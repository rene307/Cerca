import test from 'node:test';
import assert from 'node:assert/strict';
import { DURACION_CODIGO_SEGUNDOS, codigoValido, emailValido, normalizarCorreo, firmarCodigo } from '../src/admin-magic.js';
const secreto='s'.repeat(64);
test('el código temporal dura exactamente 6 minutos',()=>assert.equal(DURACION_CODIGO_SEGUNDOS,360));
test('solo se aceptan exactamente ocho dígitos',()=>{
  assert.equal(codigoValido('01234567'),true);
  for (const valor of ['1234567','123456789','abcdef12','12 34567',12345678]) assert.equal(codigoValido(valor),false);
});
test('correo normalizado antes de comparar con el autorizado',()=>{
  assert.equal(normalizarCorreo('  ADMIN@Ejemplo.CL  '),'admin@ejemplo.cl');
  assert.equal(emailValido('admin@ejemplo.cl'),true);
  assert.equal(emailValido('admin@ejemplo'),false);
});
test('el servidor guarda hash y no el código; el hash depende de sal y secreto',()=>{
  const a=firmarCodigo('admin@ejemplo.cl','salt1','01234567',secreto);
  assert.equal(a.length,64);
  assert.notEqual(a,'01234567');
  assert.notEqual(a,firmarCodigo('admin@ejemplo.cl','salt2','01234567',secreto));
  assert.notEqual(a,firmarCodigo('admin@ejemplo.cl','salt1','01234568',secreto));
});
