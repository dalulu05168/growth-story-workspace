const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('fixed black-gold theme ignores old query and storage preferences',()=>{
 for(const search of ['','?theme=warm','?theme=blue']){
  const root={dataset:{},classList:{remove(){}}},body={setAttribute(k,v){this[k]=v}};
  const context={window:{},document:{documentElement:root,body},location:{search},localStorage:{getItem(){throw new Error('blocked storage')}}};
  vm.runInNewContext(fs.readFileSync('theme-system.js','utf8'),context);
  assert.equal(root.dataset.theme,'night');assert.equal(body['data-theme'],'night');
  assert.equal(context.window.ChenNanTheme.transitionTo('blue'),'night');assert.equal(root.dataset.theme,'night');
  assert.equal(context.window.ChenNanTheme.buttons(),'');assert.equal(context.window.ChenNanTheme.get(),'night');
 }
});
