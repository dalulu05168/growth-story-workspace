/* 辰南撰写 · 概览页最终设计稿（2026-10-03）
   只调整导航、全局头部与概览页表现；不改变人物、交易、持仓、云同步业务数据。 */
(function(){
'use strict';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const app=$('.app'),sidebar=$('.sidebar'),main=$('.main'),nav=$('.nav'),overview=$('#overview');
if(!app||!sidebar||!main||!nav||!overview)return;

/* 固定导航：取消桌面伸缩，保留原功能入口。 */
app.classList.remove('nav-collapsed');
try{localStorage.removeItem('chennan-nav-collapsed')}catch{}
$('.nav-collapse')?.remove();

const labels={
  overview:'概览',
  people:'人物库',
  groups:'分组管理',
  tradeRecommend:'人物交易',
  holdingsV2:'持仓管理',
  trades:'交易计划',
  records:'人物记录',
  novel:'撰写',
  france70chat:'France 70',
  topics:'一致性检查'
};
const icons={
  overview:'⌂',people:'♙',groups:'☑',tradeRecommend:'▱',holdingsV2:'♧',
  trades:'↗',records:'▤',novel:'✎',france70chat:'♛',topics:'✓'
};
$$('button[data-page]',nav).forEach(btn=>{
  const span=$('span',btn),i=$('i',btn),page=btn.dataset.page;
  if(span&&labels[page])span.textContent=labels[page];
  if(i&&icons[page])i.textContent=icons[page];
});

/* 按设计稿固定桌面导航顺序。 */
['overview','people','groups','tradeRecommend','holdingsV2','trades','records','novel','france70chat','topics'].forEach(page=>{
  const btn=nav.querySelector('[data-page="'+page+'"]');
  if(btn)nav.appendChild(btn);
});
const logout=$('#logoutBtn');
if(logout){
  logout.classList.add('overview-logout');
  nav.appendChild(logout);
}

/* 顶部：搜索 + 同步/账户 + 概览操作按钮同行。 */
const header=$('.app-global-header');
const overviewTop=$('#overview .topbar');
const overviewActions=overviewTop?.querySelector('.actions');
if(header){
  header.classList.add('design-header');
  $('.header-brand',header)?.remove();
  if(overviewActions){
    overviewActions.classList.add('overview-header-actions');
    header.appendChild(overviewActions);
  }
}

/* 标题行：去掉旧介绍，改成设计稿中的实时资料状态。 */
if(overviewTop){
  overviewTop.classList.add('overview-titlebar');
  const titleBlock=overviewTop.firstElementChild;
  const oldSub=titleBlock?.querySelector('.sub');
  if(oldSub)oldSub.remove();
  if(titleBlock&&!$('.overview-title-row',titleBlock)){
    const h1=$('.page-title',titleBlock);
    if(h1){
      const row=document.createElement('div');
      row.className='overview-title-row';
      h1.parentNode.insertBefore(row,h1);
      row.appendChild(h1);
      const divider=document.createElement('span');
      divider.className='overview-title-divider';
      divider.setAttribute('aria-hidden','true');
      row.appendChild(divider);
      const summary=document.createElement('span');
      summary.className='overview-summary-inline';
      row.appendChild(summary);
    }
  }
}

/* 资料状态来自真实 seedNotice；只改变展示位置，不改数据。 */
const seed=$('#seedNotice');
function syncOverviewSummary(){
  const summary=$('.overview-summary-inline');
  if(!summary)return;
  const count=($('#metrics .metric strong')?.textContent||'').trim();
  const raw=(seed?.textContent||'').replace(/默认人物数据已就绪：/,'').trim();
  const clean=/\d+\s*位人物资料已加载/.test(raw)
    ? raw.replace(/\s*·\s*/g,' · ')
    : ((count||'70')+'位人物资料已加载 · 完整画像与工作区数据');
  summary.textContent=clean;
}
syncOverviewSummary();
if(seed){
  seed.classList.add('overview-seed-source');
  new MutationObserver(syncOverviewSummary).observe(seed,{childList:true,subtree:true,characterData:true});
}

/* 指标卡：保留 trade-dashboard 的真实计算结果，只增加设计稿图标与箭头。 */
const metricIcons={all:'♟',opened:'●',not_joined:'●',holding:'▣',unholding:'●',sell:'◷',buy:'▥',groups:'▤'};
function decorateMetrics(){
  const box=$('#metrics');if(!box)return;
  $$('.metric',box).forEach(card=>{
    if(card.dataset.designDecorated==='1')return;
    card.dataset.designDecorated='1';
    const key=card.dataset.dash||'all';
    const icon=document.createElement('span');
    icon.className='overview-metric-icon '+(key==='unholding'?'muted-icon':'');
    icon.textContent=metricIcons[key]||'●';
    card.insertBefore(icon,card.firstChild);
    const content=document.createElement('span');
    content.className='overview-metric-content';
    while(icon.nextSibling)content.appendChild(icon.nextSibling);
    card.appendChild(content);
    const arrow=document.createElement('span');
    arrow.className='overview-metric-arrow';
    arrow.textContent='›';
    card.appendChild(arrow);
  });
}
decorateMetrics();
const metrics=$('#metrics');
if(metrics)new MutationObserver(()=>requestAnimationFrame(decorateMetrics)).observe(metrics,{childList:true});

/* 最近事件：用真实已有事件 DOM 重排为设计稿表格风格。 */
function decorateEvents(){
  const timeline=$('#recentTimeline');if(!timeline||timeline.dataset.designTable==='1')return;
  const items=$$('.timeline-item',timeline);
  if(!items.length)return;
  const rows=items.map(item=>{
    const date=$('.date',item)?.textContent?.trim()||'';
    const ev=$('.event',item);
    const person=ev?.querySelector('.muted')?.textContent?.trim()||'';
    const content=ev?.querySelector('p')?.textContent?.trim()||ev?.querySelector('.event-title')?.textContent?.trim()||'';
    const type=ev?.querySelector('.type')?.textContent?.trim()||'记录';
    return {date,person,content,type};
  });
  timeline.dataset.designTable='1';
  timeline.className='overview-events-table';
  timeline.innerHTML='<div class="overview-event-head"><span>时间</span><span>人物</span><span>内容摘要</span><span>类型</span></div>'+
    rows.map((r,idx)=>'<div class="overview-event-row"><span class="event-time">'+esc(r.date)+'</span><span class="event-person"><i>'+(idx+1)+'</i><b>'+esc(r.person.replace(/^[^·]*·\s*/,'')||'人物')+'</b></span><span class="event-summary">'+esc(r.content)+'</span><span class="event-type-chip">'+esc(r.type)+'</span></div>').join('');
}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
decorateEvents();
const recent=$('#recentTimeline');
if(recent)new MutationObserver(()=>{if(recent.dataset.designTable!=='1')requestAnimationFrame(decorateEvents)}).observe(recent,{childList:true});

/* 系统分组概览：使用现有真实分组计数，呈现 2×2 设计卡。 */
function decorateGroups(){
  const box=$('#groupOverview');if(!box)return;
  const raw=$$(':scope > div',box).map(x=>{
    const span=x.querySelector('span'),b=x.querySelector('b');
    return {name:span?.textContent?.trim()||'',count:b?.textContent?.trim()||'0'};
  });
  if(!raw.length||box.dataset.designGroups==='1')return;
  const map=new Map(raw.map(x=>[x.name,x.count]));
  const groups=[
    ['老女','01 - 10',map.get('老女')||'10','5人VIP · 全部开户'],
    ['新女','11 - 30',map.get('新女')||'20','无VIP · 开户10人'],
    ['老男','31 - 50',map.get('老男')||'20','10人VIP · 全部开户'],
    ['新男','51 - 70',map.get('新男')||'20','无VIP · 开户10人']
  ];
  box.dataset.designGroups='1';
  box.className='overview-group-grid';
  box.innerHTML=groups.map((g,i)=>'<div class="overview-group-card"><span class="overview-group-avatar '+(i>1?'male':'')+'">♟</span><div><b>'+g[0]+' <small>'+g[1]+'</small></b><div class="overview-group-progress"><i></i></div><p>'+g[3]+'</p></div><em>'+g[2]+'人</em></div>').join('')+
    '<div class="overview-group-total"><span class="overview-total-icon">♟</span><strong>'+(map.get('全部人物')||$('#metrics .metric strong')?.textContent?.trim()||'70')+'</strong><div><b>法国投资者人物模型</b><small>完整画像 · 动态系统分组 · 自定义工作区</small></div><i>›</i></div>';
}
decorateGroups();
const groups=$('#groupOverview');
if(groups)new MutationObserver(()=>{if(groups.dataset.designGroups!=='1')requestAnimationFrame(decorateGroups)}).observe(groups,{childList:true});

/* 设计稿样式。 */
const old=$('#chennanOverviewFinalDesign');if(old)old.remove();
const st=document.createElement('style');
st.id='chennanOverviewFinalDesign';
st.textContent=`
:root{
 --ov-bg:#eef1f2;--ov-paper:#fbfcfb;--ov-line:#dde1df;--ov-ink:#111412;--ov-muted:#667078;
 --ov-gold:#c08a1c;--ov-gold-2:#e2b447;--ov-gold-soft:#fbf2d9;--ov-green:#0b8e56;--ov-shadow:0 8px 24px rgba(55,65,60,.055);
}
html,body{background:var(--ov-bg)!important}
.app.app-ready{background:linear-gradient(135deg,#edf1f3,#f3f4f3)!important}

/* 固定窄导航，无桌面伸缩。 */
@media(min-width:901px){
 .app.app-ready>.sidebar{
  width:204px!important;left:18px!important;top:8px!important;bottom:8px!important;height:auto!important;
  padding:20px 12px 18px!important;background:rgba(250,251,250,.92)!important;border:1px solid rgba(255,255,255,.9)!important;
  border-radius:22px!important;box-shadow:var(--ov-shadow)!important;overflow:hidden!important;backdrop-filter:blur(18px)!important
 }
 .app.app-ready>.sidebar:before{display:none!important}
 .app.app-ready>.sidebar .brand{
  position:relative!important;left:auto!important;top:auto!important;width:100%!important;height:94px!important;
  margin:0 0 14px!important;display:flex!important;align-items:center!important;justify-content:center!important
 }
 .app.app-ready>.sidebar .cn-wordmark{width:132px!important;height:78px!important;display:flex!important;align-items:center!important;justify-content:center!important}
 .app.app-ready>.sidebar .cn-brand-image{
  width:128px!important;height:72px!important;object-fit:contain!important;border-radius:0!important;box-shadow:none!important
 }
 .app.app-ready>.sidebar .brand-copy,.app.app-ready>.sidebar .side-note,.app.app-ready>.sidebar .nav-collapse{display:none!important}
 .app.app-ready>.sidebar .nav{
  margin:0!important;display:grid!important;gap:7px!important;max-height:none!important;overflow:visible!important
 }
 .app.app-ready>.sidebar .nav button{
  width:100%!important;margin:0!important;min-height:51px!important;padding:0 14px!important;
  display:grid!important;grid-template-columns:32px 1fr!important;gap:12px!important;align-items:center!important;
  border-radius:10px!important;background:transparent!important;color:#1e2320!important;font-weight:650!important
 }
 .app.app-ready>.sidebar .nav button:after{display:none!important}
 .app.app-ready>.sidebar .nav button i{
  width:28px!important;height:28px!important;margin:0!important;display:grid!important;place-items:center!important;
  background:transparent!important;border:0!important;color:#202522!important;font-size:18px!important
 }
 .app.app-ready>.sidebar .nav button span{font-size:14px!important;color:inherit!important}
 .app.app-ready>.sidebar .nav button:hover{background:#f6f2e7!important;color:#6c4a0b!important}
 .app.app-ready>.sidebar .nav button.active{
  background:linear-gradient(90deg,#fbf1d7,#ebc66d)!important;color:#161813!important;
  box-shadow:inset 0 0 0 1px rgba(190,138,28,.18)!important
 }
 .app.app-ready>.sidebar .nav button.active i{color:#111!important}
 .app.app-ready>.sidebar #logoutBtn{
  margin-top:4px!important;color:#7b6350!important;background:#faf7f1!important
 }
 .app.app-ready>.main{
  margin-left:236px!important;width:calc(100% - 236px)!important;padding:20px 16px 22px 10px!important;min-height:100vh!important
 }
}

/* 顶部搜索/账户/按钮同行。 */
.app.app-ready .app-global-header.design-header{
 height:98px!important;margin:0 0 4px!important;padding:16px 18px!important;position:relative!important;top:auto!important;
 display:grid!important;grid-template-columns:minmax(360px,1fr) auto auto!important;gap:18px!important;align-items:center!important;
 background:rgba(252,253,252,.92)!important;border:1px solid rgba(255,255,255,.95)!important;border-radius:18px!important;
 box-shadow:var(--ov-shadow)!important;backdrop-filter:blur(16px)!important
}
.app.app-ready .design-header .header-search{
 width:min(100%,570px)!important;height:54px!important;padding:0 16px!important;background:#fff!important;
 border:1px solid #d9dddb!important;border-radius:10px!important;color:#202522!important;box-shadow:none!important
}
.app.app-ready .design-header .header-search>span{font-size:21px!important;color:#111!important}
.app.app-ready .design-header .header-search input{font-size:14px!important;color:#2c332f!important}
.app.app-ready .design-header .header-right{display:flex!important;align-items:center!important;gap:15px!important}
.app.app-ready .design-header .cloud-chip{
 padding:10px 14px!important;background:#fff!important;border:1px solid #e1e4e2!important;color:#65706a!important;font-size:13px!important
}
.app.app-ready .design-header .cloud-chip i{background:#0dbb6b!important}
.app.app-ready .design-header .user-avatar{
 width:54px!important;height:54px!important;background:#272925!important;color:#e0b13e!important;font-size:20px!important;
 box-shadow:0 4px 10px rgba(0,0,0,.14)!important
}
.app.app-ready .design-header .header-user b{font-size:14px!important;color:#1c201e!important;font-weight:760!important}
.app.app-ready .design-header .header-user small{font-size:11px!important;color:#69716d!important}
.app.app-ready .overview-header-actions{display:flex!important;gap:12px!important;align-items:center!important;flex-wrap:nowrap!important}
.app.app-ready .overview-header-actions .btn{
 height:50px!important;min-height:50px!important;padding:0 19px!important;border-radius:9px!important;font-size:13px!important;white-space:nowrap!important
}
.app.app-ready .overview-header-actions .btn.ghost{
 background:#fff!important;color:#171a18!important;border:1px solid #eadfc9!important
}
.app.app-ready .overview-header-actions .btn.primary{
 background:linear-gradient(135deg,#ebb93d,#b77b12)!important;color:#fff!important;border:0!important;box-shadow:none!important
}

/* 概览标题卡。 */
.app.app-ready #overview{max-width:none!important}
.app.app-ready #overview .overview-titlebar{
 position:relative!important;min-height:122px!important;margin:0 0 14px!important;padding:18px 24px!important;
 display:block!important;overflow:hidden!important;background:rgba(252,253,252,.94)!important;border:1px solid rgba(255,255,255,.92)!important;
 border-radius:17px!important;box-shadow:var(--ov-shadow)!important
}
.app.app-ready #overview .overview-titlebar:after{
 content:"";position:absolute;right:-20px;bottom:-34px;width:430px;height:150px;opacity:.42;pointer-events:none;
 background:
  repeating-radial-gradient(ellipse at 55% 100%,transparent 0 8px,rgba(200,164,91,.17) 9px 10px,transparent 11px 16px);
 transform:rotate(-4deg)
}
.app.app-ready #overview .overview-titlebar>div{position:relative;z-index:1}
.app.app-ready #overview .eyebrow{
 color:#b47b10!important;font-size:11px!important;font-weight:800!important;letter-spacing:.16em!important
}
.app.app-ready #overview .overview-title-row{display:flex!important;align-items:center!important;gap:18px!important;margin-top:5px!important;min-width:0!important}
.app.app-ready #overview .page-title{
 margin:0!important;font-size:32px!important;line-height:1.2!important;font-weight:820!important;letter-spacing:-.025em!important;color:#111!important;white-space:nowrap!important
}
.app.app-ready #overview .overview-title-divider{width:1px!important;height:28px!important;background:#838a86!important;flex:0 0 auto!important}
.app.app-ready #overview .overview-summary-inline{
 color:#566069!important;font-size:14px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important
}
.app.app-ready #overview .overview-seed-source{display:none!important}

/* 指标 4×2，真实数据不变。 */
.app.app-ready #overview .dashboard{
 display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:14px!important;margin:0 0 14px!important
}
.app.app-ready #overview .metric{
 position:relative!important;min-height:138px!important;padding:18px 42px 18px 112px!important;
 display:flex!important;align-items:center!important;background:rgba(252,253,252,.95)!important;
 border:1px solid #e0e2df!important;border-radius:15px!important;box-shadow:var(--ov-shadow)!important;overflow:hidden!important
}
.app.app-ready #overview .metric:hover{transform:translateY(-2px)!important;border-color:#e6c77d!important}
.app.app-ready #overview .overview-metric-icon{
 position:absolute!important;left:28px!important;top:50%!important;transform:translateY(-50%)!important;
 width:62px!important;height:62px!important;border-radius:50%!important;display:grid!important;place-items:center!important;
 background:linear-gradient(145deg,#fff8e7,#f2dfae)!important;color:#b47a13!important;font-size:27px!important
}
.app.app-ready #overview .overview-metric-icon.muted-icon{background:#eef0f0!important;color:#50565a!important}
.app.app-ready #overview .overview-metric-content{display:block!important;min-width:0!important}
.app.app-ready #overview .metric .label{display:block!important;color:#222724!important;font-size:13px!important;margin:0!important}
.app.app-ready #overview .metric strong{display:block!important;color:#080b09!important;font-size:38px!important;font-weight:760!important;line-height:1!important;margin:8px 0!important}
.app.app-ready #overview .metric .trend{display:block!important;color:#a46b08!important;font-size:12px!important;font-weight:650!important}
.app.app-ready #overview .overview-metric-arrow{
 position:absolute!important;right:20px!important;top:50%!important;transform:translateY(-50%)!important;color:#9f6c10!important;font-size:28px!important;font-weight:300!important
}

/* 下方最近事件 / 分组。 */
.app.app-ready #overview>.grid{
 grid-template-columns:minmax(0,1.55fr) minmax(420px,1fr)!important;gap:14px!important;margin:0!important
}
.app.app-ready #overview>.grid>.panel{
 padding:16px!important;background:rgba(252,253,252,.96)!important;border:1px solid #e0e2df!important;border-radius:15px!important;box-shadow:var(--ov-shadow)!important
}
.app.app-ready #overview .panel-head{margin:0 0 8px!important}
.app.app-ready #overview .panel-head h2{font-size:18px!important;color:#121613!important;font-weight:780!important}
.app.app-ready #overview .panel-head h2:before{content:"◆";color:#c48b1b;margin-right:9px}
.app.app-ready #overview .panel-head .link-btn{color:#50657a!important;font-size:12px!important}

.app.app-ready #overview .overview-events-table{display:grid!important;gap:0!important;border-top:1px solid #edf0ed!important}
.app.app-ready #overview .overview-event-head,
.app.app-ready #overview .overview-event-row{
 display:grid!important;grid-template-columns:95px 150px minmax(0,1fr) 86px!important;align-items:center!important;min-height:40px!important;
 padding:0 8px!important;border-bottom:1px solid #ecefec!important;gap:10px!important
}
.app.app-ready #overview .overview-event-head{background:#f5f6f5!important;color:#6a7270!important;font-size:11px!important;min-height:34px!important}
.app.app-ready #overview .overview-event-row{font-size:12px!important;color:#59615d!important}
.app.app-ready #overview .event-person{display:flex!important;align-items:center!important;gap:8px!important;min-width:0!important}
.app.app-ready #overview .event-person i{width:27px;height:27px;border-radius:50%;background:#efe6d3;color:#8c650f;display:grid;place-items:center;font-style:normal;font-size:10px}
.app.app-ready #overview .event-person b,.app.app-ready #overview .event-summary{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.app.app-ready #overview .event-person b{color:#202522;font-weight:650}
.app.app-ready #overview .event-type-chip{
 justify-self:start;padding:4px 11px;border-radius:999px;background:#f7edd3;color:#a06b0d;font-size:11px;white-space:nowrap
}

.app.app-ready #overview .overview-group-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:9px!important}
.app.app-ready #overview .overview-group-card{
 position:relative;display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:10px;align-items:center;
 min-height:74px;padding:10px;border:1px solid #e7e7e3;border-radius:10px;background:#fff
}
.app.app-ready #overview .overview-group-avatar{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#fff3d8;color:#b47a13}
.app.app-ready #overview .overview-group-avatar.male{background:#eef0f0;color:#555b5f}
.app.app-ready #overview .overview-group-card b{font-size:12px;color:#131714}.app.app-ready #overview .overview-group-card b small{font-weight:500;color:#53605a;margin-left:5px}
.app.app-ready #overview .overview-group-card p{margin:5px 0 0;font-size:10px;color:#606966}
.app.app-ready #overview .overview-group-card em{font-style:normal;color:#67706c;font-size:10px}
.app.app-ready #overview .overview-group-progress{height:5px;background:#e4e6e4;border-radius:99px;margin-top:6px;overflow:hidden}
.app.app-ready #overview .overview-group-progress i{display:block;width:64%;height:100%;background:linear-gradient(90deg,#bd8619,#e8bc52);border-radius:99px}
.app.app-ready #overview .overview-group-total{
 grid-column:1/-1;min-height:64px;display:grid;grid-template-columns:48px auto 1fr 34px;gap:10px;align-items:center;
 padding:9px 13px;background:linear-gradient(90deg,#fff8e8,#fffdf7);border:1px solid #f0d596;border-radius:10px
}
.app.app-ready #overview .overview-total-icon{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:#fff0c8;color:#a9700a}
.app.app-ready #overview .overview-group-total strong{font-size:30px;color:#111}
.app.app-ready #overview .overview-group-total div{display:grid;gap:2px}.app.app-ready #overview .overview-group-total b{font-size:12px}.app.app-ready #overview .overview-group-total small{font-size:10px;color:#69716d}
.app.app-ready #overview .overview-group-total>i{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;border:1px solid #d9aa4a;color:#8d5d08;font-style:normal;font-size:20px}

@media(max-width:1250px) and (min-width:901px){
 .app.app-ready>.sidebar{width:180px!important}
 .app.app-ready>.main{margin-left:208px!important;width:calc(100% - 208px)!important}
 .app.app-ready .app-global-header.design-header{grid-template-columns:minmax(300px,1fr) auto!important}
 .app.app-ready .overview-header-actions{grid-column:1/-1;justify-content:flex-end!important;margin-top:-8px}
 .app.app-ready #overview .overview-title-row{flex-wrap:wrap!important;gap:8px 14px!important}
 .app.app-ready #overview .overview-title-divider{display:none!important}
 .app.app-ready #overview .dashboard{grid-template-columns:repeat(2,minmax(0,1fr))!important}
 .app.app-ready #overview>.grid{grid-template-columns:1fr!important}
}

/* 手机继续沿用现有底部“更多”导航，避免缩窄桌面稿直接压到手机。 */
@media(max-width:900px){
 .app.app-ready #overview .dashboard{grid-template-columns:repeat(2,minmax(0,1fr))!important}
 .app.app-ready #overview .metric{padding:14px 26px 14px 82px!important;min-height:118px!important}
 .app.app-ready #overview .overview-metric-icon{left:16px!important;width:52px!important;height:52px!important}
 .app.app-ready #overview>.grid{grid-template-columns:1fr!important}
 .app.app-ready #overview .overview-title-row{display:block!important}
 .app.app-ready #overview .overview-title-divider,.app.app-ready #overview .overview-summary-inline{display:none!important}
}
`;
document.head.appendChild(st);

/* 概览离开后，顶部操作按钮隐藏；返回概览恢复。 */
function syncHeaderActions(){
 const active=$('.section.active');
 if(overviewActions)overviewActions.style.display=active?.id==='overview'?'flex':'none';
}
syncHeaderActions();
new MutationObserver(syncHeaderActions).observe(main,{subtree:true,attributes:true,attributeFilter:['class']});

})();
