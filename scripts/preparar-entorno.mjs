import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const envPath=resolve(root,'backend','.env');
if(!existsSync(envPath)){
  const candidates=[resolve(root,'..','Cerca_Fase1.5','backend','.env'),resolve(root,'..','Cerca_Fase1.5','backend','.env.local')];
  const old=candidates.find(existsSync);
  if(old){copyFileSync(old,envPath);console.log('Se copio configuracion PostgreSQL existente (sin mostrar secretos).')}
  else {console.error('No se encontro backend/.env. Copia el que usas en Cerca_Fase1.5/backend/.env a este nuevo backend/.env para mantener la conexion PostgreSQL.');process.exit(2)}
}
let env=readFileSync(envPath,'utf8').replace(/^\uFEFF/,'');
function get(k){return (env.match(new RegExp('^'+k+'=(.*)$','m'))||[])[1]?.trim()||''}
function put(k,v,{force=false}={}){
 if(force||!get(k)){
  const re=new RegExp('^'+k+'=.*$','m');
  if(re.test(env))env=env.replace(re,k+'='+v);
  else env=env.trimEnd()+'\n'+k+'='+v+'\n';
 }
}
if(get('PGDATABASE') && get('PGDATABASE')!=='cerca'){
 console.error('Por seguridad no se cambiara la base de datos. Revisa PGDATABASE=cerca en backend/.env.');process.exit(2);
}
put('PGDATABASE','cerca');
put('ADMIN_EMAIL','renerivaslabarca@gmail.com',{force:true});
put('JWT_SECRET',randomBytes(48).toString('hex')); // solo si no existe
if(get('JWT_SECRET').length<32)put('JWT_SECRET',randomBytes(48).toString('hex'),{force:true});
put('SMTP_HOST','smtp.gmail.com');put('SMTP_PORT','465');put('SMTP_SECURE','true');
put('SMTP_USER','renerivaslabarca@gmail.com',{force:true});
put('SMTP_FROM','"CERCA.cl <renerivaslabarca@gmail.com>"',{force:true});
put('CORS_ORIGINS','http://localhost:4200,http://localhost:4201,http://127.0.0.1:4200,http://127.0.0.1:4201');
writeFileSync(envPath,env,{encoding:'utf8',mode:0o600});
if(!get('PGPASSWORD')&&!get('DATABASE_URL'))console.warn('Falta PGPASSWORD: si PostgreSQL lo exige, agrégalo a backend/.env.');
if(!get('SMTP_PASS')){console.warn('Falta SMTP_PASS de Gmail. Ejecuta CONFIGURAR_GMAIL.bat.');process.exit(3)}
console.log('Configuracion local lista. SMTP_PASS presente (no se ha probado el envio).');
