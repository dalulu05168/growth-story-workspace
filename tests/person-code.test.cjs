const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const acorn=require('acorn');
test('C.01–C.70 aliases resolve existing people without breaking data references',()=>{
 const people=JSON.parse(fs.readFileSync('data/people.json')).people;
 const src=fs.readFileSync('workspace-core.js','utf8'),ast=acorn.parse(src,{ecmaVersion:'latest'});
 const functions=ast.body.filter(n=>n.type==='FunctionDeclaration'&&['person','pCode'].includes(n.id.name)).map(n=>src.slice(n.start,n.end)).join('\n');
 const ctx={db:{people}};vm.createContext(ctx);vm.runInContext(functions,ctx);
 for(let i=0;i<70;i++){const code='C.'+String(i+1).padStart(2,'0');assert.equal(ctx.pCode(people[i]),code);assert.equal(ctx.person(code),people[i]);assert.equal(ctx.person(people[i].id),people[i]);assert.equal(people[i].display_id,code)}
 assert.equal(new Set(people.map(ctx.pCode)).size,70);assert.equal(ctx.person('C.71'),null);
 const formal=JSON.parse(fs.readFileSync('data/72人物整合汇总.json')).profiles;
 for(const p of people){const source=formal.find(x=>x.character_id===p.character_id);assert.equal(p.gender,source.gender==='female'?'女':'男');assert.equal(p.customer_relation.type_code,source.member_type.toUpperCase());assert.equal(p.account.opened,source.account_opened);assert.equal(p.vip.is_vip,source.vip)}
});
