import { readFile } from 'node:fs/promises';
import { db } from './db.js';
import { requireCercaDatabase } from './require-cerca-database.js';
try {
  await requireCercaDatabase();
  const sql = await readFile(new URL('../sql/001_schema.sql',import.meta.url),'utf8');
  await db.query(sql);
  console.log('Esquema CERCA instalado en la base cerca.');
} catch (e) {console.error('Falló migración:',e.message);process.exitCode=1;}
finally {await db.end();}
