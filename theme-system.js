/* 固定黑金主题；旧查询参数与历史偏好不再改变视觉。 */
(function(){
 'use strict';
 function apply(){
  document.documentElement.dataset.theme='night';
  document.body?.setAttribute?.('data-theme','night');
  document.documentElement.classList.remove('theme-fade-out','theme-fade-in');
  return 'night';
 }
 window.ChenNanTheme={apply,transitionTo:apply,get:()=> 'night',
  labels:Object.freeze({night:'星空金黑'}),
  options:()=>'<option value="night">星空金黑</option>',buttons:()=>''};
 apply();
})();
