/* 辰南统一设计系统运行时 v1.0 · 2026-10-03 */
(function(){
'use strict';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));

function ensureStylesheetLast(){
  let link=$('#chennanDesignSystemStyles');
  if(!link){
    link=document.createElement('link');
    link.id='chennanDesignSystemStyles';
    link.rel='stylesheet';
    link.href='./design-system.css?v=20261003-system-1';
  }
  document.head.appendChild(link);
}
ensureStylesheetLast();

const PAGE_META={
  overview:{eyebrow:'INVESTOR WORKSPACE',title:'投资者人物总览',sub:'70 位人物资料、分组、持仓与交易状态统一工作台。'},
  people:{eyebrow:'INVESTOR DIRECTORY',title:'人物库',sub:'查看、筛选、编辑人物完整资料，并进入人物详情与交易设置。'},
  groups:{eyebrow:'BALANCED GROUPS',title:'分组管理',sub:'70 位人物固定平均分为 10 组，每组 7 人；男女与新老客户比例均衡，小组名称可修改。'},
  tradeRecommend:{eyebrow:'INVESTOR TRANSACTIONS',title:'人物交易',sub:'管理股票计划、推荐购买人物，并记录邀请、拒绝与确认买入结果。'},
  holdingsV2:{eyebrow:'PORTFOLIO HOLDINGS',title:'持仓管理',sub:'按股票批次查看持有人、买入成本、计划卖出时间与当前持仓状态。'},
  trades:{eyebrow:'TRADING PLAN',title:'交易计划',sub:'集中管理今日待售、待买、持仓、未持仓人员与名单生成规则。'},
  records:{eyebrow:'INVESTOR RECORDS',title:'人物记录',sub:'统一记录人物重要事件、发言与联系信息，并辅助检查重复与状态冲突。'},
  novel:{eyebrow:'WRITING WORKSPACE',title:'撰写',sub:'每日文档、人物发言、长期记忆与一致性提醒统一写作工作台。'},
  france70chat:{eyebrow:'FRANCE 70',title:'France 70 群聊与长期记忆',sub:'使用既有人设、关系网、Voice DNA 与动态记忆组织群聊内容。'},
  topics:{eyebrow:'CONSISTENCY CHECK',title:'一致性检查',sub:'汇总人物数据规则、主题标签与逻辑检查信息，辅助保持长期内容一致。'}
};

function normalizePrimaryHeader(section){
  if(!section||!PAGE_META[section.id])return;
  const meta=PAGE_META[section.id];
  const top=section.querySelector(':scope > .topbar')||section.querySelector('.topbar');
  if(!top)return;
  top.classList.add('cn-page-header');
  const left=top.firstElementChild;
  if(!left)return;
  let eyebrow=left.querySelector('.eyebrow');
  let title=left.querySelector('.page-title');
  let sub=left.querySelector('.sub');
  if(eyebrow)eyebrow.textContent=meta.eyebrow;
  if(title)title.textContent=meta.title;
  if(sub)sub.textContent=meta.sub;
}

function tagSections(){
  $$('.main>.section').forEach(section=>{
    section.dataset.uiSystem='chennan-v1';
    normalizePrimaryHeader(section);
    if(section.id==='personDetailPage')section.dataset.uiPageType='detail';
    else if(['people','records'].includes(section.id))section.dataset.uiPageType='list';
    else if(['tradeRecommend','holdingsV2','trades','novel','france70chat','groups','topics'].includes(section.id))section.dataset.uiPageType='workspace';
    else section.dataset.uiPageType='dashboard';
  });
}

function normalizeButtons(root=document){
  $$('.btn',root).forEach(btn=>{
    if(btn.classList.contains('danger'))btn.dataset.uiTone='danger';
    else if(btn.classList.contains('primary'))btn.dataset.uiTone='primary';
    else btn.dataset.uiTone='secondary';
  });
  $$('.link-btn.danger,.delete-person',root).forEach(el=>el.dataset.uiTone='danger');
}

function normalizeTables(root=document){
  $$('table',root).forEach(table=>{
    table.dataset.uiTable='standard';
    const wrap=table.closest('.table-wrap,.people-table-wrap');
    if(wrap)wrap.dataset.uiSurface='table';
  });
}

function normalizeEmptyStates(root=document){
  $$('.empty',root).forEach(node=>{
    node.dataset.uiEmpty='true';
    if(!node.getAttribute('role'))node.setAttribute('role','status');
  });
}

function normalizeModals(root=document){
  $$('.modal',root).forEach(m=>m.dataset.uiSurface='modal');
  $$('dialog',root).forEach(d=>d.dataset.uiSurface='dialog');
}

function removeGroupPortraitLeaks(){
  $$('#groups .balanced-member-avatar,#groups .balanced-member .person-portrait').forEach(n=>n.remove());
}

function normalizeDetailPage(){
  const sec=$('#personDetailPage');
  if(!sec)return;
  const head=sec.querySelector('.detail-head');
  if(head)head.classList.add('cn-page-header');
  const eyebrow=sec.querySelector('.detail-head .eyebrow');
  if(eyebrow)eyebrow.textContent='PERSON PROFILE';
}

function normalizeAll(root=document){
  tagSections();
  normalizeButtons(root);
  normalizeTables(root);
  normalizeEmptyStates(root);
  normalizeModals(root);
  normalizeDetailPage();
  removeGroupPortraitLeaks();
}
normalizeAll();

/* Re-apply after dynamic pages replace their innerHTML. */
let queued=false;
const observer=new MutationObserver(records=>{
  if(queued)return;
  if(!records.some(r=>r.type==='childList'||(r.type==='attributes'&&r.attributeName==='class')))return;
  queued=true;
  requestAnimationFrame(()=>{
    queued=false;
    ensureStylesheetLast();
    normalizeAll();
  });
});
observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});

/* Consistent secondary-page return behavior. */
document.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||event.defaultPrevented)return;
  const active=$('.main>.section.active');
  if(!active)return;

  const openDialog=$('dialog[open]');
  if(openDialog){
    event.preventDefault();
    openDialog.close();
    return;
  }
  const modal=$('.modal-wrap.show');
  if(modal){
    const cancel=modal.querySelector('#cancelModal,[data-close-modal],.modal-close');
    event.preventDefault();
    if(cancel)cancel.click();
    else modal.classList.remove('show');
    return;
  }

  if(active.id==='personDetailPage'){
    event.preventDefault();
    if(typeof window.go==='function')window.go('people');
    else document.querySelector('.nav button[data-page="people"]')?.click();
    return;
  }

  if(active.id==='holdingsV2'){
    event.preventDefault();
    document.querySelector('.nav button[data-page="tradeRecommend"]')?.click();
  }
});

/* Keep page header and main surfaces aligned after navigation. */
document.addEventListener('click',event=>{
  const nav=event.target.closest?.('.nav button[data-page],[data-go]');
  if(!nav)return;
  requestAnimationFrame(()=>requestAnimationFrame(()=>normalizeAll()));
},true);

/* Expose a tiny QA helper without touching business data. */
window.ChenNanDesignSystem={
  version:'1.0.0',
  audit(){
    const sections=$$('.main>.section').map(s=>({
      id:s.id,
      hasHeader:!!(s.querySelector(':scope > .topbar')||s.id==='personDetailPage'),
      cards:s.querySelectorAll('.card,.panel').length,
      tables:s.querySelectorAll('table').length,
      empties:s.querySelectorAll('.empty').length
    }));
    return {version:this.version,sections};
  },
  refresh:normalizeAll
};

})();