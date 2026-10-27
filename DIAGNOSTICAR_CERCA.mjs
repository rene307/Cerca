// Diagnostico sin credenciales ni datos privados. No guarda ni envia informacion.
for (const [nombre, url] of [
 ['Backend actualizado','http://127.0.0.1:3100/api/admin/estado'],
 ['Angular proxy','http://localhost:4200/api/admin/estado'],
 ['Página de acceso','http://localhost:4200/panel-admin.html']
]) {
 try {
  const r=await fetch(url,{signal:AbortSignal.timeout(5000),headers:{'Cache-Control':'no-store'}});
  const t=await r.text();let d={};try{d=JSON.parse(t)}catch{}
  console.log(`${nombre}: HTTP ${r.status}${d.servicio?' / '+d.servicio:''}`);
  if(url.includes('/api/') && d.servicio!=='CERCA_ADMIN_OTP_V2'){
   console.log('  ERROR: esta ruta la atiende una API antigua o un proxy mal configurado.');
  } else if (d.servicio==='CERCA_ADMIN_OTP_V2') {
   console.log(`  Estado correo SMTP: ${d.correoConfigurado?'CONFIGURADO':'PENDIENTE'}`);
  }
 }catch(e){console.log(`${nombre}: NO RESPONDE (${e.message})`)}
}
console.log('Para corregir errores de API vieja, reinicia ambas ventanas usando los .bat del ZIP.');
