
(function(){
'use strict';
var V6_URL='./data/72人物整合汇总.json';
var E=window.ChenNanScriptEngine,reg=null,baseline=null,activeRequest=null,draftReport=null;
var canon=null,lastSelected=[];
var q=function(s){return document.querySelector(s)};
var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})};
function ensureState(){
 db.meta=db.meta||{};
 if(!db.meta.scriptEngine2){
   if(db.meta.france70Chat)db.meta.legacyFrance70Archive=JSON.parse(JSON.stringify(db.meta.france70Chat));
   db.meta.scriptEngine2=E.migrate(null,reg,baseline);
 }
 return db.meta.scriptEngine2;
}
async function loadCanon(){
 if(canon)return canon;
 var results=await Promise.all([fetch(V6_URL,{cache:'no-store'}),fetch('./data/people.json',{cache:'no-store'}),fetch('./data/profile-memory-baseline.json',{cache:'no-store'})]);
 for(var r of results)if(!r.ok)throw Error('正式人物资料读取失败 HTTP '+r.status);
 var full=await results[0].json(),workspace=await results[1].json();baseline=await results[2].json();
 reg=E.registry(full,db.people.length?db.people:workspace.people);
 db.meta=db.meta||{};
 if(!db.meta.romanianProfiles2){
   db.meta.legacyPeopleArchive=JSON.parse(JSON.stringify(db.people));
   var oldByCode={};db.people.forEach(function(p){var id=reg.toId(p.id);if(id)oldByCode[id]=p});
   db.people=workspace.people.map(function(p){var old=oldByCode[p.character_id];return Object.assign({},p,{id:old?old.id:p.id,trade_profile:old&&old.trade_profile,crm:old&&old.crm})});
   reg=E.registry(full,db.people);db.meta.romanianProfiles2=true;
   ensureState();save();if(typeof render==='function')render();
 }
 canon={people:Object.keys(reg.byId).filter(function(id){return /^\d{2}$/.test(id)}).map(function(id){return Object.assign({},reg.byId[id],{id:id,novel_profile:{group_role:reg.byId[id].group_role,style_label_zh:reg.byId[id].language_style_label}})}),relationship_graph:{edges:[]}};
 return canon;
}

function low(v){return String(v||'').toLocaleLowerCase('fr-FR')}
function topics(text){
  var map={
    taux:['taux','rendement','obligation','利率','债券'],
    banques:['banque','banques','银行'],
    energie:['énergie','energie','pétrole','petrole','能源','油价'],
    tech_ia:['tech','technologie',' ia ','ai','人工智能','科技'],
    inflation:['inflation','通胀'],luxe:['luxe','奢侈品'],assurance:['assurance','保险'],
    consommation:['consommation','消费'],resultats:['résultats','resultats','财报','业绩'],
    liquidite:['liquidité','liquidite','流动性'],valorisation:['valorisation','估值']
  },src=' '+low(text)+' ',out=[];
  Object.keys(map).forEach(function(k){if(map[k].some(function(w){return src.indexOf(low(w))>=0}))out.push(k)});
  return out.length?out:['marche'];
}
function memFor(id){
  var m=ensureState().memory[id]||{};
  return {recent:(m.recent||[]).slice(-12),medium:(m.medium||[]).slice(-8),long:(m.long||[]).slice(-8),opinions:m.opinions||{}};
}
function blob(p){
  return low(JSON.stringify({
    sectors:p.investment_profile&&p.investment_profile.preferred_sectors,
    occupation:p.occupation,tags:p.tags,
    traction:p.novel_profile&&p.novel_profile.conversation_traction,
    canon:p.novel_profile&&p.novel_profile.author_canon
  }));
}
function sourceKind(){return q('#fr70KindAssistant').classList.contains('active')?'assistant':'professor'}
function buildPrompt(){
 try{
   var input={date:q('#seDate').value,time:q('#seTime').value,sourceKind:sourceKind(),sourceText:q('#fr70Source').value,offerId:q('#seOffer').value||null,closed:q('#seClose').checked};
   var sc=E.scene(input),state=ensureState();
   Object.keys(reg.byId).forEach(function(id){var p=db.people.find(function(p){return reg.toId(p.id)===id});if(p)reg.byId[id].name=p.name});
   var sim=window.ChenNanTrading.scriptSnapshot({date:sc.date,offerId:sc.offerId,toId:reg.toId});
   if(['buy','sell','holdings'].includes(sc.stage)&&!sc.offerId)throw Error('请先选择模拟交易计划');
   lastSelected=E.select(reg,state,sc,sim,{reuse:q('#fr70Reuse').checked,complexity:Number(q('#seComplexity').value)});
   activeRequest={scene:sc,simulation:sim,revision:state.revision,selected:lastSelected.slice()};draftReport=null;
   q('#fr70Prompt').value=JSON.stringify(E.prompt(reg,state,sc,sim,lastSelected),null,2);
   q('#fr70Selected').innerHTML=lastSelected.map(function(id){return '<span>'+esc(id)+' · '+esc(reg.byId[id].name)+' · '+esc(reg.byId[id].group_role||'')+'</span>'}).join('');
   q('#fr70PromptStatus').textContent=sc.date+' '+sc.period+' / '+sc.stage+' · 动态候选 '+lastSelected.length+' 人 · 允许沉默';
 }catch(e){toast(e.message)}
}

