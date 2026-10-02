
(function(){
'use strict';

const DATA_URL='./data/france70-v6.1.json';
const CHAT_STATE_VERSION='1.0';
let canon=null;
let sourceKind='assistant';
let selectedPeople=[];
let currentPrompt='';
let loadedSessionId=null;

const TOPICS={
  taux:['taux','rendement','obligation','利率','债券'],
  banques:['banque','banques','bank','银行'],
  energie:['énergie','energie','pétrole','petrole','能源','油价'],
  tech_ia:['tech','technologie','intelligence artificielle',' ia ',' ai ','科技','人工智能'],
  inflation:['inflation','通胀'],
  luxe:['luxe','奢侈品'],
  immobilier:['immobilier','房地产'],
  sante:['santé','sante','医疗','医药'],
  consommation:['consommation','消费'],
  assurance:['assurance','保险'],
  industrie:['industrie','工业'],
  liquidite:['liquidité','liquidite','流动性'],
  valorisation:['valorisation','估值'],
  resultats:['résultats','resultats','bénéfice','benefice','财报','业绩','利润']
};

const CLUSTER_BASE={
  DATA_SKEPTIC:64,
  CAUTIOUS_OBSERVER:52,
  SOCIAL_QUESTIONER:66,
  EXECUTOR_FAMILY:61,
  MARKET_CONTRARIAN:65,
  PRACTICAL_BUSINESS:60,
  BALANCED_MEDIATOR:58,
  EMOTIONAL_REACTOR:55
};

function $(id){return document.getElementById(id)}
function safe(v){return typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function state(){
  db.france70Chat=db.france70Chat&&typeof db.france70Chat==='object'?db.france70Chat:{};
  const s=db.france70Chat;
  s.version=CHAT_STATE_VERSION;
  s.sessions=Array.isArray(s.sessions)?s.sessions:[];
  s.memoryByPerson=s.memoryByPerson&&typeof s.memoryByPerson==='object'&&!Array.isArray(s.memoryByPerson)?s.memoryByPerson:{};
  s.settings=s.settings&&typeof s.settings==='object'?s.settings:{maxParticipants:20,reuseLast:false};
  return s;
}
function parisDate(){
  try{return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
  catch(_){return new Date().toISOString().slice(0,10)}
}
function uid(){return 'f70-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9)}
function personMemory(id){
  const s=state();
  if(!s.memoryByPerson[id])s.memoryByPerson[id]={
    personId:id,recentMessages:[],recentEvents:[],mediumEvents:[],longTermMemory:[],
    opinions:{},unresolvedQuestions:[],followUpHooks:[],interactions:[],
    daily:{date:parisDate(),timesSpoken:0,timesReacted:0}
  };
  const m=s.memoryByPerson[id];
  m.recentMessages=Array.isArray(m.recentMessages)?m.recentMessages:[];
  m.recentEvents=Array.isArray(m.recentEvents)?m.recentEvents:[];
  m.mediumEvents=Array.isArray(m.mediumEvents)?m.mediumEvents:[];
  m.longTermMemory=Array.isArray(m.longTermMemory)?m.longTermMemory:[];
  m.opinions=m.opinions&&typeof m.opinions==='object'?m.opinions:{};
  m.unresolvedQuestions=Array.isArray(m.unresolvedQuestions)?m.unresolvedQuestions:[];
  m.followUpHooks=Array.isArray(m.followUpHooks)?m.followUpHooks:[];
  m.interactions=Array.isArray(m.interactions)?m.interactions:[];
  m.daily=m.daily&&typeof m.daily==='object'?m.daily:{date:parisDate(),timesSpoken:0,timesReacted:0};
  if(m.daily.date!==parisDate())m.daily={date:parisDate(),timesSpoken:0,timesReacted:0};
  return m;
}
function daysSince(ts){const n=Date.parse(ts);return Number.isFinite(n)?(Date.now()-n)/86400000:0}
function compactMemory(m){
  const recent=[],medium=[...m.mediumEvents],long=[...m.longTermMemory];
  for(const e of m.recentEvents){
    if(daysSince(e.at)<=15)recent.push(e);else medium.push(e);
  }
  const keptMedium=[];
  for(const e of medium){
    if(daysSince(e.at)<=90)keptMedium.push(e);
    else if(Number(e.importance||0)>=4)long.push(e);
  }
  m.recentEvents=recent.slice(-36);
  m.mediumEvents=keptMedium.slice(-30);
  m.longTermMemory=long.slice(-24);
  m.recentMessages=m.recentMessages.slice(-12);
  m.unresolvedQuestions=m.unresolvedQuestions.slice(-12);
  m.followUpHooks=m.followUpHooks.slice(-12);
  m.interactions=m.interactions.slice(-24);
}
function currentPerson(staticP){
  const local=typeof person==='function'?person(staticP.id):null;
  if(!local)return staticP;
  return Object.assign({},staticP,{
    name:local.name||staticP.name,
    age:local.age||staticP.age,
    location:local.location||staticP.location,
    occupation:local.occupation||staticP.occupation,
    family:local.family||staticP.family,
    investment_profile:local.investment_profile||staticP.investment_profile,
    personality:local.personality||staticP.personality,
    communication:local.communication||staticP.communication,
    lifestyle:local.lifestyle||staticP.lifestyle,
    tags:Array.isArray(local.tags)&&local.tags.length?local.tags:staticP.tags
  });
}
function detectTopics(text){
  const low=' '+String(text||'').toLocaleLowerCase('fr-FR')+' ';
  const out=[];
  Object.entries(TOPICS).forEach(([tag,words])=>{
    if(words.some(w=>low.includes(String(w).toLocaleLowerCase('fr-FR'))))out.push(tag);
  });
  return out.length?out:['marche'];
}
function blobFor(p){
  return JSON.stringify({
    sectors:p.investment_profile?.preferred_sectors,
    occupation:p.occupation,
    tags:p.tags,
    lifestyle:p.lifestyle,
    traction:p.novel_profile?.conversation_traction,
    canon:p.novel_profile?.author_canon
  }).toLocaleLowerCase('fr-FR');
}
function selectCandidates(text,max,reuse){
  const s=state();
  const topics=detectTopics(text);
  const last=reuse?s.sessions[0]?.selectedIds||[]:[];
  const lastSet=new Set(last);
  const rels=canon?.relationship_graph?.edges||[];
  const scored=(canon?.people||[]).map(raw=>{
    const p=currentPerson(raw);
    const cluster=p.novel_profile?.style_cluster||'';
    let score=CLUSTER_BASE[cluster]||50;
    const b=blobFor(p);
    topics.forEach(t=>{
      const words=TOPICS[t]||[t];
      if(words.some(w=>b.includes(String(w).toLocaleLowerCase('fr-FR'))))score+=17;
    });
    const mem=personMemory(p.id);
    score-=Number(mem.daily?.timesSpoken||0)*4.5+Number(mem.daily?.timesReacted||0)*1.5;
    if(lastSet.has(p.id))score+=18;
    score+=Math.min(8,rels.filter(r=>r.a===p.id||r.b===p.id).length);
    return {p,score,cluster};
  }).sort((a,b)=>b.score-a.score||String(a.p.id).localeCompare(String(b.p.id)));

  const clusters=['DATA_SKEPTIC','CAUTIOUS_OBSERVER','SOCIAL_QUESTIONER','EXECUTOR_FAMILY','MARKET_CONTRARIAN','PRACTICAL_BUSINESS','BALANCED_MEDIATOR','EMOTIONAL_REACTOR'];
  const chosen=[],used=new Set(),counts={};
  clusters.forEach(cluster=>{
    if(chosen.length>=max)return;
    const hit=scored.find(x=>x.cluster===cluster&&!used.has(x.p.id));
    if(hit){chosen.push(hit.p);used.add(hit.p.id);counts[cluster]=1}
  });
  scored.forEach(x=>{
    if(chosen.length>=max||used.has(x.p.id))return;
    if((counts[x.cluster]||0)>=4)return;
    chosen.push(x.p);used.add(x.p.id);counts[x.cluster]=(counts[x.cluster]||0)+1;
  });
  return {topics,people:chosen};
}
function compactProfile(p){
  const n=p.novel_profile||{};
  return {
    id:p.id,name:p.name,age:p.age,gender:p.gender,location:p.location,
    occupation:p.occupation,family:p.family,investment_profile:p.investment_profile,
    personality:p.personality,communication:p.communication,lifestyle:p.lifestyle,
    style_cluster:n.style_cluster,style_label_zh:n.style_label_zh,group_role:n.group_role,
    author_canon:n.author_canon,appearance_life_texture:n.appearance_life_texture,
    voice_dna:n.voice_dna,conversation_traction:n.conversation_traction,
    family_value_lens:n.family_value_lens,character_arc:n.character_arc,
    participation_policy:n.participation_policy
  };
}
function memoryContext(ids){
  return ids.map(id=>{
    const m=personMemory(id);
    compactMemory(m);
    return {
      personId:id,
      recentMessages:m.recentMessages.slice(-8),
      recentEvents:m.recentEvents.slice(-8),
      mediumEvents:m.mediumEvents.slice(-5),
      longTermMemory:m.longTermMemory.slice(-5),
      opinions:m.opinions,
      unresolvedQuestions:m.unresolvedQuestions.slice(-5),
      followUpHooks:m.followUpHooks.slice(-5),
      interactions:m.interactions.slice(-8)
    };
  });
}
function buildPrompt(){
  if(!canon)throw new Error('v6.1 人物库尚未加载完成');
  const text=$('f70SourceText').value.trim();
  if(!text)throw new Error('请先输入助理或教授发言');
  const max=Math.max(5,Math.min(20,Number($('f70MaxParticipants').value||20)));
  const reuse=$('f70ReuseLast').checked;
  const pick=selectCandidates(text,max,reuse);
  selectedPeople=pick.people;
  const ids=new Set(selectedPeople.map(p=>p.id));
  const rels=(canon.relationship_graph?.edges||[]).filter(r=>ids.has(r.a)&&ids.has(r.b));
  const recent=state().sessions.slice(0,2).map(s=>({
    date:s.date,sourceKind:s.sourceKind,sourceText:s.sourceText,
    messages:(s.messages||[]).slice(0,24)
  }));

  const payload={
    fictional_notice:'以下70位人物全部为虚构小说角色，不对应真实个人；内容仅用于群像小说创作，不是现实投资建议。',
    source:{kind:sourceKind,text},
    detectedTopics:pick.topics,
    candidates:selectedPeople.map(compactProfile),
    relationships:rels,
    dynamicMemory:memoryContext(selectedPeople.map(p=>p.id)),
    previousSessions:recent
  };

  currentPrompt=[
    '你是“France 70｜法国群像小说引擎”。严格根据下面 JSON 中的虚构人物档案、作者正史、关系网和动态记忆生成本轮法语群聊。',
    '',
    '【真实性硬规则】',
    '1. 人物必须可辨识：不要让不同角色复用相同开场、质疑方式、句长、表情和语气。',
    '2. 不要求所有候选人发言。有人可以沉默、只回复一句、只发一个表情，或连续两条短消息感。',
    '3. 群里必须允许质疑者、观望者、提问者、认可者、执行者、经验型、协调者和情绪反应型并存，不能全员信随。',
    '4. “牵引性”不等于“提问”。直接问句目标占可见发言的 25%–35%，通常不要超过 35%。',
    '5. 其余推进方式必须混合：statement（判断）、condition（条件）、counterpoint（反驳/补充）、experience（已有正史经验）、reply（回应别人）、reaction（短反应/表情）。',
    '6. 不要为了留钩子而每句话都加问号。一个质疑者完全可以直接判断“这个信号还不够干净”；观望者可以陈述“我会等下一季度确认”。',
    '7. 执行/信随型人物可以从家庭价值出发，但只有 author_canon 或 dynamicMemory 已经记录实际正面 outcome 时，才可以说“因此这个周末能带家人旅行/改善生活”。不得临时编造赚钱事实。',
    '8. 执行者也允许亏损、后悔、改变规则；不能把“执行力”写成永远赚钱。',
    '9. 法国即时群聊长短必须混合：0–3词反应、4–12词短回复、13–30词普通、31–55词展开、56–90词极少。',
    '10. 少用分号；避免中式逐字翻译；不要机械重复“À voir.”、“Exact.”等共享口癖。',
    '11. 当前城市不等于出生地/方言来源。没有成长地资料时，专业讨论优先自然标准法语。',
    '12. 只能引用 author_canon / dynamicMemory 中已经存在的具体过去；禁止临时新增重大亏损、家庭变故、职业经历、具体持仓、买卖价格、收益率。',
    '13. 人物观点可以缓慢变化，但必须有本轮证据；不要突然人格漂移。',
    '14. 关系网要影响谁回复谁、反驳力度、熟悉感和解释意愿。',
    '15. 推进不等于说服买入。质疑者可以保持质疑，观望者可以只形成下一步观察条件。',
    '',
    '【输出要求】',
    '只输出合法 JSON，不要 Markdown 代码围栏，不要解释。',
    '结构：',
    '{"topicTags":["..."],"messages":[{"speakerId":"FR0001","replyToSpeakerId":null,"textFr":"...","reactionOnly":false,"moveType":"statement|question|condition|counterpoint|experience|reply|reaction"}],"memoryEvents":[{"personId":"FR0001","eventType":"opinion|question|answer|agreement|disagreement|personal_story|relationship_change|follow_up|execution|outcome|opinion_transition","topic":"...","summaryZh":"...","stanceAfter":"...","importance":1,"evidenceFr":"...","counterpartyId":null}]}',
    '',
    'memoryEvents 只记录值得跨天记住的内容，不必为每条发言造记忆；evidenceFr 必须对应本轮实际法语发言。',
    '',
    '【本轮数据】',
    JSON.stringify(payload)
  ].join('\n');

  $('f70Prompt').value=currentPrompt;
  renderCandidateChips(selectedPeople);
  setStatus('提示词已生成。复制到你现在的 ChatGPT 即可，不调用任何额外付费 API。','good');
}
function renderCandidateChips(list){
  const box=$('f70Candidates');
  box.innerHTML=list.length?list.map(p=>'<span class="f70-chip">'+safe(p.name)+' · '+safe(p.novel_profile?.style_label_zh||p.novel_profile?.group_role||'角色')+'</span>').join(''):'<span class="muted">尚未选择人物</span>';
}
async function copyPrompt(){
  if(!currentPrompt)buildPrompt();
  await navigator.clipboard.writeText($('f70Prompt').value);
  toast('提示词已复制');
}
function openChatGPT(){
  if(!currentPrompt){try{buildPrompt()}catch(e){setStatus(e.message,'warn');return}}
  window.open('https://chatgpt.com/','_blank','noopener');
}
function parseResult(raw){
  let text=String(raw||'').trim();
  if(!text)throw new Error('请先粘贴 ChatGPT 返回的 JSON');
  text=text.replace(/^\s*```(?:json)?\s*/i,'').replace(/\s*```\s*$/,'').trim();
  const data=JSON.parse(text);
  if(!Array.isArray(data.messages)||!data.messages.length)throw new Error('JSON 中没有 messages');
  if(!Array.isArray(data.memoryEvents))data.memoryEvents=[];
  if(!Array.isArray(data.topicTags))data.topicTags=detectTopics($('f70SourceText').value);
  const validIds=new Set((canon?.people||[]).map(p=>p.id));
  data.messages=data.messages.filter(m=>validIds.has(m.speakerId)&&String(m.textFr||'').trim());
  if(!data.messages.length)throw new Error('messages 中没有有效人物发言');
  return data;
}
function questionLike(m){
  return m.moveType==='question'||/[?？]\s*$/.test(String(m.textFr||'').trim());
}
function qa(messages){
  const n=messages.length;
  const q=messages.filter(questionLike).length;
  const semis=messages.reduce((sum,m)=>sum+(String(m.textFr||'').match(/;/g)||[]).length,0);
  const starts={};
  messages.forEach(m=>{
    const key=String(m.textFr||'').toLocaleLowerCase('fr-FR').replace(/[^a-zà-ÿœæ'’-]+/gi,' ').trim().split(/\s+/).slice(0,4).join(' ');
    if(key)starts[key]=(starts[key]||0)+1;
  });
  const repeated=Object.values(starts).filter(x=>x>=2).length;
  const ratio=n?q/n:0;
  return {n,q,ratio,semis,repeated};
}
function renderQa(result){
  const x=qa(result.messages);
  $('f70Qa').innerHTML=[
    ['可见发言',x.n,false],
    ['直接问句',x.q+' · '+Math.round(x.ratio*100)+'%',x.ratio>.35||x.ratio<.15],
    ['法语分号',x.semis,x.semis>1],
    ['重复开头',x.repeated,x.repeated>2]
  ].map(([label,value,warn])=>'<div class="'+(warn?'warn':'')+'"><span>'+safe(label)+'</span><b>'+safe(value)+'</b></div>').join('');
  return x;
}
function findStatic(id){return (canon?.people||[]).find(p=>p.id===id)||null}
function displayName(id){const p=findStatic(id);const local=typeof person==='function'?person(id):null;return local?.name||p?.name||id}
function styleLabel(id){return findStatic(id)?.novel_profile?.style_label_zh||findStatic(id)?.novel_profile?.group_role||''}
function initials(name){return String(name||'').trim().split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()}
function renderMessages(messages){
  $('f70Conversation').innerHTML=messages.length?messages.map(m=>{
    const reply=m.replyToSpeakerId?'<span>回复 '+safe(displayName(m.replyToSpeakerId))+'</span>':'';
    const move=m.moveType?'<span>'+safe(m.moveType)+'</span>':'';
    return '<div class="f70-message"><div class="f70-avatar">'+safe(initials(displayName(m.speakerId)))+'</div><div class="f70-bubble"><div class="f70-meta"><b>'+safe(displayName(m.speakerId))+'</b><span>'+safe(styleLabel(m.speakerId))+'</span>'+reply+move+'</div><p>'+safe(m.textFr)+'</p></div></div>';
  }).join(''):'<div class="f70-empty">还没有导入本轮群聊。</div>';
}
function normalizeEvent(e,sessionId){
  return {
    id:uid(),at:new Date().toISOString(),sessionId,
    eventType:String(e.eventType||'opinion'),topic:String(e.topic||'marche'),
    summaryZh:String(e.summaryZh||''),stanceAfter:e.stanceAfter?String(e.stanceAfter):'',
    importance:Math.max(1,Math.min(5,Number(e.importance||3))),
    evidenceFr:String(e.evidenceFr||''),counterpartyId:e.counterpartyId||null
  };
}
function applyMemory(result,session){
  const byPerson={};
  result.messages.forEach(m=>{(byPerson[m.speakerId]||(byPerson[m.speakerId]=[])).push(m)});
  Object.entries(byPerson).forEach(([id,msgs])=>{
    const mem=personMemory(id);
    msgs.forEach(m=>{
      mem.recentMessages.push({
        at:session.date,sessionId:session.id,topicTags:session.topicTags,
        textFr:m.textFr,moveType:m.moveType||'',replyToSpeakerId:m.replyToSpeakerId||null
      });
      if(m.reactionOnly)mem.daily.timesReacted++;else mem.daily.timesSpoken++;
      if(m.replyToSpeakerId)mem.interactions.push({at:session.date,with:m.replyToSpeakerId,kind:'reply',sessionId:session.id});
    });
    compactMemory(mem);
  });
  (result.memoryEvents||[]).forEach(raw=>{
    if(!raw.personId)return;
    const mem=personMemory(raw.personId);
    const e=normalizeEvent(raw,session.id);
    mem.recentEvents.push(e);
    if(e.stanceAfter)mem.opinions[e.topic]=e.stanceAfter;
    if(e.eventType==='question')mem.unresolvedQuestions.push({at:e.at,topic:e.topic,summary:e.summaryZh,sessionId:session.id});
    if(e.eventType==='answer')mem.unresolvedQuestions=mem.unresolvedQuestions.filter(q=>q.topic!==e.topic);
    if(e.eventType==='follow_up')mem.followUpHooks.push({at:e.at,topic:e.topic,summary:e.summaryZh,sessionId:session.id});
    if(e.counterpartyId)mem.interactions.push({at:e.at,with:e.counterpartyId,kind:e.eventType,sessionId:session.id});
    compactMemory(mem);
  });
}
function importResult(){
  let result;
  try{result=parseResult($('f70ResultInput').value)}catch(e){setStatus('导入失败：'+e.message,'warn');return}
  const score=renderQa(result);
  if(score.ratio>.5){
    setStatus('这轮直接问句超过 50%，明显不自然。已显示预览，但暂不写入长期记忆；建议让 ChatGPT 按“问句不超过35%”重做。','warn');
    renderMessages(result.messages);
    return;
  }
  const s=state();
  const session={
    id:uid(),date:new Date().toISOString(),sourceKind,
    sourceText:$('f70SourceText').value.trim(),
    topicTags:result.topicTags||[],
    selectedIds:selectedPeople.length?selectedPeople.map(p=>p.id):[...new Set(result.messages.map(m=>m.speakerId))],
    messages:result.messages,
    memoryEvents:result.memoryEvents||[]
  };
  applyMemory(result,session);
  s.sessions.unshift(session);
  s.sessions=s.sessions.slice(0,120);
  loadedSessionId=session.id;
  save();
  renderMessages(session.messages);
  renderHistory();
  renderMemoryOverview();
  setStatus('本轮已保存：完整群聊快照 + 人物动态记忆已写入工作台，并会随现有 Supabase 云端同步。','good');
}
function loadSession(id){
  const s=state().sessions.find(x=>x.id===id);
  if(!s)return;
  loadedSessionId=id;
  sourceKind=s.sourceKind||'assistant';
  setSourceTabs();
  $('f70SourceText').value=s.sourceText||'';
  renderMessages(s.messages||[]);
  renderQa({messages:s.messages||[]});
  selectedPeople=(canon?.people||[]).filter(p=>(s.selectedIds||[]).includes(p.id)).map(currentPerson);
  renderCandidateChips(selectedPeople);
  $('f70ResultInput').value=JSON.stringify({topicTags:s.topicTags||[],messages:s.messages||[],memoryEvents:s.memoryEvents||[]},null,2);
  setStatus('已载入历史会话，可在此基础上勾选“优先延续上一轮人物”继续下一轮。','good');
}
function renderHistory(){
  const list=state().sessions.slice(0,12);
  $('f70History').innerHTML=list.length?list.map(s=>{
    const date=new Date(s.date).toLocaleString();
    return '<button type="button" data-f70-session="'+safe(s.id)+'"><b>'+(s.sourceKind==='professor'?'教授':'助理')+' · '+safe(date)+'</b><span>'+safe(String(s.sourceText||'').slice(0,82))+(String(s.sourceText||'').length>82?'…':'')+'</span><small>'+Number(s.messages?.length||0)+' 条发言 · '+safe((s.topicTags||[]).slice(0,3).join(' / '))+'</small></button>';
  }).join(''):'<div class="f70-empty">第一次保存群聊后会出现在这里。</div>';
  document.querySelectorAll('[data-f70-session]').forEach(b=>b.onclick=()=>loadSession(b.dataset.f70Session));
}
function renderMemoryOverview(){
  const entries=Object.values(state().memoryByPerson).filter(m=>m.recentMessages?.length||m.recentEvents?.length||m.longTermMemory?.length);
  entries.sort((a,b)=>{
    const aa=a.recentMessages?.at(-1)?.at||a.recentEvents?.at(-1)?.at||'';
    const bb=b.recentMessages?.at(-1)?.at||b.recentEvents?.at(-1)?.at||'';
    return String(bb).localeCompare(String(aa));
  });
  $('f70MemoryList').innerHTML=entries.length?entries.slice(0,30).map(m=>{
    const n=(m.recentEvents?.length||0)+(m.mediumEvents?.length||0)+(m.longTermMemory?.length||0);
    return '<div class="f70-memory-person"><div><b>'+safe(displayName(m.personId))+'</b><small>今天发言 '+Number(m.daily?.timesSpoken||0)+' · 反应 '+Number(m.daily?.timesReacted||0)+'</small></div><small>'+n+' 条事件记忆</small></div>';
  }).join(''):'<div class="f70-empty">尚无动态记忆。导入第一轮群聊后开始累计。</div>';
}
function setStatus(text,type){
  const box=$('f70Status');box.textContent=text||'';box.className='f70-status'+(type?' '+type:'');
}
function setSourceTabs(){
  document.querySelectorAll('[data-f70-source]').forEach(b=>b.classList.toggle('active',b.dataset.f70Source===sourceKind));
}
function exportMemory(){
  const payload={
    exportedAt:new Date().toISOString(),
    schema:'France70-free-memory-1.0',
    chatState:state()
  };
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='france70-memory-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function persistSettings(){
  const s=state();
  s.settings.maxParticipants=Math.max(5,Math.min(20,Number($('f70MaxParticipants').value||20)));
  s.settings.reuseLast=!!$('f70ReuseLast').checked;
  save();
}
async function init(){
  const section=$('france70Chat');if(!section)return;
  try{
    const res=await fetch(DATA_URL,{cache:'no-store'});
    if(!res.ok)throw new Error('HTTP '+res.status);
    canon=await res.json();
    if(!Array.isArray(canon.people)||canon.people.length!==70)throw new Error('v6.1 人物数量异常');
    const s=state();
    $('f70MaxParticipants').value=String(s.settings.maxParticipants||20);
    $('f70ReuseLast').checked=!!s.settings.reuseLast;
    renderHistory();renderMemoryOverview();renderMessages([]);
    setStatus('免费模式已就绪：网页只整理提示词与保存记忆，AI生成使用你当前的 ChatGPT，不产生额外 API 费用。','good');
  }catch(e){
    setStatus('v6.1 人物库加载失败：'+e.message,'warn');
  }

  document.querySelectorAll('[data-f70-source]').forEach(b=>b.onclick=()=>{sourceKind=b.dataset.f70Source;setSourceTabs()});
  $('f70BuildPrompt').onclick=()=>{try{buildPrompt()}catch(e){setStatus(e.message,'warn')}};
  $('f70CopyPrompt').onclick=()=>copyPrompt().catch(()=>setStatus('复制失败，请手动全选提示词复制。','warn'));
  $('f70OpenChatGPT').onclick=openChatGPT;
  $('f70ImportResult').onclick=importResult;
  $('f70ExportMemory').onclick=exportMemory;
  $('f70MaxParticipants').onchange=persistSettings;
  $('f70ReuseLast').onchange=persistSettings;
}
document.addEventListener('chennan:cloud-ready',()=>{renderHistory();renderMemoryOverview()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.France70FreeChat={buildPrompt,importResult,renderHistory};
})();
