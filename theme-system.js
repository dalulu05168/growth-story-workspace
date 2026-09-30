/* 辰南三主题状态：每次进入网址按 星空金黑 → 暖光书卷 → 通透蓝白 轮换；页面内可手动切换。 */
(function(){
  'use strict';
  const sequence=['night','warm','blue'];
  const allowed=new Set(sequence);
  const labels={night:'星空金黑',warm:'暖光书卷',blue:'通透蓝白'};
  const legacy={modern:'blue',ink:'warm',dark:'night'};
  const normalize=value=>legacy[value]||value;
  const query=normalize(new URLSearchParams(location.search).get('theme'));

  let current;
  if(allowed.has(query)){
    current=query;
  }else{
    const key='chennan-theme-cycle-index';
    const previous=Number.parseInt(localStorage.getItem(key)??'-1',10);
    const next=Number.isFinite(previous)?(previous+1)%sequence.length:0;
    localStorage.setItem(key,String(next));
    current=sequence[next];
  }

  function apply(theme,{persist=false}={}){
    theme=normalize(theme);
    if(!allowed.has(theme))return current;
    current=theme;
    document.documentElement.dataset.theme=theme;
    document.body?.setAttribute?.('data-theme',theme);
    document.querySelectorAll('[data-theme-switcher]').forEach(el=>{el.value=theme});
    if(persist){
      localStorage.setItem('chennan-theme-manual',theme);
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
    options:()=>sequence.map(id=>`<option value="${id}">${labels[id]}</option>`).join('')
  };
  apply(current);
})();