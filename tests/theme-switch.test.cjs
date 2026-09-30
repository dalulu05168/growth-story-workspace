const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const vm=require('node:vm');
const {chromium}=require('playwright');
const browserAvailable=fs.existsSync(chromium.executablePath());

const root=path.resolve(__dirname,'..');
const html=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0}.app{display:flex;min-height:100vh}.sidebar{position:fixed;inset:0 auto 0 0;width:212px}.main{margin-left:212px;width:calc(100% - 212px);padding:0 28px}.section{display:block}.auth-root{position:fixed;inset:0;z-index:9999;display:grid;place-items:center}.auth-root.hidden{display:none!important}.auth-root #authStage{width:100%;display:grid;place-items:center}</style></head><body><div class="app app-ready"><aside class="sidebar"><div class="brand"></div><nav class="nav"><button data-page="overview"><i>⌂</i><span>概览</span></button></nav><div class="side-note"></div></aside><main class="main"><section class="section" id="overview"></section></main></div><script src="/theme-system.js"></script><script src="/auth.js"></script><script src="/ui-shell.js"></script><script src="/theme-ui.js"></script></body></html>`;

test('theme state shares the selected value and removes the QA override on a user choice',()=>{
  const prefs={"chennan-theme":"modern"};
  const pickers=[{value:''},{value:''}];
  const handlers={};const dispatched=[];const replaced=[];
  const document={documentElement:{dataset:{}},querySelectorAll:()=>pickers,addEventListener:(name,fn)=>{handlers[name]=fn},dispatchEvent:event=>dispatched.push(event)};
  const context={document,location:{search:'?theme=ink&view=writing',href:'https://example.test/?theme=ink&view=writing'},history:{replaceState:(...args)=>replaced.push(args)},localStorage:{getItem:key=>prefs[key]||null,setItem:(key,value)=>prefs[key]=value},URL,URLSearchParams,CustomEvent:function(type,init){this.type=type;this.detail=init.detail},window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'theme-system.js'),'utf8'),context);
  assert.equal(document.documentElement.dataset.theme,'ink','valid QA query should take precedence at load');
  assert.deepEqual(pickers.map(p=>p.value),['ink','ink']);
  handlers.change({target:{value:'dark',matches:()=>true}});
  assert.equal(document.documentElement.dataset.theme,'dark');
  assert.equal(prefs['chennan-theme'],'dark');
  assert.deepEqual(pickers.map(p=>p.value),['dark','dark']);
  assert.equal(new URL(replaced[0][2],'https://example.test').search,'?view=writing','changing theme clears only the QA override');
  assert.equal(dispatched.at(-1).detail.theme,'dark');
});

test('login theme switcher covers ink/modern/dark, honors reduced motion, and persists',{skip:browserAvailable?false:'Playwright Chromium is not installed in this workspace'},async()=>{
  const server=http.createServer((req,res)=>{
    const name=path.basename(new URL(req.url,'http://local').pathname);
    if(name==='') {res.writeHead(200,{'content-type':'text/html'});return res.end(html)}
    if(['theme-system.js','auth.js','ui-shell.js','theme-ui.js'].includes(name)){res.writeHead(200,{'content-type':'text/javascript'});return res.end(fs.readFileSync(path.join(root,name)))}
    res.writeHead(404);res.end('not found');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true});
    const page=await browser.newPage({viewport:{width:1440,height:810}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    const url='http://127.0.0.1:'+server.address().port;
    await page.goto(url,{waitUntil:'networkidle'});
    await page.locator('#loginForm').waitFor({state:'visible'});
    const loginPicker=page.locator('.auth-theme-control [data-theme-switcher]');
    assert.equal(await loginPicker.locator('option').count(),3);
    assert.equal(await loginPicker.inputValue(),'ink');
    assert.equal(await page.locator('#loginForm input').count(),2);
    assert.equal(await page.locator('#loginForm input[name=user]').inputValue(),'');
    for(const [theme,accent] of [['modern','#6687a7'],['dark','#d3af70'],['ink','#977342']]){
      await loginPicker.selectOption(theme);
      assert.equal(await page.locator('html').getAttribute('data-theme'),theme);
      assert.equal(await page.locator('.app-global-header [data-theme-switcher]').inputValue(),theme);
      const style=await page.evaluate(()=>({bg:getComputedStyle(document.body).backgroundColor,accent:getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()}));
      assert.equal(style.accent,accent,theme+' must apply its own design tokens');
      assert.notEqual(style.bg,'rgba(0, 0, 0, 0)',theme+' must set a page background');
    }
    assert.equal(await page.locator('.brand-brush .brush-stroke').count(),16,'辰南 brand must render individual animated strokes');
    await loginPicker.selectOption('dark');
    await page.reload({waitUntil:'networkidle'});
    await page.locator('#loginForm').waitFor({state:'visible'});
    assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    assert.equal(await page.locator('.auth-theme-control [data-theme-switcher]').inputValue(),'dark');
    assert.equal(await page.locator('#loginForm input[name=password]').inputValue(),'');
    for(const [width,height] of [[1366,768],[1440,810],[1920,1080]]){
      await page.setViewportSize({width,height});
      const box=await page.locator('.login-shell').boundingBox();
      assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=width&&box.y+box.height<=height,`desktop login panel outside ${width}x${height}: ${JSON.stringify(box)}`);
      assert.ok(box.width/box.height>1.6,`desktop layout should preserve a wide cinematic composition at ${width}x${height}`);
    }
    for(const width of [375,390,414,430]){
      await page.setViewportSize({width,height:844});
      const box=await page.locator('.login-shell').boundingBox();
      const dims=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,hero:getComputedStyle(document.querySelector('.login-hero')).display}));
      assert.ok(box.x>=0&&box.x+box.width<=width,`login panel outside ${width}px viewport: ${JSON.stringify(box)}`);
      assert.ok(dims.scroll<=width,`horizontal overflow at ${width}px: ${JSON.stringify(dims)}`);
      assert.equal(dims.hero,'none','mobile login should use its dedicated single-column layout');
    }
    await page.emulateMedia({reducedMotion:'reduce'});
    const motion=await page.locator('.brand-brush .brush-stroke').first().evaluate(el=>({duration:getComputedStyle(el).animationDuration,dash:getComputedStyle(el).strokeDashoffset}));
    assert.equal(motion.duration,'1e-05s');
    assert.deepEqual(errors,[]);
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
});
