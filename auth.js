/* Authentication boots independently of the business render pipeline. */
(function(){
'use strict';
const byId=id=>document.getElementById(id);
function injectAuth(){
  document.querySelector('.app').classList.add('app-lock');
  const root=document.createElement('div');root.id='authRoot';root.className='auth-root';
  root.innerHTML='<div class="auth-lines"></div><div class="auth-orb a"></div><div class="auth-orb b"></div><div id="authStage"><div class="splash-mark">辰南</div><div class="splash-copy">CHENNAN · INVESTOR WORKSPACE</div></div>';
  document.body.appendChild(root);
  setTimeout(showAuthCard,650);
}
async function showAuthCard(){
  const stage=byId('authStage');if(!stage)return;
  if(window.ChenNanCloud?.hasSession?.()){
    stage.innerHTML='<div class="auth-card"><div class="auth-logo">辰南</div><h1 class="auth-title">正在连接云端</h1><p class="auth-sub">正在同步人物、交易、持仓与文档数据…</p><div class="auth-error" id="authError"></div></div>';
    if(await window.ChenNanCloud.resume()){unlockApp();return}
  }
  stage.innerHTML='<div class="login-shell"><div class="login-hero"><div class="hero-wordmark">辰南</div><div class="hero-en">CHENNAN · INVESTOR MANAGEMENT SYSTEM</div><h2>让人物、交易与记忆<br>保持在同一条时间线上</h2><p>人物档案 · 推荐交易 · 持仓管理 · 每日文档 · 云端同步</p><div class="hero-pills"><span>人物画像</span><span>交易计划</span><span>云端数据</span></div></div><div class="auth-card"><div class="auth-logo">辰南</div><div class="auth-kicker">CHENNAN INVESTOR MANAGEMENT</div><h1 class="auth-title">辰南工作台</h1><p class="auth-sub">使用管理员账号进入云端工作区</p><form id="loginForm"><div class="auth-field"><label>账户</label><input name="user" autocomplete="username" required></div><div class="auth-field"><label>密码</label><input type="password" name="password" autocomplete="current-password" required></div><button class="auth-btn">登录辰南</button><div class="auth-error" id="authError"></div></form><div class="auth-note"><span class="cloud-dot"></span> Supabase 云端数据 · 账号密码验证</div></div></div>';
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
