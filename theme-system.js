/* 辰南主题状态：登录页与工作台共用同一份本地偏好。 */
(function(){
  'use strict';
  const allowed=new Set(['ink','modern','dark']);
  const labels={ink:'水墨雅致',modern:'现代白灰',dark:'金黑夜色'};
  const query=new URLSearchParams(location.search).get('theme');
  const stored=localStorage.getItem('chennan-theme');
  let current=allowed.has(query)?query:(allowed.has(stored)?stored:'ink');
  function apply(theme,{persist=false}={}){
    if(!allowed.has(theme))return current;
    current=theme;
    document.documentElement.dataset.theme=theme;
    document.querySelectorAll('[data-theme-switcher]').forEach(el=>{el.value=theme});
    if(persist){
      localStorage.setItem('chennan-theme',theme);
      const url=new URL(location.href);
      if(url.searchParams.has('theme')){url.searchParams.delete('theme');history.replaceState(null,'',url.pathname+url.search+url.hash)}
    }
    document.dispatchEvent(new CustomEvent('chennan:theme-change',{detail:{theme,label:labels[theme]}}));
    return current;
  }
  document.addEventListener('change',event=>{
    if(event.target.matches('[data-theme-switcher]'))apply(event.target.value,{persist:true});
  });
  window.ChenNanTheme={apply,get:()=>current,labels:Object.freeze({...labels}),options:()=>Object.entries(labels).map(([id,label])=>`<option value="${id}">${label}</option>`).join('')};
  apply(current);
})();
