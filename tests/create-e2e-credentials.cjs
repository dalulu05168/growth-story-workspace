// Generate an ephemeral test credential. Only its salted verifier leaves the runner.
const fs=require('node:fs');const crypto=require('node:crypto');
const username='e2e_'+process.env.GITHUB_RUN_ID+'_'+process.env.GITHUB_RUN_ATTEMPT;
const password=crypto.randomBytes(32).toString('base64url');const salt=crypto.randomBytes(16).toString('base64');const iterations=210000;
fs.writeFileSync('/tmp/chennan-e2e.json',JSON.stringify({username,password}),{mode:0o600});
fs.writeFileSync('/tmp/provision.json',JSON.stringify({username,salt,iterations,hash:crypto.pbkdf2Sync(password,Buffer.from(salt,'base64'),iterations,32,'sha256').toString('base64')}));
console.log('Ephemeral account verifier prepared; no password logged.');
