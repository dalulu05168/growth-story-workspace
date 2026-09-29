
const STORAGE_KEY='growth-workspace-db';
const DATA_URL='./data/people.json';
const DEFAULT_DATASET_VERSION='3.0';
const emptyDB={people:[],records:[],docs:[],dailyDocs:{},customGroups:[],meta:{}};
let db=loadLocal();
let selectedDocId=db.docs[0]?.id||null;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

function loadLocal(){
  let raw=null;try{raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')}catch(_){}
  const out=raw&&typeof raw==='object'?raw:{...emptyDB};
  out.people=Array.isArray(out.people)?out.people:[];
  out.records=Array.isArray(out.records)?out.records:[];
  out.docs=Array.isArray(out.docs)?out.docs:[];
  out.dailyDocs=out.dailyDocs&&typeof out.dailyDocs==='object'&&!Array.isArray(out.dailyDocs)?out.dailyDocs:{};
  out.customGroups=Array.isArray(out.customGroups)?out.customGroups:[];
  out.meta=out.meta&&typeof out.meta==='object'?out.meta:{};
  out.people=out.people.map(normalizePerson);
  return out;
}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(db))}
function toast(t){const x=$('#toast');x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),2400)}
function today(){return new Date().toISOString().slice(0,10)}
function person(id){return db.people.find(p=>String(p.id)===String(id))||null}
function pName(p){return p?.name||p?.frenchName||'未命名'}
function pGender(p){return p?.gender||((p?.genderAge||'').includes('女')?'女':(p?.genderAge||'').includes('男')?'男':'')}
function pRelationCode(p){return p?.customer_relation?.type_code||((p?.genderAge||'').includes('老')?'OLD':(p?.genderAge||'').includes('新')?'NEW':'')}
function pRelationName(p){return p?.customer_relation?.type||(pRelationCode(p)==='OLD'?'老客户':pRelationCode(p)==='NEW'?'新客户':'未分类')}
function pVip(p){return !!(p?.vip?.is_vip)}
function pOpened(p){return !!(p?.account?.opened)}
function pJoined(p){return !!(p?.crm?.joined_group)}
function pEnthusiasm(p){return Number(p?.investment_profile?.stock_enthusiasm_index??((Number(p?.heat)||0)*10))||0}
function pAssets(p){return Number(p?.finance?.estimated_investable_assets_eur)||0}
function initials(n){return String(n||'人').trim().split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()}
function genderRelationLabel(p){const rel=pRelationCode(p)==='OLD'?'老':pRelationCode(p)==='NEW'?'新':'';return rel+(pGender(p)||'')}
function normalizePerson(raw={}){
  const p=JSON.parse(JSON.stringify(raw||{}));
  p.id=String(p.id??p.legacy_id??'').trim();
  p.legacy_id=String(p.legacy_id??p.id??'').trim();
  p.name=p.name||p.frenchName||'';
  p.gender=p.gender||((p.genderAge||'').includes('女')?'女':(p.genderAge||'').includes('男')?'男':'');
  p.gender_code=p.gender_code||(p.gender==='女'?'F':p.gender==='男'?'M':'');
  p.age=Number(p.age)||null;
  p.age_group=p.age_group||'';
  p.customer_relation=p.customer_relation&&typeof p.customer_relation==='object'?p.customer_relation:{type:(p.genderAge||'').includes('老')?'老客户':'新客户',type_code:(p.genderAge||'').includes('老')?'OLD':'NEW'};
  p.vip=p.vip&&typeof p.vip==='object'?p.vip:{is_vip:false,level:null,reason:null};
  p.account=p.account&&typeof p.account==='object'?p.account:{opened:false,status:'未开户',status_code:'NOT_OPENED',opened_date:null};
  p.location=p.location&&typeof p.location==='object'?p.location:{country:'法国',country_code:'FR',city:'',region:''};
  p.occupation=p.occupation&&typeof p.occupation==='object'?p.occupation:{title_fr:'',title_zh:'',industry_fr:'',industry_zh:'',employment_status:'',years_in_role:null,education:'',career_stage:''};
  p.family=p.family&&typeof p.family==='object'?p.family:{};
  p.finance=p.finance&&typeof p.finance==='object'?p.finance:{annual_income_eur:0,estimated_investable_assets_eur:0,estimated_liquid_assets_eur:0,available_investment_capital_eur:0};
  p.finance.available_capital_by_currency=p.finance.available_capital_by_currency&&typeof p.finance.available_capital_by_currency==='object'&&!Array.isArray(p.finance.available_capital_by_currency)?p.finance.available_capital_by_currency:{};
  [['EUR','available_investment_capital_eur'],['USD','available_investment_capital_usd'],['HKD','available_investment_capital_hkd'],['CNY','available_investment_capital_cny']].forEach(function(pair){const v=Number(p.finance[pair[1]]);if(Number.isFinite(v)&&v>0&&p.finance.available_capital_by_currency[pair[0]]==null)p.finance.available_capital_by_currency[pair[0]]=v});
  p.investment_profile=p.investment_profile&&typeof p.investment_profile==='object'?p.investment_profile:{stock_enthusiasm_index:Number(p.heat||0)*10,stock_enthusiasm_level:'',risk_tolerance:'',preferred_sectors:[]};
  p.personality=p.personality&&typeof p.personality==='object'?p.personality:{summary:'',traits:[]};
  p.communication=p.communication&&typeof p.communication==='object'?p.communication:{};
  p.lifestyle=p.lifestyle&&typeof p.lifestyle==='object'?p.lifestyle:{};
  p.tags=Array.isArray(p.tags)?p.tags:[];
  p.crm=p.crm&&typeof p.crm==='object'?p.crm:{joined_group:false,group_joined_date:null,notes:p.note||'',contact_count:0};
  if(typeof p.crm.joined_group!=='boolean')p.crm.joined_group=false;
  p.crm.contact_count=Math.max(0,Number(p.crm.contact_count)||0);
  return p;
}
async function seedDefaultPeople(){
  try{
    const res=await fetch(DATA_URL,{cache:'no-store'});
    if(!res.ok)throw new Error(`HTTP ${res.status}`);
    const dataset=await res.json();
    const list=Array.isArray(dataset)?dataset:Array.isArray(dataset.people)?dataset.people:[];
    if(!list.length)throw new Error('数据文件没有 people 数组');
    if(db.meta.defaultDatasetVersion!==DEFAULT_DATASET_VERSION){
      const existing=new Map(db.people.map(p=>[String(p.id),p]));
      let added=0;
      list.map(normalizePerson).forEach(p=>{if(!existing.has(String(p.id))){db.people.push(p);added++}});
      db.meta.defaultDatasetVersion=DEFAULT_DATASET_VERSION;
      db.meta.defaultDatasetName=dataset.dataset_name||'法国人物70位';
      save();
      $('#seedNotice').textContent=`默认人物数据已就绪：${list.length} 人；本次补充 ${added} 人。`;
    }else{
      $('#seedNotice').textContent=`默认人物数据已载入；当前人物库 ${db.people.length} 人。`;
    }
  }catch(err){
    $('#seedNotice').className='notice warn';
    $('#seedNotice').textContent=`默认数据载入失败：${err.message}。仍可使用“导入 JSON / CSV”手动导入。`;
  }
  render();
}

