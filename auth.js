/* Authentication boots independently of the business render pipeline. */
(function(){
'use strict';

const byId=id=>document.getElementById(id);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const INTRO_FALLBACK_MS=7600;
const CLOUD_RUNTIME_WAIT_MS=3000;

async function waitForCloudRuntime(){
  const deadline=performance.now()+CLOUD_RUNTIME_WAIT_MS;
  while(!window.ChenNanCloud&&performance.now()<deadline){
    await wait(25);
  }
  return window.ChenNanCloud||null;
}

function emitIntro(type,detail={}){
  document.dispatchEvent(new CustomEvent(type,{
    detail:{...detail,at:performance.now()}
  }));
}

// 品牌字只负责清晰显示名称；毛笔动画使用独立视觉元素，避免笔画和文字重复叠加。
function brushLogo(extraClass=''){
  return '<span class="brand-calligraphy '+extraClass+'" role="img" aria-label="辰南撰写">辰南撰写</span>';
}
window.ChenNanBrandMarkup=brushLogo;

function themeSelect(className=''){
  const current=window.ChenNanTheme?.get?.()||'night';
  const buttons=window.ChenNanTheme?.buttons?.()||[
    ['night','星空金黑'],['warm','暖光书卷'],['blue','通透蓝白']
  ].map(([id,label])=>'<button type="button" class="theme-chip '+(id===current?'active':'')+'" data-theme-button="'+id+'" aria-pressed="'+(id===current?'true':'false')+'"><span class="theme-swatch"></span><b>'+label+'</b></button>').join('');
  return '<div class="theme-control '+className+'"><span class="theme-control-label">切换主题</span><div class="theme-chip-group">'+buttons+'</div></div>';
}

function cinematicIntro(){
  return '<div class="auth-cinematic" id="authCinematic" aria-hidden="true">'
    +'<div class="cinematic-shade"></div>'
    +'<div class="cinematic-brush"></div>'
    +'<div class="cinematic-trail"></div>'
    +'<div class="cinematic-ring"></div>'
    +'<div class="cinematic-btc">₿</div>'
    +'<div class="cinematic-brand">辰南撰写<small>笔尖上的比特币</small></div>'
    +'</div>';
}

function nextPaint(){
  return new Promise(resolve=>{
    requestAnimationFrame(()=>requestAnimationFrame(resolve));
  });
}

function imageReady(src){
  return new Promise(resolve=>{
    if(!src){resolve();return}
    const img=new Image();
    let settled=false;
    const done=()=>{if(settled)return;settled=true;resolve()};
    img.onload=done;
    img.onerror=done;
    img.src=src;
    if(img.decode)img.decode().then(done,done);
  });
}

function backgroundUrls(element){
  const css=getComputedStyle(element).backgroundImage||'';
  return [...css.matchAll(/url\((?:["'])?([^"')]+)(?:["'])?\)/g)].map(match=>match[1]);
}

async function prepareIntroAssets(root){
  const jobs=[
    imageReady('./chen-nan-ink.webp'),
    ...backgroundUrls(root).map(imageReady)
  ];
  if(document.fonts?.ready)jobs.push(document.fonts.ready.catch(()=>{}));
  await Promise.race([
    Promise.allSettled(jobs),
    wait(1800)
  ]);
}

function waitForAnimation(element,animationName,timeoutMs,skip){
  return new Promise(resolve=>{
    let settled=false;
    const finish=source=>{
      if(settled)return;
      settled=true;
      clearTimeout(timer);
      element?.removeEventListener('animationend',onEnd);
      resolve(source);
    };
    const onEnd=event=>{
      if(event.target===element&&event.animationName===animationName)finish('animationend');
    };
    const timer=setTimeout(()=>finish('fallback'),timeoutMs);
    element?.addEventListener('animationend',onEnd);
    skip?.then(()=>finish('user-skip'));
  });
}

function storedSessionExists(){
  try{return Boolean(sessionStorage.getItem('chennan-cloud-session-v1'))}
  catch{return false}
}

async function runIntro(root){
  const skipButton=root.querySelector('#skipIntro');
  let skipped=false;
  const skip=new Promise(resolve=>{
    if(skipButton)skipButton.onclick=()=>{skipped=true;resolve('user-skip')};
  });
  // 已登录会话只做快速恢复，避免每次刷新都强制播放完整电影开场。
  if(storedSessionExists()){
    skipButton?.remove();
    root.dataset.introFast='true';
    root.dataset.introPhase='resume';
    root.classList.add('auth-intro-finish');
    emitIntro('chennan:intro-skip',{reason:'session-resume'});

    const cloud=await waitForCloudRuntime();
    if(!cloud){
      console.warn('CHENNAN_CLOUD_RUNTIME_TIMEOUT');
    }
    await showAuthCard();
    return;
  }

  root.dataset.introPhase='preparing';
  emitIntro('chennan:intro-preparing');

  await Promise.race([prepareIntroAssets(root),skip]);
  await nextPaint();

  if(!skipped){
    root.dataset.introPhase='playing';
    root.classList.add('auth-intro-active');
    emitIntro('chennan:intro-start');
  }

  const reduced=matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
  const source=skipped?'user-skip':reduced
    ? (await wait(40),'reduced-motion')
    : await waitForAnimation(root.querySelector('.cinematic-brand'),'cnBrand',INTRO_FALLBACK_MS,skip);

  skipButton?.remove();
  if(reduced||skipped)root.dataset.introFast='true';
  root.classList.remove('auth-intro-active');
  root.classList.add('auth-intro-finish');
  root.dataset.introPhase='complete';
  emitIntro('chennan:intro-complete',{source});

  await wait(reduced||skipped?0:260);
  await showAuthCard();
}

function injectAuth(){
  const app=document.querySelector('.app');
  if(app)app.classList.add('app-lock');

  const root=document.createElement('div');
  root.id='authRoot';
  root.className='auth-root auth-intro-running';
  root.dataset.introPhase='created';
  root.innerHTML=cinematicIntro()+'<div id="authStage" class="auth-stage auth-stage-pending"></div>';
  const skip=document.createElement('button');
  skip.id='skipIntro';skip.type='button';skip.className='intro-skip';skip.textContent='跳过动画';
  root.appendChild(skip);
  document.body.appendChild(root);

  runIntro(root).catch(error=>{
    console.error('CHENNAN_INTRO_FAILED',error);
    root.classList.remove('auth-intro-active');
    root.classList.add('auth-intro-finish');
    root.dataset.introPhase='fallback';
    root.querySelector('#skipIntro')?.remove();
    showAuthCard();
  });
}

let authCardShown=false;
async function showAuthCard(){
  if(authCardShown)return;
  authCardShown=true;

  const stage=byId('authStage');
  if(!stage)return;
  const root=byId('authRoot');

  const cloud=window.ChenNanCloud||await waitForCloudRuntime();

  if(cloud?.hasSession?.()){
    stage.innerHTML='<div class="auth-card auth-card-resume"><div class="auth-logo">'+brushLogo('brand-brush-small')+'</div><h1 class="auth-title">正在连接云端</h1><p class="auth-sub">正在同步工作区…</p><div class="auth-error" id="authError"></div></div>';
    stage.classList.remove('auth-stage-pending');
    stage.classList.add('auth-stage-visible');
    if(await cloud.resume()){unlockApp();return}

    stage.classList.remove('auth-stage-visible');
    stage.classList.add('auth-stage-pending');
  }

  stage.innerHTML='<div class="login-shell">'
    +themeSelect('auth-theme-control')
    +'<div class="login-hero">'
      +'<div class="hero-wordmark">'+brushLogo('brand-brush-hero')+'</div>'
      +'<div class="hero-tagline">笔尖上的比特币</div>'
      +'<div class="hero-en">CHENNAN · WRITING WORKSPACE</div>'
      +'<h2>让人物拥有灵魂</h2>'
      +'<p>人物档案 · 群组运营 · 事件记忆 · 文档创作 · 交易与资产</p>'
      +'<div class="hero-theme-caption"><span></span><b>三套主题，随心切换</b></div>'
    +'</div>'
    +'<div class="auth-card">'
      +'<div class="auth-logo">'+brushLogo('brand-brush-small')+'</div>'
      +'<div class="auth-tagline">笔尖上的比特币</div>'
      +'<div class="auth-kicker">CHENNAN WRITING WORKSPACE</div>'
      +'<h1 class="auth-title">欢迎回来，辰南撰写</h1>'
      +'<p class="auth-sub">输入账户与密码，继续进入你的工作台</p>'
      +'<form id="loginForm">'
        +'<div class="auth-field"><label for="loginUser">账户</label><div class="auth-input-wrap"><span class="auth-input-icon" aria-hidden="true">◎</span><input id="loginUser" name="user" autocomplete="username" placeholder="请输入账号" aria-describedby="authError" required></div></div>'
        +'<div class="auth-field"><label for="loginPassword">密码</label><div class="auth-input-wrap"><span class="auth-input-icon" aria-hidden="true">◇</span><input id="loginPassword" type="password" name="password" autocomplete="current-password" placeholder="请输入密码" aria-describedby="authError" required></div></div>'
        +'<button type="submit" class="auth-btn">进入工作台 <span>→</span></button>'
        +'<div class="auth-error" id="authError" role="alert"></div>'
      +'</form>'
      +'<div class="auth-note"><span class="cloud-dot"></span> 云端数据同步 · 安全登录</div>'
    +'</div>'
  +'</div>';

  root?.classList.add('auth-form-ready');
  setTimeout(()=>{
    stage.classList.remove('auth-stage-pending');
    stage.classList.add('auth-stage-visible');
    root.dataset.introPhase='login-ready';
    emitIntro('chennan:login-ready');
  },root.dataset.introFast==='true'?0:1050);
  if(!cloud)byId('authError').textContent='登录服务未加载，请刷新页面重试';

  byId('loginForm').onsubmit=async function(e){
    e.preventDefault();
    const f=new FormData(e.target),err=byId('authError'),btn=e.target.querySelector('button[type="submit"]');
    err.textContent='正在验证并同步云端数据…';
    btn.disabled=true;
    e.target.setAttribute('aria-busy','true');
    try{
      const runtime=window.ChenNanCloud||await waitForCloudRuntime();
      if(!runtime)throw new Error('登录服务未加载，请刷新页面重试');
      await runtime.login(String(f.get('user')||'').trim(),String(f.get('password')||''));
      root?.classList.add('auth-success');
      setTimeout(unlockApp,720);
    }catch(ex){
      err.textContent=ex?.message||'登录失败';
      btn.disabled=false;
    }finally{
      e.target.setAttribute('aria-busy','false');
    }
  };
}

function unlockApp(){
  const root=byId('authRoot');
  if(root)root.classList.add('hidden');
  const app=document.querySelector('.app');
  if(app){
    app.classList.remove('app-lock');
    app.classList.add('app-ready');
  }
}

injectAuth();
})();
