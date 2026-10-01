/* Account security: secrets and recovery codes are displayed only for the binding session. */
(function(){
'use strict';
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function dialog(){let d=document.getElementById('securityDialog');if(!d){d=document.createElement('dialog');d.id='securityDialog';d.className='security-dialog';document.body.appendChild(d)}return d}
function close(d){d.close();d.innerHTML=''}
async function open(){
 const d=dialog(),cloud=window.ChenNanCloud;d.innerHTML='<h2>账户安全</h2><p>正在读取验证器状态…</p><button id="securityClose" class="btn ghost">关闭</button>';d.showModal();d.querySelector('#securityClose').onclick=()=>close(d);
 try{const status=await cloud.securityStatus();
 if(status.enabled){d.innerHTML='<h2>动态锁已启用</h2><p>登录需要密码＋验证器验证码。剩余恢复码：'+Number(status.recoveryRemaining)+' 个。</p><p>恢复码应保存在工作台以外的安全位置。更换或丢失验证器时，可用恢复码登录后联系管理员重置绑定。</p><button class="btn ghost" id="securityClose">关闭</button>';d.querySelector('#securityClose').onclick=()=>close(d);return}
 d.innerHTML='<h2>绑定验证器动态锁</h2><p>兼容 Microsoft Authenticator、Google Authenticator。先确认密码，再添加密钥并输入验证码；完成验证后才启用。</p><form id="securityPasswordForm"><label>确认当前密码<input type="password" name="password" autocomplete="current-password" required></label><p id="securityError" role="alert"></p><div class="actions"><button type="button" class="btn ghost" id="securityClose">取消</button><button class="btn primary" type="submit">开始绑定</button></div></form>';
 d.querySelector('#securityClose').onclick=()=>close(d);
 d.querySelector('form').onsubmit=async e=>{e.preventDefault();const button=e.target.querySelector('[type=submit]');button.disabled=true;try{await cloud.flush(true);const result=await cloud.enrollMfa(e.target.elements.password.value);e.target.elements.password.value='';showSeed(d,result,cloud)}catch(error){d.querySelector('#securityError').textContent=error.message;button.disabled=false}};
 }catch(error){d.querySelector('p').textContent=error.message}
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
