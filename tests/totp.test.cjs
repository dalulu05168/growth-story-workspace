// RFC 6238 SHA-1 vectors, reduced to the six digits used by this application.
const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');const {webcrypto}=require('node:crypto');
for(const [time,expected] of [[59,'287082'],[1111111109,'081804'],[1111111111,'050471'],[1234567890,'005924'],[2000000000,'279037'],[20000000000,'353130']]){
 test(`TOTP RFC vector at ${time}`,async()=>{
  const ctx={crypto:webcrypto,TextEncoder,Date:{now:()=>time*1000},atob,btoa};vm.createContext(ctx);
  const source=fs.readFileSync('trade-dashboard.js','utf8').replace(/\nboot\(\);\n/, '\nglobalThis.api={totp,verifyTotp};\n');vm.runInContext(source,ctx);
  const secret='GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';assert.equal(await ctx.api.totp(secret),expected);assert.equal(await ctx.api.verifyTotp(secret,'not-a-code'),false);
 });
}
