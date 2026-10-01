/* Local-only visual acceptance. Exercise the login form against synthetic cloud responses. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
async function settle(page){
 await page.evaluate(async()=>{await Promise.all(document.getAnimations().filter(a=>a.effect.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})))});
}
async function workspaceVisuals(browser,url){
 assert.equal(new URL(url).hostname,'127.0.0.1','mock cloud responses must stay local');
 const people=JSON.parse(fs.readFileSync('data/people.json','utf8')).people;
 for(const reducedMotion of ['no-preference','reduce']){
  const context=await browser.newContext({viewport:{width:1440,height:960},reducedMotion});
  const calls=[];
  await context.route('**/functions/v1/workspace-cloud',async route=>{
   const request=route.request().postDataJSON();calls.push(request.action);
   assert(['login','load'].includes(request.action),'visual tests may not modify cloud data');
   const body=request.action==='login'?{ok:true,token:'local-visual-session',account:{username:'e2e_local_visual'}}:
    {ok:true,version:1,payload:{people,records:[],docs:[],dailyDocs:{},customGroups:[],meta:{},portfolio:{},tradeSim:{}}};
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
  });
  try{
   const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url+'?theme=night');
   if(reducedMotion==='no-preference')await page.locator('#skipIntro').click();
   await page.locator('#loginForm').waitFor({state:'visible'});
   if(reducedMotion==='reduce'){
    const effects=await page.evaluate(()=>{
     const c=document.querySelector('.auth-cinematic'),s=document.querySelector('.cinematic-shade');
     return {beam:getComputedStyle(c,'::before').animationName,dust:getComputedStyle(c,'::after').animationName,
      bars:getComputedStyle(s,'::after').animationName,blur:getComputedStyle(c).filter};
    });
    assert.deepEqual(effects,{beam:'none',dust:'none',bars:'none',blur:'none'});
   }
   await page.locator('#loginUser').fill('e2e_local_visual');
   await page.locator('#loginPassword').fill('local-fixture-password');
   await page.locator('#loginForm button[type=submit]').click();
   await page.locator('.app.app-ready').waitFor({state:'visible'});
   const animation=await page.locator('.sidebar').evaluate(e=>getComputedStyle(e).animationName);
   assert.equal(animation,reducedMotion==='reduce'?'none':'cnSidebarEnter');
   assert.equal(await page.locator('.app').evaluate(e=>getComputedStyle(e).transform),'none');
   await settle(page);
   for(const theme of ['night','warm','blue']){
    await page.locator('.theme-dock [data-theme-button="'+theme+'"]').click();
    await page.waitForFunction(t=>document.documentElement.dataset.theme===t,theme);
    await page.waitForFunction(()=>!document.documentElement.classList.contains('theme-fade-in')&&!document.documentElement.classList.contains('theme-fade-out'));
    await settle(page);
    assert.match(await page.locator('.sidebar').evaluate(e=>getComputedStyle(e).backdropFilter),/blur/);
    const ratios=await page.evaluate(()=>{
     const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
     const ctx=canvas.getContext('2d',{willReadFrequently:true});
     const lum=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4}).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0)};
     return ['.metric .label','.metric strong','.metric .trend'].map(selector=>{
      const el=document.querySelector(selector),s=getComputedStyle(el),fg=lum(s.color);
      const ratios=['--paper','--accent-soft'].map(token=>{const bg=lum(s.getPropertyValue(token));return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)});
      return {selector,ratio:Math.min(...ratios)};
     });
    });
    for(const r of ratios)assert(r.ratio>=4.5,theme+' '+r.selector+' contrast '+r.ratio);
    fs.mkdirSync('evidence',{recursive:true});
    if(reducedMotion==='no-preference')await page.screenshot({path:'evidence/workspace-'+theme+'.png'});
   }
   for(const width of [375,390,414,430,768,1366,1440,1920]){
    await page.setViewportSize({width,height:960});await settle(page);
    const layout=await page.evaluate(()=>({width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth,
     side:document.querySelector('.sidebar').getBoundingClientRect().toJSON(),header:document.querySelector('.app-global-header').getBoundingClientRect().toJSON()}));
    assert(layout.scroll<=width+1,'workspace overflow '+width);
    if(width<=760){assert(Math.abs(layout.side.bottom-layout.height)<2,'bottom nav not fixed to viewport');assert(Math.abs(layout.header.top)<2,'header not fixed to viewport')}
   }
   await page.setViewportSize({width:390,height:844});
   for(const id of ['overview','people','groups','records','novel','topics','tradeRecommend','holdingsV2']){
    await page.locator('.nav [data-page="'+id+'"]').click();
    await page.locator('#'+id+'.active').waitFor({state:'visible'});await settle(page);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile page overflow '+id);
   }
   if(reducedMotion==='no-preference')await page.screenshot({path:'evidence/workspace-mobile.png'});
   assert.deepEqual(calls,['login','load']);assert.deepEqual(errors,[]);
   console.log('PASS workspace glass, entry motion, themes and fixed mobile navigation ('+reducedMotion+')');
  }finally{await context.close()}
 }
}
module.exports={workspaceVisuals};
