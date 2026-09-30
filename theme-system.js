/* 辰南主题状态：三套主题轮流进入，登录页与工作台共用同一主题。 */
(function(){
  'use strict';

  const sequence=['night','warm','blue'];
  const allowed=new Set(sequence);
  const labels={night:'星空金黑',warm:'暖光书卷',blue:'通透蓝白'};
  const legacy={modern:'blue',ink:'warm',dark:'night'};
  const normalize=value=>legacy[value]||value;
  const queryRaw=new URLSearchParams(location.search).get('theme');
  const query=normalize(queryRaw);
  const stored=normalize(localStorage.getItem('chennan-theme'));

  // 每个新浏览会话只轮换一次；刷新当前页面不会在用户输入时突然切主题。
  let current;
  if(allowed.has(query)){
    current=query;
  }else if(!sessionStorage.getItem('chennan-theme-session')){
    const last=allowed.has(stored)?stored:'blue';
    const nextIndex=(sequence.indexOf(last)+1)%sequence.length;
    current=sequence[nextIndex];
    localStorage.setItem('chennan-theme',current);
    sessionStorage.setItem('chennan-theme-session',current);
  }else{
    const sessionTheme=normalize(sessionStorage.getItem('chennan-theme-session'));
    current=allowed.has(sessionTheme)?sessionTheme:(allowed.has(stored)?stored:'night');
  }

  function syncControls(theme){
    document.querySelectorAll('[data-theme-switcher]').forEach(el=>{el.value=theme});
    document.querySelectorAll('[data-theme-button]').forEach(btn=>{
      const active=btn.dataset.themeButton===theme;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-pressed',active?'true':'false');
    });
  }

  function apply(theme,{persist=false}={}){
    theme=normalize(theme);
    if(!allowed.has(theme))return current;
    current=theme;
    document.documentElement.dataset.theme=theme;
    document.body?.setAttribute?.('data-theme',theme);
    syncControls(theme);
    if(persist){
      localStorage.setItem('chennan-theme',theme);
      sessionStorage.setItem('chennan-theme-session',theme);
      const url=new URL(location.href);
      if(url.searchParams.has('theme')){
        url.searchParams.delete('theme');
        history.replaceState(null,'',url.pathname+url.search+url.hash);
      }
    }
    document.dispatchEvent(new CustomEvent('chennan:theme-change',{detail:{theme,label:labels[theme]}}));
    return current;
  }

  document.addEventListener('change',event=>{
    if(event.target.matches('[data-theme-switcher]'))apply(event.target.value,{persist:true});
  });
  document.addEventListener('click',event=>{
    const btn=event.target.closest?.('[data-theme-button]');
    if(btn)apply(btn.dataset.themeButton,{persist:true});
  });

  window.ChenNanTheme={
    apply,
    get:()=>current,
    sequence:Object.freeze([...sequence]),
    labels:Object.freeze({...labels}),
    options:()=>sequence.map(id=>`<option value="${id}">${labels[id]}</option>`).join(''),
    buttons:()=>sequence.map(id=>`<button type="button" class="theme-chip" data-theme-button="${id}" aria-pressed="${id===current?'true':'false'}"><span class="theme-swatch"></span><b>${labels[id]}</b></button>`).join('')
  };

  apply(current);
})();