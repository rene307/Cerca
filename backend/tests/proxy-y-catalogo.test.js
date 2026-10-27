import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const project = new URL('../../',import.meta.url);
const proxy=JSON.parse(await readFile(new URL('frontend/proxy.conf.json',project),'utf8'));
const catalogo=JSON.parse(await readFile(new URL('backend/seed/negocios.json',project),'utf8'));
test('rutas API y paginas SEO anidadas via backend 3100',()=>{
  for(const x of ['/api/**','/la-florida/**','/puente-alto/**','/seo/contacto/**','/seo-pages.css']) {
    assert.equal(proxy[x]?.target,'http://127.0.0.1:3100','Falta proxy: '+x);
  }
});
test('catalogo de respaldo: fichas de peluqueria de La Florida',()=>{
  const items=catalogo.filter(n=>n.comuna==='La Florida' && n.categoria==='Peluquería');
  assert.equal(items.length,4);
  const ids=catalogo.map(n=>n.id);
  assert.equal(new Set(ids).size,ids.length);
});
