/* 辰南三主题：每次进入按 星空金黑 → 暖光书卷 → 通透蓝白 轮换；页面内可随时手动切换。 */
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

  const optionMarkup=()=>sequence.map(id=>`<option value="${id}">${labels[id]}</option>`).join('');
  const buttonMarkup=()=>sequence.map(id=>`<button type="button" class="theme-chip ${id===current?'active':''}" data-theme-button="${id}" aria-pressed="${id===current?'true':'false'}"><span class="theme-swatch"></span><b>${labels[id]}</b></button>`).join('');

  function syncControls(){
    document.querySelectorAll('[data-theme-switcher]').forEach(el=>{el.value=current});
    document.querySelectorAll('[data-theme-button]').forEach(btn=>{
      const active=btn.dataset.themeButton===current;
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
    syncControls();
    if(persist)localStorage.setItem('chennan-theme-manual',theme);
    document.dispatchEvent(new CustomEvent('chennan:theme-change',{detail:{theme,label:labels[theme]}}));
    return current;
  }

  document.addEventListener('change',event=>{
    if(event.target.matches('[data-theme-switcher]'))apply(event.target.value,{persist:true});
  });
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-theme-button]');
    if(button)apply(button.dataset.themeButton,{persist:true});
  });

  window.ChenNanTheme={
    apply,
    get:()=>current,
    labels:Object.freeze({...labels}),
    options:optionMarkup,
    buttons:buttonMarkup
  };

  apply(current);
})();