const assert=require('node:assert/strict');const fs=require('node:fs');
async function sceneVisuals(browser,url){
 assert.equal(new URL(url).hostname,'127.0.0.1');
 for(const reducedMotion of ['no-preference','reduce']){
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion});
  const people=JSON.parse(fs.readFileSync('data/people.json')).people;
  await context.route('**/functions/v1/workspace-cloud',route=>{const r=route.request().postDataJSON();assert(['login','load'].includes(r.action));return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(r.action==='login'?{ok:true,token:'local-scene-session',account:{username:'e2e_local_scene'}}:{ok:true,version:1,payload:{people,records:[],docs:[],dailyDocs:{},customGroups:[],meta:{},portfolio:{},tradeSim:{}}})})});
  try{
   const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url);await p.waitForFunction(()=>document.querySelector('#authRoot')?.dataset.introPhase==='login-ready');await p.evaluate(async()=>{await Promise.all(document.getAnimations().filter(a=>a.effect.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})))});
   await p.waitForFunction(()=>['webgl','canvas2d'].includes(document.querySelector('#authRoot').dataset.sceneRenderer));
   const getTransforms=()=>p.evaluate(()=>['.scene-brush','.scene-coin'].map(s=>getComputedStyle(document.querySelector(s)).transform));
   const first=await getTransforms(),lakeA=await p.locator('.scene-lake').screenshot();await p.waitForTimeout(1000);const next=await getTransforms(),lakeB=await p.locator('.scene-lake').screenshot();
   if(reducedMotion==='no-preference'){assert.notDeepEqual(next,first,'brush and bitcoin must continue moving at login');assert.notEqual(Buffer.compare(lakeA,lakeB),0,'lake pixels must change independently of object layers')}
   else{assert.deepEqual(next,first);assert.equal(Buffer.compare(lakeA,lakeB),0,'reduced motion must freeze lake pixels')}
   await p.locator('#loginUser').fill('e2e_local_scene');await p.locator('#loginPassword').fill('fixture');await p.locator('#loginForm button[type=submit]').click();await p.locator('#authRoot').waitFor({state:'hidden'});assert.equal(await p.locator('#authRoot').getAttribute('data-scene-state'),'disposed');
   await p.locator('.nav [data-page=people]').click();assert.equal(await p.locator('.people-data-table tbody tr:first-child td:first-child').innerText(),'C.01');assert.equal(await p.locator('.people-data-table .person-portrait').count(),70);
   await p.locator('[data-open-person="FR0001"]').click();await p.locator('#personDetailPage.active').waitFor({state:'visible'});assert.match(await p.locator('#personDetailContent .sub').innerText(),/^C\.01/);
   const colors=await p.locator('.detail-line b').first().evaluate(e=>({color:getComputedStyle(e).color,bg:getComputedStyle(e.parentElement).backgroundColor}));assert.equal(colors.color,'rgb(237, 242, 248)');assert.equal(colors.bg,'rgb(16, 23, 34)');
   await p.locator('.nav [data-page=novel]').click();await p.locator('#speechRanking [data-sp="FR0001"]').click();assert.match(await p.locator('#memoryPerson').innerText(),/Claire Dubois/);assert.match(await p.locator('#speechRanking').innerText(),/C\.01/);
   assert.deepEqual(errors,[]);console.log('PASS independent lake, brush, coin, scene disposal, avatars, profile and writing ('+reducedMotion+')');
  }finally{await context.close()}
 }
}
module.exports={sceneVisuals};
