#!/usr/bin/env node
// Inspector de posibles duplicados de Ñuñoa. SOLO LECTURA, NO MODIFICA NADA.
const fs = require('fs'); const path = require('path');
const base = process.argv[2];
if (!base || !fs.existsSync(base) || !fs.statSync(base).isDirectory()) {
 console.error('Uso: node VERIFICAR_SIN_CAMBIOS.cjs "C:\\Users\\usuario\\Downloads\\Cerca_Fase1.5"');process.exit(1);
}
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '20_cafes_nunoa_SOLO_DATOS.json'), 'utf8'));
const IGNORE = new Set(['node_modules','.git','dist','build','coverage','.angular','.next','www','android','ios']);
let files=0, found=new Map(), existingNunoaRoutes=[];
const norm=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
function scan(dir, depth=0) {
 if(depth>12 || files>15000)return;
 let entries; try{entries=fs.readdirSync(dir,{withFileTypes:true});}catch{return;}
 for(const en of entries){
  if(en.isDirectory()) { if(!IGNORE.has(en.name))scan(path.join(dir,en.name),depth+1);continue; }
  if(!en.isFile()||!(/\.(json|js|mjs|cjs|ts|html)$/i.test(en.name))) continue;
  const file=path.join(dir,en.name); let size;
  try{size=fs.statSync(file).size;}catch{continue;}
  if(size>2_000_000)continue;
  let txt;try{txt=fs.readFileSync(file,'utf8');}catch{continue;}
  files++;
  const n=norm(txt);
  if (txt.includes('nunoa/cafeterias')||txt.includes('ñuñoa/cafeterias')||txt.includes('nunoa-cafeterias'))existingNunoaRoutes.push(path.relative(base,file));
  for(const x of data.negocios){
   if(n.includes(norm(x.nombre)) || (n.includes(norm(x.direccion)) && n.includes('nunoa'))){
    const a=found.get(x.nombre)||[];a.push(path.relative(base,file));found.set(x.nombre,a);
   }
  }
 }
}
scan(base);
console.log('\nCERCA.cl — INSPECCIÓN DE SOLO LECTURA');
console.log('Archivos examinados:',files,'| Nuevos registros propuestos:',data.negocios.length);
console.log('Rutas/archivos existentes relacionados con Ñuñoa:',existingNunoaRoutes.length);
for(const name of existingNunoaRoutes.slice(0,12)) console.log(' RUTA/ARCHIVO:',name);
for(const b of data.negocios) if(found.has(b.nombre))console.log(' POSIBLE DUPLICADO — revisar:',b.nombre,'| archivos:',found.get(b.nombre).slice(0,4).join(', '));
console.log('Posibles negocios ya referenciados:',found.size);
console.log('\nEste chequeo NO garantiza compatibilidad con PostgreSQL ni ausencia de colisiones.');
console.log('NO SE HA MODIFICADO NINGÚN ARCHIVO.');