async function copyPrompt(){
  if(!q('#fr70Prompt').value)buildPrompt();
  if(!q('#fr70Prompt').value)return;
  try{await navigator.clipboard.writeText(q('#fr70Prompt').value);toast('提示词已复制，直接粘贴到ChatGPT')}
  catch(e){q('#fr70Prompt').select();document.execCommand('copy');toast('提示词已复制')}
}
function parseResult(){
  var raw=q('#fr70Result').value.trim();
  if(!raw)throw new Error('请先粘贴ChatGPT返回的JSON');
  var tick=String.fromCharCode(96),fence=tick+tick+tick;
  if(raw.slice(0,3)===fence){
    raw=raw.slice(3);
    if(raw.toLowerCase().indexOf('json')===0)raw=raw.slice(4);
    raw=raw.trim();
    if(raw.slice(-3)===fence)raw=raw.slice(0,-3).trim();
  }
  var obj=JSON.parse(raw);
  if(!Array.isArray(obj.messages))throw new Error('JSON缺少messages');
  return obj;
}
function currentReport(){
 if(!activeRequest)throw Error('请先建立本轮提示词');
 if(q('#fr70Source').value!==activeRequest.scene.sourceText||sourceKind()!==activeRequest.scene.sourceKind||q('#seDate').value!==activeRequest.scene.date||q('#seTime').value!==activeRequest.scene.time||q('#seOffer').value!==(activeRequest.scene.offerId||'')||q('#seClose').checked!==activeRequest.scene.closed)throw Error('场景或原话已改变，请重新建立提示词');
 var sim=window.ChenNanTrading.scriptSnapshot({date:activeRequest.scene.date,offerId:activeRequest.scene.offerId,toId:reg.toId});
 if(JSON.stringify(sim)!==JSON.stringify(activeRequest.simulation))throw Error('模拟状态已改变，请重新建立提示词');
 return E.validate(parseResult(),reg,ensureState(),activeRequest.scene,sim,activeRequest.selected);
}
function previewResult(){
 try{draftReport=currentReport();q('#fr70Qa').textContent=draftReport.errors.length?'草稿未通过：'+draftReport.errors.join('；'):'草稿结构通过，尚未写入记忆。'+draftReport.warnings.join('；');if(!draftReport.errors.length)renderSession({messages:draftReport.messages});}
 catch(e){toast(e.message)}
}
function saveResult(){
 try{
  var report=currentReport();if(report.errors.length)throw Error(report.errors.join('；'));
  var s=E.adopt(ensureState(),report,activeRequest.scene,{confirmed:true,expectedRevision:activeRequest.revision,sessionId:'se2_'+crypto.randomUUID(),simulation:activeRequest.simulation});
  var before=db.meta.scriptEngine2;db.meta.scriptEngine2=s;
  try{save()}catch(e){db.meta.scriptEngine2=before;throw e;}
  renderSession(s.sessions[0]);renderHistory();renderMemoryList();renderStats();activeRequest=null;draftReport=null;
  toast('已采用完整会话并更新正式记忆；云端同步状态由现有同步模块显示');
 }catch(e){toast(e.message)}
}

