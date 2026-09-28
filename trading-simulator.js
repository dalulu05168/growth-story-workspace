/* Trading simulation v2: stock offer -> recommend people -> invite/reject -> buy -> holdings -> sell. */
(function(){
'use strict';

const OKEY='sim-v2';
let activeOfferId=null;

function el(id){return document.getElementById(id)}
function qsa(s){return [...document.querySelectorAll(s)]}
function h(v){return String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function day(d){const x=d?new Date(d):new Date();return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')}
function dt(d){if(!d)return'--';const x=new Date(d);return Number.isNaN(x.getTime())?'--':x.toLocaleString('zh-CN',{hour12:false})}
function nm(p){return p?(p.name||p.frenchName||p.id):'未知人物'}
function sex(p){return p?.gender||pGender(p)||''}
function rel(p){return pRelationName(p)||''}
function vip(p){return !!p?.vip?.is_vip}
function opened(p){return !!p?.account?.opened}
function initials(p){return nm(p).split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()}
function money(v){return '$'+Number(v||0).toLocaleString('en-US',{maximumFractionDigits:2})}
function ensure(){
  db.tradeSim=db.tradeSim&&typeof db.tradeSim==='object'?db.tradeSim:{};
  db.tradeSim.offers=Array.isArray(db.tradeSim.offers)?db.tradeSim.offers:[];
  db.tradeSim.recommendations=Array.isArray(db.tradeSim.recommendations)?db.tradeSim.recommendations:[];
  db.portfolio=db.portfolio&&typeof db.portfolio==='object'?db.portfolio:{};
  db.portfolio.holdings=Array.isArray(db.portfolio.holdings)?db.portfolio.holdings:[];
  db.portfolio.buyPlans=Array.isArray(db.portfolio.buyPlans)?db.portfolio.buyPlans:[];
}
function contactCount(p){return db.records.filter(r=>String(r.personId)===String(p.id)).length}
function leaderFor(p){
  const gs=(db.customGroups||[]).filter(g=>(g.members||[]).includes(String(p.id)));
  return gs.map(g=>g.leader).filter(Boolean).join(' / ')||'未设置';
}
function todayPlans(){
  ensure();const d=day();
  return db.portfolio.buyPlans.filter(x=>x.date===d&&x.status==='planned');
}
function currentHoldings(pid){
  ensure();return db.portfolio.holdings.filter(x=>x.status!=='sold'&&(!pid||String(x.personId)===String(pid)));
}
function score(p){
  const freq=p.trade_profile?.participation_frequency;
  const f=freq==='HIGH'?30:freq==='LOW'?10:20;
  const noHold=currentHoldings(p.id).length?0:15;
  const required=p.trade_profile?.required_today?50:0;
  return required+f+noHold+(pEnthusiasm(p)||0)/10+Math.min(10,contactCount(p));
}
function offer(id){ensure();return db.tradeSim.offers.find(x=>x.id===id)||null}
function recommendationFor(offerId){ensure();return db.tradeSim.recommendations.find(x=>x.offerId===offerId&&x.date===day())||null}
function remaining(ms){
  if(ms<=0)return'已满足持有时限';
  const mins=Math.floor(ms/60000),days=Math.floor(mins/1440),hours=Math.floor((mins%1440)/60),m=mins%60;
  return (days?days+'天 ':'')+(hours?hours+'小时 ':'')+m+'分';
}
function sellAt(hd,buyAt){return new Date(new Date(buyAt).getTime()+Number(hd||0)*86400000).toISOString()}
function holdingStatus(hd){
  const end=hd.plannedSellAt?new Date(hd.plannedSellAt).getTime():Infinity;
  const left=end-Date.now();
  if(left<=0)return{key:'ready',label:'可卖出',left};
  if(left<=12*3600000)return{key:'soon',label:'临近到期',left};
  return{key:'holding',label:'持有中',left};
}
function stockKey(hd){return (hd.offerId||'legacy')+'|'+(hd.symbol||'')+'|'+String(hd.buyAt||'').slice(0,10)}

function setupUI(){
  ensure();
  const nav=document.querySelector('.nav');
  const old=nav?.querySelector('[data-page="trades"]');if(old)old.style.display='none';
  if(nav&&!nav.querySelector('[data-page="tradeRecommend"]')){
    const a=document.createElement('button');a.dataset.page='tradeRecommend';a.innerHTML='<i>✦</i><span>人物交易列表</span>';a.onclick=()=>{go('tradeRecommend');renderRecommend()};
    const b=document.createElement('button');b.dataset.page='holdingsV2';b.innerHTML='<i>▥</i><span>持仓管理</span>';b.onclick=()=>{go('holdingsV2');renderHoldings()};
    const groups=nav.querySelector('[data-page="groups"]');if(groups){groups.after(b);groups.after(a)}else{nav.append(a,b)}
  }
  const main=document.querySelector('.main');
  if(!el('tradeRecommend')){
    const s=document.createElement('section');s.id='tradeRecommend';s.className='section';
    s.innerHTML='<div id="tradeRecommendBody"></div>';main.appendChild(s);
  }
  if(!el('holdingsV2')){
    const s=document.createElement('section');s.id='holdingsV2';s.className='section';
    s.innerHTML='<div id="holdingsV2Body"></div>';main.appendChild(s);
  }
  if(!el('simStyles')){
    const st=document.createElement('style');st.id='simStyles';
    st.textContent='.offer-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.offer-stat{border:1px solid var(--line);border-radius:12px;padding:12px;background:#fafbfe}.offer-stat span{display:block;font-size:11px;color:var(--muted)}.offer-stat b{display:block;font-size:17px;margin-top:3px}.candidate-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.candidate-card{border:1px solid var(--line);border-radius:15px;padding:15px;background:#fff;display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center}.gender-avatar{width:50px;height:50px;border-radius:16px;display:grid;place-items:center;font-weight:900;font-size:15px}.gender-avatar.f{background:#ffe7f2;color:#c24279}.gender-avatar.m{background:#e6efff;color:#3260c8}.candidate-card .meta{color:var(--muted);font-size:12px;margin-top:4px}.candidate-card .actions{justify-content:flex-end}.candidate-card.invited{border-color:#91d5bd;background:#f5fffb}.candidate-card.rejected{opacity:.58;background:#f7f7f8}.candidate-card.bought{border-color:#8fa7ff;background:#f6f8ff}.offer-list{display:grid;gap:10px}.offer-row{display:flex;justify-content:space-between;gap:15px;align-items:center;padding:13px;border:1px solid var(--line);border-radius:12px}.offer-row.active{border-color:#9eb1ff;background:#f7f9ff}.hold-chart{display:flex;align-items:flex-end;gap:12px;height:260px;padding:20px 12px 35px;border:1px solid var(--line);border-radius:14px;overflow-x:auto;background:linear-gradient(180deg,#fbfcff,#fff)}.hold-bar-wrap{min-width:90px;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center}.hold-bar{width:54px;border-radius:10px 10px 4px 4px;background:#dce5ff;min-height:14px;transition:.2s}.hold-bar.ready{background:#bcebd8}.hold-bar.soon{background:#ffe0a8}.hold-bar-label{font-size:11px;text-align:center;margin-top:7px;max-width:90px;overflow:hidden;text-overflow:ellipsis}.stock-ready{color:var(--green);font-weight:900}.stock-soon{color:var(--amber);font-weight:900}.stock-holding{color:var(--blue);font-weight:900}.batch-card{border:1px solid var(--line);border-radius:14px;padding:14px;margin-top:10px}.batch-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.person-mini{display:flex;gap:9px;align-items:center;border:1px solid var(--line);border-radius:11px;padding:9px}.person-mini .gender-avatar{width:38px;height:38px;border-radius:12px}.person-mini-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-top:12px}@media(max-width:1100px){.candidate-grid{grid-template-columns:1fr}.person-mini-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:700px){.offer-grid{grid-template-columns:repeat(2,1fr)}.candidate-card{grid-template-columns:auto 1fr}.candidate-card .actions{grid-column:1/-1}.person-mini-grid{grid-template-columns:1fr}}';
    document.head.appendChild(st);
  }
}

function renderRecommend(){
  ensure();setupUI();
  const body=el('tradeRecommendBody');if(!body)return;
  const offers=[...db.tradeSim.offers].sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
  if(!activeOfferId&&offers[0])activeOfferId=offers[0].id;
  const o=offer(activeOfferId),rec=o?recommendationFor(o.id):null;
  body.innerHTML='<div class="topbar"><div><div class="eyebrow">SIMULATED TRADE RECOMMENDATION</div><h1 class="page-title">人物交易列表</h1><p class="sub">设定模拟股票条件，一键从主看板“今日待买”人员优先推荐，再由用户逐一邀请或拒绝。</p></div><button class="btn primary" id="newOffer">＋ 新建股票计划</button></div>'+
  '<div class="grid"><div class="card panel"><div class="panel-head"><h2>股票计划</h2><span class="muted">'+offers.length+' 个计划</span></div><div class="offer-list">'+(offers.map(x=>'<div class="offer-row '+(x.id===activeOfferId?'active':'')+'"><div><b>'+h(x.symbol)+' · '+h(x.name)+'</b><div class="muted">'+h(x.market||'美股')+' · 折扣 '+h(x.discountPct)+'% · 单价 '+money(x.unitPrice)+' · 最低 '+h(x.minShares)+'股 · 持有'+h(x.holdDays)+'天 · '+h(x.participantCount)+'人</div></div><div class="button-row"><button class="btn ghost small" data-offer-open="'+h(x.id)+'">打开</button><button class="btn ghost small" data-offer-edit="'+h(x.id)+'">编辑</button></div></div>').join('')||'<div class="empty">还没有股票计划</div>')+'</div></div>'+
  '<div class="card panel"><div class="panel-head"><h2>当前计划</h2><span class="muted">模拟交易</span></div>'+(o?offerInfo(o):'<div class="empty">请先新建股票计划</div>')+'</div></div>'+
  (o?'<div class="card panel" style="margin-top:18px"><div class="panel-head"><h2>推荐购买人物</h2><div class="button-row"><span class="muted">主页面今日待买：'+todayPlans().length+' 人</span><button class="btn primary" id="recommendPeople">一键推荐购买人物</button></div></div>'+(rec?renderCandidates(o,rec):'<div class="empty">点击“一键推荐购买人物”生成名单</div>')+'</div>':'');
  bindRecommend();
}
function offerInfo(o){
  return '<div class="offer-grid">'+
    stat('股票',o.symbol+' · '+o.name)+stat('市场',o.market||'美股')+stat('折扣占比',o.discountPct+'%')+stat('单价',money(o.unitPrice))+
    stat('最低持有',o.minShares+' 股')+stat('持有时限',o.holdDays+' 天')+stat('购买人数',o.participantCount+' 人')+stat('最低资金',money(Number(o.minShares)*Number(o.unitPrice)))+
  '</div>';
}
function stat(k,v){return'<div class="offer-stat"><span>'+h(k)+'</span><b>'+h(v)+'</b></div>'}
function renderCandidates(o,rec){
  const people=rec.candidates.map(c=>({c,p:person(c.personId)})).filter(x=>x.p);
  return '<div class="candidate-grid">'+people.map(({c,p})=>{
    const cls=c.status==='invited'?'invited':c.status==='rejected'?'rejected':c.status==='bought'?'bought':'';
    const no=String(p.legacy_id||String(p.id).replace(/\D/g,'')).padStart(2,'0');
    const labelLine=no+(genderRelationLabel(p)||'')+' · '+nm(p);
    return '<div class="candidate-card '+cls+'"><div class="gender-avatar '+(sex(p)==='女'?'f':'m')+'">'+h(initials(p))+'</div><div><b>'+h(labelLine)+'</b><div class="meta">VIP：'+(vip(p)?h(p.vip?.level||'是'):'否')+'　组长：'+h(leaderFor(p))+'</div><div class="meta">已参与联系次数：'+contactCount(p)+'　推荐来源：'+h(c.source)+'</div><div class="meta">当前状态：'+h(c.status==='pending'?'待确认':c.status==='invited'?'已邀请':c.status==='rejected'?'已拒绝':'已确认买入')+'</div></div><div class="actions">'+
      (c.status==='pending'?'<button class="btn danger small" data-reject="'+h(p.id)+'">拒绝</button><button class="btn primary small" data-invite="'+h(p.id)+'">邀请</button>':'')+
      (c.status==='invited'?'<button class="btn ghost small" data-reject="'+h(p.id)+'">拒绝</button><button class="btn primary small" data-confirm-buy="'+h(p.id)+'">确认买入</button>':'')+
      (c.status==='rejected'?'<button class="btn ghost small" data-invite="'+h(p.id)+'">重新邀请</button>':'')+
      (c.status==='bought'?'<span class="pill good">已形成持仓</span>':'')+
    '</div></div>';
  }).join('')+'</div>';
}
function bindRecommend(){
  el('newOffer')?.addEventListener('click',()=>editOffer());
  qsa('[data-offer-open]').forEach(b=>b.onclick=()=>{activeOfferId=b.dataset.offerOpen;renderRecommend()});
  qsa('[data-offer-edit]').forEach(b=>b.onclick=()=>editOffer(b.dataset.offerEdit));
  el('recommendPeople')?.addEventListener('click',()=>makeRecommendations(activeOfferId));
  qsa('[data-invite]').forEach(b=>b.onclick=()=>setCandidate(activeOfferId,b.dataset.invite,'invited'));
  qsa('[data-reject]').forEach(b=>b.onclick=()=>setCandidate(activeOfferId,b.dataset.reject,'rejected'));
  qsa('[data-confirm-buy]').forEach(b=>b.onclick=()=>confirmBuy(activeOfferId,b.dataset.confirmBuy));
}
function editOffer(id){
  const o=id?offer(id):{id:'of'+Date.now(),symbol:'DDD',name:'DDD',market:'美股',discountPct:15,minShares:100,holdDays:3,unitPrice:65,participantCount:10,createdAt:new Date().toISOString()};
  openModal(id?'编辑股票计划':'新建股票计划','<div class="form-grid"><div class="field"><label>股票代码 *</label><input class="input" name="symbol" required value="'+h(o.symbol)+'"></div><div class="field"><label>股票名称 *</label><input class="input" name="name" required value="'+h(o.name)+'"></div><div class="field"><label>市场</label><input class="input" name="market" value="'+h(o.market||'美股')+'"></div><div class="field"><label>折扣占比 %</label><input class="input" type="number" min="0" max="99" step="0.01" name="discount" value="'+h(o.discountPct)+'"></div><div class="field"><label>最低持有股数</label><input class="input" type="number" min="1" name="shares" value="'+h(o.minShares)+'"></div><div class="field"><label>持有时间限制（天）</label><input class="input" type="number" min="0" name="days" value="'+h(o.holdDays)+'"></div><div class="field"><label>单价 USD</label><input class="input" type="number" min="0" step="0.01" name="price" value="'+h(o.unitPrice)+'"></div><div class="field"><label>购买人数</label><input class="input" type="number" min="1" max="70" name="count" value="'+h(o.participantCount)+'"></div></div>',fd=>{
    o.symbol=String(fd.get('symbol')).trim().toUpperCase();o.name=String(fd.get('name')).trim();o.market=String(fd.get('market')).trim()||'美股';o.discountPct=Number(fd.get('discount'))||0;o.minShares=Math.max(1,Number(fd.get('shares'))||1);o.holdDays=Math.max(0,Number(fd.get('days'))||0);o.unitPrice=Math.max(0,Number(fd.get('price'))||0);o.participantCount=Math.max(1,Math.min(70,Number(fd.get('count'))||1));
    if(!id){db.tradeSim.offers.push(o);activeOfferId=o.id}else activeOfferId=id;setTimeout(renderRecommend,0);
  });
}
function makeRecommendations(offerId){
  const o=offer(offerId);if(!o)return;
  // Preserve today's decisions when refreshing the recommendation list.
  const existing=recommendationFor(offerId);
  if(existing){renderRecommend();toast('今日名单已生成，已保留邀请和成交状态');return}
  const planMap=new Map(todayPlans().map(x=>[String(x.personId),x]));
  const openedPeople=db.people.filter(opened);
  const fromToday=openedPeople.filter(p=>planMap.has(String(p.id))).sort((a,b)=>score(b)-score(a));
  const todayIds=new Set(fromToday.map(p=>String(p.id)));
  const fill=openedPeople.filter(p=>!todayIds.has(String(p.id))).sort((a,b)=>score(b)-score(a));
  const chosen=fromToday.concat(fill).slice(0,o.participantCount);
  const rec={id:'rec'+Date.now(),offerId:o.id,date:day(),createdAt:new Date().toISOString(),candidates:chosen.map(p=>({personId:String(p.id),status:'pending',source:todayIds.has(String(p.id))?'主看板今日待买':'已开户补充推荐'}))};
  db.tradeSim.recommendations=db.tradeSim.recommendations.filter(x=>!(x.offerId===o.id&&x.date===day()));
  db.tradeSim.recommendations.push(rec);save();renderRecommend();toast('已推荐 '+chosen.length+' 人，优先使用今日待买名单');
}
function setCandidate(offerId,pid,status){
  const rec=recommendationFor(offerId);if(!rec)return;const c=rec.candidates.find(x=>String(x.personId)===String(pid));if(!c||c.status==='bought'||!['invited','rejected'].includes(status))return;
  const o=offer(offerId);
  if(!o)return;c.status=status;
  if(status==='invited'){
    const exists=db.portfolio.buyPlans.some(x=>x.date===day()&&String(x.personId)===String(pid)&&x.offerId===o.id&&x.status==='planned');
    if(!exists)db.portfolio.buyPlans.push({id:'bp'+Date.now()+pid,personId:String(pid),date:day(),symbol:o.symbol,stockName:o.name,reason:'模拟交易邀请',source:'recommendation',offerId:o.id,status:'planned'});
  }else if(status==='rejected'){
    db.portfolio.buyPlans=db.portfolio.buyPlans.filter(x=>!(x.date===day()&&String(x.personId)===String(pid)&&x.offerId===o.id&&x.status==='planned'));
  }
  save();renderRecommend();
}
function confirmBuy(offerId,pid){
  const o=offer(offerId),rec=recommendationFor(offerId);if(!o||!rec)return;
  const c=rec.candidates.find(x=>String(x.personId)===String(pid));if(!c||c.status!=='invited')return;
  if(!person(pid)||!opened(person(pid)))return;
  const buyAt=new Date().toISOString(),plannedSellAt=sellAt(o.holdDays,buyAt);
  db.portfolio.holdings.push({id:'h'+Date.now()+pid,offerId:o.id,personId:String(pid),symbol:o.symbol,name:o.name,quantity:o.minShares,buyPrice:o.unitPrice,buyAt,plannedSellAt,status:'holding',simulated:true});
  db.portfolio.buyPlans.forEach(x=>{if(x.offerId===o.id&&String(x.personId)===String(pid)&&x.status==='planned'){x.status='done';x.doneAt=buyAt}});
  c.status='bought';save();renderRecommend();toast(nm(person(pid))+' 已确认买入并形成持仓');
}

function batches(){
  const map=new Map();
  currentHoldings().forEach(hd=>{
    const k=stockKey(hd);if(!map.has(k))map.set(k,{key:k,offerId:hd.offerId,symbol:hd.symbol,name:hd.name,buyAt:hd.buyAt,rows:[]});
    map.get(k).rows.push(hd);
  });
  return [...map.values()].sort((a,b)=>String(a.buyAt).localeCompare(String(b.buyAt)));
}
function batchStatus(b){
  const states=b.rows.map(holdingStatus);
  if(states.every(x=>x.key==='ready'))return{key:'ready',label:'满足持有条件'};
  if(states.some(x=>x.key==='ready')||states.some(x=>x.key==='soon'))return{key:'soon',label:'部分临近/可卖'};
  return{key:'holding',label:'持有中'};
}
function renderHoldings(){
  ensure();setupUI();
  const body=el('holdingsV2Body');if(!body)return;
  const bs=batches(),max=Math.max(1,...bs.map(b=>b.rows.reduce((s,x)=>s+(Number(x.buyPrice)||0)*(Number(x.quantity)||0),0)));
  body.innerHTML='<div class="topbar"><div><div class="eyebrow">PORTFOLIO HOLDINGS</div><h1 class="page-title">持仓页面</h1><p class="sub">按买入先后展示股票批次、持有人和距离计划卖出时间的剩余时长。</p></div><button class="btn ghost" id="goRecommend">返回人物交易列表</button></div>'+
  '<div class="card panel"><div class="panel-head"><h2>买入批次柱状图</h2><span class="muted">柱高按该批次买入金额；绿色=已满足持有条件，橙色=临近到期</span></div><div class="hold-chart">'+
  (bs.length?bs.map(b=>{const total=b.rows.reduce((s,x)=>s+(Number(x.buyPrice)||0)*(Number(x.quantity)||0),0),st=batchStatus(b),height=Math.max(14,Math.round(total/max*180));return'<div class="hold-bar-wrap"><div class="hold-bar '+st.key+'" style="height:'+height+'px" title="'+h(b.symbol)+' '+money(total)+'"></div><div class="hold-bar-label '+(st.key==='ready'?'stock-ready':st.key==='soon'?'stock-soon':'stock-holding')+'">'+h(b.symbol||'--')+'<br>'+h(String(b.buyAt||'').slice(0,10))+'</div></div>'}).join(''):'<div class="empty">暂无持仓</div>')+
  '</div></div><div class="card panel" style="margin-top:18px"><div class="panel-head"><h2>持仓明细</h2><span class="muted">'+currentHoldings().length+' 笔</span></div>'+renderBatches(bs)+'</div>';
  el('goRecommend')?.addEventListener('click',()=>{go('tradeRecommend');renderRecommend()});
  qsa('[data-sell-batch]').forEach(b=>b.onclick=()=>openSellBatch(b.dataset.sellBatch));
}
function renderBatches(bs){
  if(!bs.length)return'<div class="empty">暂无持仓记录</div>';
  return bs.map(b=>{
    const st=batchStatus(b),next=Math.min(...b.rows.map(x=>new Date(x.plannedSellAt).getTime())),left=remaining(next-Date.now()),total=b.rows.reduce((s,x)=>s+(Number(x.buyPrice)||0)*(Number(x.quantity)||0),0);
    return'<div class="batch-card"><div class="batch-top"><div><b class="'+(st.key==='ready'?'stock-ready':st.key==='soon'?'stock-soon':'stock-holding')+'">'+h(b.symbol||'--')+' · '+h(b.name||'')+'</b><div class="muted">买入时间 '+h(dt(b.buyAt))+' · '+b.rows.length+' 人 · 本批投入 '+money(total)+' · '+h(left)+'</div></div><button class="btn '+(st.key==='ready'?'primary':'ghost')+' small" data-sell-batch="'+h(b.key)+'">卖出</button></div><div class="person-mini-grid">'+b.rows.map(x=>{const p=person(x.personId),hs=holdingStatus(x);return'<div class="person-mini"><div class="gender-avatar '+(sex(p)==='女'?'f':'m')+'">'+h(initials(p))+'</div><div><b>'+h(String(p?.legacy_id||'').padStart(2,'0')+(genderRelationLabel(p)||'')+' · '+nm(p))+'</b><small class="muted">'+h(hs.label)+' · '+h(remaining(hs.left))+'</small></div></div>'}).join('')+'</div></div>';
  }).join('');
}
function openSellBatch(key){
  const b=batches().find(x=>x.key===key);if(!b)return;
  const allReady=b.rows.every(x=>holdingStatus(x).key==='ready');
  const cards=b.rows.map(x=>{const p=person(x.personId),hs=holdingStatus(x);return'<label class="person-mini"><input type="checkbox" name="sellPerson" value="'+h(x.id)+'" '+(hs.key==='ready'?'checked':'')+'><div class="gender-avatar '+(sex(p)==='女'?'f':'m')+'">'+h(initials(p))+'</div><div><b>'+h(nm(p))+'</b><small class="muted">'+h(hs.label)+' · '+h(remaining(hs.left))+'</small></div></label>'}).join('');
  openModal('确认卖出 · '+b.symbol+' '+b.name,'<div class="notice '+(allReady?'success':'warn')+'">'+(allReady?'本批所有持仓均已满足持有时限。':'本批仍有人尚未满足持有时限，系统只默认勾选已到期人员；用户仍可自行决定。')+'</div><div class="person-mini-grid">'+cards+'</div><div class="form-grid" style="margin-top:14px"><div class="field"><label>卖出价（USD，可统一录入）</label><input class="input" name="soldPrice" type="number" min="0" step="0.01"></div></div>',fd=>{
    const ids=qsa('#modalForm input[name="sellPerson"]:checked').map(x=>x.value);if(!ids.length){toast('至少选择一位持仓人员');return false}
    const price=Number(fd.get('soldPrice'))||null,now=new Date().toISOString();
    db.portfolio.holdings.forEach(x=>{if(ids.includes(x.id)){x.status='sold';x.soldAt=now;x.soldPrice=price}});
    save();setTimeout(renderHoldings,0);toast('已确认卖出 '+ids.length+' 位人员的持仓');
  });
}

function bindNav(){
  qsa('.nav button').forEach(b=>{
    if(b.dataset.page==='tradeRecommend')b.onclick=()=>{go('tradeRecommend');renderRecommend()};
    if(b.dataset.page==='holdingsV2')b.onclick=()=>{go('holdingsV2');renderHoldings()};
  });
}
setupUI();bindNav();
})();