const SYSTEM_GROUPS=[
  {id:'all',name:'全部人物',test:p=>true},
  {id:'new_male',name:'新男',test:p=>pRelationCode(p)==='NEW'&&pGender(p)==='男'},
  {id:'new_female',name:'新女',test:p=>pRelationCode(p)==='NEW'&&pGender(p)==='女'},
  {id:'old_male',name:'老男',test:p=>pRelationCode(p)==='OLD'&&pGender(p)==='男'},
  {id:'old_female',name:'老女',test:p=>pRelationCode(p)==='OLD'&&pGender(p)==='女'},
  {id:'vip',name:'VIP',test:p=>pVip(p)},
  {id:'male',name:'男性',test:p=>pGender(p)==='男'},
  {id:'female',name:'女性',test:p=>pGender(p)==='女'},
  {id:'opened',name:'已开户',test:p=>pOpened(p)},
  {id:'not_opened',name:'未开户',test:p=>!pOpened(p)},
  {id:'joined',name:'已入群',test:p=>pJoined(p)},
  {id:'not_joined',name:'未入群',test:p=>!pJoined(p)}
];
function systemGroup(id){return SYSTEM_GROUPS.find(g=>g.id===id)||SYSTEM_GROUPS[0]}
function customGroup(id){return db.customGroups.find(g=>g.id===id)||null}

