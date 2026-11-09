import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
process.env.SITE_URL='https://cerca.example';
const { registerSeoPages } = await import('../src/seo-pages.js');

const larga='Peluquería de barrio con cortes clásicos, barbería y atención con hora agendada, confirmada con el local.';
const filas=[
  {id:1,datos:{nombre:'Estudio Norte',comuna:'La Florida',categoria:'Peluquería',descripcion:larga,direccion:'Calle 1',datosVerificados:true,foto:'https://images.unsplash.com/x.jpg'},actualizado_en:'2026-11-01T10:00:00Z'},
  {id:2,datos:{nombre:'Demo Sin Verificar',comuna:'La Florida',categoria:'Peluquería',descripcion:'Ejemplo'},actualizado_en:null},
  {id:3,datos:{nombre:'Oculto',comuna:'La Florida',categoria:'Cafés',publicado:false},actualizado_en:null}
];
const eventos=[];
const db={query:async(sql,args)=>{
  if(/INSERT INTO eventos/.test(sql)){eventos.push(args);return {rows:[]};}
  if(/WHERE id=\$1/.test(sql))return {rows:filas.filter(f=>f.id===args[0]).map(f=>({datos:f.datos}))};
  return {rows:filas};
}};
const app=express();registerSeoPages(app,db);
const srv=await new Promise(r=>{const s=app.listen(0,()=>r(s));});
const base=`http://127.0.0.1:${srv.address().port}`;
const get=(p,o={})=>fetch(base+p,{redirect:'manual',...o});
test.after(()=>srv.close());

test('robots.txt apunta al sitemap con SITE_URL y bloquea contacto, API y panel',async()=>{
  const t=await (await get('/robots.txt')).text();
  assert.match(t,/Sitemap: https:\/\/cerca\.example\/sitemap\.xml/);
  for(const d of ['/api/','/seo/contacto/','/panel-admin.html'])assert.ok(t.includes('Disallow: '+d),d);
});
test('sitemap incluye solo fichas verificadas, con lastmod y sin localhost',async()=>{
  const x=await (await get('/sitemap.xml')).text();
  assert.match(x,/<loc>https:\/\/cerca\.example\/la-florida\/peluquerias\/estudio-norte<\/loc><lastmod>2026-11-01<\/lastmod>/);
  assert.ok(!x.includes('demo-sin-verificar')&&!x.includes('oculto')&&!x.includes('localhost'));
});
test('ficha verificada: index, canonical, og:image y JSON-LD; sin verificar: noindex',async()=>{
  const ok=await (await get('/la-florida/peluquerias/estudio-norte')).text();
  assert.match(ok,/name="robots" content="index,follow"/);
  assert.match(ok,/rel="canonical" href="https:\/\/cerca\.example\/la-florida\/peluquerias\/estudio-norte"/);
  assert.match(ok,/og:image" content="https:\/\/images\.unsplash\.com/);
  assert.match(ok,/"@type":"LocalBusiness"/);
  const no=await (await get('/la-florida/peluquerias/demo-sin-verificar')).text();
  assert.match(no,/name="robots" content="noindex,follow"/);
  assert.ok(!no.includes('LocalBusiness'));
});
test('alias, mayúsculas y barra final redirigen 301 a la URL canónica',async()=>{
  for(const p of ['/La-Florida/peluquerias/','/la-florida/peluqueria']){
    const r=await get(p);
    assert.equal(r.status,301,p);
  }
  assert.equal((await get('/la-florida/peluqueria')).headers.get('location'),'/la-florida/peluquerias');
});
test('404 real para comuna, rubro o ficha inexistentes u ocultas',async()=>{
  for(const p of ['/atlantis','/la-florida/dragones','/la-florida/cafes/oculto','/la-florida/..%2Fx'])
    assert.equal((await get(p)).status,404,p);
});
test('robots no cuentan como contacto y personas sí',async()=>{
  filas[0].datos.telefono='+56 9 1234 5678';
  await get('/seo/contacto/telefono/1',{headers:{'user-agent':'Googlebot/2.1 crawler'}});
  assert.equal(eventos.length,0);
  const r=await get('/seo/contacto/telefono/1',{headers:{'user-agent':'Mozilla/5.0 iPhone'}});
  assert.equal(r.status,302);assert.equal(eventos.length,1);
  assert.equal(r.headers.get('x-robots-tag'),'noindex, nofollow');
});
test('respaldos del frontend no se sirven',async()=>{
  assert.equal((await get('/panel-admin.html.respaldo_antes')).status,404);
  assert.equal((await get('/catalogo-respaldo.json')).status,404);
});