function personById(id){var key=reg.toId(id)||id,base=canon.people.find(function(p){return p.id===key})||reg.byId[key],current=db.people.find(function(p){return reg.toId(p.id)===key});return base?Object.assign({},base,{name:current?current.name:base.name}):current}
function initials(name){return String(name||'?').trim().split(/\s+/).map(function(x){return x[0]}).join('').slice(0,2).toUpperCase()}
function renderSession(sess){
  var box=q('#fr70Chat');if(!box)return;
  if(!sess){box.innerHTML='<div class="empty">还没有导入群聊结果</div>';return}
  box.innerHTML=sess.messages.map(function(m){
    var p=personById(m.speaker_id),name=p&&p.name||m.speaker_id,n=p&&p.novel_profile||{},style=n.style_label_zh||n.group_role||'';
    var reference=m.reply_to&&sess.messages.find(function(x){return x.message_id===m.reply_to});
    m.reply_to_speaker_id=reference&&reference.character_id||m.reply_to_speaker_id;
    var target=m.reply_to_speaker_id&&personById(m.reply_to_speaker_id);
    var reply=m.reply_to_speaker_id?'<span>回复 '+esc(target&&target.name||m.reply_to_speaker_id)+'</span>':'';
    return '<div class="fr70-message"><div class="fr70-avatar">'+esc(initials(name))+'</div><div class="fr70-bubble"><div class="fr70-meta"><b>'+esc(name)+'</b><span>'+esc(style)+'</span>'+reply+'</div><p>'+esc(m.text_fr)+'</p></div></div>';
  }).join('');
}
function renderHistory(){
  var list=ensureState().sessions,box=q('#fr70History');if(!box)return;
  box.innerHTML=list.length?list.map(function(s){
    return '<button data-fr70-session="'+esc(s.id)+'"><b>'+(s.sourceKind==='assistant'?'助理':'教授')+' · '+new Date(s.createdAt).toLocaleString()+'</b><small>'+esc(s.sourceText.slice(0,72))+(s.sourceText.length>72?'…':'')+' · '+(s.messages&&s.messages.length||0)+'条</small></button>';
  }).join(''):'<div class="empty">暂无历史会话</div>';
  box.querySelectorAll('button').forEach(function(b){b.onclick=function(){var s=list.find(function(x){return x.id===b.dataset.fr70Session});if(s){renderSession(s);q('#fr70Source').value=s.sourceText}}});
}
function renderStats(){
  var s=ensureState(),count=Object.values(s.memory).reduce(function(n,m){return n+(m.recent&&m.recent.length||0)+(m.medium&&m.medium.length||0)+(m.long&&m.long.length||0)},0);
  q('#fr70SessionCount').textContent=s.sessions.length;
  q('#fr70MemoryCount').textContent=count;
  q('#fr70PeopleMem').textContent=Object.keys(s.memory).length;
}
function ensureFrance70PersonDetailPage(){
  var sec=q('#fr70PersonDetailPage');
  if(sec)return sec;
  sec=document.createElement('section');
  sec.id='fr70PersonDetailPage';
  sec.className='section';
  sec.dataset.uiParent='france70chat';
  sec.innerHTML='<div id="fr70PersonDetailContent"></div>';
  var base=q('#france70chat');
  if(base&&base.parentNode)base.parentNode.insertBefore(sec,base.nextSibling);
  else q('.main')?.appendChild(sec);
  return sec;
}
function memoryRowsFor(personId){
  var m=ensureState().memory[personId]||{};
  var rows=[];
  [['recent','近期记忆'],['medium','中期记忆'],['long','长期记忆']].forEach(function(pair){
    (m[pair[0]]||[]).forEach(function(x){
      rows.push({layer:pair[1],at:x.at||'',topic:x.topic||'general',summary:x.summary_zh||x.summary||'--',evidence:x.evidence||x.evidence_fr||''});
    });
  });
  return rows.sort(function(a,b){return String(b.at).localeCompare(String(a.at))});
}
function openFrance70PersonDetail(id){
  var p=personById(id);if(!p)return;
  ensureFrance70PersonDetailPage();
  var state=ensureState().memory[id]||{},rows=memoryRowsFor(id),profile=p.novel_profile||{},host=q('#fr70PersonDetailContent');
  if(!host)return;
  var recent=(state.recent||[]).length,medium=(state.medium||[]).length,long=(state.long||[]).length;
  host.innerHTML=
    '<div class="detail-head cn-page-header"><div class="detail-identity"><div class="cn-detail-mark">F70</div><div>'+
      '<div class="eyebrow">CHENNAN PERSONA</div><h1 class="page-title">'+esc(p.name||id)+'</h1>'+
      '<p class="sub">'+esc(id)+' · '+esc(profile.style_label_zh||profile.group_role||'人物档案')+'</p></div></div>'+
      '<div class="actions"><button class="btn ghost" id="fr70DetailBack">← 返回辰南群聊</button></div></div>'+
    '<div class="cn-detail-kpis">'+
      '<div class="card cn-detail-kpi"><span>近期记忆</span><strong>'+recent+'</strong></div>'+
      '<div class="card cn-detail-kpi"><span>中期记忆</span><strong>'+medium+'</strong></div>'+
      '<div class="card cn-detail-kpi"><span>长期记忆</span><strong>'+long+'</strong></div>'+
      '<div class="card cn-detail-kpi"><span>记忆总数</span><strong>'+rows.length+'</strong></div>'+
      '<div class="card cn-detail-kpi"><span>意见主题</span><strong>'+Object.keys(state.opinions||{}).length+'</strong></div>'+
    '</div>'+
    '<div class="cn-two-column-detail">'+
      '<div class="card panel"><div class="panel-head"><h2>人设与发言风格</h2><span class="muted">罗马尼亚正式主档</span></div>'+
        '<div class="cn-rule-list">'+
          '<div><span>群组角色</span><b>'+esc(profile.group_role||'--')+'</b></div>'+
          '<div><span>风格标签</span><b>'+esc(profile.style_label_zh||'--')+'</b></div>'+
          '<div><span>说话节奏</span><b>'+esc(profile.speech_rhythm_zh||profile.speech_rhythm||'--')+'</b></div>'+
          '<div><span>表达倾向</span><b>'+esc(profile.expression_tendency_zh||profile.expression_tendency||'--')+'</b></div>'+
        '</div>'+
        '<div class="panel-head" style="margin-top:12px"><h2>动态记忆</h2><span class="muted">'+rows.length+' 条</span></div>'+
        '<div class="cn-memory-detail-list">'+(rows.length?rows.slice(0,40).map(function(x){
          return '<div class="cn-memory-detail-row"><div><b>'+esc(x.layer)+' · '+esc(x.topic)+'</b><small>'+esc(x.at?new Date(x.at).toLocaleString():'--')+'</small></div><p>'+esc(x.summary)+'</p></div>';
        }).join(''):'<div class="empty">暂无动态记忆</div>')+'</div>'+
      '</div>'+
      '<div class="card panel"><div class="panel-head"><h2>结构化人物数据</h2><span class="muted">只读</span></div>'+
        '<pre class="cn-json-preview">'+esc(JSON.stringify({character_id:p.id,profile:reg.byId[p.id],memory:state},null,2))+'</pre>'+
      '</div>'+
    '</div>';
  go('fr70PersonDetailPage');
  q('#fr70DetailBack').onclick=function(){go('france70chat')};
}

