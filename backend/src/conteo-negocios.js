import 'dotenv/config';
import {db} from './db.js';
import {requireCercaDatabase} from './require-cerca-database.js';
try {
 await requireCercaDatabase();
 const {rows:[r]}=await db.query('SELECT count(*)::integer AS total FROM negocios');
 console.log(`Registros guardados en cerca: ${r.total}`);
 if(r.total===0)process.exitCode=2;
} catch(e){console.error('ERROR CONSULTANDO CATALOGO:',e.message);process.exitCode=1;}
finally {await db.end();}
