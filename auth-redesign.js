/* Login presentation on the real workspace. Authentication remains in ChenNanCloud. */
(function(){
'use strict';
const byId=id=>document.getElementById(id);
function brushLogo(extraClass=''){
  return '<span class="brand-calligraphy '+extraClass+'" role="img" aria-label="辰南撰写">辰南撰写</span>';
}
window.ChenNanBrandMarkup=brushLogo;
function themeSelect(){
  const options=window.ChenNanTheme?.options?.()||'<option value="ink">水墨雅致</option><option value="modern">现代蓝灰</option><option value="dark">金黑夜色</option>';
  return '<label class="auth-theme-control"><span>页面主题</span><select data-theme-switcher aria-label="切换登录页主题">'+options+'</select></label>';
}
function introMarkup(){
  return '<div class="cn-intro" id="cnIntro">'
    +'<div class="cn-stars" aria-hidden="true"></div>'
    +'<div class="cn-intro-center"><span class="cn-intro-label">辰南撰写 · 笔尖上的比特币</span>'
    +'<svg class="cn-intro-art" viewBox="0 0 300 340" aria-hidden="true" focusable="false">'
    +'<defs><linearGradient id="cnNib" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff0cb"/><stop offset=".6" stop-color="#d7ab65"/><stop offset="1" stop-color="#88623d"/></linearGradient></defs>'
    +'<g class="cn-flying-brush"><path d="M113 4 Q150 18 186 4 L170 100 L129 100Z" fill="#281912" stroke="#d9b982" stroke-width="4"/><path d="M129 91 L170 91 L152 176 Q149 197 146 176Z" fill="url(#cnNib)"/></g>'
    +'<g class="cn-bitcoin" fill="none" stroke-linecap="round" stroke-linejoin="round"><path class="cn-bitcoin-path cn-bitcoin-main" d="M112 69 L112 272 M112 74 C248 57 247 172 130 171 M112 171 C254 149 258 277 112 268"/><path class="cn-bitcoin-path cn-bitcoin-lines" d="M131 54 L131 284 M151 54 L151 284"/></g></svg>'
    +'<div class="cn-form-morph" aria-hidden="true"><span></span><span></span></div>'
    +'<span class="cn-intro-copy">从一笔开始，进入更大的世界</span></div>'
    +'<button type="button" class="cn-skip" id="cnSkip">跳过动画</button></div>';
}
const app=document.querySelector('.app');
if(app)app.classList.add('app-lock');
const root=document.createElement('div');root.id='authRoot';root.className='auth-root cn-auth-root';
root.innerHTML=introMarkup()+'<div id="authStage" class="cn-auth-stage"></div>';
document.body.appendChild(root);
let introTimer=0,shown=false;
function finishIntro(){
  if(shown)return;
  shown=true;
  clearTimeout(introTimer);
  root.classList.add('cn-intro-finished');
  showAuthCard();
  setTimeout(()=>byId('cnIntro')?.remove(),850);
}
byId('cnSkip').addEventListener('click',finishIntro,{once:true});
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
introTimer=setTimeout(finishIntro,reduced?0:window.ChenNanCloud?.hasSession?.()?900:4850);
function loginMarkup(){
  return '<div class="cn-login-scene"><div class="cn-login-wrap">'
    +themeSelect()
    +'<div class="cn-login-copy"><div class="cn-brand">'+brushLogo('cn-brand-large')+'<span class="cn-brand-seal">辰</span></div>'
    +'<div class="cn-brand-en">CHEN NAN · WRITE A BIGGER WORLD</div>'
    +'<h2>让人物拥有灵魂</h2><p>把人物、故事与记忆写进更大的世界。</p></div>'
    +'<div class="cn-login-card"><div class="cn-card-head"><span class="cn-card-kicker">CHEN NAN · WRITING WORKSPACE</span><h1>欢迎回来</h1><p>登录辰南撰写，继续今天的创作</p></div>'
    +'<form id="loginForm"><div class="cn-field"><label for="cn-user">账号</label><div class="cn-input-wrap"><span aria-hidden="true">◎</span><input id="cn-user" name="user" autocomplete="username" placeholder="请输入账号" required></div></div>'
    +'<div class="cn-field"><label for="cn-password">密码</label><div class="cn-input-wrap"><span aria-hidden="true">◇</span><input id="cn-password" type="password" name="password" autocomplete="current-password" placeholder="请输入密码" required><button type="button" class="cn-reveal" id="cnReveal" aria-label="显示密码">显示</button></div></div>'
    +'<button class="cn-login-button" type="submit"><span>登录工作台</span><span aria-hidden="true">→</span></button>'
    +'<div class="auth-error" id="authError" role="alert"></div></form>'
    +'<div class="cn-login-foot"><span class="cloud-dot"></span> 云端同步 · 安全登录</div></div></div></div>';
}
async function showAuthCard(){
  const stage=byId('authStage');if(!stage)return;
  if(window.ChenNanCloud?.hasSession?.()){
    stage.innerHTML='<div class="cn-resume" role="status"><h1>正在连接云端</h1><p>同步你的辰南工作区…</p></div>';
    root.classList.add('cn-card-ready');
    if(await window.ChenNanCloud.resume()){unlockApp();return}
  }
  stage.innerHTML=loginMarkup();
  root.classList.add('cn-card-ready');
  const select=stage.querySelector('[data-theme-switcher]');
  if(select)select.value=window.ChenNanTheme?.get?.()||'ink';
  byId('cnReveal').onclick=()=>{const input=byId('cn-password'),visible=input.type==='password';input.type=visible?'text':'password';byId('cnReveal').textContent=visible?'隐藏':'显示';byId('cnReveal').setAttribute('aria-label',visible?'隐藏密码':'显示密码')};
  byId('loginForm').onsubmit=async event=>{
    event.preventDefault();
    const form=new FormData(event.target),error=byId('authError'),button=event.target.querySelector('[type=submit]');
    error.textContent='正在验证并同步云端数据…';button.disabled=true;
    try{await window.ChenNanCloud.login(String(form.get('user')||'').trim(),String(form.get('password')||''));unlockApp()}
    catch(ex){error.textContent=ex?.message||'登录失败';button.disabled=false}
  };
}
function unlockApp(){
  root.classList.add('hidden');
  if(app){app.classList.remove('app-lock');app.classList.add('app-ready')}
}
})();
