/* Account security: secrets and recovery codes are displayed only for the binding session. */
(function(){
'use strict';
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function dialog(){let d=document.getElementById('securityDialog');if(!d){d=document.createElement('dialog');d.id='securityDialog';d.className='security-dialog';document.body.appendChild(d)}return d}
function close(d){d.close();d.innerHTML=''}
async function open(){
 const d=dialog(),cloud=window.ChenNanCloud;d.innerHTML='<h2>账户安全</h2><p>正在读取验证器状态…</p><button id="securityClose" class="btn ghost">关闭</button>';d.showModal();d.querySelector('#securityClose').onclick=()=>close(d);
 try{const status=await cloud.securityStatus();
 if(status.enabled){d.innerHTML='<h2>动态锁已启用</h2><p>登录需要密码＋验证器验证码。剩余恢复码：'+Number(status.recoveryRemaining)+' 个。</p><p>更换验证器需再次确认密码及验证码或恢复码，新绑定验证成功后才替换旧验证器。</p><div class="actions"><button class="btn primary" id="replaceAuthenticator">更换验证器</button><button class="btn ghost" id="securityClose">关闭</button></div><div id="securitySessions"></div>';d.querySelector('#securityClose').onclick=()=>close(d);d.querySelector('#replaceAuthenticator').onclick=()=>replace(d,cloud);await sessions(d,cloud);return}
 d.innerHTML='<h2>绑定验证器动态锁</h2><p>兼容 Microsoft Authenticator、Google Authenticator。先确认密码，再添加密钥并输入验证码；完成验证后才启用。</p><form id="securityPasswordForm"><label>确认当前密码<input type="password" name="password" autocomplete="current-password" required></label><p id="securityError" role="alert"></p><div class="actions"><button type="button" class="btn ghost" id="securityClose">取消</button><button class="btn primary" type="submit">开始绑定</button></div></form>';
 sessions(d,cloud);
 d.querySelector('#securityClose').onclick=()=>close(d);
 d.querySelector('form').onsubmit=async e=>{e.preventDefault();const button=e.target.querySelector('[type=submit]');button.disabled=true;try{await cloud.flush(true);const result=await cloud.enrollMfa(e.target.elements.password.value);e.target.elements.password.value='';showSeed(d,result,cloud)}catch(error){d.querySelector('#securityError').textContent=error.message;button.disabled=false}};
 }catch(error){d.querySelector('p').textContent=error.message}
}
async function sessions(d,cloud){
 let host=d.querySelector('#securitySessions');if(!host){host=document.createElement('div');host.id='securitySessions';d.appendChild(host)}
 try{const result=await cloud.listSessions();host.innerHTML='<h3>已登录会话</h3><p>可撤销其他浏览器的访问；会话仅展示时间，不收集设备指纹。</p>'+result.sessions.map(x=>'<div class="backup-row"><div><b>'+(x.current?'当前浏览器':'其他浏览器')+'</b><small>登录 '+escape(new Date(x.created_at).toLocaleString())+' · 最近访问 '+escape(new Date(x.last_seen_at).toLocaleString())+'</small></div>'+(x.current?'':'<button class="btn ghost small" data-revoke="'+escape(x.id)+'">撤销</button>')+'</div>').join('')+'<button class="btn ghost small" id="revokeOtherSessions">撤销其他全部会话</button>';host.querySelectorAll('[data-revoke]').forEach(b=>b.onclick=async()=>{try{await cloud.revokeSessions(b.dataset.revoke);sessions(d,cloud)}catch(e){toast(e.message)}});host.querySelector('#revokeOtherSessions').onclick=async()=>{if(!confirm('撤销其他浏览器的登录？当前浏览器保持登录。'))return;try{await cloud.revokeSessions();sessions(d,cloud)}catch(e){toast(e.message)}};}catch(e){host.textContent=e.message}
}
function replace(d,cloud){
 d.innerHTML='<h2>安全更换验证器</h2><p>先核验当前身份。新验证器启用前旧验证器仍有效；提交核验所用的恢复码会被消耗。</p><form id="replaceAuthenticatorForm"><label>当前密码<input type="password" name="password" autocomplete="current-password" required></label><label>当前验证码或未使用的恢复码<input name="proof" autocomplete="one-time-code" required></label><p id="securityError" role="alert"></p><div class="actions"><button class="btn ghost" type="button" id="securityClose">取消</button><button class="btn primary" type="submit">核验并生成新密钥</button></div></form>';
 d.querySelector('#securityClose').onclick=()=>close(d);d.querySelector('form').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('[type=submit]');b.disabled=true;try{await cloud.flush(true);const proof=e.target.elements.proof.value.trim(),result=await cloud.replaceMfa(e.target.elements.password.value,/^\d{6}$/.test(proof)?proof:undefined,/^\d{6}$/.test(proof)?undefined:proof);showSeed(d,result,cloud)}catch(err){d.querySelector('#securityError').textContent=err.message;b.disabled=false}};
}
function showSeed(d,result,cloud){
 d.innerHTML='<h2>添加到验证器</h2><p>在验证器中选择“手动输入设置密钥”，账户名称填“辰南”，类型选择“基于时间”。</p><label>设置密钥<code class="security-seed">'+escape(result.secret)+'</code></label><p>密钥仅用于本次绑定，请勿分享。取消后不会启用动态锁。</p><form id="securityCodeForm"><label>6位验证码<input name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required></label><p id="securityError" role="alert"></p><div class="actions"><button type="button" id="securityClose" class="btn ghost">取消</button><button type="submit" class="btn primary">验证并启用</button></div></form>';
 d.querySelector('#securityClose').onclick=()=>close(d);
 d.querySelector('form').onsubmit=async e=>{e.preventDefault();const button=e.target.querySelector('[type=submit]');button.disabled=true;try{const verified=await cloud.verifyMfa(result.challenge,e.target.elements.code.value);showRecovery(d,verified.recoveryCodes)}catch(error){d.querySelector('#securityError').textContent=error.message;button.disabled=false}};
}
function showRecovery(d,codes){
 d.innerHTML='<h2>动态锁已启用</h2><p>恢复码只展示一次，每个只能使用一次。请下载并保存在工作台以外的位置，丢失验证器时可用它们登录。</p><pre class="security-recovery">'+codes.map(escape).join('\n')+'</pre><div class="actions"><button class="btn primary" id="downloadRecovery">下载恢复码</button><button class="btn ghost" id="securityClose">我已保存，关闭</button></div>';
 d.querySelector('#downloadRecovery').onclick=()=>{const url=URL.createObjectURL(new Blob(['辰南撰写 · 一次性恢复码\n'+codes.join('\n')],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='chennan-recovery-codes.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 d.querySelector('#securityClose').onclick=()=>{codes.fill('');close(d)};
}
const host=document.querySelector('.header-right');if(host){const button=document.createElement('button');button.id='accountSecurity';button.className='btn ghost small';button.textContent='安全设置';button.onclick=open;host.prepend(button)}
})();
