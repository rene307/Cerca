// Verifica respuesta JSON + HTML SSR de la misma base, a traves de Angular y Express.
// No envia credenciales ni altera PostgreSQL.
const rutas = [
  ['API directa','http://127.0.0.1:3100/api/negocios','json'],
  ['API por Angular','http://127.0.0.1:4200/api/negocios','json'],
  ['Peluquerias SEO directa','http://127.0.0.1:3100/la-florida/peluquerias','html'],
  ['Peluquerias en Angular','http://127.0.0.1:4200/la-florida/peluquerias','html-dev'],
];
let errores=0;
for(const [nombre,url,modo] of rutas){
  try {
    const res=await fetch(url,{signal:AbortSignal.timeout(5000)});
    const texto=await res.text();
    if(!res.ok)throw Error('HTTP '+res.status+' '+texto.slice(0,130));
    if(modo==='json'){
      const items=JSON.parse(texto);
      if(!Array.isArray(items))throw Error('No devolvio un listado JSON de negocios');
      const peluquerias=items.filter(n=>n.comuna==='La Florida' && ['Peluquería','Peluquerías'].includes(n.categoria));
      console.log('OK ',nombre,':',items.length,'negocios; peluquerias de La Florida:',peluquerias.length);
      if(!items.length)console.log('  AVISO: la base no tiene negocios publicados. Verifica el catalogo y el administrador.');
    }else if(modo==='html-dev') {
      if(/<link rel="canonical"/i.test(texto) && /<h1>\s*Peluquer/i.test(texto)) {
        console.log('OK ',nombre,': HTML SEO de Express.');
      }else if(/<app-root/i.test(texto)) {
        console.log('AVISO ',nombre,': Angular sirvio su SPA. La interfaz filtra usando la URL y la API; el SEO rastreable se verifica en 3100.');
      }else throw Error('Respuesta HTML inesperada.');
    }else {
      if(!/<link rel="canonical"/i.test(texto) || !/<h1>\s*Peluquer/i.test(texto))
        throw Error('Express no devolvio la pagina SEO HTML de peluquerias.');
      console.log('OK ',nombre,'pagina SEO con H1 y canonical');
    }
  }catch(e){errores++;console.log('ERROR',nombre,':',e.message);}
}
console.log('\n'+(errores ? 'Revisa los errores anteriores: el sistema no esta totalmente conectado.' : 'CONEXION CERCA CORRECTA: API y SEO responden.'));
if(errores)process.exitCode=1;
