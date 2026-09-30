/* 辰南主题状态：登录页与工作台共用同一份本地偏好。 */
(function(){
  'use strict';
  const allowed=new Set(['blue','warm','night']);
  const labels={blue:'通透蓝白',warm:'暖光书卷',night:'星空金黑'};
  const legacy={modern:'blue',ink:'warm',dark:'night'};
  const queryRaw=new URLSearchParams(location.search).get('theme');
  const storedRaw=localStorage.getItem('chennan-theme');
  const normalize=value=>legacy[value]||value;
  const query=normalize(queryRaw);
  const stored=normalize(storedRaw);
  let current=allowed.has(query)?query:(allowed.has(stored)?stored:'blue');

  function apply(theme,{persist=false}={}){
    theme=normalize(theme);
    if(!allowed.has(theme))return current;
    current=theme;
    document.documentElement.dataset.theme=theme;
    document.body?.setAttribute?.('data-theme',theme);
    document.querySelectorAll('[data-theme-switcher]').forEach(el=>{el.value=theme});
    if(persist){
      localStorage.setItem('chennan-theme',theme);
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

  window.ChenNanTheme={
    apply,
    get:()=>current,
    labels:Object.freeze({...labels}),
    options:()=>Object.entries(labels).map(([id,label])=>`<option value="${id}">${label}</option>`).join('')
  };

  apply(current);
})();