function eventHTML(r){
  const p=person(r.personId);
  return `<div class="timeline-item"><div class="date">${esc(r.date||'')}</div><div class="dotline"></div><div class="event"><div class="event-head"><div><span class="event-title">${esc(r.title)}</span><div class="muted" style="font-size:12px;margin-top:2px">${p?`#${esc(p.id)} · ${esc(genderRelationLabel(p)||'未分类')} · ${esc(pName(p))}`:'未知人物'}</div></div><span class="type ${r.type==='发言记录'?'talk':''}">${esc(r.type)}</span></div><p>${esc(r.content)}</p><div class="tags">${(r.topics||[]).map(t=>`<span class="tag"># ${esc(t)}</span>`).join('')}<button class="link-btn edit-record" data-id="${esc(r.id)}">编辑</button></div></div></div>`;
}
function render(){
  renderOverview();renderPeopleFilters();renderPeople();renderGroups();fillSelect();renderRecords();renderTopics();renderDocs();bindDynamic();
}
function renderOverview(){
  const rs=[...db.records].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  $('#metrics').innerHTML=[
    ['人物总数',db.people.length,'完整画像'],
    ['VIP',db.people.filter(pVip).length,'动态统计'],
    ['已开户',db.people.filter(pOpened).length,'账户状态'],
    ['已入群',db.people.filter(pJoined).length,'可手动更新']
  ].map(([l,n,t])=>`<div class="card metric"><span class="label">${l}</span><strong>${n}</strong><span class="trend">${t}</span></div>`).join('');
  $('#recentTimeline').innerHTML=rs.slice(0,4).map(eventHTML).join('')||'<div class="empty">还没有重要记录</div>';
  const ids=['new_male','new_female','old_male','old_female','vip','opened','joined'];
  $('#groupOverview').innerHTML=ids.map(id=>{const g=systemGroup(id),n=db.people.filter(g.test).length;return `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line)"><span>${esc(g.name)}</span><b>${n}</b></div>`}).join('');
}
function renderPeopleFilters(){
  const s=$('#systemGroupFilter'),old=s.value||'all';
  s.innerHTML=SYSTEM_GROUPS.map(g=>`<option value="${g.id}">${esc(g.name)} (${db.people.filter(g.test).length})</option>`).join('');
  s.value=SYSTEM_GROUPS.some(g=>g.id===old)?old:'all';
  const c=$('#customGroupFilter'),cold=c.value||'all';
  c.innerHTML='<option value="all">全部自定义小组</option>'+db.customGroups.map(g=>`<option value="${esc(g.id)}">${esc(g.name)} (${g.members?.length||0})</option>`).join('');
  c.value=db.customGroups.some(g=>g.id===cold)?cold:'all';
}
function personSearchBlob(p){
  return [p.id,p.legacy_id,pName(p),pGender(p),p.age,pRelationName(p),p.location?.city,p.location?.region,p.occupation?.title_zh,p.occupation?.title_fr,p.occupation?.industry_zh,p.personality?.summary,p.crm?.notes,...(p.tags||[])].join(' ').toLowerCase();
}
function renderPeople(){
  const q=($('#personSearch')?.value||'').trim().toLowerCase(),sort=$('#personSort')?.value||'id';
  const sg=systemGroup($('#systemGroupFilter')?.value||'all'),cgid=$('#customGroupFilter')?.value||'all',cg=customGroup(cgid);
  let list=db.people.filter(p=>sg.test(p)&&(!cg||cg.members.includes(String(p.id)))&&(!q||personSearchBlob(p).includes(q)));
  list.sort((a,b)=>sort==='name'?pName(a).localeCompare(pName(b),'fr'):sort==='enthusiasm'?pEnthusiasm(b)-pEnthusiasm(a):sort==='assets'?pAssets(b)-pAssets(a):String(a.id).localeCompare(String(b.id),undefined,{numeric:true}));
  $('#peopleCount').textContent=`当前显示 ${list.length} / ${db.people.length} 人`;
  $('#peopleList').innerHTML=list.map(p=>`<div class="profile-row">
    <div class="avatar">${esc(initials(pName(p)))}</div>
    <div class="person"><b>#${esc(p.id)} · ${esc(pName(p))}</b><small>${esc(genderRelationLabel(p)||'未分类')} · ${esc(p.age||'--')}岁 · ${esc(p.location?.city||'城市未填')} · ${esc(p.occupation?.title_zh||p.occupation?.title_fr||'职业未填')}</small></div>
    ${pVip(p)?'<span class="status vip">VIP</span>':''}
    <span class="status ${pOpened(p)?'good':'warn'}">${pOpened(p)?'已开户':'未开户'}</span>
    <span class="status ${pJoined(p)?'good':''}">${pJoined(p)?'已入群':'未入群'}</span>
    <span class="sort-badge">股票热情 ${pEnthusiasm(p)}</span>
    <button class="link-btn view-person" data-id="${esc(p.id)}">详情</button>
    <button class="link-btn edit-person" data-id="${esc(p.id)}">编辑</button>
    <button class="link-btn danger delete-person" data-id="${esc(p.id)}">删除</button>
  </div>`).join('')||'<div class="empty">没有匹配人物</div>';
}
function renderGroups(){
  $('#systemGroups').innerHTML=SYSTEM_GROUPS.filter(g=>g.id!=='all').map(g=>`<div class="group-card"><button class="system-group-open" data-group="${g.id}"><small>系统分组</small><strong>${db.people.filter(g.test).length}</strong><b>${esc(g.name)}</b></button></div>`).join('');
  $('#customGroupCount').textContent=`共 ${db.customGroups.length} 个小组`;
  $('#customGroups').innerHTML=db.customGroups.map(g=>{
    const names=(g.members||[]).map(id=>person(id)).filter(Boolean).slice(0,5).map(pName);
    return `<div class="card custom-group"><h3>${esc(g.name)}</h3><div class="leader">组长：${esc(g.leader||'未设置')}</div><div class="members-preview">${g.members?.length||0} 位成员${names.length?` · ${names.map(esc).join('、')}${(g.members?.length||0)>5?'…':''}`:''}</div><div class="button-row" style="margin-top:12px"><button class="btn ghost small open-custom-group" data-id="${esc(g.id)}">查看成员</button><button class="btn ghost small edit-group" data-id="${esc(g.id)}">编辑</button><button class="btn danger small delete-group" data-id="${esc(g.id)}">删除</button></div></div>`;
  }).join('')||'<div class="empty">还没有自定义小组，点击“新建自定义小组”开始规划。</div>';
}
function fillSelect(){
  const s=$('#recordPerson'),old=s.value;
  s.innerHTML='<option value="all">全部人物</option>'+db.people.map(p=>`<option value="${esc(p.id)}">#${esc(p.id)} · ${esc(pName(p))}</option>`).join('');
  s.value=[...s.options].some(o=>o.value===old)?old:'all';
}
function renderRecords(){
  const ps=$('#recordPerson').value||'all',ty=$('#recordType').value||'all',q=($('#recordSearch').value||'').toLowerCase();
  const rs=db.records.filter(r=>(ps==='all'||String(r.personId)===String(ps))&&(ty==='all'||r.type===ty)&&(`${r.title} ${r.content} ${(r.topics||[]).join(' ')}`).toLowerCase().includes(q)).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  $('#allTimeline').innerHTML=rs.map(eventHTML).join('')||'<div class="empty">没有匹配记录</div>';
  document.querySelectorAll('.edit-record').forEach(b=>b.onclick=()=>openRecord(b.dataset.id)); // record-edit-rebind
}
function topicCounts(){const m={};db.records.forEach(r=>(r.topics||[]).forEach(t=>{if(t)m[t]=(m[t]||0)+1}));return Object.entries(m).sort((a,b)=>b[1]-a[1])}
function renderTopics(){const ts=topicCounts();$('#allTopics').innerHTML=ts.length?`<h3>已使用主题</h3><div class="tags" style="margin-top:10px">${ts.map(([t,n])=>`<span class="tag"># ${esc(t)} · ${n}</span>`).join('')}</div>`:'<div class="empty">暂未填写主题标签</div>'}
function bindDynamic(){
  document.querySelectorAll('.edit-person').forEach(b=>b.onclick=()=>openPerson(b.dataset.id));
  document.querySelectorAll('.view-person').forEach(b=>b.onclick=()=>viewPerson(b.dataset.id));
  document.querySelectorAll('.delete-person').forEach(b=>b.onclick=()=>deletePerson(b.dataset.id));
  document.querySelectorAll('.edit-record').forEach(b=>b.onclick=()=>openRecord(b.dataset.id));
  document.querySelectorAll('.system-group-open').forEach(b=>b.onclick=()=>openSystemGroup(b.dataset.group));
  document.querySelectorAll('.edit-group').forEach(b=>b.onclick=()=>openGroup(b.dataset.id));
  document.querySelectorAll('.open-custom-group').forEach(b=>b.onclick=()=>openCustomGroup(b.dataset.id));
  document.querySelectorAll('.delete-group').forEach(b=>b.onclick=()=>deleteGroup(b.dataset.id));
}
function go(page){document.querySelectorAll('.section').forEach(s=>s.classList.toggle('active',s.id===page));document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===page));window.scrollTo(0,0)}
document.querySelectorAll('.nav button').forEach(b=>b.onclick=()=>go(b.dataset.page));document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));document.addEventListener('click',e=>{const b=e.target.closest?.('.nav button[data-page]');if(b){e.preventDefault();go(b.dataset.page)}});
$('#personSearch').oninput=renderPeople;$('#personSort').onchange=renderPeople;$('#systemGroupFilter').onchange=renderPeople;$('#customGroupFilter').onchange=renderPeople;
['recordPerson','recordType','recordSearch'].forEach(id=>$('#'+id).addEventListener(id==='recordSearch'?'input':'change',renderRecords));

