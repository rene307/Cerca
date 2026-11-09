#!/usr/bin/env node
// IMPORTADOR SEGURO CERCA.CL · no modifica frontend ni server.js
// Usa el backend existente: GET/POST /api/admin/negocios, con código temporal.
// Predeterminado: solo previsualiza. Con --aplicar crea fichas NO publicadas.
// Node.js 18+ (fetch integrado). No requiere instalar dependencias.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const dir=path.dirname(fileURLToPath(import.meta.url));
const args=process.argv.slice(2);
const tiene=f=>args.includes(f);
function getArg(f,fallback){const i=args.indexOf(f);return i>=0&&args[i+1]?args[i+1]:fallback;}
const aplicar=tiene('--aplicar');
const publicar=tiene('--publicar');
const permitirRemoto=tiene('--permitir-remoto');
const url=getArg('--url',process.env.CERCA_URL||'http://localhost:3000').replace(/\/$/,'');
const dest=new URL(url);
if(!['http:','https:'].includes(dest.protocol))throw Error('URL no HTTP/HTTPS');
if(dest.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(dest.hostname))throw Error('Usa HTTPS para un servidor remoto.');
if(!['localhost','127.0.0.1'].includes(dest.hostname)&&!permitirRemoto)throw Error('Servidor externo: agrega --permitir-remoto solo si es tu API CERCA.cl.');
if(publicar&&!aplicar)throw Error('--publicar exige --aplicar');
const rl=createInterface({input,output});
async function req(ruta,method='GET',body,token=''){
 const h={'Accept':'application/json'};
 if(body!==undefined)h['Content-Type']='application/json';
 if(token)h.Authorization='Bearer '+token;
 let res;try{res=await fetch(url+'/api'+ruta,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body)});}catch(e){throw Error('No conecta al backend '+url+'. Inicia API/PostgreSQL. Detalle: '+e.message);}
 const txt=await res.text();let data;try{data=JSON.parse(txt);}catch{data={error:txt.slice(0,400)}}
 if(!res.ok)throw Error(`HTTP ${res.status} en ${ruta}: ${data.error||txt.slice(0,160)}`);
 return data;
}
function normal(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es-CL').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();}
function key(o){return normal(o.nombre)+'|'+normal(o.comuna);}
async function auth(){
 if(process.env.CERCA_ADMIN_TOKEN?.trim())return process.env.CERCA_ADMIN_TOKEN.trim();
 const email=(process.env.CERCA_ADMIN_EMAIL||await rl.question('Correo administrador CERCA.cl: ')).trim();
 if(!email.includes('@'))throw Error('Correo inválido');
 await req('/admin/solicitar-codigo','POST',{email});
 console.log('Revisa el correo autorizado en tu servidor. El código dura 6 minutos.');
 const codigo=(await rl.question('Código recibido (8 dígitos): ')).trim();
 if(!/^\d{8}$/.test(codigo))throw Error('Código inválido');
 const x=await req('/admin/verificar-codigo','POST',{email,codigo});
 if(!x.token)throw Error('No llegó token de sesión.');
 return x.token;
}
try{
 const fichero=JSON.parse(await readFile(path.join(dir,'negocios_para_importar.json'),'utf8'));
 const propuestas=fichero.negocios;
 if(!Array.isArray(propuestas)||propuestas.length!==25)throw Error('Se esperaban 25 fichas.');
 if(new Set(propuestas.map(key)).size!==propuestas.length)throw Error('El catálogo de origen tiene duplicados.');
 await req('/salud');
 const token=await auth();
 const actuales=await req('/admin/negocios','GET',undefined,token);
 if(!Array.isArray(actuales))throw Error('Respuesta inesperada del listado admin.');
 const existentes=new Set(actuales.map(key));
 const nuevos=propuestas.filter(n=>!existentes.has(key(n)));
 const repetidos=propuestas.filter(n=>existentes.has(key(n)));
 console.log(`\nCERCA.cl · Propuestas ${propuestas.length}, ya existentes ${repetidos.length}, nuevas ${nuevos.length}.`);
 for(const n of repetidos)console.log('  SALTADO (ya existe): '+n.nombre+' / '+n.comuna);
 for(const n of nuevos)console.log('  '+(aplicar?'CREAR BORRADOR':'PREVISUALIZAR')+': '+n.nombre+' / '+n.comuna);
 if(!aplicar){console.log('\nSolo revisión: NO se escribió nada. Para crear borradores: node importar_pizzerias.mjs --aplicar');process.exitCode=0;}
 else if(nuevos.length===0){console.log('\nSin cambios. No se agregaron duplicados.');}
 else{
  if(publicar)console.log('\nATENCIÓN: --publicar hará visibles las fichas NO verificadas.');
  const palabra=(await rl.question('\nEscribe IMPORTAR para crear '+nuevos.length+' fichas '+(publicar?'PÚBLICAS':'como BORRADOR')+': ')).trim();
  if(palabra!=='IMPORTAR'){console.log('Cancelado, sin cambios.');process.exitCode=0;}
  else{
   await mkdir(path.join(dir,'respaldos'),{recursive:true});
   const date=new Date().toISOString().replace(/[:.]/g,'-');
   const bk=path.join(dir,'respaldos','cerca_antes_de_importar_'+date+'.json');
   await writeFile(bk,JSON.stringify({fecha:new Date().toISOString(),negocios:actuales},null,2),'utf8');
   console.log('Respaldo previo: '+bk);
   let creados=0,fallos=0;
   for(const n of nuevos){
    try{
     const payload={...n,publicado:publicar};
     const x=await req('/admin/negocios','POST',payload,token);
     console.log('  OK id='+x.id+' '+n.nombre);
     creados++;
    }catch(e){console.error('  ERROR '+n.nombre+': '+e.message);fallos++; if(creados===0&&String(e.message).includes('inválid'))console.error('Revisa validación backend: campo categoría Pizzerías, foto HTTPS y demás requisitos.');}
   }
   console.log(`\nFINAL: ${creados} creados; ${repetidos.length} ya existentes; ${fallos} con error. Se puede repetir sin duplicar.`);
   if(fallos)process.exitCode=1;
  }
 }
}catch(e){console.error('\nERROR: '+e.message);process.exitCode=1;}
finally{rl.close();}
