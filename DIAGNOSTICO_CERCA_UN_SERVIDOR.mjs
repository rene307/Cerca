const origin='http://127.0.0.1:4200';
const rutas=[['Portada','/','html'],['API de negocios','/api/negocios','json'],['Salud PostgreSQL','/api/salud','json'],['Panaderias La Florida','/la-florida/panaderias','html'],['Peluquerias La Florida','/la-florida/peluquerias','html']];
let fallas=0;
for(const [nombre,path,tipo] of rutas){
 try{
  const res=await fetch(origin+path,{signal:AbortSignal.timeout(6000),cache:'no-store'});
  const raw=await res.text();
  if(!res.ok)throw Error('HTTP '+res.status+' '+raw.slice(0,180));
  const mime=res.headers.get('content-type')||'';
  if(tipo==='json'){
    if(!mime.includes('json')) throw Error('RESPUESTA NO JSON. Probablemente sigue abierto Angular antiguo en el puerto 4200.');
    const data=JSON.parse(raw);
    if(Array.isArray(data)){
      const rubros=data.filter(n=>String(n.comuna||'').trim()==='La Florida'&&/panader|peluquer/i.test(n.categoria||''));
      console.log('OK',nombre,`${data.length} negocios publicos; ${rubros.length} panaderias/peluquerias de La Florida`);
      for(const n of rubros.slice(0,15))console.log('  ',n.categoria,'-',n.nombre);
      if(!data.length)console.log('ATENCION: la base esta VACIA; recupera/importa tus fichas anteriores mediante los procedimientos documentados.');
    }else console.log('OK',nombre,JSON.stringify(data));
  }else if(path!=='/' && !/<link rel="canonical"/i.test(raw))throw Error('No se recibio HTML SEO. Un Angular antiguo puede seguir sirviendo el puerto.');
  else console.log('OK',nombre,mime);
 }catch(e){fallas++;console.log('ERROR',nombre,e.message);}
}
console.log(fallas?'DIAGNOSTICO: revisa los errores anteriores.':'LISTO: portada, API, PostgreSQL y SEO responden desde el MISMO puerto 4200.');
if(fallas)process.exitCode=1;
