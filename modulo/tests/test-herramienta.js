'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const os=require('node:os');
const fs=require('node:fs/promises');
const path=require('node:path');
const {validarDestino,auditar}=require('../herramienta.js');
const scope={allowedOrigins:['http://127.0.0.1:3417','http://127.0.0.1:3000']};
test('acepta origen local permitido',()=>assert.equal(validarDestino('http://127.0.0.1:3417',scope),'http://127.0.0.1:3417'));
test('rechaza destino no autorizado',()=>assert.throws(()=>validarDestino('https://example.com',scope),/alcance autorizado/));
test('rechaza URL con credenciales',()=>assert.throws(()=>validarDestino('http://admin:pwd@127.0.0.1:3417',scope),/credenciales/));
test('rechaza rutas arbitrarias',()=>assert.throws(()=>validarDestino('http://127.0.0.1:3417/admin',scope),/rutas/));
test('rechaza query/fragment',()=>assert.throws(()=>validarDestino('http://127.0.0.1:3417/?op=delete',scope),/parametros/));
test('rechaza otros esquemas',()=>assert.throws(()=>validarDestino('file:///etc/passwd',scope),/HTTP/));
test('rechaza cambios de host',()=>assert.throws(()=>validarDestino('http://127.0.0.1.evil.test:3417',scope),/alcance autorizado/));
test('rechaza entradas no string',()=>assert.throws(()=>validarDestino({},scope),/URL invalida/));
test('auditoria real: HEAD a servidor de prueba local y genera informe',async()=>{
  const hits=[];
  const server=http.createServer((req,res)=>{
    hits.push([req.method,req.url]);
    res.writeHead(200,{'Content-Security-Policy':"default-src 'self'",'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});
    res.end();
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'v11-audit-'));
  try{
    const {file,data}=await auditar(origin,{scope:{allowedOrigins:[origin]},reportDir:dir});
    assert.equal(data.http.statusCode,200);
    assert.equal(data.http.disponible,true);
    assert.equal(data.tcp.abierto,true);
    assert.deepEqual(hits,[['HEAD','/']]);
    assert.match((await fs.readFile(file,'utf8')),/content-security-policy/);
  }finally{
    await new Promise(resolve=>server.close(resolve));
    await fs.rm(dir,{recursive:true,force:true});
  }
});
test('auditoria real: no sigue redirecciones',async()=>{
  let hits=0;
  const server=http.createServer((req,res)=>{hits++;res.writeHead(302,{Location:'http://example.com'});res.end();});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'v11-audit-'));
  try{
    const {data}=await auditar(origin,{scope:{allowedOrigins:[origin]},reportDir:dir});
    assert.equal(data.http.statusCode,302);
    assert.equal(data.http.redirectsFollowed,false);
    assert.equal(hits,1);
  }finally{await new Promise(resolve=>server.close(resolve));await fs.rm(dir,{recursive:true,force:true});}
});
