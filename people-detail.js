/* Detailed people directory and dedicated second-page profile view. */
(function(){
'use strict';

function $id(id){return document.getElementById(id)}
function s(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'})[m]})}
function cash(v){return '€ '+Number(v||0).toLocaleString('fr-FR',{maximumFractionDigits:2})}
function label(p){return p?(p.name||p.frenchName||p.id):'未知人物'}
function isOpened(p){return !!(p&&p.account&&p.account.opened)}
function isJoined(p){return !!(p&&p.crm&&p.crm.joined_group)}
function allHoldings(){return db.portfolio&&Array.isArray(db.portfolio.holdings)?db.portfolio.holdings:[]}
function allPlans(){return db.portfolio&&Array.isArray(db.portfolio.buyPlans)?db.portfolio.buyPlans:[]}
function personHoldings(p,includeSold){return allHoldings().filter(function(h){return String(h.personId)===String(p.id)&&(includeSold||h.status!=='sold')})}
function contactCount(p){return db.records.filter(function(r){return String(r.personId)===String(p.id)}).length}
function participationCount(p){
  const hs=allHoldings().filter(function(h){return String(h.personId)===String(p.id)}).length;
  const done=allPlans().filter(function(x){return String(x.personId)===String(p.id)&&x.status==='done'}).length;
  return hs+done;
}
function holdingCost(p){return personHoldings(p,false).reduce(function(sum,h){return sum+(Number(h.buyPrice)||0)*(Number(h.quantity)||0)},0)}
function performance(p){
  p.performance=p.performance&&typeof p.performance==='object'?p.performance:{};
  const invested=Number(p.performance.invested_capital_eur)||holdingCost(p)||0;
  const profit=p.performance.total_profit_eur;
  if(profit===null||profit===undefined||profit==='')return{invested:invested,profit:null,ratio:null};
  const pn=Number(profit);
  return{invested:invested,profit:pn,ratio:invested>0?pn/invested*100:null};
}
function ratioText(r){return r==null?'未录入':(r>=0?'+':'')+Number(r).toFixed(2)+'%'}
function freq(p){const f=p&&p.trade_profile&&p.trade_profile.participation_frequency;return f==='HIGH'?'高':f==='LOW'?'低':'中'}
function currentList(){
  const q=($id('personSearch')?.value||'').trim().toLowerCase(),sort=$id('personSort')?.value||'id';
  const sg=systemGroup($id('systemGroupFilter')?.value||'all'),cgid=$id('customGroupFilter')?.value||'all',cg=customGroup(cgid);
  let list=db.people.filter(function(p){return sg.test(p)&&(!cg||cg.members.includes(String(p.id)))&&(!q||personSearchBlob(p).includes(q))});
  list.sort(function(a,b){
    if(sort==='name')return pName(a).localeCompare(pName(b),'fr');
    if(sort==='enthusiasm')return pEnthusiasm(b)-pEnthusiasm(a);
    if(sort==='assets')return pAssets(b)-pAssets(a);
    return String(a.id).localeCompare(String(b.id),undefined,{numeric:true});
  });
  return list;
}

function ensureUI(){
  if(!$id('personDetailPage')){
    const sec=document.createElement('section');sec.id='personDetailPage';sec.className='section';
    sec.innerHTML='<div id="personDetailContent"></div>';
    const trades=$id('trades'),main=document.querySelector('.main');
    if(trades&&trades.nextSibling)main.insertBefore(sec,trades.nextSibling);else main.appendChild(sec);
  }
  if(!$id('peopleDetailStyles')){
    const st=document.createElement('style');st.id='peopleDetailStyles';
    st.textContent='.people-table-wrap{overflow:auto;border:1px solid var(--line);border-radius:13px}.people-data-table{width:100%;border-collapse:collapse;min-width:1420px;background:#fff}.people-data-table th,.people-data-table td{padding:11px 10px;border-bottom:1px solid var(--line);text-align:left;white-space:nowrap;vertical-align:middle}.people-data-table th{position:sticky;top:0;background:#f8fafc;color:var(--muted);font-size:11px;font-weight:800;z-index:1}.people-data-table tbody tr{cursor:pointer;transition:.18s}.people-data-table tbody tr:hover{background:#f7f9ff}.people-data-table .namecell{font-weight:800}.profit-pos{color:var(--green);font-weight:800}.profit-neg{color:var(--red);font-weight:800}.detail-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:18px}.detail-identity{display:flex;gap:14px;align-items:center}.detail-avatar{width:64px;height:64px;border-radius:18px;display:grid;place-items:center;background:linear-gradient(135deg,#e8edff,#dce5ff);color:#3456bd;font-size:20px;font-weight:900}.detail-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;margin-bottom:18px}.detail-kpi{padding:14px}.detail-kpi span{font-size:11px;color:var(--muted)}.detail-kpi strong{display:block;font-size:20px;margin-top:5px}.detail-columns{display:grid;grid-template-columns:1.05fr .95fr;gap:18px}.detail-card{padding:19px}.detail-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.detail-line{padding:10px;border:1px solid var(--line);border-radius:10px;background:#fafbfe}.detail-line span{display:block;color:var(--muted);font-size:11px}.detail-line b{display:block;margin-top:3px}.journey{display:grid}.journey-item{display:grid;grid-template-columns:105px 18px 1fr;gap:10px;min-height:64px}.journey-date{font-size:12px;color:var(--muted);padding-top:4px;text-align:right}.journey-rail{position:relative}.journey-rail:before{content:"";position:absolute;left:5px;top:7px;width:8px;height:8px;border-radius:50%;background:var(--blue)}.journey-rail:after{content:"";position:absolute;left:8px;top:18px;bottom:0;width:2px;background:var(--line)}.journey-item:last-child .journey-rail:after{display:none}.journey-body b{display:block}.journey-body small{color:var(--muted)}@media(max-width:1200px){.detail-kpis{grid-template-columns:repeat(3,1fr)}.detail-columns{grid-template-columns:1fr}}@media(max-width:700px){.detail-kpis{grid-template-columns:repeat(2,1fr)}.detail-list{grid-template-columns:1fr}.detail-head{flex-direction:column}.journey-item{grid-template-columns:82px 14px 1fr}}';
    document.head.appendChild(st);
  }
}

renderPeople=function(){
  const host=$id('peopleList');if(!host)return;
  const list=currentList(),count=$id('peopleCount');if(count)count.textContent='当前显示 '+list.length+' / '+db.people.length+' 人';
  host.innerHTML='<div class="people-table-wrap"><table class="people-data-table"><thead><tr><th>编号</th><th>姓名</th><th>性别</th><th>年龄</th><th>新/老</th><th>VIP</th><th>开户</th><th>入群</th><th>联系记录</th><th>参与次数</th><th>持仓</th><th>可投资资产</th><th>盈利占比</th><th>操作</th></tr></thead><tbody>'+
  list.map(function(p){
    const hs=personHoldings(p,false),pf=performance(p);
    return '<tr data-open-person="'+s(p.id)+'"><td>'+s(p.id)+'</td><td class="namecell">'+s(label(p))+'</td><td>'+s(pGender(p)||'--')+'</td><td>'+s(p.age||'--')+'</td><td>'+s(pRelationName(p)||'--')+'</td><td>'+(pVip(p)?s(p.vip?.level||'VIP'):'否')+'</td><td>'+(isOpened(p)?'已开户':'未开户')+'</td><td>'+(isJoined(p)?'已入群':'未入群')+'</td><td>'+contactCount(p)+'</td><td>'+participationCount(p)+'</td><td>'+(hs.length?hs.length+' 笔':'无')+'</td><td>'+cash(p.finance?.estimated_investable_assets_eur||0)+'</td><td class="'+(pf.ratio==null?'':(pf.ratio>=0?'profit-pos':'profit-neg'))+'">'+s(ratioText(pf.ratio))+'</td><td><button class="link-btn view-person" data-id="'+s(p.id)+'">详情</button> <button class="link-btn" data-trade-pref="'+s(p.id)+'">交易设置</button> <button class="link-btn edit-person" data-id="'+s(p.id)+'">编辑</button> <button class="link-btn danger delete-person" data-id="'+s(p.id)+'">删除</button></td></tr>';
  }).join('')+'</tbody></table></div>';
  host.querySelectorAll('[data-open-person]').forEach(function(row){row.onclick=function(e){if(e.target.closest('button'))return;openDetail(row.dataset.openPerson)}});
  host.querySelectorAll('.view-person').forEach(function(b){b.onclick=function(e){e.stopPropagation();openDetail(b.dataset.id)}});
  host.querySelectorAll('[data-trade-pref]').forEach(function(b){b.onclick=function(e){e.stopPropagation();editTradePrefLocal(b.dataset.tradePref)}});
  host.querySelectorAll('.edit-person').forEach(function(b){b.onclick=function(e){e.stopPropagation();openPerson(b.dataset.id)}});
  host.querySelectorAll('.delete-person').forEach(function(b){b.onclick=function(e){e.stopPropagation();deletePerson(b.dataset.id)}});
};

function editTradePrefLocal(id){
  const p=person(id);if(!p)return;
  p.trade_profile=p.trade_profile&&typeof p.trade_profile==='object'?p.trade_profile:{participation_frequency:'MEDIUM',required_today:false};
  openModal('交易参与设置 · '+label(p),'<div class="form-grid"><div class="field"><label>参与频率</label><select class="select" name="freq"><option value="HIGH" '+(p.trade_profile.participation_frequency==='HIGH'?'selected':'')+'>高</option><option value="MEDIUM" '+(p.trade_profile.participation_frequency==='MEDIUM'?'selected':'')+'>中</option><option value="LOW" '+(p.trade_profile.participation_frequency==='LOW'?'selected':'')+'>低</option></select></div><div class="field"><label>今天强制参与</label><select class="select" name="required"><option value="0" '+(!p.trade_profile.required_today?'selected':'')+'>否</option><option value="1" '+(p.trade_profile.required_today?'selected':'')+'>是</option></select></div></div>',function(fd){p.trade_profile.participation_frequency=String(fd.get('freq'));p.trade_profile.required_today=fd.get('required')==='1'});
}

function journey(p){
  const rows=[],add=function(date,title,detail){if(date)rows.push({date:String(date).slice(0,10),title:title,detail:detail||''})};
  add(p.customer_relation?.first_contact_date,'首次联系','客户关系建立');
  add(p.account?.opened_date,'完成开户',p.account?.status||'已开户');
  add(p.crm?.group_joined_date,'加入群组','进入运营群组');
  db.records.filter(function(r){return String(r.personId)===String(p.id)}).forEach(function(r){add(r.date,r.title||r.type,r.content||'')});
  allPlans().filter(function(x){return String(x.personId)===String(p.id)&&x.status==='done'}).forEach(function(x){add(x.doneAt||x.date,'完成买入计划',(x.symbol||'')+' '+(x.stockName||''))});
  allHoldings().filter(function(h){return String(h.personId)===String(p.id)}).forEach(function(h){
    add(h.buyAt,'建立持仓',(h.symbol||'')+' '+(h.name||'')+' · 数量 '+(h.quantity||0));
    if(h.status==='sold')add(h.soldAt,'完成卖出',(h.symbol||'')+' '+(h.name||''));
  });
  return rows.sort(function(a,b){return String(b.date).localeCompare(String(a.date))}).slice(0,50);
}
function line(k,v){return '<div class="detail-line"><span>'+s(k)+'</span><b>'+s(v)+'</b></div>'}
function holdingTable(p){
  const rows=personHoldings(p,true);
  if(!rows.length)return'<div class="empty">暂无持仓记录</div>';
  return'<div class="table-wrap"><table class="mini-table"><thead><tr><th>状态</th><th>股票</th><th>数量</th><th>买入价</th><th>买入时间</th><th>计划卖出</th></tr></thead><tbody>'+rows.map(function(h){return'<tr><td>'+(h.status==='sold'?'已售':'持仓')+'</td><td>'+s(h.symbol||'--')+' '+s(h.name||'')+'</td><td>'+s(h.quantity||0)+'</td><td>'+s(h.buyPrice||'--')+'</td><td>'+s(h.buyAt?new Date(h.buyAt).toLocaleString('zh-CN',{hour12:false}):'--')+'</td><td>'+s(h.plannedSellAt?new Date(h.plannedSellAt).toLocaleString('zh-CN',{hour12:false}):'--')+'</td></tr>'}).join('')+'</tbody></table></div>';
}
function openDetail(id){
  const p=person(id);if(!p)return;
  const hs=personHoldings(p,false),pf=performance(p),cost=holdingCost(p),contacts=contactCount(p),parts=participationCount(p),tl=journey(p);
  const groups=db.customGroups.filter(function(g){return(g.members||[]).includes(String(p.id))}).map(function(g){return g.name});
  go('personDetailPage');
  const host=$id('personDetailContent');if(!host)return;
  host.innerHTML='<div class="detail-head"><div class="detail-identity"><div class="detail-avatar">'+s((label(p).split(' ').map(function(x){return x[0]}).join('')).slice(0,2))+'</div><div><div class="eyebrow">PERSON PROFILE</div><h1 class="page-title" style="margin-bottom:5px">'+s(label(p))+'</h1><p class="sub">'+s(p.id)+' · '+s(pGender(p)||'--')+' · '+s(p.age||'--')+'岁 · '+s(pRelationName(p)||'--')+' · '+s(p.location?.city||'--')+'</p></div></div><div class="actions"><button class="btn ghost" id="detailBack">← 返回人物列表</button><button class="btn ghost" id="editPerformance">资金/盈利维护</button><button class="btn primary" id="detailEdit">编辑人物</button></div></div>'+
  '<div class="detail-kpis"><div class="card detail-kpi"><span>联系记录</span><strong>'+contacts+'</strong></div><div class="card detail-kpi"><span>参与次数</span><strong>'+parts+'</strong></div><div class="card detail-kpi"><span>当前持仓</span><strong>'+hs.length+' 笔</strong></div><div class="card detail-kpi"><span>持仓成本</span><strong>'+cash(cost)+'</strong></div><div class="card detail-kpi"><span>盈利占比</span><strong class="'+(pf.ratio==null?'':(pf.ratio>=0?'profit-pos':'profit-neg'))+'">'+s(ratioText(pf.ratio))+'</strong></div><div class="card detail-kpi"><span>股票热情</span><strong>'+s(pEnthusiasm(p))+'</strong></div></div>'+
  '<div class="detail-columns"><div class="card detail-card"><div class="panel-head"><h2>人物与资金详情</h2><span class="muted">画像 + 系统记录</span></div><div class="detail-list">'+
  line('系统分类',genderRelationLabel(p)||'--')+line('VIP',pVip(p)?(p.vip?.level||'VIP'):'否')+line('账户状态',p.account?.status||(isOpened(p)?'已开户':'未开户'))+line('群组状态',isJoined(p)?'已入群':'未入群')+
  line('职业',p.occupation?.title_zh||p.occupation?.title_fr||'--')+line('行业',p.occupation?.industry_zh||p.occupation?.industry_fr||'--')+
  line('年收入',cash(p.finance?.annual_income_eur||0))+line('可投资资产',cash(p.finance?.estimated_investable_assets_eur||0))+line('流动资产',cash(p.finance?.estimated_liquid_assets_eur||0))+line('可用投资资金',cash(p.finance?.available_investment_capital_eur||0))+
  line('累计投入资金',pf.invested?cash(pf.invested):'未录入')+line('累计盈利',pf.profit==null?'未录入':cash(pf.profit))+
  line('当前持仓成本',cash(cost))+line('风险偏好',p.investment_profile?.risk_tolerance||'--')+line('参与频率',freq(p))+line('自定义小组',groups.join('、')||'无')+
  '<div class="detail-line" style="grid-column:1/-1"><span>家庭情况</span><b>'+s(p.family?.summary||'--')+'</b></div><div class="detail-line" style="grid-column:1/-1"><span>性格</span><b>'+s(p.personality?.summary||'--')+'</b></div><div class="detail-line" style="grid-column:1/-1"><span>内部备注</span><b>'+s(p.crm?.notes||'--')+'</b></div></div></div>'+
  '<div class="card detail-card"><div class="panel-head"><h2>人物发展历程</h2><span class="muted">'+tl.length+' 个节点</span></div><div class="journey">'+(tl.length?tl.map(function(x){return'<div class="journey-item"><div class="journey-date">'+s(x.date)+'</div><div class="journey-rail"></div><div class="journey-body"><b>'+s(x.title)+'</b><small>'+s(x.detail)+'</small></div></div>'}).join(''):'<div class="empty">暂无发展历程记录</div>')+'</div></div></div>'+
  '<div class="card detail-card" style="margin-top:18px"><div class="panel-head"><h2>持仓明细</h2><span class="muted">实际录入的持仓记录</span></div>'+holdingTable(p)+'</div>';
  $id('detailBack').onclick=function(){go('people');renderPeople()};
  $id('detailEdit').onclick=function(){openPerson(p.id)};
  $id('editPerformance').onclick=function(){editPerformance(p.id)};
}
function editPerformance(id){
  const p=person(id);if(!p)return;
  p.performance=p.performance&&typeof p.performance==='object'?p.performance:{};
  const pf=performance(p);
  openModal('资金与盈利维护 · '+label(p),'<div class="form-grid"><div class="field"><label>累计投入资金 EUR</label><input class="input" type="number" min="0" step="0.01" name="invested" value="'+s(p.performance.invested_capital_eur??(pf.invested||''))+'"></div><div class="field"><label>累计盈利 EUR</label><input class="input" type="number" step="0.01" name="profit" value="'+s(p.performance.total_profit_eur??'')+'" placeholder="亏损可输入负数"></div><div class="field full"><div class="notice">盈利占比 = 累计盈利 ÷ 累计投入资金。系统不会自动伪造价格或收益；未录入盈利时显示“未录入”。</div></div></div>',function(f){p.performance.invested_capital_eur=Number(f.get('invested'))||0;const raw=String(f.get('profit')||'').trim();p.performance.total_profit_eur=raw===''?null:Number(raw);setTimeout(function(){openDetail(p.id)},0)});
}
viewPerson=openDetail;
['personSearch','personSort','systemGroupFilter','customGroupFilter'].forEach(function(id){
  const el=$id(id);if(!el)return;el.dataset.peopleDetailFilterBound='1';
  if(id==='personSearch')el.oninput=renderPeople;else el.onchange=renderPeople;
});

function refreshBindings(){
  document.querySelectorAll('#peopleList [data-trade-pref]').forEach(function(b){
    if(b.dataset.boundDetail)return;b.dataset.boundDetail='1';
    b.addEventListener('click',function(e){e.stopPropagation()});
  });
}
function afterRender(){
  ensureUI();renderPeople();bindDynamic();refreshBindings();
}
ensureUI();
afterRender();
})();