function renderMemoryList(){
  var box=q('#fr70MemoryList');if(!box)return;
  var s=ensureState();
  var rows=Object.keys(s.memory).map(function(id){
    var m=s.memory[id]||{},p=personById(id),recent=m.recent||[],medium=m.medium||[],long=m.long||[];
    var latest=recent[recent.length-1]||medium[medium.length-1]||long[long.length-1]||null;
    return {id:id,name:p&&p.name||id,total:recent.length+medium.length+long.length,latest:latest};
  }).sort(function(a,b){return b.total-a.total||a.name.localeCompare(b.name)}).slice(0,30);
  if(!rows.length){box.innerHTML='<div class="empty">暂无动态记忆</div>';return}
  box.innerHTML=rows.map(function(r){
    var summary=r.latest&&r.latest.summary_zh?String(r.latest.summary_zh):'已有历史记忆';
    return '<button class="fr70-memory-row" type="button" data-fr70-person="'+esc(r.id)+'"><b>'+esc(r.name)+'</b><span>'+r.total+' 条</span><small>'+esc(summary.slice(0,92))+(summary.length>92?'…':'')+'</small></button>';
  }).join('');
  box.querySelectorAll('[data-fr70-person]').forEach(function(b){b.onclick=function(){openFrance70PersonDetail(b.dataset.fr70Person)}});
}
function exportMemory(){
  var s=ensureState();
  var payload={
    schema_version:'2.0',
    exported_at:new Date().toISOString(),
    synthetic:true,
    sessions:s.sessions,
    memory:s.memory
  };
  var blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='辰南-群聊与记忆-'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href)},1000);
  toast('群聊与人物记忆已导出');
}
function setKind(k){
  q('#fr70KindAssistant').classList.toggle('active',k==='assistant');
  q('#fr70KindProfessor').classList.toggle('active',k==='professor');
}
async function init(){
  if(!q('#france70chat'))return;
  try{
    await loadCanon();ensureState();
    q('#fr70KindAssistant').onclick=function(){setKind('assistant')};
    q('#fr70KindProfessor').onclick=function(){setKind('professor')};
    q('#fr70Build').onclick=buildPrompt;
    q('#fr70Copy').onclick=copyPrompt;
    q('#fr70Import').onclick=previewResult;
    q('#seAdopt').onclick=saveResult;
    var now=new Date(),parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Singapore',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now),part=function(k){return parts.find(function(x){return x.type===k}).value};
    q('#seDate').value=part('year')+'-'+part('month')+'-'+part('day');
    q('#seOffer').innerHTML='<option value="">选择模拟计划</option>'+(db.tradeSim&&db.tradeSim.offers||[]).map(function(o){return '<option value="'+esc(o.id)+'">'+esc(o.symbol)+' · '+esc(o.name)+'</option>'}).join('');
    q('#fr70Export').onclick=exportMemory;
    renderHistory();renderMemoryList();renderStats();renderSession(ensureState().sessions[0]||null);
    q('#fr70LoadStatus').textContent='Script Engine 2.0 · 罗马尼亚完整人物库 · 草稿与正式记忆分离';
    q('#fr70LoadStatus').className='notice success';
  }catch(e){
    q('#fr70LoadStatus').textContent='辰南群聊加载失败：'+e.message;
    q('#fr70LoadStatus').className='notice warn';
  }
}
document.addEventListener('chennan:cloud-ready',function(){init()},{once:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){if(window.ChenNanCloud&&window.ChenNanCloud.hydrated)init()},{once:true});
else if(window.ChenNanCloud&&window.ChenNanCloud.hydrated)init();
window.ChenNanScriptChat=window.France70Chat={init:init,buildPrompt:buildPrompt,saveResult:saveResult,openPersonDetail:openFrance70PersonDetail};
})();
