import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { leerCafesNunoa, agregarSoloFaltantes } from '../src/nunoa-importacion.js';
import { rutaNegocio, fichaIndexable } from '../src/seo-utils.js';
import { evaluarCalidadNegocio } from '../src/calidad-negocios.js';

const original = JSON.parse(await readFile(new URL('../seed/negocios.json', import.meta.url), 'utf8'));

test('se preserva Casa Miga y las 20 fichas usan el SEO de CERCA', async () => {
  const nuevos = await leerCafesNunoa();
  assert.equal(nuevos.length, 20);
  assert.equal(original.filter(n => n.comuna==='Ñuñoa' && n.categoria==='Cafés').length, 1);
  assert.equal(nuevos[0].nombre, 'Kalopsia Café');
  assert.equal(rutaNegocio(nuevos[0], nuevos), '/nunoa/cafes/kalopsia-cafe');
  assert.equal(nuevos.filter(fichaIndexable).length, 0, 'noindex mientras no se verifique');
  assert.equal(nuevos.some(n => n.calificacion != null || n.opiniones != null),false,'las notas Google no son reputacion CERCA');
  assert.ok(evaluarCalidadNegocio(nuevos[0]).camposFaltantes.includes('Foto real del local'), 'la imagen generada no se considera fotografia real');
});

test('la importacion es incremental, no cambia ni duplica negocios existentes', async () => {
  const nuevos = await leerCafesNunoa();
  const registros = original.map(n => ({...n}));
  let inserted = 0;
  const client = {
    async query(sql, params) {
      if (sql.startsWith('SELECT')) return {rows:registros.filter(n => n.comuna==='Ñuñoa').map(n => ({id:n.id,datos:n}))};
      if (sql.startsWith('INSERT')) { registros.push({...JSON.parse(params[0]), id:100+inserted++}); return {rowCount:1}; }
      throw new Error('Consulta no reconocida');
    }
  };
  assert.deepEqual(await agregarSoloFaltantes(client,nuevos),{agregadas:20,omitidas:0});
  assert.deepEqual(await agregarSoloFaltantes(client,nuevos),{agregadas:0,omitidas:20});
  assert.equal(registros.length, 85);
  assert.deepEqual(registros.slice(0,original.length),original);
  assert.equal(registros.filter(n => n.comuna==='Ñuñoa' && n.categoria==='Cafés').length,21);
});
