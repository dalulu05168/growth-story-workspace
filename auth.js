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
  return '<span class="brand-calligraphy '+extraClass+'" role="img" aria-label="辰南">辰南</span>';
}
window.ChenNanBrandMarkup=brushLogo;

function cinematicIntro(){
  return \`<div class="auth-cinematic" id="authCinematic" aria-hidden="true">
    <div class="cinematic-brand">
      <canvas class="scene-lake"></canvas>
      <div class="scene-haze"></div>
      <svg class="scene-koi-art" viewBox="0 0 900 940" role="presentation" aria-hidden="true">
        <defs>
          <linearGradient id="cnGold" x1="0" x2="1"><stop stop-color="#7d511a"/><stop offset=".45" stop-color="#e6bc61"/><stop offset=".72" stop-color="#fff0b7"/><stop offset="1" stop-color="#9c641c"/></linearGradient>
          <linearGradient id="cnInk" x1=".1" y1=".9" x2=".85" y2=".1"><stop stop-color="#050606"/><stop offset=".5" stop-color="#171918"/><stop offset=".78" stop-color="#5c482d"/><stop offset="1" stop-color="#dfb55e"/></linearGradient>
          <radialGradient id="cnPortal"><stop stop-color="#fff7ce"/><stop offset=".28" stop-color="#f5cf72" stop-opacity=".82"/><stop offset=".72" stop-color="#d6a344" stop-opacity=".18"/><stop offset="1" stop-color="#d6a344" stop-opacity="0"/></radialGradient>
          <filter id="cnGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="10" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="cnShadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#3e2f17" flood-opacity=".20"/></filter>
        </defs>
        <g class="portal-core" transform="translate(610 182)">
          <circle r="154" fill="url(#cnPortal)" opacity=".72"/>
          <circle class="portal-ring" r="145" fill="none" stroke="url(#cnGold)" stroke-width="15" opacity=".88"/>
          <circle r="126" fill="none" stroke="#171716" stroke-width="4" opacity=".7" stroke-dasharray="118 21 9 17"/>
          <g filter="url(#cnGlow)" fill="none" stroke="url(#cnGold)" stroke-linejoin="round">
            <path d="M-88 18V-33H88V18M-105-34H105M-82-34L-103-54M82-34L103-54M-111-55H111" stroke-width="10"/>
            <path d="M-58 18V-22M58 18V-22M-23 18V-22M23 18V-22" stroke-width="8"/>
            <path d="M-127-55Q-92-72-63-59Q-33-76 0-61Q33-76 63-59Q92-72 127-55" stroke-width="8"/>
          </g>
        </g>
        <g class="ink-splash" fill="#0b0c0b" opacity=".86">
          <circle cx="315" cy="210" r="7"/><circle cx="351" cy="173" r="3"/><circle cx="282" cy="266" r="4"/><circle cx="337" cy="323" r="5"/>
          <circle cx="735" cy="410" r="5"/><circle cx="778" cy="458" r="3"/><circle cx="710" cy="520" r="7"/><circle cx="248" cy="640" r="5"/>
          <path d="M267 191q31 28 50 71q-43-20-72-11q24-21 22-60Z"/><path d="M734 333q-35 30-45 75q38-25 71-20q-26-18-26-55Z"/>
        </g>
        <g class="koi-body" filter="url(#cnShadow)">
          <path d="M398 839C303 839 224 900 143 862c72-42 94-97 78-157c83 35 139 75 177 134Z" fill="#111312"/>
          <path d="M401 837c-37 36-69 73-89 103c74-17 130-46 168-92c-28 4-54 0-79-11Z" fill="#e7e1d7" opacity=".78"/>
          <path d="M390 807C333 710 356 625 430 548c52-54 78-111 89-190c8-66 42-104 89-100c51 5 75 61 51 111c-25 51-82 77-108 137c-36 83-20 170-66 251c-26 46-57 69-95 50Z" fill="url(#cnInk)" stroke="url(#cnGold)" stroke-width="4"/>
          <path d="M496 552c-60 19-106 56-139 113c27-17 61-27 103-27Z" fill="#dcd7cd" stroke="#151615" stroke-width="4"/>
          <path d="M535 468c61 3 107 23 137 61c-42-14-79-12-111 6Z" fill="#eee9df" stroke="#171817" stroke-width="4"/>
          <path d="M614 275c38 14 51 52 36 84c-13 29-47 47-79 37c-31-10-43-47-25-77c16-27 40-54 68-44Z" fill="#242625"/>
          <ellipse cx="624" cy="301" rx="13" ry="12" fill="#f3ead1"/><circle cx="627" cy="299" r="6" fill="#0a0b0a"/><circle cx="630" cy="296" r="2.4" fill="#fff"/>
          <path d="M649 320q33 5 48 25q-27-3-44 6" fill="none" stroke="#bb7e24" stroke-width="3" stroke-linecap="round"/>
          <path class="koi-glint" d="M596 372c-46 71-72 151-76 240c-4 76-23 134-59 175" fill="none" stroke="#f1c769" stroke-width="13" stroke-linecap="round"/>
          <g fill="none" stroke="#d9c69d" stroke-width="2.2" opacity=".52">
            <path d="M565 401q25-18 48 1q-24 17-48-1Z"/><path d="M543 443q28-18 52 4q-27 16-52-4Z"/><path d="M524 487q31-18 55 6q-30 16-55-6Z"/>
            <path d="M511 534q31-17 56 8q-31 15-56-8Z"/><path d="M504 583q32-16 57 9q-32 14-57-9Z"/><path d="M499 632q32-15 56 10q-32 13-56-10Z"/>
            <path d="M492 681q31-13 53 10q-31 12-53-10Z"/><path d="M478 729q29-11 49 10q-29 11-49-10Z"/>
          </g>
        </g>
        <g class="ink-splash" fill="none" stroke-linecap="round">
          <path d="M104 872c92-55 176-67 270-26c92 40 180 43 292-6" stroke="#0a0b0a" stroke-width="22" opacity=".92"/>
          <path d="M84 893c122-25 216-18 298 21c92 44 184 31 297-22" stroke="#e8e4db" stroke-width="12" opacity=".92"/>
          <path d="M102 854c95-24 177-19 248 10" stroke="#cb9136" stroke-width="5" opacity=".82"/>
        </g>
      </svg>
      <div class="scene-brand-copy">
        <span class="scene-brand-en">CHENNAN · WRITING SYSTEM</span>
        <span class="scene-cn-title">辰南</span>
        <span class="scene-brand-seal">辰<br>南</span>
        <div class="scene-brand-rule">人物 · 记忆 · 剧情 · 逻辑</div>
        <p class="scene-brand-sub">一套持续生长的故事工作空间</p>
      </div>
      <div class="scene-particles"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <img class="scene-brush" src="./assets/login/brush.webp" alt="">
      <div class="scene-coin"><img src="./assets/login/bitcoin.webp" alt=""><img class="coin-back" src="./assets/login/bitcoin.webp" alt=""></div>
    </div>
  </div>\`;
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
    Promise.all([imageReady('./assets/login/landscape.webp'),imageReady('./assets/login/brush.webp'),imageReady('./assets/login/bitcoin.webp')]),
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
  window.ChenNanScene?.mount(root);
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
    +'<h1 class="login-accessible-brand">辰南 · 创作工作台</h1>'
    +'<div class="login-topline" aria-hidden="true"><span>安全</span><span>高效</span><span>稳定</span><span>持续更新</span></div>'
    +'<div class="login-language"><img src="./icons/globe.svg" alt="">简体中文</div>'
    +'<div class="auth-card">'
      +'<div class="auth-kicker">CHENNAN · WRITING SYSTEM</div>'
      +'<h2 class="auth-title"><span>欢迎</span><em>回来</em></h2>'
      +'<p class="auth-sub">继续进入辰南工作台</p>'
      +'<form id="loginForm">'
        +'<div class="auth-field"><label for="loginUser">账号</label><div class="auth-input-wrap"><img class="auth-input-icon" src="./icons/user.svg" alt=""><input id="loginUser" name="user" autocomplete="username" placeholder="请输入账号 / 邮箱" aria-describedby="authError" required></div></div>'
        +'<div class="auth-field"><label for="loginPassword">密码</label><div class="auth-input-wrap"><img class="auth-input-icon" src="./icons/lock-key.svg" alt=""><input id="loginPassword" type="password" name="password" autocomplete="current-password" placeholder="请输入密码" aria-describedby="authError" required><button type="button" class="auth-password-toggle" aria-label="显示密码" aria-pressed="false"><img src="./icons/eye.svg" alt=""></button></div></div>'
        +'<button type="submit" class="auth-btn">登录工作台 <img src="./icons/arrow-right.svg" alt=""></button>'
        +'<div class="auth-error" id="authError" role="alert"></div>'
      +'</form>'
      +'<div class="auth-assist"><label><input type="checkbox" id="rememberAccount">记住账号</label><button type="button" id="passwordHelp" aria-expanded="false" aria-controls="authHelp">忘记密码？</button></div>'
      +'<p id="authHelp" hidden>请联系管理员重置密码。账号密码由服务器验证。</p>'
      +'<div class="auth-security-note">账户验证、会话与工作区数据均沿用现有安全逻辑</div>'
    +'</div>'
    +'<div class="login-features" aria-label="工作台特性">'
      +'<div><img src="./icons/users-four.svg" alt=""><span><b>多角色统一管理</b><small>人物 · 分组 · 长期记忆</small></span></div>'
      +'<div><img src="./icons/chats.svg" alt=""><span><b>群组运营协作</b><small>记录 · 发言 · 主题检查</small></span></div>'
      +'<div><img src="./icons/chart-line-up.svg" alt=""><span><b>数据安全同步</b><small>云端验证 · 会话保护</small></span></div>'
      +'<div><img src="./icons/chart-pie-slice.svg" alt=""><span><b>持续更新迭代</b><small>电脑 · 手机 · 平板适配</small></span></div>'
    +'</div>'
  +'</div>';

  try{const remembered=localStorage.getItem('chennan-login-account');if(remembered){byId('loginUser').value=remembered;byId('rememberAccount').checked=true}}catch{}
  stage.querySelector('.auth-password-toggle').onclick=function(){
    const visible=byId('loginPassword').type==='password';byId('loginPassword').type=visible?'text':'password';
    this.setAttribute('aria-pressed',String(visible));this.setAttribute('aria-label',visible?'隐藏密码':'显示密码');
    this.querySelector('img').src=visible?'./icons/eye-slash.svg':'./icons/eye.svg';
  };
  byId('passwordHelp').onclick=function(){const open=byId('authHelp').hidden;byId('authHelp').hidden=!open;this.setAttribute('aria-expanded',String(open))};
  byId('rememberAccount').onchange=function(){if(!this.checked){try{localStorage.removeItem('chennan-login-account')}catch{}}};

  root?.classList.add('auth-form-ready');
  setTimeout(()=>{
    stage.classList.remove('auth-stage-pending');
    stage.classList.add('auth-stage-visible');
    root.dataset.introPhase='login-ready';
    emitIntro('chennan:login-ready');
  },root.dataset.introFast==='true'?0:120);
  if(!cloud)byId('authError').textContent='登录服务未加载，请刷新页面重试';

  byId('loginForm').onsubmit=async function(e){
    e.preventDefault();
    const f=new FormData(e.target),err=byId('authError'),btn=e.target.querySelector('button[type="submit"]');
    err.textContent='正在验证并同步云端数据…';
    btn.disabled=true;
    e.target.setAttribute('aria-busy','true');
    try{if(byId('rememberAccount').checked)localStorage.setItem('chennan-login-account',String(f.get('user')||'').trim());else localStorage.removeItem('chennan-login-account')}catch{}
    try{
      const runtime=window.ChenNanCloud||await waitForCloudRuntime();
      if(!runtime)throw new Error('登录服务未加载，请刷新页面重试');
      const result=await runtime.login(String(f.get('user')||'').trim(),String(f.get('password')||''));
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
