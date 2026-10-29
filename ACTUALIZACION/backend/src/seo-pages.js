import express from 'express';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMUNAS, RUBROS, slug, comunaPorSlug, rubroPorSlug, negociosPublicos,
  rutaComuna, rutaRubro, rutaNegocio, fichaIndexable, mismoRubro, slugRutaValido, categoriaCanonica } from './seo-utils.js';
import { conCalidad, compararCalidadNegocios } from './calidad-negocios.js';

const FRONT_PUBLIC = fileURLToPath(new URL('../../frontend/public/', import.meta.url));
const FRONT_BUILD = fileURLToPath(new URL('../../frontend/dist/cerca/browser/', import.meta.url));
const esc = (x = '') => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
const cleanOrigin = () => (process.env.SITE_URL || 'http://localhost:4200').replace(/\/+$/,'');
const abs = path => cleanOrigin() + path;
const fullUrl = (n, lista) => abs(rutaNegocio(n, lista));
const isValidSlug = slugRutaValido;

function shell({title,description,canonical,robots='index,follow',body,schema=[]}) {
  const structured = schema.map(entry=>`<script type="application/ld+json">${json(entry)}</script>`).join('\n');
  return `<!doctype html><html lang="es-CL"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description.slice(0,165))}">
<meta name="robots" content="${robots}"><link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="CERCA">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description.slice(0,165))}"><meta property="og:url" content="${esc(canonical)}">
<link rel="icon" href="/assets/cerca-favicon.png" type="image/png"><link rel="stylesheet" href="/seo-pages.css">
${structured}</head><body><header class="top"><div class="wrap bar"><a href="/" class="logo" aria-label="CERCA, ir al inicio"><img src="/assets/cerca-logo-horizontal.png" alt="CERCA" width="184" height="50"></a><nav class="main-nav" aria-label="Navegación principal"><a href="/#explorar">Explorar</a><a href="/#categorias">Categorías</a><a href="/#mapa">Mapa</a><a href="/#negocios">Para negocios</a></nav><div class="top-actions"><span class="nav-city">⌖ Santiago, Chile</span><a href="/#explorar" class="heart" aria-label="Explorar negocios">♡</a><a href="/?publicar=1#negocios" class="publish-button">Publica tu negocio <span aria-hidden="true">↗</span></a></div></div></header>
<main id="contenido" class="wrap">${body}</main><footer><div class="wrap footer-content"><a href="/" class="footer-logo"><img src="/assets/cerca-logo-horizontal.png" alt="CERCA" width="150" height="42"></a><span>Tu barrio más cerca · Negocios y profesionales de tu comuna.</span></div></footer></body></html>`;
}
function bread(secciones){
  const blocks = [{name:'Inicio',url:'/'},...secciones];
  const html = `<nav class="breadcrumbs" aria-label="Ruta de navegación">${blocks.map((x,i)=>i===blocks.length-1?`<span aria-current="page">${esc(x.name)}</span>`:`<a href="${esc(x.url)}">${esc(x.name)}</a><span aria-hidden="true">›</span>`).join('')}</nav>`;
  const schema = {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:blocks.map((x,i)=>({'@type':'ListItem',position:i+1,name:x.name,item:abs(x.url)}))};
  return {html,schema};
}
const contacto = n => {
  const w=(n.whatsapp||'').replace(/\D/g,'');
  const t=(n.telefono||'').replace(/\D/g,'');
  const web = /^https:\/\//.test(n.sitioWeb||'') ? n.sitioWeb : '';
  return `<div class="links">${w.length>=10&&w.length<=15?`<a class="btn" href="/seo/contacto/whatsapp/${n.id}" rel="nofollow">WhatsApp ↗</a>`:''}${t.length>=8&&t.length<=15?`<a class="btn outline" href="/seo/contacto/telefono/${n.id}" rel="nofollow">Llamar</a>`:''}${web?`<a class="btn outline" href="/seo/contacto/web/${n.id}" rel="nofollow">Sitio web ↗</a>`:''}<a class="btn outline" href="/seo/contacto/mapa/${n.id}" rel="nofollow">Cómo llegar ↗</a></div>`;
};
const tarjeta = (n, lista) => {
  const ruta = esc(rutaNegocio(n, lista));
  const wa = (n.whatsapp || '').replace(/\D/g,'');
  const whatsapp = wa.length >= 10 && wa.length <= 15;
  return `<article class="card"><a href="${ruta}" class="photo">${n.foto?`<img src="${esc(n.foto)}" alt="Imagen ilustrativa de ${esc(n.categoria)}" loading="lazy">`:'<span class="empty-photo">⌖</span>'}<span class="photo-category">${esc(n.categoria)}</span></a><div class="cardbody"><h2><a href="${ruta}">${esc(n.nombre)}</a></h2><p class="card-subtitle">${esc(n.categoria)} · ${esc(n.comuna)}</p><p class="details">⌖ ${esc(n.direccion || 'Dirección por confirmar')}</p><div class="card-facts"><div><span>◷ Horario</span><strong>${esc(n.horario || 'Por confirmar')}</strong></div><div><span>★ Reputación CERCA</span><strong>Revisa las evaluaciones en su ficha</strong></div></div><div class="card-actions">${whatsapp?`<a class="whatsapp" href="/seo/contacto/whatsapp/${n.id}" rel="nofollow"><img src="/assets/whatsapp-cerca.svg" width="17" height="17" alt=""> WhatsApp</a>`:''}<a class="more" href="${ruta}">Ver negocio ↗</a></div></div></article>`;
};
const aviso = `<p class="notice">Las fichas pendientes de validación son informativas y podrían tener datos desactualizados. Confirma horarios, teléfonos y disponibilidad directamente con el negocio.</p>`;
const introPorRubro = {
  'Peluquería':'Encuentra alternativas para cortes de pelo, peluquería y barbería. Revisa la ubicación y contacta al local antes de asistir.',
  'Cafés':'Descubre cafeterías del sector para una pausa, un café o algo para acompañar. Consulta los horarios antes de visitar.',
  'Panaderías':'Explora panaderías y pastelerías de la comuna. Revisa los datos publicados y consulta disponibilidad antes de ir.',
  'Mecánicos':'Busca talleres y profesionales de mecánica automotriz del sector. Confirma el tipo de atención y cotiza directamente.',
  'Farmacias':'Encuentra farmacias registradas en la comuna. Confirma horarios, existencias y atención directamente con cada establecimiento.'
};
async function publicos(db) {
  const {rows}=await db.query("SELECT id,datos FROM negocios WHERE jsonb_typeof(datos) = 'object' AND COALESCE(datos->>'publicado','true') <> 'false' ORDER BY id");
  return negociosPublicos(rows.map(r => conCalidad({...r.datos,id:Number(r.id)}))).sort(compararCalidadNegocios);
}
function listarComuna(comuna, lista) {
  const items = lista.filter(x=>x.comuna===comuna);
  const categorias=[...new Set(items.map(n=>categoriaCanonica(n.categoria)))];
  const grupos = categorias.map(cat=>({cat,label:RUBROS.find(r=>r[0]===cat)?.[2] || cat,n:items.filter(x=>mismoRubro(x,cat))}));
  const b = bread([{name:comuna,url:rutaComuna(comuna)}]);
  const title=`Negocios y servicios en ${comuna} | CERCA`;
  const description=`Descubre ${items.length} fichas de negocios y profesionales en ${comuna}. Explora cafeterías, peluquerías, oficios y otros rubros con CERCA.`;
  const body=`${b.html}<section class="headline"><p class="eyebrow"><span class="eyebrow-dot"></span> TU BARRIO MÁS CERCA</p><h1>Descubre tu barrio<br><span>en ${esc(comuna)}.</span></h1><p>${esc(description)}</p></section><section class="sections"><h2>Explora por rubro <span>✦</span></h2><div class="chips">${grupos.length?grupos.map(g=>`<a href="${esc(rutaRubro(comuna,g.cat))}">${esc(g.label)} <b>${g.n.length}</b></a>`).join(''):RUBROS.map(g=>`<a href="${esc(rutaRubro(comuna,g[0]))}">${esc(g[2])}</a>`).join('')}</div></section><section class="listhead"><h2>Negocios de ${esc(comuna)}</h2><p>${items.length} ${items.length===1?'negocio publicado':'negocios publicados'}</p></section>${items.length?`<div class="cards">${items.map(n=>tarjeta(n,lista)).join('')}</div>`:`<div class="empty-state"><h2>Todavía no hay negocios registrados en ${esc(comuna)}</h2><p>Pronto podrás encontrar comercios y profesionales de este sector. ¿Tienes uno?</p><a class="btn" href="/?publicar=1#negocios">Publica tu negocio ↗</a></div>`}${aviso}`;
  const robots = items.some(fichaIndexable) ? 'index,follow':'noindex,follow';
  return {title,description,canonical:abs(rutaComuna(comuna)),robots,body,schema:[b.schema]};
}
function listarRubro(comuna, rubro, lista) {
  const items=lista.filter(x=>x.comuna===comuna && mismoRubro(x,rubro[0]));
  const ruta=rutaRubro(comuna,rubro[0]);
  const b=bread([{name:comuna,url:rutaComuna(comuna)},{name:rubro[2],url:ruta}]);
  const title=`${rubro[2]} en ${comuna} | CERCA`;
  const description=`Encuentra ${items.length} ${rubro[2].toLowerCase()} en ${comuna}. Consulta sus fichas, direcciones, horarios y opciones de contacto en CERCA.`;
  const intro=introPorRubro[rubro[0]] || 'Explora negocios y profesionales de la comuna. Revisa cada ficha para encontrar información y formas de contacto.';
  const body=`${b.html}<section class="headline"><p class="eyebrow"><span class="eyebrow-dot"></span> TU BARRIO MÁS CERCA · ${esc(comuna.toUpperCase())}</p><h1>${esc(rubro[2])}<br><span>en ${esc(comuna)}.</span></h1><p>${esc(intro)}</p></section><section class="listhead"><div><h2>${esc(rubro[2])} cerca de ti <span>✦</span></h2><p>Conoce negocios y profesionales registrados en ${esc(comuna)}.</p></div><strong>${items.length} ${items.length===1?'resultado':'resultados'}</strong></section>${items.length?`<div class="cards">${items.map(n=>tarjeta(n,lista)).join('')}</div>`:`<div class="empty-state"><h2>Aún no hay ${esc(rubro[2].toLowerCase())} publicados en ${esc(comuna)}</h2><p>Esta sección ya tiene su dirección propia. No mostramos negocios inventados. Puedes explorar otro rubro o publicar uno real.</p><a class="btn" href="/?publicar=1#negocios">Publica tu negocio ↗</a></div>`}<section class="below"><h2>Explora también otros rubros</h2><div class="chips">${RUBROS.filter(r=>r[1]!==rubro[1]).slice(0,8).map(r=>`<a href="${esc(rutaRubro(comuna,r[0]))}">${esc(r[2])}</a>`).join('')}</div><p><a href="${esc(rutaComuna(comuna))}">← Ver todos los rubros de ${esc(comuna)}</a></p></section>${aviso}`;
  const robots=items.some(fichaIndexable)?'index,follow':'noindex,follow';
  return {title,description,canonical:abs(ruta),robots,body,schema:[b.schema]};
}
function detalle(n,lista) {
  const ruta=rutaNegocio(n,lista);
  const rubro=RUBROS.find(r=>r[0]===categoriaCanonica(n.categoria)) || [n.categoria,slug(n.categoria),n.categoria];
  const b=bread([{name:n.comuna,url:rutaComuna(n.comuna)},{name:rubro[2],url:rutaRubro(n.comuna,n.categoria)},{name:n.nombre,url:ruta}]);
  const description=`${n.nombre} en ${n.comuna}. ${n.descripcion||'Conoce sus datos de contacto y ubicación en CERCA.'}`;
  const title=`${n.nombre} en ${n.comuna} | CERCA`;
  const verificada=fichaIndexable(n);
  const body=`${b.html}<article class="detail"><section class="headline"><p class="eyebrow"><span class="eyebrow-dot"></span> ${esc(rubro[2].toUpperCase())} · ${esc(n.comuna.toUpperCase())}</p><h1>${esc(n.nombre)}</h1><p class="status">${verificada?'Ficha con datos verificados':'Datos pendientes de verificación por el administrador'}</p></section><div class="detailgrid"><div>${n.foto?`<img class="heroimg" alt="Imagen ilustrativa de ${esc(n.categoria)}" src="${esc(n.foto)}">`:''}<h2>Acerca de ${esc(n.nombre)}</h2><p>${esc(n.descripcion||'Información todavía no informada.')}</p>${n.fechaRevision?`<p class="details">Información pública consultada el ${esc(n.fechaRevision)}. Verifica su vigencia.</p>`:''}</div><aside class="info"><h2>Información</h2><dl><dt>Comuna</dt><dd>${esc(n.comuna)}</dd><dt>Dirección</dt><dd>${esc(n.direccion||'Por confirmar')}</dd><dt>Horario</dt><dd>${esc(n.horario||'Por confirmar')}</dd><dt>Teléfono</dt><dd>${esc(n.telefono||'No informado')}</dd></dl>${contacto(n)}</aside></div><div class="reviewbox"><h2>¿Conoces este negocio?</h2><p>Comparte tu experiencia en CERCA o revisa sus evaluaciones dentro de la plataforma.</p><a href="/?negocio=${n.id}#explorar">Abrir reseñas y evaluación →</a></div><p><a href="${esc(rutaRubro(n.comuna,n.categoria))}">← Más ${esc(rubro[2].toLowerCase())} en ${esc(n.comuna)}</a></p></article>${aviso}`;
  const schema=[b.schema];
  if(verificada){
    const tipo=n.tipoPersona==='persona'?'Person':'LocalBusiness';
    const business={'@context':'https://schema.org','@type':tipo,name:n.nombre,description:n.descripcion,url:abs(ruta),areaServed:{'@type':'AdministrativeArea',name:n.comuna}};
    if(n.direccion)business.address={'@type':'PostalAddress',streetAddress:n.direccion,addressLocality:n.comuna,addressRegion:'Región Metropolitana',addressCountry:'CL'};
    if(n.telefono)business.telephone=n.telefono;
    if(n.sitioWeb&&/^https:\/\//.test(n.sitioWeb))business.sameAs=[n.sitioWeb];
    schema.push(business);
  }
  return {title,description,canonical:abs(ruta),robots:verificada?'index,follow':'noindex,follow',body,schema};
}
export function registerSeoPages(app,db){
  // Permite ver el diseño SSR desde el backend en desarrollo y en producción.
  app.use('/assets',express.static(resolve(FRONT_PUBLIC,'assets')));
  app.get('/seo-pages.css',(_req,res)=>res.sendFile(resolve(FRONT_PUBLIC,'seo-pages.css')));
  app.use(express.static(FRONT_PUBLIC));
  app.use(express.static(FRONT_BUILD));
  app.get('/robots.txt',(_req,res)=>res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /panel-admin.html\nSitemap: ${abs('/sitemap.xml')}\n`));
  app.get('/sitemap.xml',async(req,res,next)=>{
    try {
      const lista=await publicos(db);
      const rutas=new Set(['/']);
      for(const n of lista.filter(fichaIndexable)){
        rutas.add(rutaComuna(n.comuna));rutas.add(rutaRubro(n.comuna,n.categoria));rutas.add(rutaNegocio(n,lista));
      }
      const items=[...rutas].filter(Boolean);
      res.set('Cache-Control','public, max-age=300').type('application/xml')
        .send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items.map(r=>`<url><loc>${esc(abs(r))}</loc></url>`).join('')}</urlset>`);
    }catch(e){next(e);}
  });
  app.get('/seo/contacto/:tipo/:id',async(req,res,next)=>{
    try {
      const id=Number(req.params.id),tipo=req.params.tipo;
      if(!Number.isSafeInteger(id)||id<1||!['whatsapp','telefono','web','mapa'].includes(tipo))return res.sendStatus(404);
      const {rows}=await db.query("SELECT datos FROM negocios WHERE id=$1 AND COALESCE(datos->>'publicado','true') <> 'false'",[id]);
      if(!rows.length)return res.sendStatus(404);
      const n=rows[0].datos;let destino='',evento='';
      if(tipo==='whatsapp'){
        const digitos=(n.whatsapp||'').replace(/\D/g,'');
        if(digitos.length<10||digitos.length>15)return res.sendStatus(404);
        destino=`https://wa.me/${digitos}?text=${encodeURIComponent('Hola, encontré tu ficha en CERCA y quiero consultar por tus servicios.')}`;evento='whatsapp';
      } else if(tipo==='web'){
        if(!/^https:\/\//.test(n.sitioWeb||''))return res.sendStatus(404);
        try {const v=new URL(n.sitioWeb);if(v.protocol!=='https:')return res.sendStatus(404);destino=v.href;}catch{return res.sendStatus(404)}
        evento='web';
      } else if(tipo==='telefono'){
        const tel=(n.telefono||'').replace(/\D/g,'');if(tel.length<8||tel.length>15)return res.sendStatus(404);
        destino=`tel:+${tel}`;evento='telefono';
      } else {
        const terms=[n.nombre,n.direccion,n.comuna,'Santiago Chile'].filter(Boolean).join(' ');
        destino='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(terms);evento='ruta';
      }
      // Métricas agregadas: no se registra el dato personal del visitante.
      await db.query('INSERT INTO eventos(tipo,negocio_id,comuna,categoria) VALUES ($1,$2,$3,$4)',[evento,id,n.comuna,n.categoria]);
      return res.redirect(302,destino);
    }catch(e){next(e)}
  });
  app.get('/:comunaSlug/:rubroSlug?/:negocioSlug?',async(req,res,next)=>{
    try{
      const {comunaSlug,rubroSlug,negocioSlug}=req.params;
      if(![comunaSlug,rubroSlug,negocioSlug].filter(Boolean).every(isValidSlug))return res.sendStatus(404);
      const lista=await publicos(db);
      const comuna=comunaPorSlug(comunaSlug,lista);
      if(!comuna)return res.sendStatus(404);
      let page;
      if(!rubroSlug){page=listarComuna(comuna,lista);}
      else {
        const rubro=rubroPorSlug(rubroSlug,lista);
        if(!rubro)return res.sendStatus(404);
        if(!negocioSlug){page=listarRubro(comuna,rubro,lista);}
        else{
          const posibles=lista.filter(x=>x.comuna===comuna && mismoRubro(x,rubro[0]));
          const negocio=posibles.find(n=>rutaNegocio(n,lista)?.endsWith('/'+negocioSlug));
          if(!negocio)return res.sendStatus(404);
          page=detalle(negocio,lista);
        }
      }
      if(!page)return res.sendStatus(404);
      res.set('Cache-Control','public, max-age=30').status(200).type('html').send(shell(page));
    }catch(e){next(e)}
  });
  app.get('/',(req,res,next)=>res.sendFile(resolve(FRONT_BUILD,'index.html'),err=>{
    if(err)res.status(404).type('text').send('Para abrir la portada en desarrollo usa http://localhost:4200');
  }));
}
