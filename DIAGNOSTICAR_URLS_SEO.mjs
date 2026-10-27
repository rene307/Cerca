// Diagnostico sin credenciales ni cambios en la base de datos.
// Separa problemas de PostgreSQL, backend Node y proxy de Angular.
const BASE_API='http://127.0.0.1:3100';
const BASE_WEB='http://localhost:4200';
async function comprobar(origen,ruta){
  const url=origen+ruta;
  try{
    const response=await fetch(url,{redirect:'manual',headers:{Accept:'text/html,application/json;q=0.9,*/*;q=0.8','Cache-Control':'no-cache'},signal:AbortSignal.timeout(6000)});
    const ct=response.headers.get('content-type')||'';
    const body=(await response.text()).slice(0,120000);
    const titulo=body.match(/<title\b[^>]*>([^<]*)<\/title>/i)?.[1]||'';
    const canonical=body.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1]||'';
    let json={};if(ct.includes('json'))try{json=JSON.parse(body)}catch{}
    console.log(`${String(response.status).padEnd(3)} ${url}`);
    if(titulo)console.log(`    Titulo: ${titulo}`);
    if(canonical)console.log(`    Canonical: ${canonical}`);
    if(json.servicio)console.log(`    Servicio: ${json.servicio}`);
    if(json.postgresql)console.log('    PostgreSQL: conectado');
    if(json.error)console.log(`    Mensaje del servidor: ${json.error}`);
    const error=noData => ({response,status:response.status,ct,body,canonical,json,noData});
    return error(false);
  }catch(e){console.log(`SIN CONEXION ${url} -> ${e.message}`);return {status:0,error:e.message}}
}
console.log('=== CERCA DIAGNOSTICO RUTAS SEO ===');
console.log('No transmite datos personales ni imprime contrasenas.');
console.log('\n1. API Node/Express (puerto 3100)');
const api=await comprobar(BASE_API,'/api/admin/estado');
const bd=await comprobar(BASE_API,'/api/salud');
console.log('\n2. Paginas HTML directamente desde el backend (sin Angular)');
const seo=await comprobar(BASE_API,'/la-florida/cafes');
await comprobar(BASE_API,'/la-florida/peluquerias');
await comprobar(BASE_API,'/la-florida/peluquerias/estudio-norte');
await comprobar(BASE_API,'/sitemap.xml');
console.log('\n3. Misma pagina atravesando el proxy del frontend (puerto 4200)');
const proxy=await comprobar(BASE_WEB,'/la-florida/cafes');
console.log('\n=== RESULTADO ===');
if(!api.status)console.log('API NO INICIADA: ejecuta 01_API_CERCA.bat y revisa el error en esa ventana.');
else if(api.json?.servicio !== 'CERCA_ADMIN_OTP_V2')console.log('API DIFERENTE: tienes una version antigua en el puerto 3100. Cierra procesos viejos.');
else if(bd.status!==200)console.log('POSTGRESQL NO DISPONIBLE: revisa backend/.env y la base de datos "cerca".');
else if(seo.status===404)console.log('RUTA SIN DATOS: PostgreSQL responde, pero faltan negocios de Cafes en La Florida o no estan publicados. Revisa la base "cerca".');
else if(seo.status>=500)console.log('ERROR DEL BACKEND: abre la ventana "CERCA - API" y lee "CERCA ERROR", codigo y mensaje (omite contrasenas).');
else if(seo.status===200 && !seo.canonical)console.log('BACKEND SIN SEO: respuesta HTML incorrecta. Posible proceso viejo o ruta interceptada.');
else if(!proxy.status)console.log('SEO EN BACKEND OK, WEB NO DISPONIBLE: ejecuta 02_WEB_CERCA.bat.');
else if(proxy.status!==200 || !proxy.canonical)console.log('SEO EN BACKEND OK, PERO EL PROXY FALLA: reinicia Angular con 02_WEB_CERCA.bat.');
else console.log('RUTAS SEO OK: backend, PostgreSQL y proxy responden con HTML y canonical.');
console.log('Nota: sin una ficha verificada, Google recibira "noindex" y no la anadira al sitemap.');