function closeModal(){$('#modal').classList.remove('show')}
function openModal(title,body,submit,foot='保存'){
  $('#modalTitle').textContent=title;$('#modalForm').innerHTML=body+`<div class="modal-foot"><button type="button" class="btn ghost" id="cancelModal">取消</button>${submit?`<button class="btn primary">${foot}</button>`:''}</div>`;$('#modal').classList.add('show');$('#cancelModal').onclick=closeModal;
  $('#modalForm').onsubmit=e=>{e.preventDefault();if(!submit)return;const result=submit(new FormData(e.target));if(result!==false){closeModal();save();render();toast('已保存')}};
}
function viewPerson(id){
  const p=person(id);if(!p)return;
  const groups=db.customGroups.filter(g=>(g.members||[]).includes(String(p.id))).map(g=>g.name);
  const sectors=p.investment_profile?.preferred_sectors||[];
  openModal(`${pName(p)} · ${p.id}`,`<div class="profile-detail">
    <div class="detail-box"><span>系统分类</span><b>${esc(genderRelationLabel(p)||'未分类')}</b></div>
    <div class="detail-box"><span>年龄</span><b>${esc(p.age||'--')} 岁</b></div>
    <div class="detail-box"><span>城市</span><b>${esc(p.location?.city||'--')}</b></div>
    <div class="detail-box"><span>VIP</span><b>${pVip(p)?esc(p.vip?.level||'VIP'):'否'}</b></div>
    <div class="detail-box"><span>开户状态</span><b>${esc(p.account?.status|| (pOpened(p)?'已开户':'未开户'))}</b></div>
    <div class="detail-box"><span>入群状态</span><b>${pJoined(p)?`已入群${p.crm?.group_joined_date?' · '+esc(p.crm.group_joined_date):''}`:'未入群'}</b></div>
    <div class="section-label">职业与家庭</div>
    <div class="detail-box"><span>职业</span><b>${esc(p.occupation?.title_zh||p.occupation?.title_fr||'--')}</b></div>
    <div class="detail-box"><span>行业</span><b>${esc(p.occupation?.industry_zh||p.occupation?.industry_fr||'--')}</b></div>
    <div class="detail-box"><span>家庭</span><b>${esc(p.family?.summary||'--')}</b></div>
    <div class="section-label">财务与投资</div>
    <div class="detail-box"><span>年收入</span><b>€ ${Number(p.finance?.annual_income_eur||0).toLocaleString()}</b></div>
    <div class="detail-box"><span>可投资资产</span><b>€ ${Number(p.finance?.estimated_investable_assets_eur||0).toLocaleString()}</b></div>
    <div class="detail-box"><span>可用投资资金</span><b>€ ${Number(p.finance?.available_investment_capital_eur||0).toLocaleString()}</b></div>
    <div class="detail-box"><span>股票热情指数</span><b>${pEnthusiasm(p)}</b></div>
    <div class="detail-box"><span>风险偏好</span><b>${esc(p.investment_profile?.risk_tolerance||'--')}</b></div>
    <div class="detail-box"><span>偏好行业</span><b>${esc(sectors.join('、')||'--')}</b></div>
    <div class="section-label">性格与规划</div>
    <div class="detail-box" style="grid-column:1/-1"><span>性格</span><b>${esc(p.personality?.summary||'--')}</b></div>
    <div class="detail-box" style="grid-column:1/-1"><span>自定义小组</span><b>${esc(groups.join('、')||'未加入自定义小组')}</b></div>
    <div class="detail-box" style="grid-column:1/-1"><span>内部备注</span><b>${esc(p.crm?.notes||'--')}</b></div>
  </div>`,null);
}
function openPerson(id){
  const p=id?person(id):normalizePerson({id:'',name:'',gender:'',age:null,customer_relation:{type:'新客户',type_code:'NEW'},vip:{is_vip:false,level:null},account:{opened:false,status:'未开户',status_code:'NOT_OPENED'},crm:{joined_group:false,group_joined_date:null,notes:''}});
  if(!p)return;
  openModal(id?'编辑人物':'新增人物',`<div class="form-grid">
    <div class="field"><label>编号 *</label><input class="input" name="id" required value="${esc(p.id||nextPersonId())}" ${id?'readonly':''}></div>
    <div class="field"><label>姓名 *</label><input class="input" name="name" required value="${esc(pName(p)==='未命名'?'':pName(p))}"></div>
    <div class="field"><label>性别 *</label><select class="select" name="gender"><option value="女" ${pGender(p)==='女'?'selected':''}>女性</option><option value="男" ${pGender(p)==='男'?'selected':''}>男性</option></select></div>
    <div class="field"><label>年龄</label><input class="input" type="number" min="18" max="100" name="age" value="${esc(p.age||'')}"></div>
    <div class="field"><label>客户关系 *</label><select class="select" name="relation"><option value="NEW" ${pRelationCode(p)==='NEW'?'selected':''}>新客户</option><option value="OLD" ${pRelationCode(p)==='OLD'?'selected':''}>老客户</option></select></div>
    <div class="field"><label>城市</label><input class="input" name="city" value="${esc(p.location?.city||'')}"></div>
    <div class="field"><label>职业（中文）</label><input class="input" name="occupation" value="${esc(p.occupation?.title_zh||'')}"></div>
    <div class="field"><label>行业（中文）</label><input class="input" name="industry" value="${esc(p.occupation?.industry_zh||'')}"></div>
    <div class="field"><label>年收入 EUR</label><input class="input" type="number" min="0" name="income" value="${esc(p.finance?.annual_income_eur||0)}"></div>
    <div class="field"><label>可投资资产 EUR</label><input class="input" type="number" min="0" name="assets" value="${esc(p.finance?.estimated_investable_assets_eur||0)}"></div>
    <div class="field"><label>股票热情指数（0-100）</label><input class="input" type="number" min="0" max="100" name="enthusiasm" value="${esc(pEnthusiasm(p))}"></div>
    <div class="field"><label>风险偏好</label><input class="input" name="risk" value="${esc(p.investment_profile?.risk_tolerance||'')}"></div>
    <div class="field"><label>VIP</label><select class="select" name="vip"><option value="0" ${!pVip(p)?'selected':''}>否</option><option value="1" ${pVip(p)?'selected':''}>是</option></select></div>
    <div class="field"><label>VIP 等级</label><input class="input" name="vipLevel" value="${esc(p.vip?.level||'')}" placeholder="例如 VIP1"></div>
    <div class="field"><label>开户</label><select class="select" name="opened"><option value="0" ${!pOpened(p)?'selected':''}>未开户</option><option value="1" ${pOpened(p)?'selected':''}>已开户</option></select></div>
    <div class="field"><label>账户状态</label><input class="input" name="accountStatus" value="${esc(p.account?.status||'')}"></div>
    <div class="field"><label>入群</label><select class="select" name="joined"><option value="0" ${!pJoined(p)?'selected':''}>未入群</option><option value="1" ${pJoined(p)?'selected':''}>已入群</option></select></div>
    <div class="field"><label>入群日期</label><input class="input" type="date" name="joinedDate" value="${esc(p.crm?.group_joined_date||'')}"></div>
    <div class="field"><label>历史联系次数</label><input class="input" type="number" min="0" name="contactCount" value="${esc(p.crm?.contact_count||0)}"></div>
    <div class="field full"><label>内部备注</label><textarea name="notes" rows="3">${esc(p.crm?.notes||'')}</textarea></div>
    <div class="field full"><label>性格描述</label><textarea name="personality" rows="3">${esc(p.personality?.summary||'')}</textarea></div>
  </div>`,f=>{
    const pid=String(f.get('id')).trim();if(!id&&person(pid)){toast('编号已存在');return false}
    const x=id?p:normalizePerson({id:pid});
    x.id=pid;x.name=String(f.get('name')).trim();x.frenchName=x.name;
    x.gender=f.get('gender');x.gender_code=x.gender==='女'?'F':'M';x.age=Number(f.get('age'))||null;
    x.customer_relation=x.customer_relation||{};x.customer_relation.type_code=f.get('relation');x.customer_relation.type=x.customer_relation.type_code==='OLD'?'老客户':'新客户';
    x.location=x.location||{};x.location.country=x.location.country||'法国';x.location.country_code=x.location.country_code||'FR';x.location.city=String(f.get('city')).trim();
    x.occupation=x.occupation||{};x.occupation.title_zh=String(f.get('occupation')).trim();x.occupation.industry_zh=String(f.get('industry')).trim();
    x.finance=x.finance||{};x.finance.annual_income_eur=Number(f.get('income'))||0;x.finance.estimated_investable_assets_eur=Number(f.get('assets'))||0;
    x.investment_profile=x.investment_profile||{};x.investment_profile.stock_enthusiasm_index=Math.max(0,Math.min(100,Number(f.get('enthusiasm'))||0));x.investment_profile.risk_tolerance=String(f.get('risk')).trim();
    x.vip=x.vip||{};x.vip.is_vip=f.get('vip')==='1';x.vip.level=x.vip.is_vip?(String(f.get('vipLevel')).trim()||'VIP'):null;
    x.account=x.account||{};x.account.opened=f.get('opened')==='1';x.account.status=String(f.get('accountStatus')).trim()||(x.account.opened?'已开户':'未开户');x.account.status_code=x.account.opened?(x.account.status_code==='NOT_OPENED'?'ACCOUNT_OPENED':x.account.status_code||'ACCOUNT_OPENED'):'NOT_OPENED';
    x.crm=x.crm||{};x.crm.joined_group=f.get('joined')==='1';x.crm.group_joined_date=x.crm.joined_group?(f.get('joinedDate')||x.crm.group_joined_date||today()):null;x.crm.contact_count=Math.max(0,Number(f.get('contactCount'))||0);x.crm.notes=String(f.get('notes')).trim();
    x.personality=x.personality||{};x.personality.summary=String(f.get('personality')).trim();
    x.tags=rebuildTags(x);
    if(!id)db.people.push(x);
  });
}
function rebuildTags(p){
  const keep=(p.tags||[]).filter(t=>!['老客户','新客户','VIP','普通客户','已开户','未开户','已入群','未入群'].includes(t));
  return [...new Set([pRelationName(p),pVip(p)?'VIP':'普通客户',pOpened(p)?'已开户':'未开户',pJoined(p)?'已入群':'未入群',...keep])];
}
function nextPersonId(){
  const nums=db.people.map(p=>Number(String(p.id).match(/(\d+)$/)?.[1]||0));return 'FR'+String(Math.max(0,...nums)+1).padStart(4,'0');
}
function deletePerson(id){
  const p=person(id);if(!p)return;
  const linked=[...(db.records||[]),...(db.portfolio?.holdings||[]),...(db.portfolio?.buyPlans||[])].some(x=>String(x.personId)===String(id))||(db.tradeSim?.recommendations||[]).some(r=>(r.candidates||[]).some(x=>String(x.personId)===String(id)))||(db.docs||[]).some(d=>String(d.html||'').includes('data-person="'+id+'"'))||Object.values(db.dailyDocs||{}).some(d=>String(d.html||'').includes('data-person="'+id+'"'));
  if(linked){toast('该人物有关联记录、交易或文档，请保留人物以维护历史完整性');return}
  if(!confirm(`确定删除 ${pName(p)}（${p.id}）吗？\n该人物会同时从所有自定义小组中移除。`))return;
  db.people=db.people.filter(x=>String(x.id)!==String(id));db.customGroups.forEach(g=>g.members=(g.members||[]).filter(x=>String(x)!==String(id)));save();render();toast('人物已删除');
}
function openSystemGroup(id){go('people');$('#systemGroupFilter').value=id;$('#customGroupFilter').value='all';renderPeople()}
function openCustomGroup(id){go('people');$('#systemGroupFilter').value='all';$('#customGroupFilter').value=id;renderPeople()}

