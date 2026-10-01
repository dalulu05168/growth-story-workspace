const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
function releaseFiles(){
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const linked=[...html.matchAll(/(?:src|href)="\.\/([^"?]+)(?:\?[^" ]*)?"/g)].map(m=>m[1]);
  const files=[...new Set(['index.html',...linked,'data/people.json','CNAME',
    'chen-nan-ink.webp','scene-night.webp','scene-warm.webp','scene-blue.webp'])].sort();
  for(const file of files){
    if(path.isAbsolute(file)||file.split('/').includes('..'))throw new Error('Invalid release path: '+file);
    if(!fs.statSync(path.join(root,file)).isFile())throw new Error('Missing release file: '+file);
  }
  return files;
}
module.exports={root,releaseFiles};
