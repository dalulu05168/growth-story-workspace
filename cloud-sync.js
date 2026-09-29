/* 辰南云端数据桥：服务端账号验证 + Supabase 工作区同步。 */
(function(){
'use strict';

const CLOUD_URL='https://afelbznpwltuebmqmqbh.supabase.co/functions/v1/workspace-cloud';
const PUBLISHABLE_KEY='sb_publishable_J548-tZcZAxnUF4HD-VPEA_Gepy26Ec';
const SESSION_KEY='chennan-cloud-session-v1';
const ACCOUNT_KEY='chennan-cloud-account-v1';
let cloudVersion=0;
let hydrated=false;
let saveTimer=null;
let saving=false;
let queued=false;

function getToken(){return sessionStorage.getItem(SESSION_KEY)||''}
function setToken(token){if(token)sessionStorage.setItem(SESSION_KEY,token);else sessionStorage.removeItem(SESSION_KEY)}
function headers(withAuth=true){
  const h={'Content-Type':'application/json','apikey':PUBLISHABLE_KEY};
  const token=getToken();if(withAuth&&token)h.Authorization='Bearer '+token;
  return h;
}
async function call(action,payload={},withAuth=true){
  const res=await fetch(CLOUD_URL,{method:'POST',headers:headers(withAuth),body:JSON.stringify({action,...payload})});
  let data=null;try{data=await res.json()}catch(_){data={ok:false,error:'云端响应格式错误'}}
  if(!res.ok||!data?.ok){const e=new Error(data?.error||('云端请求失败 HTTP '+res.status));e.status=res.status;e.code=data?.code;e.data=data;throw e}
  return data;
}
function normalizePayload(raw){
  const out=raw&&typeof raw==='object'?raw:{};
  out.people=Array.isArray(out.people)?out.people.map(normalizePerson):[];
  out.records=Array.isArray(out.records)?out.records:[];
  out.docs=Array.isArray(out.docs)?out.docs:[];
  out.dailyDocs=out.dailyDocs&&typeof out.dailyDocs==='object'&&!Array.isArray(out.dailyDocs)?out.dailyDocs:{};
  out.customGroups=Array.isArray(out.customGroups)?out.customGroups:[];
  out.meta=out.meta&&typeof out.meta==='object'?out.meta:{};
  out.portfolio=out.portfolio&&typeof out.portfolio==='object'?out.portfolio:{};
  out.tradeSim=out.tradeSim&&typeof out.tradeSim==='object'?out.tradeSim:{};
  return out;
}
async function ensureDefaultPeople(){
  if(db.people?.length)return;
  const res=await fetch(DATA_URL,{cache:'no-store'});if(!res.ok)return;
  const src=await res.json();const list=Array.isArray(src)?src:(Array.isArray(src.people)?src.people:[]);
  if(list.length){db.people=list.map(normalizePerson);db.meta.defaultDatasetVersion=DEFAULT_DATASET_VERSION;db.meta.defaultDatasetName=src.dataset_name||'法国人物70位'}
}
async function hydrate(){
  const result=await call('load');
  cloudVersion=Number(result.version||0);
  if(result.payload&&typeof result.payload==='object'){
    db=normalizePayload(result.payload);
  }else{
    await ensureDefaultPeople();
  }
  hydrated=true;
  localStorage.setItem(STORAGE_KEY,JSON.stringify(db));
  render();
  if(!result.payload)await flush(true);
  document.dispatchEvent(new CustomEvent('chennan:cloud-ready',{detail:{version:cloudVersion,updatedAt:result.updatedAt||null}}));
  return result;
}
async function flush(force=false){
  if(!getToken()||!hydrated)return;
  if(saving){queued=true;return}
  saving=true;
  try{
    const result=await call('save',{payload:db,expectedVersion:cloudVersion||null});
    cloudVersion=Number(result.version||cloudVersion);
    sessionStorage.setItem('chennan-cloud-version',String(cloudVersion));
    document.dispatchEvent(new CustomEvent('chennan:cloud-saved',{detail:{version:cloudVersion,updatedAt:result.updatedAt}}));
  }catch(err){
    if(err.code==='VERSION_CONFLICT'){
      console.error('Cloud version conflict',err.data);
      if(typeof toast==='function')toast('云端数据已在其他设备更新，请刷新后继续');
    }else{
      console.error('Cloud save failed',err);
      if(force)throw err;
      if(typeof toast==='function')toast('云端保存失败，已保留本地缓存');
    }
  }finally{
    saving=false;
    if(queued){queued=false;scheduleSave(100)}
  }
}
function scheduleSave(delay=450){
  if(!getToken()||!hydrated)return;
  clearTimeout(saveTimer);saveTimer=setTimeout(()=>flush(false),delay);
}
async function finishLogin(data){
  if(!data?.token)throw new Error('登录响应缺少会话令牌');
  setToken(data.token);
  sessionStorage.setItem(ACCOUNT_KEY,JSON.stringify(data.account||{}));
  await hydrate();
  return data;
}
async function login(username,password){
  const data=await call('login',{username,password},false);
  if(data?.requires2fa||data?.requires2faEnrollment)return data;
  return finishLogin(data);
}
async function verify2fa(challengeToken,code){
  const data=await call('verify2fa',{challengeToken,code},false);
  return finishLogin(data);
}
async function resume(){
  if(!getToken())return false;
  try{await hydrate();return true}catch(err){if(err.status===401){setToken('');sessionStorage.removeItem(ACCOUNT_KEY)}return false}
}
async function logout(){
  try{if(getToken())await call('logout')}catch(_){}
  setToken('');sessionStorage.removeItem(ACCOUNT_KEY);sessionStorage.removeItem('chennan-cloud-version');hydrated=false;
}
function account(){try{return JSON.parse(sessionStorage.getItem(ACCOUNT_KEY)||'{}')}catch(_){return{}}}

const localSave=save;
save=function(){localSave();scheduleSave()};

window.ChenNanCloud={login,verify2fa,resume,logout,hydrate,flush,hasSession:()=>!!getToken(),account,get version(){return cloudVersion},get hydrated(){return hydrated}};
})();