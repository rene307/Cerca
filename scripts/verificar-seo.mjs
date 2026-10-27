const paths=['/', '/api/seo/estado','/la-florida/cafes','/la-florida','/sitemap.xml','/panel-admin.html'];
const origin='http://localhost:4200';
let failures=0;
for(const path of paths){
  try{
    const res=await fetch(origin+path,{signal:AbortSignal.timeout(5000)});
    const html=await res.text();
    const type=res.headers.get('content-type')||'';
    const isSeo=path==='/la-florida/cafes'||path==='/la-florida';
    const correct=res.status===200 && (!isSeo||type.includes('text/html')&&html.includes('<h1>')&&html.includes('rel="canonical"'));
    console.log(`${correct?'OK':'ERROR'} [${res.status}] ${path} ${correct?'':('- '+html.slice(0,110).replace(/\s+/g,' '))}`);
    if(!correct)failures++;
  }catch(e){failures++;console.log('ERROR',path,':',e.cause?.code||e.message);}
}
if(failures){
 console.log('\nComprueba que INICIAR_CERCA_SEO.bat siga abierto y que PostgreSQL este iniciado.');
 console.log('Si aparece 503, revisa backend/.env y el resultado de npm run migrate.');
 process.exitCode=1;
}else console.log('\nCERCA: portada, rutas SEO, sitemap, API y administrador responden.');
