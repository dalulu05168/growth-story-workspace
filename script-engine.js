/* Shared browser/Node core. Trade data is read-only; only adopt() writes formal memory. */
(function(root){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const ids=Array.from({length:70},(_,i)=>String(i+1).padStart(2,'0'));
const hosts=['assistant','professor'];
const courses={
 morning:[['opening','09:00','09:30',5,8],['indicators','09:30','10:00',5,8],['news','10:00','10:30',6,8],['theme','10:30','10:50',3,5],['lecture','10:50','11:30',6,8],['discussion','11:30','11:40',3,8],['summary','11:40','12:00',0,5]],
 afternoon:[['opening','13:00','13:30',5,8],['holdings','13:30','14:00',3,6],['sell','14:00','14:30',0,8],['news','14:30','15:00',6,8],['buy','15:00','15:30',0,8],['lecture','15:30','16:20',6,8],['summary','16:20','17:00',0,5]],
 evening:[['opening','19:00','19:15',5,8],['review','19:15','19:30',5,8],['lecture','19:30','20:30',5,7],['discussion','20:30','20:50',3,8],['summary','20:50','21:00',0,5]]
};
function stageAt(time){if(!/^\d{2}:\d{2}$/.test(time))throw Error('时间须为 HH:mm');for(const [period,stages] of Object.entries(courses))for(const s of stages)if(time>=s[1]&&time<s[2])return {period,stage:s[0],start:s[1],end:s[2],reference:[s[3],s[4]]};return {period:'rest',stage:'rest',reference:[0,0]};}
function identity(p){return String(p.character_id||p.legacy_id||'');}
function registry(profiles,people){
 const all=profiles.profiles||profiles.people||profiles,byId={},external={};
 for(const p of all){const id=identity(p);if(!ids.includes(id)&&!hosts.includes(id))throw Error('未知人物编号 '+id);if(byId[id])throw Error('重复人物编号 '+id);byId[id]=clone(p);}
 for(const id of ids)if(!byId[id])throw Error('人物资料缺失 '+id);
 for(const p of people||[]){const id=identity(p);if(ids.includes(id)){if(Object.values(external).includes(id))throw Error('工作区编号重复 '+id);external[p.id]=id;}}
 return {byId,external,toId(value){const id=String(value||'');return byId[id]?id:external[id]||null;}};
}
function newestSessions(state){return (state.sessions||[]).map((s,i)=>({s,i})).sort((a,b)=>String(b.s.createdAt||b.s.date||'').localeCompare(String(a.s.createdAt||a.s.date||''))||a.i-b.i).map(x=>x.s);}
function memberType(p){return p.member_type||String(p.customer_relation&&p.customer_relation.type_code||'').toLowerCase();}
function migrate(legacy,reg,baseline){
 const state={schemaVersion:'2.0',revision:0,sessions:[],memory:{},questions:[],disagreements:[],facts:[],interactions:[],dailySummaries:{},closed:[],migrationIssues:[]};
 if(baseline)state.profileMemories=clone(baseline.character_memories||{});
 for(const [key,m] of Object.entries(legacy&&legacy.memory||{})){const id=reg.toId(key);if(id)state.memory[id]=clone(m);else state.migrationIssues.push('未映射记忆 '+key);}
 for(const raw of legacy&&legacy.sessions||[]){const s=clone(raw);s.selectedIds=(s.selectedIds||[]).map(x=>reg.toId(x)).filter(Boolean);s.messages=(s.messages||[]).map((m,i)=>({...m,character_id:reg.toId(m.character_id||m.speaker_id),speaker_id:reg.toId(m.character_id||m.speaker_id),message_id:m.message_id||s.id+'_m'+i}));if(s.messages.some(m=>!m.character_id))state.migrationIssues.push('未映射会话 '+s.id);state.sessions.push(s);}
 return state;
}
function scene(input){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(input.date)||Number.isNaN(Date.parse(input.date+'T00:00:00Z')))throw Error('缺少有效课程日期');
 const s=stageAt(input.time);if(s.period==='rest')throw Error('当前为休息时段，请选择正式课程时间');
 if(!hosts.includes(input.sourceKind)||typeof input.sourceText!=='string'||!input.sourceText.trim())throw Error('需要用户提供助理或教授原话');
 return {...s,date:input.date,time:input.time,topic:input.topic||input.sourceText,sourceKind:input.sourceKind,sourceText:input.sourceText,offerId:input.offerId||null,closed:!!input.closed};
}
function select(reg,state,sc,simulation,options={}){
 if(sc.closed||state.closed.includes(sc.date+'|'+sc.period))return [];
 const must=new Set((simulation&&simulation.required_participants||[]).map(id=>reg.toId(id)).filter(Boolean));
 const direct=new Set((options.directTargets||[]).map(id=>reg.toId(id)).filter(Boolean));
 const history=newestSessions(state).flatMap(s=>[...(s.messages||[])].reverse()).slice(0,100),recent=history.slice(0,20);
 const text=String(sc.topic||''),scored=ids.map(id=>{const p=reg.byId[id],count=recent.filter(m=>(m.character_id||m.speaker_id)===id).length,group=p.group_role||p.novel_profile&&p.novel_profile.style_cluster||'',details=JSON.stringify(p),words=text.match(/[\p{L}]{2,}/gu)||[];let score=words.filter(w=>details.includes(w)).length*3-count*8;
 if(state.questions.some(q=>q.character_id===id&&q.status==='open'))score+=12;
 if(options.reuse&&recent.some(m=>m.character_id===id))score+=2;
 if(must.has(id))score+=1000;if(direct.has(id))score+=500;
 return {id,group,type:memberType(p),count,score};}).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 const base=sc.reference[1],complexity=Math.min(5,Math.max(0,Number(options.complexity)||0)),desired=options.needsResponse===false?0:base+complexity;
 const out=[],groups=new Set(),types=new Set();
 function add(x){if(!out.includes(x.id)){out.push(x.id);groups.add(x.group);types.add(x.type);}}
 scored.filter(x=>must.has(x.id)||direct.has(x.id)).forEach(add);
 const available=scored.filter(x=>x.count<3&&!out.includes(x.id));
 for(const x of available)if(out.length<desired&&(!groups.has(x.group)||!types.has(x.type)))add(x);
 for(const x of available)if(out.length<desired)add(x);
 return out;
}
function prompt(reg,state,sc,simulation,selected){
 return {engine:'辰南 Script Engine 2.0',status:'draft',scene:clone(sc),source:{message_id:'source',kind:sc.sourceKind,text:sc.sourceText},selected_characters:selected.map(id=>({...clone(reg.byId[id]),character_id:id,member_type:memberType(reg.byId[id])})),character_memories:Object.fromEntries(selected.map(id=>[id,clone(state.memory[id]||state.profileMemories&&state.profileMemories[id]||{})])),recent_sessions:clone(newestSessions(state).slice(0,5)),open_questions:clone(state.questions.filter(q=>q.status==='open')),disagreements:clone(state.disagreements),established_facts:clone(state.facts),simulation:clone(simulation),instructions:[
 '所有内容是虚构演练。仅生成01–70成员互动；助理和教授原话由用户提供，原样保留，不代写、补写或闭群。',
 '人物完整资料是唯一背景来源。姓名仅用于显示，身份和所有关联使用character_id。新人/老人、VIP、开户分别读取，不相互推导。',
 '模拟程序当前状态 > 正式会话记忆 > 正式人物配置 > 课程规则 > 草稿建议。对白不得改变交易状态。',
 '买卖、持仓、参与、预留、成交、取消、等待等事实只能引用simulation.facts。没有数据就提问或观察。trade_fact_ids引用该成员对应事实。',
 '不强制每位候选人发言，不凑人数。允许质疑、保留意见、不同句长、成员间回复、无回应和沉默；没有新增内容可以返回空messages。',
 '按完整背景、新人老人、知识边界、正式记忆、场景、对象、性格和语言习惯生成，不能统一模板再换编号。',
 '不编造新闻来源、既往经历、盈利或图片。图片构想标为待制作，未提供附件不能称已发送。',
 '未解决问题跨时段跨日保留。观点变化必须写明previous_view、new_view、reason、source_message_id。',
 'memory_events是草稿候选，每条必须引用本轮该角色message_id，evidence必须是该条原文。不能把猜测、样例或未采用草稿当作历史。',
 '只返回JSON。输出messages包含message_id、suggested_time、character_id、member_type、message_type、reply_to、text、attachment_status、trade_fact_ids；memory_events包含character_id、event_type、topic、summary_zh、source_message_id、evidence。'
 ],output_schema:{messages:[{message_id:'m1',suggested_time:sc.time,character_id:selected[0]||'01',member_type:'new/old（读取人物）',message_type:'reply',reply_to:null,text:'...',attachment_status:'none',trade_fact_ids:[]}],memory_events:[]}};
}
function validate(obj,reg,state,sc,simulation,selected){
 const errors=[],warnings=[],messages=[],known=new Map(state.sessions.flatMap(s=>s.messages||[]).map(m=>[m.message_id,m])),current=new Map(),texts=new Set();
 if(!obj||!Array.isArray(obj.messages)){return {errors:['缺少messages数组'],warnings,messages,events:[]};}
 known.set('source',{message_id:'source',character_id:sc.sourceKind,text:sc.sourceText});
 const facts=new Map((simulation&&simulation.facts||[]).map(f=>[f.id,f]));
 if(!Array.isArray(obj.memory_events||[]))return {errors:['memory_events须为数组'],warnings,messages,events:[]};
 for(const m of obj.messages){const id=m.character_id,text=m.text;
 if(!ids.includes(id)||!selected.includes(id)){errors.push('非本轮成员 '+id);continue;}
 if(typeof m.message_id!=='string'||!m.message_id||current.has(m.message_id)){errors.push('消息编号缺失或重复');continue;}
 if(known.has(m.message_id)){errors.push('消息编号与正式历史重复');continue;}
 if(typeof text!=='string'||!text.trim()){errors.push('空消息 '+m.message_id);continue;}
 if(m.member_type!==memberType(reg.byId[id]))errors.push('新人老人字段不一致 '+id);
 if(!m.message_type||typeof m.suggested_time!=='string'||m.suggested_time<sc.start||m.suggested_time>=sc.end)errors.push('消息类型或时间不符合当前阶段 '+m.message_id);
 if(!['none','idea','pending','provided'].includes(m.attachment_status)||m.attachment_status==='provided')errors.push('附件未核实 '+m.message_id);
 if(!Array.isArray(m.trade_fact_ids))errors.push('缺少交易事实引用数组 '+m.message_id);
 const refs=Array.isArray(m.trade_fact_ids)?m.trade_fact_ids:[];
 for(const ref of refs){const f=facts.get(ref);if(!f||f.character_id!==id)errors.push('交易事实不属于该成员或已失效 '+ref);}
 if(/(?:已(?:经)?(?:买入|卖出|成交|取消|预留)|我(?:持有|持仓|买了|卖了)|j['’]ai\s+(?:acheté|vendu)|je\s+(?:détiens|possède))/i.test(text)&&!refs.length)errors.push('交易事实缺少模拟依据 '+m.message_id);
 if(refs.length&&/已(?:经)?卖出|j['’]ai\s+vendu/i.test(text)&&!refs.some(r=>facts.get(r)&&facts.get(r).kind==='sold'))errors.push('卖出声明与模拟状态不符 '+m.message_id);
 if(refs.length&&/已(?:经)?买入|j['’]ai\s+acheté/i.test(text)&&!refs.some(r=>facts.get(r)&&facts.get(r).kind==='bought'))errors.push('买入声明与模拟状态不符 '+m.message_id);
 const normalized=text.trim().replace(/\s+/g,' ');if(texts.has(normalized))errors.push('重复消息 '+m.message_id);texts.add(normalized);
 const p=reg.byId[id],len=[...text].length;if(p.sentence_length&&(len<p.sentence_length.min||len>p.sentence_length.max))warnings.push('句长超出人物软范围 '+id);
 const saved={...clone(m),speaker_id:id,text_fr:text};messages.push(saved);current.set(m.message_id,saved);
 }
 for(const m of messages)if(m.reply_to&&!known.has(m.reply_to)&&!current.has(m.reply_to))errors.push('无效回复引用 '+m.reply_to);
 for(const m of messages){const visited=new Set([m.message_id]);let r=m.reply_to;while(r&&current.has(r)){if(visited.has(r)){errors.push('循环回复引用 '+m.message_id);break;}visited.add(r);r=current.get(r).reply_to;}}
 const events=[];
 for(const e of obj.memory_events||[]){const m=current.get(e.source_message_id);if(!m||e.character_id!==m.character_id||typeof e.evidence!=='string'||!e.evidence.trim()||!m.text.includes(e.evidence)||!e.summary_zh){errors.push('记忆缺少本人成员原文依据');continue;}
 if(!['opinion','question','interaction','disagreement','opinion_transition','relationship_change'].includes(e.event_type)){errors.push('未知记忆事件类型');continue;}
 if(['opinion_transition','relationship_change'].includes(e.event_type)&&(!e.reason||!e.previous_view||!e.new_view))errors.push('观点或关系变化缺少原因和前后状态');
 if(e.event_type==='opinion_transition'){const previous=state.memory[e.character_id]&&state.memory[e.character_id].opinions&&state.memory[e.character_id].opinions[e.topic||'general'];if(previous&&previous!==e.previous_view)errors.push('原观点与正式记忆不一致');}
 if(e.event_type==='interaction'&&(!m.reply_to||!(current.get(m.reply_to)||known.get(m.reply_to))))errors.push('互动记忆缺少回复对象');
 events.push(clone(e));}
 warnings.push('人物知识边界、自然语言事实、新闻真实性和不同声线仍需人工复核。');
 return {errors,warnings,messages,events};
}
function adopt(state,report,sc,{confirmed=false,expectedRevision,sessionId,simulation}={}){
 if(!confirmed)throw Error('用户尚未明确采用/保存');if(expectedRevision!==state.revision)throw Error('正式记忆版本已变化，请重新生成或检查');
 if(report.errors.length)throw Error(report.errors.join('；'));if(!sessionId||state.sessions.some(s=>s.id===sessionId))throw Error('会话编号重复');
 const next=clone(state),prefix=sessionId+'_',mapping=new Map(report.messages.map(m=>[m.message_id,prefix+m.message_id]));
 mapping.set('source',prefix+'source');
 const messages=report.messages.map(m=>({...clone(m),message_id:mapping.get(m.message_id),reply_to:mapping.get(m.reply_to)||m.reply_to}));
 const source={message_id:prefix+'source',character_id:sc.sourceKind,speaker_id:sc.sourceKind,text:sc.sourceText,text_fr:sc.sourceText,user_supplied:true};
 for(const e of report.events){const id=e.character_id,m=next.memory[id]||(next.memory[id]={recent:[],medium:[],long:[],opinions:{}}),event={...clone(e),source_message_id:mapping.get(e.source_message_id),at:sc.date+'T'+sc.time+':00',sessionId};m.recent=m.recent||[];m.recent.push(event);m.opinions=m.opinions||{};
 if(e.event_type==='opinion'||e.event_type==='opinion_transition')m.opinions[e.topic||'general']=e.new_view||e.stance_after||e.summary_zh;
 if(e.event_type==='question')next.questions.push({question_id:event.source_message_id,character_id:id,topic:e.topic,status:'open',source_message_id:event.source_message_id,text:e.summary_zh});
 if(e.event_type==='disagreement')next.disagreements.push({character_id:id,topic:e.topic,status:'open',source_message_id:event.source_message_id,text:e.summary_zh});
 }
 const sess={id:sessionId,date:sc.date,period:sc.period,stage:sc.stage,createdAt:sc.date+'T'+sc.time+':00',sourceKind:sc.sourceKind,sourceText:sc.sourceText,selectedIds:[...new Set(messages.map(m=>m.character_id))],messages:[source,...messages],simulation:clone(simulation),status:'adopted'};
 next.sessions.unshift(sess);
 const allMessages=new Map(next.sessions.flatMap(s=>s.messages||[]).map(m=>[m.message_id,m]));next.interactions=next.interactions||[];
 for(const m of messages){const target=allMessages.get(m.reply_to);if(target)next.interactions.push({character_id:m.character_id,target_id:target.character_id,source_message_id:m.message_id,reply_to:m.reply_to});}
 next.dailySummaries=next.dailySummaries||{};const daySessions=next.sessions.filter(s=>s.date===sc.date);
 next.dailySummaries[sc.date]={session_ids:daySessions.map(s=>s.id),message_ids:daySessions.flatMap(s=>s.messages.map(m=>m.message_id)),open_questions:next.questions.filter(q=>q.status==='open').map(q=>q.question_id),simulation_refs:daySessions.map(s=>({session_id:s.id,offer_id:s.simulation&&s.simulation.offer_id}))};
 if(sc.closed&&!next.closed.includes(sc.date+'|'+sc.period))next.closed.push(sc.date+'|'+sc.period);next.revision++;return next;
}
const api={courses,stageAt,registry,memberType,migrate,scene,select,prompt,validate,adopt};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ChenNanScriptEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
