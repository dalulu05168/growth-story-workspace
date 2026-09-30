/* Authentication boots independently of the business render pipeline. */
(function(){
'use strict';
const byId=id=>document.getElementById(id);

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

function injectAuth(){
  const app=document.querySelector('.app');
  if(app)app.classList.add('app-lock');
  const root=document.createElement('div');root.id='authRoot';root.className='auth-root auth-intro-running';
  root.innerHTML=cinematicIntro()+'<div id="authStage" class="auth-stage auth-stage-pending"></div>';
  document.body.appendChild(root);

  const resume=window.ChenNanCloud?.hasSession?.();
  const delay=resume?700:3800;
  setTimeout(()=>{root.classList.add('auth-intro-finish');showAuthCard();},delay);
}

async function showAuthCard(){
  const stage=byId('authStage');if(!stage)return;
  const root=byId('authRoot');
  if(window.ChenNanCloud?.hasSession?.()){
    stage.innerHTML='<div class="auth-card auth-card-resume"><div class="auth-logo">'+brushLogo('brand-brush-small')+'</div><h1 class="auth-title">正在连接云端</h1><p class="auth-sub">正在同步工作区…</p><div class="auth-error" id="authError"></div></div>';
    stage.classList.remove('auth-stage-pending');
    stage.classList.add('auth-stage-visible');
    if(await window.ChenNanCloud.resume()){unlockApp();return}
  }

  stage.innerHTML='<div class="login-shell">'
    +themeSelect('auth-theme-control')
    +'<div class="login-hero">'
      +'<div class="hero-wordmark">'+brushLogo('brand-brush-hero')+'</div>'
      +'<div class="hero-tagline">笔尖上的比特币</div>'
      +'<div class="hero-en">CHENNAN · WRITING WORKSPACE</div>'
      +'<h2>让人物拥有灵魂</h2>'
      +'<p>人物档案 · 群组运营 · 事件记忆 · 文档创作 · 交易与资产</p>'
      +'<div class="hero-theme-caption"><span></span><b>三套主题，轮流出场</b></div>'
    +'</div>'
    +'<div class="auth-card">'
      +'<div class="auth-logo">'+brushLogo('brand-brush-small')+'</div>'
      +'<div class="auth-tagline">笔尖上的比特币</div>'
      +'<div class="auth-kicker">CHENNAN WRITING WORKSPACE</div>'
      +'<h1 class="auth-title">欢迎回来，辰南撰写</h1>'
      +'<p class="auth-sub">输入账户与密码，继续进入你的工作台</p>'
      +'<form id="loginForm">'
        +'<div class="auth-field"><label>账户</label><div class="auth-input-wrap"><span class="auth-input-icon">◎</span><input name="user" autocomplete="username" placeholder="请输入账号" required></div></div>'
        +'<div class="auth-field"><label>密码</label><div class="auth-input-wrap"><span class="auth-input-icon">◇</span><input type="password" name="password" autocomplete="current-password" placeholder="请输入密码" required></div></div>'
        +'<button class="auth-btn">进入工作台 <span>→</span></button>'
        +'<div class="auth-error" id="authError"></div>'
      +'</form>'
      +'<div class="auth-note"><span class="cloud-dot"></span> 云端数据同步 · 安全登录</div>'
    +'</div>'
  +'</div>';

  stage.classList.remove('auth-stage-pending');
  stage.classList.add('auth-stage-visible');
  root?.classList.add('auth-form-ready');

  byId('loginForm').onsubmit=async function(e){
    e.preventDefault();
    const f=new FormData(e.target),err=byId('authError'),btn=e.target.querySelector('button');
    err.textContent='正在验证并同步云端数据…';btn.disabled=true;
    try{
      await window.ChenNanCloud.login(String(f.get('user')||'').trim(),String(f.get('password')||''));
      root?.classList.add('auth-success');
      setTimeout(unlockApp,360);
    }catch(ex){
      err.textContent=ex?.message||'登录失败';btn.disabled=false;
    }
  };
}

function unlockApp(){
  const root=byId('authRoot');if(root)root.classList.add('hidden');
  const app=document.querySelector('.app');
  if(app){app.classList.remove('app-lock');app.classList.add('app-ready');}
}

injectAuth();
})();