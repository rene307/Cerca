import {registerSeoPages} from './src/seo-pages-preview.mjs';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const data=JSON.parse(readFileSync('./seed/negocios.json','utf8'));
const db={query:async (sql,args)=>{if(sql.includes('FROM negocios'))return {rows:data.map(n=>({id:n.id,datos:n}))};return {rows:[]}}};
const routes=new Map();
const app={use(){},get(route,handler){routes.set(route,handler)}};
registerSeoPages(app,db);
const main=routes.get('/:comunaSlug/:rubroSlug?/:negocioSlug?');
function mockRes(){return {code:200,html:'',set(){return this},status(n){this.code=n;return this},type(){return this},send(x){this.html=x;return this},sendStatus(x){this.code=x;return this}}};
const cases=[['mecanicos','la-florida','mecanicos',undefined,200,'<h1>Mecánicos<br><span>en La Florida.'],['cafes','la-florida','cafes',undefined,200,'<h1>Cafés<br><span>en La Florida.'],['sin-negocios','nunoa','farmacias',undefined,200,'Aún no hay'],['ficha','la-florida','mecanicos','mecanica-a-domicilio-24-7',200,'Acerca de'],['comuna','la-florida',undefined,undefined,200,'Descubre tu barrio']];
mkdirSync('../preview',{recursive:true});
for(const [name,comunaSlug,rubroSlug,negocioSlug,expected,needle] of cases){
 const res=mockRes(); await main({params:{comunaSlug,rubroSlug,negocioSlug}},res,err=>{throw err});
 if(res.code!==expected || (needle && !res.html.includes(needle)))throw new Error(name+' code '+res.code+' missing '+needle);
 if(name==='sin-negocios' && !res.html.includes('noindex,follow'))throw new Error('Sin resultados debe ser noindex');
 if(res.html)writeFileSync(`../preview/${name}.html`,res.html);
 console.log(name,res.code,res.html.length)
}
