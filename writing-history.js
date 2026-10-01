/* Bounded document revisions; no account tokens or passwords enter a backup. */
(function(root){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const equal=(a,b)=>a?.title===b?.title&&a?.content===b?.content&&a?.html===b?.html;
function checkpoint(store,date,doc,reason='自动版本',now=Date.now()){
 if(!doc||(!doc.content&&!doc.title))return false;
 store.documentHistory=store.documentHistory||{};
 const list=store.documentHistory[date]||(store.documentHistory[date]=[]);
 if(list.some(x=>equal(x.document,doc)))return false;
 if(reason==='自动版本'&&list.length&&now-Date.parse(list[0].createdAt)<60000)return false;
 list.unshift({id:globalThis.crypto?.randomUUID?.()||now+'-'+Math.random(),createdAt:new Date(now).toISOString(),reason,document:clone(doc)});
 list.splice(20);
 // Keep the newest revisions within a 1.2 MB history budget, below cloud payload limits.
 while(JSON.stringify(store.documentHistory).length>1200000){
  const dates=Object.keys(store.documentHistory).filter(k=>store.documentHistory[k].length);
  if(!dates.length)break;
  dates.sort((a,b)=>Date.parse(store.documentHistory[a].at(-1).createdAt)-Date.parse(store.documentHistory[b].at(-1).createdAt));
  store.documentHistory[dates[0]].pop();
 }
 return true;
}
function compare(before,after){
 const a=String(before||'').split('\n'),b=String(after||'').split('\n');let start=0;
 while(start<a.length&&start<b.length&&a[start]===b[start])start++;
 let end=0;while(end<a.length-start&&end<b.length-start&&a[a.length-1-end]===b[b.length-1-end])end++;
 return {unchanged:start,removed:a.slice(start,a.length-end).join('\n'),added:b.slice(start,b.length-end).join('\n')};
}
function validateBackup(raw){
 const p=raw?.format==='chennan-workspace-backup'?raw.payload:raw?.payload||raw;
 if(!p||typeof p!=='object'||Array.isArray(p)||!Array.isArray(p.people)||!Array.isArray(p.records)||!p.dailyDocs||typeof p.dailyDocs!=='object'||Array.isArray(p.dailyDocs))throw new Error('备份格式不完整：需要人物、记录和每日文档');
 if(JSON.stringify(p).length>5500000)throw new Error('备份超过 5.5 MB，请先整理历史版本');
 if(p.people.some(x=>!x||typeof x.id!=='string')||new Set(p.people.map(x=>x.id)).size!==p.people.length)throw new Error('人物编号缺失或重复');
 if(p.records.some(x=>!x||typeof x.personId!=='string'||!p.people.some(y=>y.id===x.personId)))throw new Error('记录引用了不存在的人物');
 for(const [date,doc] of Object.entries(p.dailyDocs))if(!/^\d{4}-\d{2}-\d{2}(?:-\d+)?$/.test(date)||!doc||typeof doc!=='object'||typeof doc.content!=='string'||typeof doc.html!=='string')throw new Error('每日文档格式错误');
 const copy=clone(p);delete copy.token;delete copy.password;delete copy.session;return copy;
}
const api={checkpoint,compare,validateBackup,equal};if(typeof module!=='undefined')module.exports=api;else root.ChenNanWritingHistory=api;
})(typeof window==='undefined'?globalThis:window);
