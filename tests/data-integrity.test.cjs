const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const index=fs.readFileSync('index.html','utf8');
const deletion=index.slice(index.indexOf('function deletePerson('),index.indexOf('function openSystemGroup('));
for(const kind of ['records','holdings','buyPlans','recommendations','docs','none'])test('person deletion protects '+kind,()=>{
 const db={people:[{id:'p1'}],records:[],customGroups:[{members:['p1']}],portfolio:{holdings:[],buyPlans:[]},tradeSim:{recommendations:[]},docs:[]};
 if(kind==='records')db.records.push({personId:'p1'});
 if(['holdings','buyPlans'].includes(kind))db.portfolio[kind].push({personId:'p1'});
 if(kind==='recommendations')db.tradeSim.recommendations.push({candidates:[{personId:'p1'}]});
 if(kind==='docs')db.docs.push({html:'<span data-person="p1">Test</span>'});
 const ctx={db,person:()=>db.people[0],pName:()=> 'Test',confirm:()=>true,save(){},render(){},toast(){}};vm.createContext(ctx);vm.runInContext(deletion+"deletePerson('p1')",ctx);
 assert.equal(db.people.length,kind==='none'?0:1);assert.equal(db.customGroups[0].members.length,kind==='none'?0:1);
});
for(const name of ['createDoc2','renameDoc2'])test(name+' preserves unsaved content when discard declined',()=>{
 const source=fs.readFileSync('document-workspace.js','utf8').replace('setupNovel();','globalThis.api={createDoc2,renameDoc2};');
 const db={docs:[{id:'d1',title:'Original'}]};const ctx={db,selectedDocId:'d1',document:{getElementById:()=>({textContent:'文档有未保存修改'})},confirm:()=>false};vm.createContext(ctx);vm.runInContext(source,ctx);ctx.api[name]();assert.equal(db.docs.length,1);assert.equal(db.docs[0].title,'Original');assert.equal(ctx.selectedDocId,'d1');
});
