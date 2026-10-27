import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../src/server.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../../frontend/public/panel-admin.html',import.meta.url),'utf8');
const client=readFileSync(new URL('../../frontend/public/admin.js',import.meta.url),'utf8');
test('panel servido por backend mismo origen y sin script inline',()=>{
 assert.match(code,/app\.get\('\/panel-admin\.html'/);
 assert.match(code,/app\.get\('\/admin\.js'/);
 assert.match(html,/script src="\/admin\.js" defer/);
 assert.doesNotMatch(html,/<script>/);
});
test('endpoint OTP existe y obliga a correo único',()=>{
 assert.match(code,/app\.post\('\/api\/admin\/solicitar-codigo'/);
 assert.match(code,/ADMIN_CORREO_UNICO='renerivaslabarca@gmail.com'/);
 assert.match(code,/DURACION_CODIGO_SEGUNDOS/);
});
test('cliente consulta API mismo origen con path relativo',()=>{
 assert.match(client,/fetch\('\/api'\+path/);
 assert.match(client,/CERCA_ADMIN_OTP_V3/);
});
