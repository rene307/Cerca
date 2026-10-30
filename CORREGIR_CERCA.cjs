'use strict';
// CERCA.cl – reparar los dos errores mostrados por Netlify (TS2367 e Ionic CSS).
// Ejecutar: node CORREGIR_CERCA.cjs [ruta-del-proyecto]
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(process.argv[2] || process.cwd());
const tsFile = path.join(root, 'frontend', 'src', 'app', 'app.component.ts');
const cssFile = path.join(root, 'frontend', 'src', 'global.scss');
const pkgFile = path.join(root, 'frontend', 'package.json');
const htmlFile = path.join(root, 'frontend', 'src', 'app', 'app.component.html');
function fail(message) { console.error('[ERROR] ' + message); process.exit(1); }
for (const file of [tsFile, cssFile, pkgFile]) if (!fs.existsSync(file)) fail('No encuentro '+file+'; no cambie ningun archivo.');
const originalTs = fs.readFileSync(tsFile, 'utf8');
const originalCss = fs.readFileSync(cssFile, 'utf8');
const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
const html = fs.existsSync(htmlFile) ? fs.readFileSync(htmlFile, 'utf8') : '';
const pattern = /\bn\.categoria\s*===\s*(['"])Cafeterías\1/g;
const matches = [...originalTs.matchAll(pattern)];
const fixedAlready = /String\(n\.categoria\)\s*===\s*(['"])Cafeterías\1/.test(originalTs);
if (matches.length > 1 || (matches.length === 0 && !fixedAlready))
  fail('No encuentro exactamente la comparacion esperada (o aparece varias veces). No hice cambios.');
let newTs = originalTs.replace(pattern, (_, q) => `String(n.categoria) === ${q}Cafeterías${q}`);
// Esta version no usa componentes Ionic, ni declara @ionic/angular como dependencia.
// No eliminar CSS Ionic si alguien cambió el proyecto para usar Ionic realmente.
const usesIonic = /<ion-[\w-]+\b/.test(html) || /['"]@ionic\/angular['"]/.test(newTs);
if (usesIonic) fail('Detecte componentes Ionic. Hay que instalar Ionic en lugar de eliminar CSS. No hice cambios.');
const ionicImport = /^[ \t]*@import[ \t]+['"]@ionic\/angular\/css\/(core|normalize|structure|typography)\.css['"];?[ \t]*(?:\r?\n|$)/gm;
let removed = 0;
const newCss = originalCss.replace(ionicImport, () => { removed++; return ''; });
const otherIonic = /@ionic\/angular\/css\//.test(newCss);
if (otherIonic) fail('Se detectaron otros imports Ionic no previstos. No hice cambios.');
if (newTs === originalTs && newCss === originalCss) {
  console.log('[OK] Los dos problemas ya estaban corregidos. No se cambiaron archivos.');
  process.exit(0);
}
const stamp = new Date().toISOString().replace(/[:.]/g,'-');
const backupDir = path.join(root, 'RESPALDO_ANTES_REPARACION_' + stamp);
fs.mkdirSync(backupDir, {recursive:true});
fs.writeFileSync(path.join(backupDir, 'app.component.ts'), originalTs);
fs.writeFileSync(path.join(backupDir, 'global.scss'), originalCss);
fs.writeFileSync(tsFile, newTs, 'utf8');
fs.writeFileSync(cssFile, newCss, 'utf8');
console.log('[OK] Comparacion Cafeterias corregida: ' + matches.length);
console.log('[OK] Importaciones Ionic eliminadas: ' + removed);
console.log('[OK] Copia de seguridad en: ' + backupDir);
console.log('[SIGUIENTE] cd frontend && npm run build');
if (pkg.dependencies && pkg.dependencies['@ionic/angular'])
  console.log('[AVISO] El package.json incluye Ionic, pero la portada no usa ion-components; revisa otras paginas antes de eliminar mas CSS.');
