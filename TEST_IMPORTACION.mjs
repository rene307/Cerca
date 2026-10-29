import { readFile } from 'node:fs/promises';
import { validar, agregarSoloFaltantes } from './importar-nunoa-directo.mjs';
import assert from 'node:assert/strict';
const lista=JSON.parse(await readFile(new URL('./datos/nunoa-cafes.json',import.meta.url),'utf8'));
validar(lista);
const catalogo=[{nombre:'Casa Miga',comuna:'Ñuñoa',categoria:'Cafés'}];
let siguiente=2;
const cliente={async query(sql,arg){
  if(sql.startsWith('SELECT'))return {rows:catalogo.map(datos=>({datos}))};
  if(sql.startsWith('INSERT')){catalogo.push({...JSON.parse(arg[0]),id:siguiente++});return {rowCount:1};}
  throw Error('consulta inesperada');
}};
assert.deepEqual(await agregarSoloFaltantes(cliente,lista),{nuevas:20,omitidas:0});
assert.deepEqual(await agregarSoloFaltantes(cliente,lista),{nuevas:0,omitidas:20});
assert.equal(catalogo.length,21);
assert.equal(catalogo[0].nombre,'Casa Miga');
console.log('OK: 21 cafeterias contando Casa Miga, sin duplicados ni ediciones de otros negocios.');
