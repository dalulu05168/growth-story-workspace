/* Rich document workspace: person tokens, memory, consistency warnings, DOCX export. */
(function(){
'use strict';

let currentMentionPersonId=null;

function E(id){return document.getElementById(id)}
function esc2(v){return String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function pnm(p){return p?(p.name||p.frenchName||p.id):'未知人物'}
function legacy(p){return String(p?.legacy_id||String(p?.id||'').replace(/\D/g,'')).replace(/^0+/,'')||'0'}
function classLabel(p){return (pRelationCode(p)==='OLD'?'老':'新')+(pGender(p)||'')}
function findByNumber(n){
  const clean=String(n||'').replace(/^0+/,'')||'0';
  return db.people.find(p=>legacy(p)===clean)||null;
}
function getDoc(){return db.docs.find(d=>d.id===selectedDocId)||null}
function newId(prefix){return prefix+Date.now()+Math.random().toString(16).slice(2)}
function today2(){return new Date().toISOString().slice(0,10)}
function plainTextFromEditor(){return E('richEditor')?.innerText||''}
function normalizeText(s){return String(s||'').toLowerCase().replace(/[\s，。！？、,.!?"“”‘’'：:；;（）()\[\]{}]/g,'')}
function hashText(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0).toString(16)}
function countDocMentions(p){
  const num=legacy(p),name=pnm(p);let n=0;
  db.docs.forEach(d=>{
    const t=String(d.content||d.html||'');
    const reNum=new RegExp('(^|\\D)0*'+num+'(?=\\D|$)','g');n+=(t.match(reNum)||[]).length;
    if(name)n+=Math.max(0,t.split(name).length-1);
  });
  return n;
}
function appearanceCount(p){
  const recordCount=db.records.filter(r=>String(r.personId)===String(p.id)).length;
  return recordCount+countDocMentions(p);
}
function memoryRows(p){
  const rows=[];
  const add=(date,title,detail,type)=>{if(date)rows.push({date:String(date).slice(0,10),title,detail:detail||'',type:type||''})};
  add(p.customer_relation?.first_contact_date,'首次联系','建立客户关系','system');
  add(p.account?.opened_date,'开户',p.account?.status||'已开户','system');
  add(p.crm?.group_joined_date,'入群','加入群组','system');
  db.records.filter(r=>String(r.personId)===String(p.id)).forEach(r=>add(r.date,r.title||r.type,r.content,r.type));
  const holdings=db.portfolio?.holdings||[];
  holdings.filter(x=>String(x.personId)===String(p.id)).forEach(x=>{
    add(x.buyAt,'买入 '+(x.symbol||''),(x.name||'')+' · '+(x.quantity||0)+'股','trade');
    if(x.status==='sold')add(x.soldAt,'卖出 '+(x.symbol||''),(x.name||''),'trade');
  });
  return rows.sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,50);
}
function personStatementRows(text){
  const lines=String(text||'').split(/\n+/).map(x=>x.trim()).filter(Boolean),out=[];
  lines.forEach(line=>{
    const m=line.match(/^0*(\d{1,3})(?:新男|新女|老男|老女)?(?:\s*[·\-]\s*[^：:]+)?[：:]\s*(.+)$/);
    if(!m)return;const p=findByNumber(m[1]);if(p)out.push({p,content:m[2].trim(),raw:line});
  });
  return out;
}
function hasAny(t,arr){return arr.some(x=>t.includes(x))}
function detectIssues(p,content){
  const now=normalizeText(content),issues=[];
  const past=db.records.filter(r=>String(r.personId)===String(p.id)).map(r=>normalizeText(r.content));
  const opened=!!p.account?.opened;
  if(opened&&hasAny(now,['未开户','没有开户','从未开户','没有账户']))issues.push('账户状态冲突：系统记录显示该人物已开户，但当前文本描述为未开户/没有账户。');
  if(!opened&&hasAny(now,['已开户','有账户','账户已开','已经开户']))issues.push('账户状态冲突：系统记录显示该人物未开户，但当前文本描述为已开户。');
  const saysNoTrade=hasAny(now,['从未参与大宗交易','没有参与大宗交易','没参与过大宗交易','从未参与交易']);
  const saysTrade=hasAny(now,['参与过大宗交易','参加过大宗交易','参与大宗交易','参加大宗交易']);
  if(saysNoTrade&&past.some(x=>hasAny(x,['参与过大宗交易','参加过大宗交易','参与大宗交易','大宗交易获利','大宗交易盈利'])))issues.push('经历冲突：历史记忆中该人物曾参与过大宗交易，但当前文本称从未参与。');
  if(saysTrade&&past.some(x=>hasAny(x,['从未参与大宗交易','没有参与大宗交易','没参与过大宗交易'])))issues.push('经历冲突：历史记忆中该人物曾明确称未参与大宗交易，当前文本与之相反。');
  const trustNow=hasAny(now,['信任助理','很信任助理','相信助理','完全相信助理']);
  const opposeNow=hasAny(now,['不信任助理','怀疑助理','反驳助理','质疑助理']);
  if(trustNow&&past.some(x=>hasAny(x,['不信任助理','怀疑助理','反驳助理','质疑助理'])))issues.push('态度变化提示：历史记录存在对助理的怀疑/反驳，当前文本转为明显信任。请补充态度变化原因或过渡情节。');
  if(opposeNow&&past.some(x=>hasAny(x,['信任助理','很信任助理','相信助理','完全相信助理'])))issues.push('态度变化提示：历史记录存在对助理的信任，当前文本突然转为怀疑/反驳。请补充触发原因或过渡情节。');
  const personality=normalizeText(p.personality?.summary||'');
  if(hasAny(personality,['谨慎','审慎','风险敏感','慢热'])&&hasAny(now,['毫不犹豫','完全相信','立刻决定','不考虑风险','马上全仓']))issues.push('人物性格差异：该人物画像偏谨慎/风险敏感，但当前文本表现为无条件快速决策。');
  if(hasAny(personality,['独立果断','自主','目标明确'])&&hasAny(now,['完全依赖助理','没有主见','全部听助理']))issues.push('人物性格差异：该人物画像强调独立/自主，但当前文本表现为完全依赖他人。');
  const duplicate=db.records.find(r=>String(r.personId)===String(p.id)&&normalizeText(r.content)===now);
  if(duplicate)issues.push('重复记忆：人物历史记录中已经存在完全相同的内容。');
  if(typeof checks==='function'){
    const c=checks(p.id,content,null);
    if(c?.conflicts?.length)issues.push('结构化状态检查发现与历史记录存在冲突。');
    if(c?.near?.length)issues.push('文本与人物既有记忆高度相似，请确认是否为重复情节。');
  }
  return [...new Set(issues)];
}
function allIssues(statements){
  return statements.flatMap(x=>detectIssues(x.p,x.content).map(reason=>({p:x.p,content:x.content,reason})));
}
function issueMessage(issues){
  return issues.slice(0,10).map((x,i)=>(i+1)+'. '+legacy(x.p)+classLabel(x.p)+' · '+pnm(x.p)+'\n'+x.reason+'\n文本：'+x.content).join('\n\n')+(issues.length>10?'\n\n另有 '+(issues.length-10)+' 条提示未展开。':'');
}

function setupNovel(){
  const sec=E('novel');if(!sec)return;
  sec.innerHTML='<div class="topbar"><div><div class="eyebrow">RICH DOCUMENT WORKSPACE</div><h1 class="page-title">文档与人物记忆</h1><p class="sub">富文本编辑、人物编号快捷插入、出场频次、记忆沉淀、成长历程与逻辑一致性提示。</p></div><div class="actions"><button class="btn ghost" id="docxExport">导出 DOCX</button><button class="btn primary" id="newRichDoc">＋ 新建文档</button></div></div><div class="rich-doc-layout"><div class="card panel rich-doc-list-panel"><div class="panel-head"><h2>文档</h2><button class="link-btn" id="renameRichDoc">重命名</button></div><div id="richDocList" class="doc-list"></div></div><div class="card panel rich-editor-panel"><div class="rich-title-row"><input class="input" id="richDocTitle" placeholder="文档标题"><button class="btn primary small" id="saveRichDoc">保存</button></div><div class="word-toolbar" id="wordToolbar"><button data-cmd="undo">↶</button><button data-cmd="redo">↷</button><span></span><button data-cmd="bold"><b>B</b></button><button data-cmd="italic"><i>I</i></button><button data-cmd="underline"><u>U</u></button><button data-cmd="strikeThrough"><s>S</s></button><span></span><button data-block="h1">H1</button><button data-block="h2">H2</button><button data-block="p">正文</button><span></span><button data-cmd="insertUnorderedList">• 列表</button><button data-cmd="insertOrderedList">1. 列表</button><button data-cmd="justifyLeft">左</button><button data-cmd="justifyCenter">中</button><button data-cmd="justifyRight">右</button><span></span><button id="insertHr">分隔线</button><button id="clearFormat">清格式</button></div><div id="docPersonSuggest" class="doc-suggest"></div><div id="richEditor" class="rich-editor" contenteditable="true" spellcheck="false"></div><div class="shortcut">输入人物数字编号，例如 <b>21</b>，系统会显示对应人物；按回车后自动插入“21新女 · 姓名：”，随后直接撰写内容。保存时会进行人物记忆和逻辑一致性检查。</div><div id="richDocStatus" class="muted" style="margin-top:8px"></div></div><div class="card panel memory-panel"><div class="panel-head"><h2>人物记忆</h2><span id="mentionFrequency" class="muted">未选择人物</span></div><div id="memoryPerson"></div><div id="memoryTimeline" class="memory-timeline"></div></div></div>';
  if(!E('richDocStyles')){
    const st=document.createElement('style');st.id='richDocStyles';
    st.textContent='.rich-doc-layout{display:grid;grid-template-columns:230px minmax(0,1fr) 330px;gap:18px}.rich-title-row{display:flex;gap:10px;margin-bottom:10px}.word-toolbar{display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:8px;border:1px solid var(--line);border-radius:11px 11px 0 0;background:#f8fafc}.word-toolbar button{padding:6px 9px;border-radius:7px;background:#fff;border:1px solid var(--line);font-size:12px}.word-toolbar span{width:1px;height:23px;background:var(--line);margin:0 2px}.rich-editor{min-height:520px;border:1px solid var(--line);border-top:0;border-radius:0 0 11px 11px;padding:26px 34px;background:#fff;outline:none;font-size:15px;line-height:1.8;overflow:auto}.rich-editor:focus{box-shadow:inset 0 0 0 1px #a9baff}.person-token{background:#edf2ff;color:#3656ba;border-radius:6px;padding:2px 5px;font-weight:800}.doc-suggest{display:none;border:1px solid #b9c8ff;background:#f7f9ff;padding:8px 10px;font-size:12px;color:#40599d}.doc-suggest.show{display:block}.memory-person-card{border:1px solid var(--line);border-radius:13px;padding:12px;background:#fafbfe}.memory-person-card b{display:block}.memory-person-card small{color:var(--muted)}.memory-timeline{display:grid;gap:10px;margin-top:14px;max-height:570px;overflow:auto}.memory-row{border-left:3px solid #dbe3ff;padding:8px 10px;background:#fafbfe;border-radius:0 9px 9px 0}.memory-row b{display:block;font-size:12px}.memory-row small{color:var(--muted);display:block}.memory-row p{margin:4px 0 0;font-size:12px}.rich-editor h1{font-size:26px}.rich-editor h2{font-size:20px}@media(max-width:1200px){.rich-doc-layout{grid-template-columns:210px minmax(0,1fr)}.memory-panel{grid-column:1/-1}.memory-timeline{max-height:none}}@media(max-width:760px){.rich-doc-layout{grid-template-columns:1fr}.rich-doc-list-panel,.memory-panel{grid-column:auto}.rich-editor{padding:20px 16px}}';
    document.head.appendChild(st);
  }
  bindNovelUI();renderRichDocs();
}
function bindNovelUI(){
  E('newRichDoc').onclick=createRichDoc;
  E('saveRichDoc').onclick=saveRichDoc;
  E('renameRichDoc').onclick=renameRichDoc;
  E('docxExport').onclick=exportDocx;
  E('insertHr').onclick=()=>{document.execCommand('insertHorizontalRule',false,null);E('richEditor').focus()};
  E('clearFormat').onclick=()=>{document.execCommand('removeFormat',false,null);E('richEditor').focus()};
  E('richDocTitle').oninput=()=>E('richDocStatus').textContent='标题有未保存修改';
  E('richEditor').addEventListener('input',()=>{E('richDocStatus').textContent='文档有未保存修改';updateSuggestion()});
  E('richEditor').addEventListener('keyup',updateSuggestion);
  E('richEditor').addEventListener('click',()=>{const p=personFromSelection();if(p){currentMentionPersonId=p.id;renderMemory(p.id)}});
  E('richEditor').addEventListener('keydown',handleEditorKey);
  qsa2('#wordToolbar [data-cmd]').forEach(b=>b.onclick=()=>{document.execCommand(b.dataset.cmd,false,null);E('richEditor').focus()});
  qsa2('#wordToolbar [data-block]').forEach(b=>b.onclick=()=>{document.execCommand('formatBlock',false,b.dataset.block);E('richEditor').focus()});
}
function qsa2(s){return [...document.querySelectorAll(s)]}
function renderRichDocs(){
  if(!db.docs.length){createRichDoc();return}
  if(!selectedDocId||!getDoc())selectedDocId=db.docs[0].id;
  const d=getDoc();
  E('richDocList').innerHTML=db.docs.map(x=>'<button class="doc-item '+(x.id===selectedDocId?'active':'')+'" data-rdoc="'+esc2(x.id)+'"><b>'+esc2(x.title||'未命名文档')+'</b><small>更新于 '+esc2(x.updated||today2())+'</small></button>').join('');
  E('richDocTitle').value=d.title||'未命名文档';
  E('richEditor').innerHTML=d.html||textToHtml(d.content||'');
  E('richDocStatus').textContent='已载入 · '+(d.content||E('richEditor').innerText||'').length+' 字';
  qsa2('[data-rdoc]').forEach(b=>b.onclick=()=>{selectedDocId=b.dataset.rdoc;currentMentionPersonId=null;renderRichDocs();renderMemory(null)});
}
function textToHtml(t){return String(t||'').split(/\n/).map(x=>'<div>'+esc2(x||' ')+'</div>').join('')}
function createRichDoc(){
  const d={id:newId('d'),title:'新文档',content:'',html:'<div><br></div>',updated:today2()};db.docs.unshift(d);selectedDocId=d.id;save();renderRichDocs();E('richDocTitle').focus();
}
function renameRichDoc(){
  const d=getDoc();if(!d)return;const n=prompt('输入新文档标题',d.title||'');if(n!==null){d.title=n.trim()||d.title;save();renderRichDocs()}
}
function currentBlock(){
  const sel=window.getSelection();if(!sel||!sel.rangeCount)return null;let n=sel.anchorNode;if(!n)return null;if(n.nodeType===3)n=n.parentElement;while(n&&n!==E('richEditor')&&n.parentElement!==E('richEditor'))n=n.parentElement;return n&&n!==E('richEditor')?n:null;
}
function updateSuggestion(){
  const block=currentBlock(),box=E('docPersonSuggest');if(!block||!box)return;
  const t=block.innerText.trim(),m=t.match(/^0*(\d{1,3})$/),p=m?findByNumber(m[1]):null;
  if(p){box.className='doc-suggest show';box.innerHTML='按回车插入人物：<b>'+esc2(legacy(p)+classLabel(p)+' · '+pnm(p))+'</b>';currentMentionPersonId=p.id;renderMemory(p.id)}
  else box.className='doc-suggest';
}
function setCaretEnd(node){
  const r=document.createRange(),sel=window.getSelection();r.selectNodeContents(node);r.collapse(false);sel.removeAllRanges();sel.addRange(r);
}
function insertPrefix(p,block){
  block.innerHTML='<span class="person-token" contenteditable="false" data-person="'+esc2(p.id)+'">'+esc2(legacy(p)+classLabel(p)+' · '+pnm(p))+'</span>：&nbsp;';
  setCaretEnd(block);currentMentionPersonId=p.id;renderMemory(p.id);E('docPersonSuggest').className='doc-suggest';
}
function handleEditorKey(e){
  if(e.key!=='Enter')return;
  const block=currentBlock();if(!block)return;const txt=block.innerText.trim();
  const only=txt.match(/^0*(\d{1,3})$/);
  if(only){const p=findByNumber(only[1]);if(p){e.preventDefault();insertPrefix(p,block);return}}
  const rows=personStatementRows(txt);if(rows.length){
    const issues=allIssues(rows);
    if(issues.length){const ok=confirm('人物逻辑/塑造提示：\n\n'+issueMessage(issues)+'\n\n继续换行并保留当前内容吗？');if(!ok){e.preventDefault();return}}
  }
}
function personFromSelection(){
  const sel=window.getSelection();if(!sel||!sel.rangeCount)return null;let n=sel.anchorNode;if(n?.nodeType===3)n=n.parentElement;const token=n?.closest?.('.person-token');return token?person(token.dataset.person):null;
}
function renderMemory(pid){
  const p=pid?person(pid):null,card=E('memoryPerson'),list=E('memoryTimeline'),freq=E('mentionFrequency');if(!card||!list)return;
  if(!p){card.innerHTML='<div class="empty">输入人物编号或点击文档中的人物标签查看记忆</div>';list.innerHTML='';freq.textContent='未选择人物';return}
  freq.textContent='系统出场频次 '+appearanceCount(p);
  card.innerHTML='<div class="memory-person-card"><b>'+esc2(legacy(p)+classLabel(p)+' · '+pnm(p))+'</b><small>'+esc2(p.age||'--')+'岁 · '+esc2(p.account?.status||'--')+' · '+(pVip(p)?esc2(p.vip?.level||'VIP'):'非VIP')+'</small><p style="margin:8px 0 0">'+esc2(p.personality?.summary||'暂无性格描述')+'</p></div>';
  const rows=memoryRows(p);list.innerHTML=rows.map(x=>'<div class="memory-row"><b>'+esc2(x.date)+' · '+esc2(x.title)+'</b><small>'+esc2(x.type||'记忆')+'</small><p>'+esc2(x.detail||'')+'</p></div>').join('')||'<div class="empty">暂无历史记忆</div>';
}
function saveRichDoc(){
  const d=getDoc();if(!d)return;const editor=E('richEditor'),plain=plainTextFromEditor(),statements=personStatementRows(plain),issues=allIssues(statements);
  if(issues.length){
    const ok=confirm('保存前发现人物逻辑/塑造风险：\n\n'+issueMessage(issues)+'\n\n仍要保存这份文档吗？');
    if(!ok){E('richDocStatus').textContent='已取消保存，请根据提示修改';return false}
  }
  d.title=E('richDocTitle').value.trim()||'未命名文档';d.html=editor.innerHTML;d.content=plain;d.updated=today2();
  statements.forEach(x=>{
    const key='docmem-'+d.id+'-'+x.p.id+'-'+hashText(x.content),exists=db.records.some(r=>r.id===key);
    if(!exists)db.records.push({id:key,personId:x.p.id,date:today2(),type:'发言记录',title:'文档记忆 · '+d.title,content:x.content,topics:['文档记忆']});
  });
  save();renderRichDocs();if(currentMentionPersonId)renderMemory(currentMentionPersonId);E('richDocStatus').textContent='已保存并同步人物记忆 · '+plain.length+' 字';toast('文档已保存，人物记忆已更新');return true
}

/* Minimal valid DOCX export using OOXML ZIP store method. */
function crc32(bytes){
  let c=-1;for(let i=0;i<bytes.length;i++){c^=bytes[i];for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xEDB88320:0)}return(c^-1)>>>0
}
function u16(n){return[n&255,(n>>>8)&255]}
function u32(n){return[n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]}
function concatBytes(parts){const len=parts.reduce((s,x)=>s+x.length,0),o=new Uint8Array(len);let p=0;for(const x of parts){o.set(x,p);p+=x.length}return o}
function zipStore(files){
  const enc=new TextEncoder(),locals=[],centrals=[];let offset=0;
  files.forEach(f=>{
    const name=enc.encode(f.name),data=typeof f.data==='string'?enc.encode(f.data):f.data,crc=crc32(data);
    const local=new Uint8Array([...u32(0x04034b50),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...name]);
    locals.push(local,data);
    const central=new Uint8Array([...u32(0x02014b50),...u16(20),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset),...name]);
    centrals.push(central);offset+=local.length+data.length;
  });
  const centralBytes=concatBytes(centrals),end=new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(centralBytes.length),...u32(offset),...u16(0)]);
  return concatBytes([...locals,centralBytes,end]);
}
function xmlText(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function exportDocx(){
  const d=getDoc();if(!d)return;if(saveRichDoc()===false)return;
  const paras=plainTextFromEditor().split(/\n/),body=paras.map(p=>'<w:p><w:r><w:t xml:space="preserve">'+xmlText(p)+'</w:t></w:r></w:p>').join('');
  const files=[
    {name:'[Content_Types].xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'},
    {name:'_rels/.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'},
    {name:'word/document.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+body+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>'}
  ];
  const blob=new Blob([zipStore(files)],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(d.title||'文档')+'.docx';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('DOCX 已导出');
}

setupNovel();
})();