const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {rejectedLogin}=require('./public-login.cjs');
const {verifyRelease}=require('../scripts/verify-release.cjs');
const root=path.resolve('dist/pages');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.json':'application/json'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.writeHead(404);res.end();return;
  }
  res.setHeader('Content-Type',mime[path.extname(file)]||'text/plain');
  res.end(fs.readFileSync(file));
});
async function run(){
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+server.address().port+'/';
  let browser;
  try{
    const release=await verifyRelease(url);assert(release.files>=18);
    assert(!fs.existsSync(path.join(root,'supabase')),'server source must not be published');
    browser=await chromium.launch({headless:true});
    const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    let mode='reject',loginRequests=0;
    await context.route('**/functions/v1/workspace-cloud',async route=>{
      assert.equal(route.request().postDataJSON().action,'login','tests must never access business data');
      loginRequests++;
      if(mode==='hang')return;
      await route.fulfill({status:401,contentType:'application/json',body:JSON.stringify({ok:false,error:'账号或密码错误'})});
    });
    const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url+'?theme=warm');
    await page.locator('#loginForm').waitFor({state:'visible',timeout:7000});
    assert.equal(await page.locator('#authRoot').getAttribute('data-intro-phase'),'login-ready');
    await rejectedLogin(page);assert.equal(loginRequests,1);
    console.log('PASS rejected login submits exactly once and keeps the workspace locked');
    await page.getByRole('button',{name:'通透蓝白',exact:true}).click();
    assert.equal(await page.locator('html').getAttribute('data-theme'),'blue');
    await page.goto(url);
    await page.locator('#loginForm').waitFor({state:'visible'});
    assert.equal(await page.locator('html').getAttribute('data-theme'),'blue');
    console.log('PASS manual theme survives a fresh navigation without query parameters');
    for(const width of [375,390,414,430,1366,1440,1920]){
      await page.setViewportSize({width,height:900});
      const size=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
      assert(size.scroll<=size.width+1,'login horizontal overflow at '+width);
    }
    console.log('PASS login layout at seven desktop/mobile widths');
    mode='hang';
    await page.locator('#loginForm [name=user]').fill('__timeout_check__');
    await page.locator('#loginForm [name=password]').fill('invalid-credential');
    await page.locator('#loginForm button[type=submit]').click();
    await page.waitForFunction(()=>document.querySelector('#authError')?.textContent.includes('超时'),null,{timeout:19000});
    assert.equal(await page.locator('#loginForm button[type=submit]').isEnabled(),true);
    assert.equal(loginRequests,2,'requests must not be retried automatically');
    console.log('PASS stalled login times out and allows an explicit retry');
    mode='reject';await rejectedLogin(page);assert.equal(loginRequests,3);
    assert.deepEqual(errors,[]);
    await context.close();

    const normal=await browser.newContext({reducedMotion:'no-preference'});
    const motion=await normal.newPage();
    await motion.addInitScript(()=>{
      window.introResults=[];
      document.addEventListener('chennan:intro-complete',e=>window.introResults.push(e.detail.source));
    });
    await motion.goto(url);
    await motion.getByRole('button',{name:'跳过动画',exact:true}).click();
    await motion.locator('#loginForm').waitFor({state:'visible',timeout:4000});
    assert.deepEqual(await motion.evaluate(()=>window.introResults),['user-skip']);
    assert.equal(await motion.locator('#skipIntro').count(),0);
    console.log('PASS skip animation releases login exactly once');
    await motion.getByRole('button',{name:'通透蓝白',exact:true}).click();
    await motion.getByRole('button',{name:'星空金黑',exact:true}).click();
    await motion.waitForTimeout(500);
    assert.equal(await motion.locator('html').getAttribute('data-theme'),'night');
    assert.equal(await motion.evaluate(()=>localStorage.getItem('chennan-theme-manual')),'night');
    console.log('PASS reverting a pending theme transition keeps the latest choice');
    fs.mkdirSync('evidence',{recursive:true});
    await motion.screenshot({path:'evidence/repaired-login.png'});
    await normal.close();

    const unavailable=await browser.newContext({reducedMotion:'reduce'});
    await unavailable.route('**/cloud-sync.js*',route=>route.abort());
    const missing=await unavailable.newPage();await missing.goto(url);
    await missing.locator('#loginForm').waitFor({state:'visible',timeout:8000});
    assert.match(await missing.locator('#authError').innerText(),/登录服务未加载/);
    console.log('PASS missing cloud runtime shows an actionable login error');
    await unavailable.close();
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
}
run().catch(e=>{console.error(e);process.exitCode=1});
