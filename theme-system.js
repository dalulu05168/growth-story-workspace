/* 查询参数优先，其次恢复手动选择；未选择过主题的访客沿用三主题轮换。 */
(function(){
  'use strict';

  const sequence=['night','warm','blue'];
  const allowed=new Set(sequence);
  const labels={night:'星空金黑',warm:'暖光书卷',blue:'通透蓝白'};
  const legacy={modern:'blue',ink:'warm',dark:'night'};
  const normalize=value=>legacy[value]||value;
  const query=normalize(new URLSearchParams(location.search).get('theme'));
  function readPreference(key){try{return localStorage.getItem(key)}catch{return null}}
  function writePreference(key,value){try{localStorage.setItem(key,String(value))}catch{}}
  const saved=normalize(readPreference('chennan-theme-manual'));
  const oldSaved=normalize(readPreference('chennan-theme'));

  let current;
  if(allowed.has(query)){
    current=query;
  }else if(allowed.has(saved)){
    current=saved;
  }else if(allowed.has(oldSaved)){
    current=oldSaved;
    writePreference('chennan-theme-manual',current);
  }else{
    const key='chennan-theme-cycle-index';
    const previous=Number.parseInt(readPreference(key)??'-1',10);
    const next=Number.isInteger(previous)&&previous>=-1?(previous+1)%sequence.length:0;
    writePreference(key,next);
    current=sequence[next];
  }

  let transitionTimer=0;
  let transitionFinishTimer=0;

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
    if(persist)writePreference('chennan-theme-manual',theme);
    document.dispatchEvent(new CustomEvent('chennan:theme-change',{detail:{theme,label:labels[theme]}}));
    return current;
  }

  function transitionTo(theme,{persist=true}={}){
    theme=normalize(theme);
    if(!allowed.has(theme))return current;
    clearTimeout(transitionTimer);clearTimeout(transitionFinishTimer);
    if(theme===current){
      document.documentElement.classList.remove('theme-fade-out','theme-fade-in');
      return apply(theme,{persist});
    }

    if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
      clearTimeout(transitionTimer);clearTimeout(transitionFinishTimer);
      document.documentElement.classList.remove('theme-fade-out','theme-fade-in');
      return apply(theme,{persist});
    }

    const root=document.documentElement;
    const from=current;
    root.classList.remove('theme-fade-in');
    root.classList.add('theme-fade-out');
    document.dispatchEvent(new CustomEvent('chennan:theme-before-change',{detail:{from,to:theme}}));

    transitionTimer=setTimeout(()=>{
      apply(theme,{persist});
      root.classList.remove('theme-fade-out');
      void root.offsetWidth;
      root.classList.add('theme-fade-in');
      transitionFinishTimer=setTimeout(()=>root.classList.remove('theme-fade-in'),850);
    },320);

    return theme;
  }

  document.addEventListener('change',event=>{
    if(event.target.matches('[data-theme-switcher]'))transitionTo(event.target.value,{persist:true});
  });

  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-theme-button]');
    if(button)transitionTo(button.dataset.themeButton,{persist:true});
  });

  window.ChenNanTheme={
    apply,
    transitionTo,
    get:()=>current,
    labels:Object.freeze({...labels}),
    options:optionMarkup,
    buttons:buttonMarkup
  };

  apply(current);
})();
