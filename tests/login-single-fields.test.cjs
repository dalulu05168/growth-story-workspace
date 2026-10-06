const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('login renders exactly one account field and one password field',()=>{
  const src=fs.readFileSync('auth.js','utf8');
  assert.equal((src.match(/<input id="loginUser"/g)||[]).length,1);
  assert.equal((src.match(/<input id="loginPassword"/g)||[]).length,1);
  assert.match(src,/if\(document\.getElementById\('authRoot'\)\)return/);
  assert.match(src,/function enforceSingleLoginFields\(stage\)/);
});