function openGroup(id){
  const g=id?customGroup(id):{id:'g'+Date.now(),name:'',leader:'',members:[]};if(!g)return;
  const memberRows=[...db.people].sort((a,b)=>String(a.id).localeCompare(String(b.id),undefined,{numeric:true})).map(p=>`<label class="member-option"><input type="checkbox" name="members" value="${esc(p.id)}" ${(g.members||[]).includes(String(p.id))?'checked':''}><span><b>#${esc(p.id)} · ${esc(pName(p))}</b><br><small class="muted">${esc(genderRelationLabel(p)||'未分类')} · ${esc(p.age||'--')}岁 · ${pVip(p)?'VIP · ':''}${pOpened(p)?'已开户':'未开户'} · ${pJoined(p)?'已入群':'未入群'}</small></span></label>`).join('');
  openModal(id?'编辑自定义小组':'新建自定义小组',`<div class="form-grid"><div class="field"><label>小组名称 *</label><input class="input" name="name" required value="${esc(g.name||'')}" placeholder="例如：重点跟进A组"></div><div class="field"><label>组长姓名（可不在名单中）</label><input class="input" name="leader" value="${esc(g.leader||'')}" placeholder="直接填写组长名称"></div><div class="field full"><label>选择成员</label><div class="member-picker">${memberRows||'<div class="empty">人物库为空</div>'}</div></div></div>`,f=>{
    const name=String(f.get('name')).trim();if(!name)return false;
    const members=[...document.querySelectorAll('#modalForm input[name="members"]:checked')].map(x=>String(x.value));
    const x={id:g.id,name,leader:String(f.get('leader')).trim(),members,updated:today()};
    if(id)db.customGroups=db.customGroups.map(a=>a.id===id?x:a);else db.customGroups.push(x);
  });
}
function deleteGroup(id){const g=customGroup(id);if(!g)return;if(!confirm(`确定删除自定义小组“${g.name}”吗？\n不会删除小组中的人物。`))return;db.customGroups=db.customGroups.filter(x=>x.id!==id);save();render();toast('小组已删除')}

