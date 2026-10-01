const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function harness(search='?theme=warm',preferences={},blocked=false){
  const listeners={};
  const buttons=['night','warm','blue'].map(id=>({
    dataset:{themeButton:id},
    classList:{toggle(){}},
    setAttribute(){}
  }));
  const switchers=[{value:''}];
  const classes=new Set();
  const root={
    dataset:{},
    classList:{
      add(...xs){xs.forEach(x=>classes.add(x))},
      remove(...xs){xs.forEach(x=>classes.delete(x))}
    },
    get offsetWidth(){return 1}
  };
  const body={setAttribute(k,v){this[k]=v}};
  const events=[];
  const store={...preferences};
  const context={
    location:{search},
    URLSearchParams,
    CustomEvent:function(type,init){this.type=type;this.detail=init?.detail},
    setTimeout(fn){fn();return 1},
    clearTimeout(){},
    localStorage:{getItem:k=>{if(blocked)throw new Error('storage unavailable');return store[k]??null},setItem:(k,v)=>{if(blocked)throw new Error('storage unavailable');store[k]=String(v)}},
    document:{
      documentElement:root,
      body,
      querySelectorAll(sel){
        if(sel==='[data-theme-switcher]')return switchers;
        if(sel==='[data-theme-button]')return buttons;
        return [];
      },
      addEventListener:(name,fn)=>{listeners[name]=fn},
      dispatchEvent:e=>events.push(e)
    },
    window:{}
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('theme-system.js','utf8'),context);
  return {context,listeners,root,body,events,store,switchers};
}

test('loads approved three-theme query and exposes labels',()=>{
  const h=harness('?theme=blue');
  assert.equal(h.root.dataset.theme,'blue');
  assert.equal(h.context.window.ChenNanTheme.get(),'blue');
  assert.deepEqual(
    JSON.parse(JSON.stringify(h.context.window.ChenNanTheme.labels)),
    {night:'星空金黑',warm:'暖光书卷',blue:'通透蓝白'}
  );
});

test('manual transition fades and persists the approved theme',()=>{
  const h=harness('?theme=warm');
  h.context.window.ChenNanTheme.transitionTo('night',{persist:true});
  assert.equal(h.root.dataset.theme,'night');
  assert.equal(h.store['chennan-theme-manual'],'night');
  assert.equal(h.events.at(-1).detail.theme,'night');
});

test('legacy theme ids normalize to current themes',()=>{
  const h=harness('?theme=ink');
  assert.equal(h.root.dataset.theme,'warm');
  h.context.window.ChenNanTheme.apply('dark');
  assert.equal(h.root.dataset.theme,'night');
  h.context.window.ChenNanTheme.apply('modern');
  assert.equal(h.root.dataset.theme,'blue');
});
test('manual choice survives a new boot without a query parameter',()=>{
  const first=harness('');first.context.window.ChenNanTheme.transitionTo('blue');
  const second=harness('',first.store);assert.equal(second.root.dataset.theme,'blue');
});
test('selecting the current theme persists it and prevents the next cycle',()=>{
  const first=harness('');first.context.window.ChenNanTheme.transitionTo('night');
  assert.equal(harness('',first.store).root.dataset.theme,'night');
});
test('query overrides a saved choice without erasing that choice',()=>{
  const h=harness('?theme=warm',{'chennan-theme-manual':'blue'});
  assert.equal(h.root.dataset.theme,'warm');assert.equal(h.store['chennan-theme-manual'],'blue');
});
test('migrates the old Pages preference and ignores corrupt cycle values',()=>{
  const h=harness('',{'chennan-theme':'modern'});
  assert.equal(h.root.dataset.theme,'blue');assert.equal(h.store['chennan-theme-manual'],'blue');
  assert.equal(harness('',{'chennan-theme-cycle-index':'-8'}).root.dataset.theme,'night');
});
test('blocked storage does not prevent rendering or manual switching',()=>{
  const h=harness('',{},true);assert.equal(h.root.dataset.theme,'night');
  h.context.window.ChenNanTheme.transitionTo('warm');assert.equal(h.root.dataset.theme,'warm');
});
