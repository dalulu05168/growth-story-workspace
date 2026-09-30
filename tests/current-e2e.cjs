/* Current production acceptance: real browser + isolated cloud account. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');

const URL=process.env.E2E_URL||'https://dalulu05168.github.io/growth-story-workspace/';
const STAGE=process.env.E2E_STAGE||'memory';
const creds=JSON.parse(fs.readFileSync(process.env.E2E_CREDENTIALS||'/tmp/chennan-e2e.json'));
assert.match(creds.username,/^e2e_/,'Disposable E2E account required');

const endpoint='https://afelbznpwltuebmqmqbh.supabase.co/functions/v1/workspace-cloud';
const key='sb_publishable_J548-tZcZAxnUF4HD-VPEA_Gepy26Ec';
let token='';

async function deploymentHash(){
  const files=['theme-system.js','auth.js','workspace-core.js','cloud-sync.js','trade-dashboard.js','people-detail.js','trading-simulator.js','document-workspace.js','ui-shell.js','theme-ui.js'];
  const mismatches=[];
  for(const file of files){
    const r=await fetch(URL.replace(/\/$/,'')+'/'+file+'?hashcheck='+Date.now());
    assert.equal(r.status,200,file+' HTTP '+r.status);
    const live=await r.text();
    const liveHash=crypto.createHash('sha256').update(live).digest('hex');
    const repoHash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    if(liveHash!==repoHash)mismatches.push({file,liveHash,repoHash});
  }
  assert.deepEqual(mismatches,[]);
}


async function cloud(action,payload={}){
  const r=await fetch(endpoint,{
    method:'POST',
    headers:{'Content-Type':'application/json',apikey:key,...(token?{Authorization:'Bearer '+token}:{})},
    body:JSON.stringify({action,...payload})
  });
  const data=await r.json();
  return {status:r.status,...data};
}
async function waitCloud(predicate){
  for(let i=0;i<40;i++){
    const r=await cloud('load');
    if(r.ok&&predicate(r.payload))return r.payload;
    await new Promise(r=>setTimeout(r,300));
  }
  assert.fail('cloud state did not reach expected state');
}
async function nav(page,id){
  await page.locator('.nav button[data-page="'+id+'"]').click();
  await page.locator('#'+id+'.active').waitFor({state:'visible',timeout:10000});
}
async function login(page){
  await page.goto(URL,{waitUntil:'networkidle'});
  await page.locator('#loginForm').waitFor({state:'visible',timeout:20000});
  await page.locator('#loginForm input[name=user]').fill(creds.username);
  await page.locator('#loginForm input[name=password]').fill(creds.password);
  const response=page.waitForResponse(r=>r.url()===endpoint&&r.request().postData()?.includes('"action":"login"'));
  await page.locator('#loginForm button').click();
  const res=await response;const body=await res.json();
  assert.equal(res.status(),200);assert.equal(body.ok,true);assert.ok(body.token);
  token=body.token;
  await page.locator('#authRoot').waitFor({state:'hidden',timeout:15000});
}

async function prelogin(page){
  await page.goto(URL,{waitUntil:'networkidle'});
  await page.locator('#loginForm').waitFor({state:'visible',timeout:20000});
  assert.equal(await page.locator('.auth-theme-control [data-theme-button]').count(),3);
  for(const [theme,accent] of [['night','#d7a33e'],['warm','#9a6428'],['blue','#2289ef']]){
    await page.locator('.auth-theme-control [data-theme-button="'+theme+'"]').click();
    await page.waitForFunction(t=>document.documentElement.dataset.theme===t,theme);
    assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()),accent);
  }
  assert.equal((await page.locator('.brand-calligraphy').first().innerText()).trim(),'辰南撰写');
  assert.equal(await page.locator('.cinematic-brush').count(),1);
  assert.equal(await page.locator('.cinematic-btc').count(),1);
}
async function loginOnly(page){
  await login(page);
  await nav(page,'people');
  assert.equal(await page.locator('#peopleList tbody tr').count(),70);
}

async function memory(page){
  await login(page);
  await nav(page,'people');
  assert.equal(await page.locator('#peopleList tbody tr').count(),70);

  await page.locator('.edit-person[data-id=FR0021]').click();
  await page.locator('#modalForm [name=opened]').selectOption('1');
  await page.locator('#modalForm [name=joined]').selectOption('1');
  await page.locator('#modalForm [name=vip]').selectOption('1');
  await page.locator('#modalForm .modal-foot .primary').click();
  await page.locator('#modal').waitFor({state:'hidden'});

  const marker='E2E_MEMORY_'+Date.now();
  await nav(page,'novel');
  await page.locator('#dailyDatePicker').fill('2026-09-30');
  await page.locator('#openDate').click();
  await page.locator('#dailyEditor').fill('21：'+marker);
  await page.locator('#saveDaily').click();

  const stored=await waitCloud(d=>
    d.dailyDocs?.['2026-09-30']?.content?.includes(marker)&&
    d.records?.some(r=>r.personId==='FR0021'&&r.type==='发言记录'&&r.content===marker)
  );
  assert.equal(stored.records.filter(r=>r.personId==='FR0021'&&r.type==='发言记录'&&r.content===marker).length,1);

  await page.locator('[data-sp=FR0021]').click();
  assert.match(await page.locator('#memoryTimeline').innerText(),new RegExp(marker));

  await page.reload({waitUntil:'networkidle'});
  await page.locator('#authRoot').waitFor({state:'hidden',timeout:20000});
  await nav(page,'novel');
  await page.locator('[data-sp=FR0021]').click();
  assert.match(await page.locator('#memoryTimeline').innerText(),new RegExp(marker));

  await page.locator('#dailyDatePicker').fill('2026-10-01');
  await page.locator('#openDate').click();
  await page.locator('#dailyEditor').fill('21：我从来没有开过账户');
  assert.match(await page.locator('#logicWarnings').innerText(),/开户状态冲突/);
}

async function navigation(page){
  await login(page);
  for(const id of ['overview','people','groups','records','novel','topics','tradeRecommend','holdingsV2'])await nav(page,id);
  await page.setViewportSize({width:390,height:844});
  for(const id of ['overview','people','groups','records','novel','topics','tradeRecommend','holdingsV2']){
    await nav(page,id);
    const layout=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth,side:document.querySelector('.sidebar').getBoundingClientRect().toJSON(),main:document.querySelector('.main').getBoundingClientRect().toJSON()}));
    assert(layout.scroll<=layout.viewport,'horizontal overflow '+id+' '+JSON.stringify(layout));
    assert(Math.abs(layout.side.width-layout.viewport)<=2,'bottom nav width '+id+' '+JSON.stringify(layout.side));
    assert(layout.main.left>=-1&&layout.main.right<=layout.viewport+1,'main outside viewport '+id+' '+JSON.stringify(layout.main));
  }
}

(async()=>{
  if(STAGE==='hash'){
    await deploymentHash();
    console.log(JSON.stringify({acceptance:'PASS',stage:STAGE}));
    return;
  }
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    if(STAGE==='prelogin')await prelogin(page);
    else if(STAGE==='login')await loginOnly(page);
    else if(STAGE==='navigation')await navigation(page);
    else await memory(page);
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({acceptance:'PASS',stage:STAGE}));
  }finally{await browser.close()}
})().catch(e=>{console.error('STAGE '+STAGE+' FAILED');console.error(e);process.exit(1)});