function normalize(s){return String(s).toLowerCase().replace(/[\s，。！？、,.!?"“”‘’'：:；;（）()\[\]{}]/g,'')}
function similarity(a,b){const x=normalize(a),y=normalize(b);if(!x||!y)return 0;const longer=x.length>=y.length?x:y,shorter=x.length>=y.length?y:x;if(longer.includes(shorter))return shorter.length/longer.length;let prev=Array(y.length+1).fill(0).map((_,i)=>i);for(let i=1;i<=x.length;i++){let cur=[i];for(let j=1;j<=y.length;j++)cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+(x[i-1]===y[j-1]?0:1));prev=cur}return 1-prev[y.length]/longer.length}
function stateKeys(s){const t=String(s).toLowerCase(),keys=[];[['账户','有账户','没有账户'],['婚姻','已婚','未婚'],['工作','有工作','没有工作'],['记忆','记得','不记得'],['住处','住在','不住在']].forEach(([k,pos,neg])=>{const negative=t.includes(neg);if(negative)keys.push({k,v:'负'});if(t.replaceAll(neg,'').includes(pos))keys.push({k,v:'正'})});return keys}
function checks(personId,content,ignoreId){const same=db.records.filter(r=>String(r.personId)===String(personId)&&r.id!==ignoreId),exact=same.find(r=>normalize(r.content)===normalize(content)),near=same.filter(r=>similarity(r.content,content)>=.72),states=stateKeys(content),conflicts=[];states.forEach(s=>same.filter(r=>stateKeys(r.content).some(old=>old.k===s.k&&old.v!==s.v)).forEach(r=>conflicts.push({r,now:s})));return{exact,near,conflicts}}
function openRecord(id){
  const r=id?db.records.find(x=>x.id===id):{};openModal(id?'编辑重要记录':'新增重要记录',`<div class="form-grid"><div class="field"><label>人物 *</label><select class="select" name="personId" required>${db.people.map(p=>`<option value="${esc(p.id)}" ${String(p.id)===String(r.personId)?'selected':''}>#${esc(p.id)} · ${esc(pName(p))}</option>`).join('')}</select></div><div class="field"><label>日期 *</label><input class="input" type="date" name="date" required value="${esc(r.date||today())}"></div><div class="field"><label>记录类型</label><select class="select" name="type"><option ${r.type==='重要事件'?'selected':''}>重要事件</option><option ${r.type==='发言记录'?'selected':''}>发言记录</option><option ${r.type==='联系记录'?'selected':''}>联系记录</option></select></div><div class="field"><label>主题标签</label><input class="input" name="topics" value="${esc((r.topics||[]).join('、'))}" placeholder="用顿号分隔"></div><div class="field full"><label>标题 *</label><input class="input" name="title" required value="${esc(r.title||'')}"></div><div class="field full"><label>人物事实 / 发言内容 *</label><textarea name="content" rows="5" required>${esc(r.content||'')}</textarea></div></div>`,f=>{const personId=f.get('personId'),content=String(f.get('content')).trim(),c=checks(personId,content,id);if(c.exact){alert('已阻止保存：该人物已有完全重复内容。');return false}if(c.near.length||c.conflicts.length){if(!confirm('发现高相似度或状态冲突记录，确认复核后仍要保存吗？'))return false}const x={id:id||'r'+Date.now(),personId,date:f.get('date'),type:f.get('type'),title:String(f.get('title')).trim(),content,topics:String(f.get('topics')).split(/[、,，]/).map(s=>s.trim()).filter(Boolean)};if(id)db.records=db.records.map(a=>a.id===id?x:a);else db.records.push(x)});
}
function currentDoc(){return db.docs.find(d=>d.id===selectedDocId)||null}
function renderDocs(){if(!$('#docList'))return;if(!db.docs.length){selectedDocId=null;$('#docList').innerHTML='<div class="empty">还没有文档</div>';$('#docTitle').value='';$('#editor').value='';$('#docStatus').textContent='点击“新建文档”开始写作';return}if(!selectedDocId||!currentDoc())selectedDocId=db.docs[0].id;const d=currentDoc();$('#docList').innerHTML=db.docs.map(x=>`<button class="doc-item ${x.id===selectedDocId?'active':''}" data-doc="${esc(x.id)}"><b>${esc(x.title)}</b><small>更新于 ${esc(x.updated||today())}</small></button>`).join('');$('#docTitle').value=d.title;$('#editor').value=d.content;$('#docStatus').textContent=`已在本地保存 · ${d.content.length} 字`;document.querySelectorAll('.doc-item').forEach(b=>b.onclick=()=>{selectedDocId=b.dataset.doc;renderDocs()})}
function saveDoc(){const d=currentDoc();if(!d)return;d.title=$('#docTitle').value.trim()||'未命名文档';d.content=$('#editor').value;d.updated=today();save();renderDocs();toast('文档已保存')}
function createDoc(){const d={id:'d'+Date.now(),title:'新小说文档',content:'',updated:today()};db.docs.unshift(d);selectedDocId=d.id;save();renderDocs();$('#docTitle').focus()}
function renameDoc(){const d=currentDoc();if(!d)return toast('请先新建文档');const name=prompt('输入新文档标题',d.title);if(name!==null){d.title=name.trim()||d.title;save();renderDocs()}}
function insertPerson(){const d=currentDoc();if(!d)return toast('请先新建文档');if(!db.people.length)return toast('人物库为空');const id=prompt('输入人物编号');if(id===null)return;const p=person(id.trim());if(!p)return alert(`未找到人物编号 ${id.trim()}`);const text=$('#editor').value,add=`${p.id} · ${genderRelationLabel(p)||'未分类'} · ${pName(p)}：`,pos=$('#editor').selectionStart;$('#editor').value=text.slice(0,pos)+add+text.slice(pos);$('#editor').focus()}
$('#editor').addEventListener('keydown',e=>{if(e.key!=='Enter')return;const el=e.currentTarget,pos=el.selectionStart,lineStart=el.value.lastIndexOf('\n',pos-1)+1,raw=el.value.slice(lineStart,pos),m=raw.match(/^\s*([^\s]+)\s+(.+)$/);if(!m)return;const p=person(m[1]);if(!p)return;e.preventDefault();const formatted=`${p.id} · ${genderRelationLabel(p)||'未分类'} · ${pName(p)}：${m[2]}`;el.value=el.value.slice(0,lineStart)+formatted+'\n'+el.value.slice(pos);const np=lineStart+formatted.length+1;el.selectionStart=el.selectionEnd=np;$('#docStatus').textContent='已格式化人物发言，请保存文档'});

function download(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
$('#importBtn').onclick=()=>$('#fileInput').click();
$('#fileInput').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const text=await file.text();let arr;if(file.name.toLowerCase().endsWith('.json')){const parsed=JSON.parse(text);arr=Array.isArray(parsed)?parsed:parsed.people}else{const lines=text.split(/\r?\n/).filter(Boolean),head=lines.shift().split(',').map(x=>x.trim());arr=lines.map(line=>{const vals=line.split(','),o={};head.forEach((h,i)=>o[h]=vals[i]||'');return o})}if(!Array.isArray(arr))throw Error('JSON 应为人物数组，或顶层包含 people 数组');let added=0,updated=0;arr.map(normalizePerson).forEach(x=>{if(!x.id)return;const old=person(x.id);if(old){const crm=old.crm;Object.assign(old,x);old.crm=x.crm||crm;updated++}else{db.people.push(x);added++}});save();render();toast(`导入完成：新增 ${added}，更新 ${updated}`)}catch(err){alert('导入失败：'+err.message)}e.target.value=''};
$('#addPerson').onclick=()=>openPerson();$('#addGroup').onclick=()=>openGroup();
$('#addRecord').onclick=()=>{if(!db.people.length)return alert('人物库为空');openRecord()};$('#quickAdd').onclick=()=>{go('records');if(db.people.length)openRecord()};
$('#newDoc').onclick=createDoc;$('#saveDoc').onclick=saveDoc;$('#renameDoc').onclick=renameDoc;$('#insertPerson').onclick=insertPerson;
$('#docTitle').oninput=()=>$('#docStatus').textContent='标题有未保存修改';$('#editor').oninput=()=>$('#docStatus').textContent='文档有未保存修改';
$('#modal').onclick=e=>{if(e.target.id==='modal')closeModal()};
$('#exportBtn').onclick=()=>download('投资者人物工作台_全部数据.json',JSON.stringify(db,null,2),'application/json');


