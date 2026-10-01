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
    assert.equal(await page.locator('.cinematic-brand').evaluate(e=>getComputedStyle(e).filter),'none');
   }
   for(const [width,height] of [[852,393],[932,430]]){
    await page.setViewportSize({width,height});
    const button=page.locator('#loginForm button[type=submit]');
    await button.scrollIntoViewIfNeeded();
    const bounds=await button.boundingBox();
    assert(bounds.y>=0&&bounds.y+bounds.height<=height+1,'landscape login submit must remain reachable');
    await page.locator('#loginUser').scrollIntoViewIfNeeded();
    assert(await page.locator('#loginUser').isVisible(),'landscape login input must remain reachable');
   }
   await page.setViewportSize({width:1440,height:960});
   await page.locator('#loginUser').fill('e2e_local_visual');
   await page.locator('#loginPassword').fill('local-fixture-password');
   await page.locator('#loginForm button[type=submit]').click();
   await page.locator('.app.app-ready').waitFor({state:'visible'});
   const animation=await page.locator('.sidebar').evaluate(e=>getComputedStyle(e).animationName);
   assert.equal(animation,reducedMotion==='reduce'?'none':'cnSidebarEnter');
   assert.equal(await page.locator('.app').evaluate(e=>getComputedStyle(e).transform),'none');
   await settle(page);
   for(const theme of ['night']){
    assert.equal(await page.locator('[data-theme-button]').count(),0);
    await page.waitForFunction(t=>document.documentElement.dataset.theme===t,theme);
    await page.waitForFunction(()=>!document.documentElement.classList.contains('theme-fade-in')&&!document.documentElement.classList.contains('theme-fade-out'));
    await settle(page);
    assert.match(await page.locator('.sidebar').evaluate(e=>getComputedStyle(e).backdropFilter),/blur/);
    const ratios=await page.evaluate(()=>{
     const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
     const ctx=canvas.getContext('2d',{willReadFrequently:true});
     const lum=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4}).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0)};
     const result=['.metric .label','.metric strong','.metric .trend'].map(selector=>{
      const el=document.querySelector(selector),s=getComputedStyle(el),fg=lum(s.color);
      const ratios=['--paper','--accent-soft'].map(token=>{const bg=lum(s.getPropertyValue(token));return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)});
      return {selector,ratio:Math.min(...ratios)};
     });
     for(const selector of ['tr.is-vip .table-name','tr.relation-old:not(.is-vip) .table-name','tr.relation-new:not(.is-vip) .table-name']){
      const el=document.querySelector('.people-data-table '+selector);
      const fg=lum(getComputedStyle(el).color);let parent=el.closest('td');
      while(parent&&getComputedStyle(parent).backgroundColor==='rgba(0, 0, 0, 0)')parent=parent.parentElement;
      const bg=lum(getComputedStyle(parent).backgroundColor);
      result.push({selector,ratio:(Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)});
     }
     return result;
    });
    for(const r of ratios)assert(r.ratio>=4.5,theme+' '+r.selector+' contrast '+r.ratio);
    fs.mkdirSync('evidence',{recursive:true});
    if(reducedMotion==='no-preference')await page.screenshot({path:'evidence/workspace-'+theme+'.png'});
   }
   for(const width of [375,390,414,430,768,1366,1440,1920]){
    await page.setViewportSize({width,height:960});await settle(page);
    const layout=await page.evaluate(()=>({width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth,
     frame:document.querySelector('.app').getBoundingClientRect().toJSON(),side:document.querySelector('.sidebar').getBoundingClientRect().toJSON(),header:document.querySelector('.app-global-header').getBoundingClientRect().toJSON()}));
    assert(layout.scroll<=width+1,'workspace overflow '+width);
    if(width>900){assert(Math.abs(layout.frame.width/layout.frame.height-16/9)<.01,'desktop frame must be 16:9');assert(layout.frame.left>=0&&layout.frame.right<=width+1,'frame fits viewport');assert(layout.frame.top>=0&&layout.frame.bottom<=layout.height+1,'frame height fits viewport')}
    if(width<=760){assert(Math.abs(layout.side.bottom-layout.height)<2,'bottom nav not fixed to viewport');assert(Math.abs(layout.header.top)<2,'header not fixed to viewport')}
   }
   await page.setViewportSize({width:390,height:844});
   for(const id of ['overview','people','groups','records','novel','topics','tradeRecommend','holdingsV2']){
    await page.locator('.nav [data-page="'+id+'"]').click();
    await page.locator('#'+id+'.active').waitFor({state:'visible'});await settle(page);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile page overflow '+id);
   }
   for(const [width,height] of [[667,375],[852,393],[932,430],[1024,600],[1280,540]]){
    await page.setViewportSize({width,height});
    await page.locator('.nav [data-page="people"]').click();
    await page.locator('#people.active').waitFor({state:'visible'});await settle(page);
    const layout=await page.evaluate(()=>{
     const rect=e=>e.getBoundingClientRect().toJSON(),header=document.querySelector('.app-global-header');
     const title=document.querySelector(innerWidth>900?'.cn-brand-image':'.cn-header-logo'),host=document.querySelector('#peopleList'),wrap=host.querySelector('.people-table-wrap');
     return {title:rect(title),header:rect(header),host:rect(host),wrap:rect(wrap),
      mainWidth:document.querySelector('.main').getBoundingClientRect().width,frame:rect(document.querySelector('.app')),scroll:document.documentElement.scrollWidth,width:innerWidth,
      tableWidth:wrap.scrollWidth,tableViewport:wrap.clientWidth};
    });
    assert(layout.scroll<=width+1,'landscape page overflow '+width);
    assert(layout.wrap.width>=layout.host.width-2,'table must fill the people panel '+width);
    assert(layout.wrap.width>=layout.mainWidth*.75,'table viewport too narrow '+width);
    assert(layout.title.right<=layout.frame.right&&layout.title.left>=layout.frame.left,'brand outside workspace '+width);
    assert(layout.tableWidth>layout.tableViewport,'wide table must scroll inside its container');
    const initial=await page.locator('.people-table-wrap').evaluate(e=>e.scrollLeft);
    await page.locator('.people-table-wrap').evaluate(e=>{e.scrollLeft=e.scrollWidth});
    assert(await page.locator('.people-table-wrap').evaluate(e=>e.scrollLeft)>initial,'table columns must be reachable');
    await page.locator('.people-table-wrap').evaluate(e=>{e.scrollLeft=0});
    if(reducedMotion==='no-preference'&&width===852){
     await page.locator('.people-table-wrap').scrollIntoViewIfNeeded();
     await page.mouse.move(width-1,height-1);
     await page.screenshot({path:'evidence/people-landscape.png'});
    }
   }
   if(reducedMotion==='no-preference')await page.screenshot({path:'evidence/workspace-mobile.png'});
   assert.deepEqual(calls,['login','load']);assert.deepEqual(errors,[]);
   console.log('PASS workspace glass, entry motion, themes and fixed mobile navigation ('+reducedMotion+')');
  }finally{await context.close()}
 }
}
module.exports={workspaceVisuals};
