/* Authentication boots independently of the business render pipeline. */
(function(){
'use strict';
const byId=id=>document.getElementById(id);
function brushLogo(extraClass=''){
  const paths=['M8 8 Q27 7 47 8','M30 4 Q29 14 25 24 Q21 34 13 40','M17 17 Q34 16 48 17','M31 16 Q33 24 30 35 Q28 41 21 44','M18 28 Q31 27 44 28','M24 39 Q33 36 45 38','M54 8 Q72 8 91 8','M73 6 Q71 17 71 41','M57 13 Q66 12 86 13','M60 17 Q59 23 59 29','M85 17 Q86 24 85 29','M59 20 Q72 19 86 20','M59 26 Q72 25 85 26','M72 20 Q70 31 71 39','M60 33 Q71 32 84 33','M60 39 Q72 38 84 39'];
  return '<svg class="brand-brush '+extraClass+'" viewBox="0 0 100 50" role="img" aria-label="辰南" focusable="false"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+paths.map((d,i)=>{const delay=extraClass.includes('sidebar')?i*18:i*85;return '<path class="brush-stroke" style="--stroke-order:'+i+';animation-delay:'+delay+'ms" d="'+d+'"/><path class="brush-fly" style="animation-delay:'+delay+'ms" d="'+d+'"/>'}).join('')+'</g><path class="brush-seal" d="M91 1h7v7h-7z"/><text class="brush-seal-mark" x="92" y="6.2">辰</text></svg>';
}
window.ChenNanBrandMarkup=brushLogo;
function themeSelect(className=''){
  const current=window.ChenNanTheme?.get?.()||'ink';
  const options=(window.ChenNanTheme?.options?.()||'<option value="ink">水墨雅致</option><option value="modern">现代白灰</option><option value="dark">金黑夜色</option>').replace('value="'+current+'"','value="'+current+'" selected');
  return '<label class="theme-control '+className+'"><span>主题</span><select data-theme-switcher aria-label="切换主题">'+options+'</select></label>';
}
function injectAuth(){
  document.querySelector('.app').classList.add('app-lock');
  const root=document.createElement('div');root.id='authRoot';root.className='auth-root';
  root.innerHTML='<div class="auth-lines"></div><div class="auth-orb a"></div><div class="auth-orb b"></div><div id="authStage"><div class="splash-mark">'+brushLogo('brand-brush-splash')+'</div><div class="splash-tagline">笔尖上的比特币</div><div class="splash-copy">人物 · 故事 · 记忆 · 文档</div></div>';
  document.body.appendChild(root);
  setTimeout(showAuthCard,650);
}
async function showAuthCard(){
  const stage=byId('authStage');if(!stage)return;
  if(window.ChenNanCloud?.hasSession?.()){
    stage.innerHTML='<div class="auth-card"><div class="auth-logo">'+brushLogo('brand-brush-small')+'</div><h1 class="auth-title">正在连接云端</h1><p class="auth-sub">正在同步工作区…</p><div class="auth-error" id="authError"></div></div>';
    if(await window.ChenNanCloud.resume()){unlockApp();return}
  }
  stage.innerHTML='<div class="login-shell">'+themeSelect('auth-theme-control')+'<div class="login-hero"><div class="hero-wordmark">'+brushLogo('brand-brush-hero')+'</div><div class="hero-tagline">笔尖上的比特币</div><div class="hero-en">CHENNAN · A WRITER’S WORKSPACE</div><h2>让每一个人物<br>都有自己的故事</h2><p>每日撰写 · 人物记忆 · 文档整理</p><div class="hero-pills"><span>人物档案</span><span>每日撰写</span><span>故事记忆</span></div></div><div class="auth-card"><div class="auth-logo">'+brushLogo('brand-brush-small')+'</div><div class="auth-tagline">笔尖上的比特币</div><div class="auth-kicker">CHENNAN WRITING WORKSPACE</div><h1 class="auth-title">辰南工作台</h1><p class="auth-sub">登录后继续你的创作</p><form id="loginForm"><div class="auth-field"><label>账户</label><input name="user" autocomplete="username" required></div><div class="auth-field"><label>密码</label><input type="password" name="password" autocomplete="current-password" required></div><button class="auth-btn">入卷 · 辰南</button><div class="auth-error" id="authError"></div></form><div class="auth-note"><span class="cloud-dot"></span> 云端数据同步 · 安全登录</div></div></div>';
  byId('loginForm').onsubmit=async function(e){
    e.preventDefault();const f=new FormData(e.target),err=byId('authError'),btn=e.target.querySelector('button');
    err.textContent='正在验证并同步云端数据…';btn.disabled=true;
    try{await window.ChenNanCloud.login(String(f.get('user')||'').trim(),String(f.get('password')||''));unlockApp()}
    catch(ex){err.textContent=ex?.message||'登录失败';btn.disabled=false}
  };
}
function unlockApp(){
  const root=byId('authRoot');if(root)root.classList.add('hidden');
  document.querySelector('.app').classList.remove('app-lock');document.querySelector('.app').classList.add('app-ready');
}

injectAuth();
})();
