/* 辰南撰写 · Reference Workspace UI
   视觉基准：用户提供的低饱和灰色 Dashboard 设计稿。
   只改表现层，不改登录、数据、云同步和业务逻辑。 */
(function(){
'use strict';

const forceReferenceTheme=()=>{
  document.documentElement.dataset.theme='reference';
  if(document.body) document.body.dataset.theme='reference';
};
forceReferenceTheme();
document.addEventListener('chennan:theme-change',forceReferenceTheme);

const brand=document.querySelector('.brand');
if(brand){
  brand.innerHTML='<div class="cn-wordmark"><img class="cn-brand-image" src="./assets/brand/chennan-logo.jpg" alt="辰南"></div><div class="brand-copy"><b>辰南撰写</b><small>Workspace</small></div>';
}
const sideNote=document.querySelector('.side-note');
if(sideNote) sideNote.innerHTML='<span class="cloud-live-dot"></span> 云端自动保存<br><small>人物 · 群聊 · 交易 · 文档</small>';

const header=document.querySelector('.app-global-header');
if(header){
  const hb=header.querySelector('.header-brand');
  if(hb){
    hb.innerHTML='<span class="header-kicker">WORKSPACE</span><b>辰南撰写</b>';
  }
}

const old=document.getElementById('chennanReferenceWorkspace');
if(old) old.remove();

const st=document.createElement('style');
st.id='chennanReferenceWorkspace';
st.textContent=`
:root,html[data-theme="reference"]{
  color-scheme:light;
  --bg:#dedfdd;
  --paper:rgba(244,245,242,.88);
  --paper-strong:#f1f2ef;
  --paper-soft:#e8eae7;
  --ink:#202321;
  --muted:#777d79;
  --line:rgba(55,61,57,.14);
  --line-strong:rgba(55,61,57,.22);
  --accent:#cad9d5;
  --accent-ink:#3f5650;
  --accent-soft:#e3ebe8;
  --green:#6f8f84;
  --green-weak:#e4ece8;
  --amber:#9f8b67;
  --amber-weak:#eee9df;
  --red:#aa7774;
  --red-weak:#f0e5e3;
  --violet:#85868f;
  --violet-weak:#e9e9ed;
  --shadow:0 14px 36px rgba(34,39,36,.075),inset 0 1px rgba(255,255,255,.58);
  --radius:18px;
  --rail:#262628;
  --rail-ink:#eef0ee;
  --mint:#d9e7e3;
  --ice:#e4ecee;
  --gold:#b99a57;
}
html,body{background:var(--bg)!important;color:var(--ink)!important}
body{font:14px/1.62 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif!important}
.app.app-ready{background:var(--bg)!important;color:var(--ink)!important;min-height:100vh;transition:none!important}
.app.app-ready:before,.app.app-ready:after{display:none!important}

/* Desktop: narrow dark rail + pale navigation surface */
.app.app-ready>.sidebar{
  width:286px!important;
  top:18px!important;bottom:18px!important;left:18px!important;height:auto!important;
  padding:22px 18px 22px 82px!important;
  background:rgba(233,234,231,.92)!important;
  border:1px solid rgba(255,255,255,.45)!important;
  border-radius:24px!important;
  box-shadow:0 18px 52px rgba(35,40,37,.08),inset 0 1px rgba(255,255,255,.7)!important;
  backdrop-filter:blur(22px) saturate(.85)!important;
  overflow:hidden!important;
}
.app.app-ready>.sidebar:before{
  content:"";position:absolute;z-index:0;left:10px;top:10px;bottom:10px;width:54px;
  border-radius:18px;background:linear-gradient(180deg,#2b2b2d 0%,#222224 100%);
  box-shadow:0 12px 28px rgba(0,0,0,.15),inset 0 1px rgba(255,255,255,.06);
}
.app.app-ready>.sidebar>*{position:relative;z-index:1}
.app.app-ready>.sidebar .brand{
  position:absolute!important;left:16px!important;top:18px!important;width:42px!important;height:42px!important;
  margin:0!important;display:grid!important;place-items:center!important;
}
.app.app-ready>.sidebar .cn-wordmark{width:38px!important;height:38px!important;min-width:38px!important;display:grid!important;place-items:center!important}
.app.app-ready>.sidebar .cn-brand-image{
  width:38px!important;height:38px!important;border-radius:50%!important;object-fit:cover!important;
  box-shadow:0 0 0 1px rgba(230,201,132,.35),0 8px 20px rgba(0,0,0,.18)!important;
}
.app.app-ready>.sidebar .brand-copy{display:none!important}
.app.app-ready>.sidebar .nav{margin-top:70px!important;display:grid!important;gap:7px!important}
.app.app-ready>.sidebar .nav button{
  position:relative!important;isolation:isolate;width:calc(100% + 72px)!important;margin-left:-72px!important;
  min-height:46px!important;padding:0 12px 0 0!important;
  display:grid!important;grid-template-columns:58px 1fr!important;align-items:center!important;gap:14px!important;
  background:transparent!important;border:0!important;border-radius:14px!important;color:#5e6461!important;
  text-align:left!important;font-weight:560!important;letter-spacing:.005em!important;transform:none!important;
}
.app.app-ready>.sidebar .nav button:after{
  content:"";position:absolute;z-index:-1;left:60px;right:0;top:1px;bottom:1px;border-radius:14px;
  background:transparent;border:1px solid transparent;transition:.18s ease;
}
.app.app-ready>.sidebar .nav button i{
  width:34px!important;height:34px!important;margin-left:12px!important;display:grid!important;place-items:center!important;
  color:#e8eae8!important;border-radius:10px!important;font-style:normal!important;font-size:17px!important;
}
.app.app-ready>.sidebar .nav button span{font-size:14px!important;color:inherit!important}
.app.app-ready>.sidebar .nav button:hover:after{
  background:rgba(245,246,244,.52)!important;border-color:rgba(80,88,82,.10)!important
}
.app.app-ready>.sidebar .nav button:hover{color:#242826!important}
.app.app-ready>.sidebar .nav button.active{color:#1f2522!important;background:transparent!important;box-shadow:none!important;border-left:0!important}
.app.app-ready>.sidebar .nav button.active:after{
  background:linear-gradient(90deg,rgba(229,238,235,.96),rgba(239,242,240,.88))!important;
  border-color:rgba(91,112,103,.18)!important;
  box-shadow:inset 0 1px rgba(255,255,255,.72),0 5px 16px rgba(56,69,62,.05)!important;
}
.app.app-ready>.sidebar .nav button.active i{
  background:rgba(255,255,255,.10)!important;border:1px solid rgba(255,255,255,.12)!important;color:#fff!important
}
.app.app-ready>.sidebar .side-note{
  left:82px!important;right:18px!important;bottom:26px!important;color:#8a8f8c!important;font-size:10px!important;line-height:1.7!important
}
.app.app-ready>.sidebar .cloud-live-dot{background:#79a193!important}
.app.app-ready>.sidebar .nav-collapse{
  left:16px!important;right:auto!important;bottom:20px!important;width:42px!important;height:42px!important;padding:0!important;
  border-radius:12px!important;background:#29292b!important;color:#fff!important;border:1px solid rgba(255,255,255,.1)!important;
  box-shadow:0 7px 18px rgba(0,0,0,.16)!important
}
.app.app-ready>.sidebar .collapse-text{display:none!important}

/* Workspace canvas */
.app.app-ready>.main{
  margin-left:322px!important;width:calc(100% - 322px)!important;min-height:100vh!important;
  padding:0 34px 64px!important;background:transparent!important
}
.app.app-ready .app-global-header{
  height:72px!important;margin:18px 0 42px!important;padding:0 18px!important;
  display:grid!important;grid-template-columns:auto minmax(260px,520px) auto!important;gap:26px!important;align-items:center!important;
  position:sticky!important;top:18px!important;z-index:5!important;
  background:rgba(236,237,234,.72)!important;border:1px solid rgba(255,255,255,.48)!important;border-radius:18px!important;
  box-shadow:0 12px 32px rgba(44,49,46,.045),inset 0 1px rgba(255,255,255,.64)!important;
  backdrop-filter:blur(20px) saturate(.85)!important
}
.app.app-ready .header-brand{display:flex!important;align-items:center!important;gap:9px!important}
.app.app-ready .header-kicker{font-size:9px!important;letter-spacing:.18em!important;color:#939894!important}
.app.app-ready .header-brand b{font-size:16px!important;font-weight:620!important;color:#222624!important;font-family:inherit!important}
.app.app-ready .header-search{
  height:40px!important;background:rgba(247,248,246,.70)!important;border:1px solid rgba(65,72,67,.11)!important;
  border-radius:12px!important;padding:0 12px!important;color:#919793!important;box-shadow:inset 0 1px rgba(255,255,255,.75)!important
}
.app.app-ready .header-search input{color:#343936!important;background:transparent!important}
.app.app-ready .header-search input::placeholder{color:#9ca19e!important}
.app.app-ready .header-right{gap:12px!important}
.app.app-ready .cloud-chip{
  color:#69706c!important;background:rgba(246,247,245,.62)!important;border:1px solid rgba(65,72,67,.11)!important;
  border-radius:999px!important;padding:7px 10px!important
}
.app.app-ready .cloud-chip.ok i{background:#7c9e91!important}
.app.app-ready .header-user{gap:9px!important}
.app.app-ready .user-avatar{
  width:36px!important;height:36px!important;border-radius:50%!important;background:#2a2a2c!important;color:#e7d3a2!important;
  border:1px solid rgba(255,255,255,.16)!important
}
.app.app-ready .header-user b{color:#2a2e2c!important;font-size:11px!important}
.app.app-ready .header-user small{color:#929793!important;font-size:9px!important}

.app.app-ready .section{max-width:1480px!important;margin:0 auto!important}
.app.app-ready .topbar{margin-bottom:38px!important;align-items:flex-end!important;gap:30px!important}
.app.app-ready .eyebrow{color:#858b87!important;font-size:10px!important;letter-spacing:.18em!important;font-weight:620!important}
.app.app-ready .page-title{
  margin:8px 0 10px!important;color:#1e211f!important;font-size:clamp(31px,2.7vw,43px)!important;
  line-height:1.12!important;font-weight:620!important;letter-spacing:-.035em!important
}
.app.app-ready :is(.sub,.muted,.meta,small){color:#7f8581!important}
.app.app-ready .sub{font-size:13px!important;line-height:1.7!important;max-width:780px!important}
.app.app-ready :is(h2,h3){color:#242826!important;font-weight:620!important;letter-spacing:-.012em!important}
.app.app-ready h2{font-size:18px!important}

/* Cards: layered, low-contrast, not one heavy gradient */
.app.app-ready :is(.card,.panel,.group-card,.profile-row,.event,.detail-box,.detail-card,.batch-card,.offer-card,.candidate-card,.custom-group,.person-buy-card,.holding-person,.memory-person-card,.check-box){
  background:linear-gradient(145deg,rgba(247,248,245,.80),rgba(235,237,233,.72))!important;
  border:1px solid rgba(61,68,63,.13)!important;border-radius:18px!important;color:#252925!important;
  box-shadow:0 14px 36px rgba(39,45,41,.06),inset 0 1px rgba(255,255,255,.68)!important;
  backdrop-filter:blur(18px) saturate(.82)!important
}
.app.app-ready :is(.card,.panel,.detail-card){padding:26px!important}
.app.app-ready .dashboard{gap:22px!important;margin-bottom:26px!important}
.app.app-ready :is(.metric,.dashboard>.metric){
  min-height:132px!important;padding:22px 24px!important;border:1px solid rgba(59,67,61,.13)!important;border-radius:18px!important;
  background:linear-gradient(145deg,rgba(247,248,246,.85),rgba(231,234,230,.73))!important;
  box-shadow:0 12px 30px rgba(40,45,42,.052),inset 0 1px rgba(255,255,255,.72)!important
}
.app.app-ready .metric .label{color:#777d79!important;font-size:12px!important}
.app.app-ready .metric strong{color:#202321!important;font-size:38px!important;font-weight:560!important;line-height:1.25!important;font-variant-numeric:tabular-nums}
.app.app-ready .metric .trend{color:#6f8f84!important;font-size:11px!important}
.app.app-ready :is(.grid,.detail-columns,.novel-layout){gap:26px!important}
.app.app-ready .panel-head{margin-bottom:22px!important;gap:16px!important}

/* Controls */
.app.app-ready :is(.input,.select,textarea,input:not([type=checkbox]):not([type=radio]),select){
  background:rgba(248,249,247,.80)!important;color:#303531!important;border:1px solid rgba(62,70,64,.15)!important;
  border-radius:12px!important;min-height:42px!important;box-shadow:inset 0 1px rgba(255,255,255,.72)!important
}
.app.app-ready input::placeholder,.app.app-ready textarea::placeholder{color:#989e9a!important}
.app.app-ready :is(.input,.select,textarea,input,select):focus{
  border-color:rgba(95,123,113,.34)!important;box-shadow:0 0 0 3px rgba(201,218,212,.38)!important;outline:0!important
}
.app.app-ready :is(.rich-editor,.editor,.editor-area,[contenteditable=true]){
  background:rgba(249,250,248,.90)!important;color:#2c312e!important;border-color:rgba(62,70,64,.13)!important;
  line-height:1.88!important
}

/* Buttons */
.app.app-ready .btn{min-height:40px!important;padding:9px 16px!important;border-radius:11px!important;font-weight:590!important;box-shadow:none!important}
.app.app-ready .btn.primary{background:#2b2d2c!important;color:#f3f4f2!important;border:1px solid #2b2d2c!important}
.app.app-ready .btn.primary:hover{background:#1f2120!important}
.app.app-ready .btn.ghost{
  background:rgba(246,247,245,.72)!important;color:#343936!important;border:1px solid rgba(61,68,63,.14)!important
}
.app.app-ready .btn.ghost:hover{background:#f4f5f2!important;border-color:rgba(61,68,63,.22)!important}
.app.app-ready .link-btn{color:#4e6a62!important;background:transparent!important}
.app.app-ready .status,.app.app-ready .tag,.app.app-ready .type,.app.app-ready .count,.app.app-ready .sort-badge{
  background:rgba(229,234,231,.88)!important;color:#5d6661!important;border:1px solid rgba(82,93,86,.10)!important;border-radius:999px!important
}
.app.app-ready .status.good{background:#e0eae5!important;color:#557568!important}
.app.app-ready .status.vip,.app.app-ready .status.warn{background:#ece8de!important;color:#806f51!important}

/* Lists, events, nested surfaces */
.app.app-ready :is(.detail-line,.offer-stat,.trade-mini,.mini-person,.person-mini,.memory-row,.doc-item,.member-picker){
  background:rgba(248,249,247,.66)!important;color:#2d322f!important;border:1px solid rgba(61,68,63,.11)!important;
  border-radius:13px!important;box-shadow:inset 0 1px rgba(255,255,255,.62)!important
}
.app.app-ready .profile-row:hover,
.app.app-ready .event:hover,
.app.app-ready .group-card:hover,
.app.app-ready .custom-group:hover{
  background:linear-gradient(145deg,rgba(248,249,247,.90),rgba(230,237,233,.82))!important;
  border-color:rgba(92,117,108,.20)!important;transform:none!important
}

/* Tables */
.app.app-ready :is(.people-data-table,.mini-table,table){background:transparent!important;color:#303531!important}
.app.app-ready .people-data-table{min-width:1550px!important;border-spacing:0!important}
.app.app-ready .people-data-table :is(th,td){
  padding:15px 14px!important;border-bottom:1px solid rgba(61,68,63,.10)!important;color:#343936!important;background:rgba(247,248,246,.62)!important
}
.app.app-ready .people-data-table th{
  background:rgba(229,232,228,.76)!important;color:#6d746f!important;font-size:11px!important;font-weight:650!important;letter-spacing:.035em!important
}
.app.app-ready .people-data-table tbody tr:hover td{background:#e8efec!important}
.app.app-ready .people-data-table td:first-child{color:#616864!important}
.app.app-ready .people-data-table .table-avatar{
  width:42px!important;height:42px!important;min-width:42px!important;border-radius:50%!important;border:1px solid rgba(62,70,64,.18)!important;
  background:#e9ebe8!important;box-shadow:none!important
}
.app.app-ready .people-data-table .table-name{color:#282d2a!important;font-weight:620!important}
.app.app-ready .mini-table :is(th,td){background:rgba(247,248,246,.65)!important;color:#343936!important;border-color:rgba(61,68,63,.10)!important}

/* Semantic states retain meaning, but stay desaturated */
.app.app-ready .candidate-card.bought{background:#e5ece8!important;border-color:#cbdad3!important}
.app.app-ready .candidate-card.rejected{opacity:.74;background:#eeeeeb!important}
.app.app-ready .offer-row.active{background:#e5ece9!important;border-color:#c7d7d0!important}
.app.app-ready .profit-pos{color:#587f6f!important}
.app.app-ready :is(.danger,.profit-neg){color:#a56f6c!important}
.app.app-ready .hold-bar{background:#bfcfca!important;box-shadow:none!important}
.app.app-ready .hold-bar.ready{background:#adc8bc!important}
.app.app-ready .hold-bar.soon{background:#d1c6ad!important}

/* Modals and notices */
.app.app-ready .modal{
  background:rgba(243,244,241,.96)!important;color:#252925!important;border:1px solid rgba(61,68,63,.14)!important;
  border-radius:22px!important;box-shadow:0 30px 90px rgba(30,35,32,.14)!important;backdrop-filter:blur(24px)!important
}
.app.app-ready .notice{
  background:rgba(231,236,233,.86)!important;color:#65706a!important;border:1px solid rgba(80,91,84,.10)!important;border-radius:13px!important
}
.app.app-ready .notice.warn{background:#eeeae2!important;color:#7e7057!important}
.app.app-ready .notice.success{background:#e3ebe7!important;color:#5f766c!important}

/* France 70 follows same system */
.app.app-ready #france70chat :is(.fr70-stat,.fr70-bubble,.fr70-history button,.fr70-memory-row){
  background:linear-gradient(145deg,rgba(247,248,245,.80),rgba(235,237,233,.72))!important;
  border:1px solid rgba(61,68,63,.13)!important;color:#2d322f!important;
  box-shadow:0 12px 30px rgba(39,45,41,.05),inset 0 1px rgba(255,255,255,.66)!important
}
.app.app-ready #france70chat .fr70-stat{border-top:0!important}
.app.app-ready #france70chat :is(.fr70-stat b,.fr70-meta b,.fr70-bubble p,.fr70-history b,.fr70-memory-row b){color:#292e2b!important}
.app.app-ready #france70chat :is(.fr70-stat span,.fr70-meta span,.fr70-history small,.fr70-memory-row small,.fr70-note){color:#7c827e!important}
.app.app-ready #france70chat .fr70-avatar{
  background:#292a2c!important;color:#e2cf9f!important;border:1px solid rgba(255,255,255,.16)!important
}
.app.app-ready #france70chat .fr70-seg{background:#e6e8e5!important;border-color:rgba(61,68,63,.11)!important}
.app.app-ready #france70chat .fr70-seg button{color:#747a76!important}
.app.app-ready #france70chat .fr70-seg button.active{background:#f4f5f2!important;color:#303531!important;box-shadow:0 4px 12px rgba(40,45,42,.06)!important}

/* Motion: reference is calm, not cinematic */
.section.active{opacity:1;transform:none;filter:none;transition:opacity .24s ease!important}
.section.active.section-leaving{opacity:0!important;transform:translateY(4px)!important;filter:none!important}
.section.active.section-entering{opacity:0!important;transform:translateY(6px)!important;filter:none!important}
@media(hover:hover) and (pointer:fine){
  .app.app-ready :is(.card,.metric,.group-card,.profile-row,.event,.custom-group,.fr70-bubble,.fr70-history button):hover{
    box-shadow:0 16px 38px rgba(39,45,41,.075),inset 0 1px rgba(255,255,255,.72)!important
  }
}

/* Tablet */
@media(min-width:761px) and (max-width:1100px){
  .app.app-ready>.sidebar{width:88px!important;padding:18px 10px!important}
  .app.app-ready>.sidebar:before{left:12px;right:12px;width:auto}
  .app.app-ready>.sidebar .brand{left:23px!important}
  .app.app-ready>.sidebar .nav{margin-top:70px!important}
  .app.app-ready>.sidebar .nav button{width:100%!important;margin-left:0!important;grid-template-columns:1fr!important;padding:0!important}
  .app.app-ready>.sidebar .nav button:after{display:none!important}
  .app.app-ready>.sidebar .nav button i{margin:auto!important}
  .app.app-ready>.sidebar :is(.nav span,.side-note,.nav-collapse){display:none!important}
  .app.app-ready>.main{margin-left:116px!important;width:calc(100% - 116px)!important;padding:0 22px 54px!important}
  .app.app-ready .app-global-header{margin-top:14px!important}
}

/* Mobile: keep bottom navigation, translate reference language */
@media(max-width:760px){
  .app.app-ready{display:block!important}
  .app.app-ready>.sidebar{
    position:fixed!important;z-index:30!important;left:10px!important;right:10px!important;bottom:10px!important;top:auto!important;
    width:auto!important;height:72px!important;padding:7px 8px!important;border-radius:22px!important;
    background:rgba(239,240,237,.94)!important;border:1px solid rgba(255,255,255,.58)!important;
    box-shadow:0 18px 45px rgba(38,43,40,.15),inset 0 1px rgba(255,255,255,.7)!important;
    backdrop-filter:blur(22px)!important;overflow:hidden!important
  }
  .app.app-ready>.sidebar:before,
  .app.app-ready>.sidebar :is(.brand,.side-note,.nav-collapse){display:none!important}
  .app.app-ready>.sidebar .nav{
    margin:0!important;width:100%!important;height:100%!important;display:grid!important;
    grid-template-columns:repeat(7,minmax(66px,1fr))!important;gap:4px!important;overflow-x:auto!important;overflow-y:hidden!important
  }
  .app.app-ready>.sidebar .nav button{
    width:auto!important;min-width:66px!important;height:58px!important;margin:0!important;padding:5px 4px!important;
    display:flex!important;flex-direction:column!important;gap:2px!important;align-items:center!important;justify-content:center!important;
    color:#747a76!important;border-radius:14px!important
  }
  .app.app-ready>.sidebar .nav button:after{left:0;right:0;top:0;bottom:0;border-radius:14px}
  .app.app-ready>.sidebar .nav button i{
    width:28px!important;height:26px!important;margin:0!important;color:#505653!important;background:transparent!important;border:0!important;font-size:16px!important
  }
  .app.app-ready>.sidebar .nav button span{font-size:9px!important;line-height:1.2!important;white-space:nowrap!important}
  .app.app-ready>.sidebar .nav button.active:after{background:#dfe9e5!important;border-color:#ccd9d4!important}
  .app.app-ready>.sidebar .nav button.active i{color:#303633!important;background:transparent!important;border:0!important}
  .app.app-ready>.main{margin-left:0!important;width:100%!important;padding:0 14px 104px!important}
  .app.app-ready .app-global-header{
    position:sticky!important;top:8px!important;height:62px!important;margin:10px 0 30px!important;padding:0 12px!important;
    grid-template-columns:minmax(0,1fr) auto!important;gap:10px!important;border-radius:17px!important
  }
  .app.app-ready .header-brand{display:none!important}
  .app.app-ready .header-search{min-width:0!important}
  .app.app-ready .header-right{gap:6px!important}
  .app.app-ready .cloud-chip{display:none!important}
  .app.app-ready .header-user>div{display:none!important}
  .app.app-ready .topbar{margin-bottom:28px!important;align-items:flex-start!important}
  .app.app-ready .page-title{font-size:29px!important}
  .app.app-ready .actions{width:100%!important}
  .app.app-ready .actions .btn{flex:1!important}
  .app.app-ready :is(.card,.panel,.detail-card){padding:18px!important}
  .app.app-ready .dashboard{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}
  .app.app-ready .metric{min-height:116px!important;padding:17px!important}
  .app.app-ready .metric strong{font-size:31px!important}
  .app.app-ready :is(.grid,.novel-layout,.fr70-layout){grid-template-columns:1fr!important;gap:16px!important}
}
@media(max-width:420px){
  .app.app-ready>.main{padding-left:10px!important;padding-right:10px!important}
  .app.app-ready .dashboard{gap:9px!important}
  .app.app-ready .metric{padding:14px!important}
}
@media(prefers-reduced-motion:reduce){
  .section.active,.app.app-ready{transition:none!important}
}

/* ===== Final layout specification · 16:9 desktop / fluid mobile ===== */
:root,html[data-theme="reference"]{
  --ui-4:4px;--ui-8:8px;--ui-12:12px;--ui-16:16px;--ui-20:20px;--ui-24:24px;--ui-32:32px;--ui-40:40px;
  --type-xs:10px;--type-sm:12px;--type-md:14px;--type-lg:18px;--type-xl:clamp(30px,2.45vw,42px);
  --card-radius:18px;--control-radius:12px;--frame-radius:28px;
}
.app.app-ready .section>*{min-width:0}
.app.app-ready .topbar>*{min-width:0}
.app.app-ready .page-title{font-size:var(--type-xl)!important;font-weight:630!important;line-height:1.08!important}
.app.app-ready .eyebrow{font-size:var(--type-xs)!important;line-height:1.4!important}
.app.app-ready .sub{font-size:var(--type-sm)!important}
.app.app-ready :is(.panel h2,.panel-head h2){font-size:var(--type-lg)!important;line-height:1.25!important}
.app.app-ready :is(.panel h3,.field>label,.metric .label){font-size:var(--type-sm)!important}
.app.app-ready :is(.btn,.input,.select,textarea,button){letter-spacing:0!important}
.app.app-ready .metric strong{font-variant-numeric:tabular-nums lining-nums!important}
.app.app-ready :is(.card,.panel,.metric,.group-card,.custom-group,.profile-row,.event,.detail-card,.batch-card,.offer-card,.candidate-card,.person-buy-card,.holding-person,.memory-person-card){
  border-radius:var(--card-radius)!important;
}
.app.app-ready :is(.input,.select,textarea,input:not([type=checkbox]):not([type=radio]),select,.btn){
  border-radius:var(--control-radius)!important;
}
.app.app-ready :is(.dashboard,.group-grid,.custom-groups,.grid,.detail-columns,.novel-layout,.fr70-layout){
  align-items:stretch!important;
}
.app.app-ready :is(.dashboard,.group-grid,.custom-groups)>*{min-width:0}
.app.app-ready .card>.panel-head:first-child,
.app.app-ready .panel>.panel-head:first-child{padding-bottom:0!important}
.app.app-ready .toolbar{gap:12px!important}
.app.app-ready .button-row,.app.app-ready .actions{gap:10px!important}
.app.app-ready :is(.panel,.card){scroll-margin-top:108px}

/* Full desktop application frame: true 16:9 canvas centered in viewport. */
@media(min-width:1180px) and (min-aspect-ratio:4/3){
  html,body{width:100%;height:100%;overflow:hidden!important}
  body{display:grid!important;place-items:center!important;padding:0!important}
  .app.app-ready{
    position:fixed!important;
    left:50%!important;top:50%!important;
    transform:translate(-50%,-50%)!important;
    width:min(calc(100vw - 32px),calc((100vh - 32px) * 16 / 9))!important;
    height:min(calc(100vh - 32px),calc((100vw - 32px) * 9 / 16))!important;
    min-height:0!important;
    border-radius:var(--frame-radius)!important;
    overflow:hidden!important;
    border:1px solid rgba(255,255,255,.55)!important;
    box-shadow:0 30px 90px rgba(38,43,40,.16),inset 0 1px rgba(255,255,255,.66)!important;
  }
  .app.app-ready>.sidebar{
    position:absolute!important;
    height:auto!important;
  }
  .app.app-ready>.main{
    position:absolute!important;
    top:0!important;right:0!important;bottom:0!important;
    height:100%!important;min-height:0!important;
    overflow-y:auto!important;overflow-x:hidden!important;
    scrollbar-gutter:stable!important;
    overscroll-behavior:contain!important;
    padding-bottom:48px!important;
  }
  .app.app-ready .app-global-header{top:18px!important}
  .app.app-ready .section{padding-bottom:28px!important}
}

/* Wide desktop spacing and edge alignment */
@media(min-width:1440px){
  .app.app-ready>.main{padding-left:38px!important;padding-right:38px!important}
  .app.app-ready .topbar{margin-bottom:40px!important}
  .app.app-ready .dashboard{gap:22px!important}
  .app.app-ready .grid,.app.app-ready .detail-columns,.app.app-ready .novel-layout,.app.app-ready .fr70-layout{gap:26px!important}
}

/* Laptop / tablet: fluid full viewport, no forced crop */
@media(min-width:761px) and (max-width:1179px){
  html,body{min-height:100%;overflow-x:hidden!important}
  .app.app-ready{position:relative!important;transform:none!important;width:100%!important;height:auto!important;min-height:100vh!important;border-radius:0!important;overflow:visible!important}
}

/* Mobile refinement: 4-column max content rhythm, safe-area aware bottom dock */
@media(max-width:760px){
  html,body{width:100%;min-height:100%;overflow-x:hidden!important}
  .app.app-ready{position:relative!important;transform:none!important;width:100%!important;height:auto!important;min-height:100dvh!important;border-radius:0!important;overflow:visible!important}
  .app.app-ready>.main{padding-bottom:calc(104px + env(safe-area-inset-bottom))!important}
  .app.app-ready>.sidebar{bottom:calc(10px + env(safe-area-inset-bottom))!important}
  .app.app-ready .topbar{gap:18px!important}
  .app.app-ready .page-title{font-size:30px!important;line-height:1.12!important}
  .app.app-ready .sub{font-size:12px!important;line-height:1.7!important}
  .app.app-ready :is(.card,.panel,.detail-card){border-radius:16px!important}
  .app.app-ready .dashboard{grid-template-columns:repeat(2,minmax(0,1fr))!important}
  .app.app-ready .dashboard>*{min-width:0!important}
  .app.app-ready :is(.input,.select,textarea,input:not([type=checkbox]):not([type=radio]),select){font-size:16px!important}
}

/* Edge alignment: cards in the same grid share visual baselines. */
.app.app-ready .dashboard>.metric,
.app.app-ready .group-grid>.group-card,
.app.app-ready .custom-groups>.custom-group{height:100%!important}
.app.app-ready .panel-head>:first-child,
.app.app-ready .topbar>:first-child{min-width:0}
.app.app-ready .panel-head{align-items:center!important}
.app.app-ready .metric{display:flex!important;flex-direction:column!important;justify-content:center!important}
.app.app-ready .metric .trend{margin-top:auto!important}


/* ===== Final contrast + portrait restoration ===== */
:root,html[data-theme="reference"]{
  --text-primary:#101311;
  --text-strong:#181c19;
  --text-secondary:#4b534e;
  --text-muted:#666e69;
  --text-faint:#858c87;
  --deep-gold:#8a6419;
  --deep-gold-strong:#74510f;
  --deep-gold-bg:#eee5cf;
  --deep-gold-border:#cdbb8d;
  --green-strong:#3f6f5e;
  --red-strong:#8b4f4d;
}

/* Primary readable text is true near-black. */
.app.app-ready :is(
  .page-title,h1,h2,h3,
  .card,.panel,
  .person b,.table-name,.event-title,
  .metric strong,.detail-kpi strong,
  .group-card b,.group-card strong,
  .custom-group h3,
  .holding-person b,.candidate-card b,
  .person-mini b,.mini-person b,
  .fr70-meta b,.fr70-bubble p,.fr70-stat b,
  .fr70-history b,.fr70-memory-row b
){
  color:var(--text-primary)!important;
}

/* Normal body/content copy: dark enough to read, never washed-out grey. */
.app.app-ready :is(
  p,li,td,
  .event p,
  .members-preview,
  .detail-line,
  .check-box,
  .notice,
  .fr70-note
){
  color:var(--text-secondary)!important;
}

/* Secondary descriptions only. */
.app.app-ready :is(
  .sub,.muted,.meta,
  .person small,.table-name small,
  .leader,.date,
  .metric .label,
  .fr70-meta span,.fr70-history small,.fr70-memory-row small
){
  color:var(--text-muted)!important;
}

/* Never let generic small-tag rules wash out semantic text. */
.app.app-ready small{color:var(--text-muted)!important}
.app.app-ready .eyebrow{
  color:var(--deep-gold)!important;
  font-weight:720!important;
}
.app.app-ready .header-brand b,
.app.app-ready .header-user b{
  color:var(--text-primary)!important;
}
.app.app-ready .header-kicker,
.app.app-ready .header-user small{
  color:var(--text-muted)!important;
}

/* Deep yellow is reserved for VIP / highlighted identity / warning emphasis. */
.app.app-ready :is(.status.vip,.vip-badge,[data-vip="true"]){
  color:var(--deep-gold-strong)!important;
  background:var(--deep-gold-bg)!important;
  border-color:var(--deep-gold-border)!important;
  font-weight:700!important;
}
.app.app-ready .status.warn{
  color:var(--deep-gold-strong)!important;
  background:#f1e9d7!important;
  border-color:#d6c59d!important;
}
.app.app-ready [data-category="老男"]{
  color:var(--deep-gold-strong)!important;
  border-color:#baa36c!important;
  background:#eee5cf!important;
}
.app.app-ready .metric .trend{
  color:var(--green-strong)!important;
  font-weight:650!important;
}
.app.app-ready .profit-pos{color:var(--green-strong)!important}
.app.app-ready :is(.danger,.profit-neg){color:var(--red-strong)!important}
.app.app-ready .link-btn{color:#385e70!important;font-weight:700!important}
.app.app-ready .link-btn.danger{color:var(--red-strong)!important}

/* Inputs and tables must use black/dark text, not low-contrast grey. */
.app.app-ready :is(
  .input,.select,textarea,
  input:not([type=checkbox]):not([type=radio]),select,
  .rich-editor,.editor,.editor-area,[contenteditable=true]
){
  color:var(--text-primary)!important;
}
.app.app-ready :is(input,textarea)::placeholder{color:#8a918d!important}
.app.app-ready .people-data-table :is(td,th){color:var(--text-strong)!important}
.app.app-ready .people-data-table th{
  color:#4c544f!important;
  font-weight:720!important;
}
.app.app-ready .mini-table :is(td,th){color:var(--text-strong)!important}

/* Restore all 70 fictional portrait sprites explicitly at final cascade layer. */
.app.app-ready .person-portrait{
  display:block!important;
  width:100%!important;
  height:100%!important;
  min-width:100%!important;
  min-height:100%!important;
  border-radius:inherit!important;
  background-image:url('./assets/people/avatar-atlas.webp')!important;
  background-repeat:no-repeat!important;
  background-size:1000% 700%!important;
  background-position:var(--portrait-x) var(--portrait-y)!important;
  background-color:#dfe2de!important;
  opacity:1!important;
  visibility:visible!important;
  filter:none!important;
}

/* Portrait containers: fixed geometry, never collapse in flex/grid. */
.app.app-ready :is(.avatar,.gender-avatar,.detail-avatar,.table-avatar){
  display:block!important;
  position:relative!important;
  overflow:hidden!important;
  flex:0 0 auto!important;
  padding:0!important;
  background:#dfe2de!important;
  border:1px solid rgba(34,39,36,.18)!important;
  border-radius:50%!important;
  box-shadow:0 3px 10px rgba(35,40,37,.08)!important;
  opacity:1!important;
  visibility:visible!important;
}
.app.app-ready .avatar{
  width:44px!important;height:44px!important;min-width:44px!important;min-height:44px!important;
}
.app.app-ready .gender-avatar{
  width:48px!important;height:48px!important;min-width:48px!important;min-height:48px!important;
}
.app.app-ready .table-avatar{
  width:42px!important;height:42px!important;min-width:42px!important;min-height:42px!important;
}
.app.app-ready .detail-avatar{
  width:82px!important;height:82px!important;min-width:82px!important;min-height:82px!important;
}

/* Header administrator avatar remains visible on desktop and mobile. */
.app.app-ready .header-user{display:flex!important;align-items:center!important}
.app.app-ready .user-avatar{
  display:grid!important;
  place-items:center!important;
  width:36px!important;height:36px!important;min-width:36px!important;
  border-radius:50%!important;
  background:#292a2b!important;
  color:#d5b86f!important;
  font-weight:800!important;
  opacity:1!important;
  visibility:visible!important;
}

/* Make portrait rows align cleanly with the text baseline. */
.app.app-ready .profile-row{
  align-items:center!important;
  min-height:70px!important;
}
.app.app-ready .table-person{
  display:inline-flex!important;
  align-items:center!important;
  gap:10px!important;
}
.app.app-ready .detail-identity{
  display:flex!important;
  align-items:center!important;
  gap:18px!important;
}
.app.app-ready .candidate-card{
  align-items:center!important;
}

/* Mobile keeps real portraits visible; only administrator label may collapse. */
@media(max-width:760px){
  .app.app-ready :is(.avatar,.table-avatar){
    width:40px!important;height:40px!important;min-width:40px!important;min-height:40px!important;
  }
  .app.app-ready .gender-avatar{
    width:44px!important;height:44px!important;min-width:44px!important;min-height:44px!important;
  }
  .app.app-ready .user-avatar{
    width:34px!important;height:34px!important;min-width:34px!important;
  }
}


/* ===== Final readability + portrait guarantee ===== */
:root,html[data-theme="reference"]{
  --text-primary:#111312;
  --text-strong:#1d211f;
  --text-body:#2a2f2c;
  --text-muted:#5f6661;
  --deep-gold:#8f6a18;
  --deep-gold-strong:#6f4f0b;
  --deep-gold-bg:#efe4c8;
  --deep-gold-border:#c6ab68;
  --green-strong:#3f6f5e;
  --red-strong:#944d4a;
}

/* Hard contrast rules for all light workspace surfaces. */
.app.app-ready :is(
  .page-title,h1,h2,h3,
  .panel-head h2,.panel-head h3,
  .metric strong,.person b,.table-name,
  .detail-box b,.detail-line b,.offer-stat b,
  .batch-card b,.candidate-card b,.person-mini b,
  .holding-person b,.memory-person-card b,
  .fr70-stat b,.fr70-meta b,.fr70-bubble p,.fr70-history b,.fr70-memory-row b
){
  color:var(--text-primary)!important;
  text-shadow:none!important;
}
.app.app-ready :is(
  p,td,.event p,.members-preview,
  .detail-box,.detail-line,.offer-stat,
  .batch-card,.candidate-card,.person-mini,
  .holding-person,.memory-row,.memory-person-card,
  .fr70-note
){
  color:var(--text-body)!important;
}
.app.app-ready :is(
  .sub,.muted,.meta,small,
  .person small,.detail-box span,.detail-line span,
  .fr70-stat span,.fr70-meta span,.fr70-history small,.fr70-memory-row small
){
  color:var(--text-muted)!important;
}
.app.app-ready .eyebrow{
  color:var(--deep-gold)!important;
  font-weight:760!important;
}
.app.app-ready :is(.status.vip,.vip-badge,[data-vip="true"],[data-category="老男"]){
  color:var(--deep-gold-strong)!important;
  background:var(--deep-gold-bg)!important;
  border-color:var(--deep-gold-border)!important;
  font-weight:750!important;
}
.app.app-ready .status.warn{
  color:var(--deep-gold-strong)!important;
  background:#f0e6cf!important;
  border-color:#cfb978!important;
}
.app.app-ready .metric .trend,.app.app-ready .profit-pos{color:var(--green-strong)!important}
.app.app-ready :is(.danger,.profit-neg){color:var(--red-strong)!important}

/* Inputs/tables must stay high contrast. */
.app.app-ready :is(
  .input,.select,textarea,
  input:not([type=checkbox]):not([type=radio]),select,
  .rich-editor,.editor,.editor-area,[contenteditable=true]
){
  color:var(--text-primary)!important;
}
.app.app-ready :is(input,textarea)::placeholder{color:#7a817c!important}
.app.app-ready .people-data-table :is(td,th),
.app.app-ready .mini-table :is(td,th){color:var(--text-strong)!important}
.app.app-ready .people-data-table th{color:#3e4541!important;font-weight:760!important}

/* Absolute portrait guarantee. */
.app.app-ready .person-portrait{
  display:block!important;
  position:absolute!important;
  inset:0!important;
  width:100%!important;
  height:100%!important;
  min-width:100%!important;
  min-height:100%!important;
  border-radius:inherit!important;
  background-image:url('./assets/people/avatar-atlas.webp')!important;
  background-repeat:no-repeat!important;
  background-size:1000% 700%!important;
  background-position:var(--portrait-x) var(--portrait-y)!important;
  background-color:#dfe2de!important;
  opacity:1!important;
  visibility:visible!important;
  z-index:1!important;
  filter:none!important;
}
.app.app-ready :is(.avatar,.gender-avatar,.detail-avatar,.table-avatar){
  display:block!important;
  position:relative!important;
  overflow:hidden!important;
  flex:0 0 auto!important;
  padding:0!important;
  background:#dfe2de!important;
  border:1px solid rgba(30,34,31,.18)!important;
  border-radius:50%!important;
  box-shadow:0 3px 10px rgba(35,40,37,.08)!important;
  opacity:1!important;
  visibility:visible!important;
}
.app.app-ready .avatar{width:44px!important;height:44px!important;min-width:44px!important;min-height:44px!important}
.app.app-ready .gender-avatar{width:48px!important;height:48px!important;min-width:48px!important;min-height:48px!important}
.app.app-ready .table-avatar{width:42px!important;height:42px!important;min-width:42px!important;min-height:42px!important}
.app.app-ready .detail-avatar{width:82px!important;height:82px!important;min-width:82px!important;min-height:82px!important}

/* Header admin avatar fallback remains visible. */
.app.app-ready .header-user{display:flex!important;align-items:center!important}
.app.app-ready .user-avatar{
  display:grid!important;
  place-items:center!important;
  width:36px!important;height:36px!important;min-width:36px!important;
  border-radius:50%!important;
  background:#202321!important;
  color:#a77c22!important;
  font-weight:800!important;
  opacity:1!important;
  visibility:visible!important;
}


/* People list final contrast: matches the actual mobile table structure. */
.app.app-ready .people-data-table td:first-child{
  color:#3f4541!important;
  font-weight:750!important;
}
.app.app-ready .people-data-table .table-name,
.app.app-ready .people-data-table tr.relation-old:not(.is-vip) .table-name,
.app.app-ready .people-data-table tr.relation-new:not(.is-vip) .table-name,
.app.app-ready .people-data-table tr.is-vip .table-name{
  color:#111312!important;
  font-weight:720!important;
}
.app.app-ready .people-data-table .person-category{
  color:#222624!important;
  background:#eef0ed!important;
  border-color:#c9ceca!important;
}
.app.app-ready .people-data-table .person-category[data-category="老女"],
.app.app-ready .people-data-table .person-category[data-category="老男"]{
  color:#7a590f!important;
  background:#efe5cb!important;
  border-color:#c7ac6a!important;
}
.app.app-ready .people-data-table .person-category[data-category="新女"],
.app.app-ready .people-data-table .person-category[data-category="新男"]{
  color:#222624!important;
  background:#eef0ed!important;
  border-color:#c9ceca!important;
}
@media(max-width:760px){
  .app.app-ready>.sidebar .nav button span{
    display:block!important;
    color:#3b403d!important;
    opacity:1!important;
    visibility:visible!important;
    font-size:10px!important;
    font-weight:650!important;
  }
  .app.app-ready>.sidebar .nav button.active span{
    color:#1f2421!important;
    font-weight:760!important;
  }
}

`;
document.head.appendChild(st);
})();