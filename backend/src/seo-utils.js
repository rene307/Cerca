// CERCA: los slugs se comparten entre la web pública y el sitemap.
export const COMUNAS = ['La Florida','Peñalolén','Macul','Puente Alto','Ñuñoa','Providencia','Santiago'];
export const RUBROS = [
  ['Cafés', 'cafes', 'Cafés'],
  ['Panaderías', 'panaderias', 'Panaderías'],
  ['Computación', 'computacion', 'Computación'],
  ['Viveros', 'viveros', 'Viveros'],
  ['Farmacias', 'farmacias', 'Farmacias'],
  ['Mecánicos', 'mecanicos', 'Mecánicos'],
  ['Bares', 'bares', 'Bares y pubs'],
  ['Peluquería', 'peluquerias', 'Peluquerías'],
  ['Mascotas', 'mascotas', 'Mascotas'],
  ['Vulcanización', 'vulcanizaciones', 'Vulcanizaciones'],
  ['Tiendas', 'tiendas', 'Tiendas'],
  ['Oficios y Profesiones', 'oficios-y-profesiones', 'Oficios y profesiones']
];
export function slug(text = '') {
  return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
export function comunaPorSlug(token, lista = []) {
  return [...COMUNAS, ...lista.map(n => n.comuna)].find(x => slug(x) === token) || null;
}
export function rubroPorSlug(token, lista = []) {
  return RUBROS.find(x => x[1] === token) ||
    [...new Set(lista.map(n => n.categoria))].filter(Boolean)
      .map(c => [c, slug(c), c]).find(r => r[1] === token) || null;
}
export function negociosPublicos(filas) {
  return filas.filter(n => n && n.publicado !== false && n.nombre && n.comuna && n.categoria);
}
// Acepta variantes antiguas guardadas por el administrador, sin cambiar datos existentes.
export function categoriaCanonica(categoria) {
  const normal = slug(categoria);
  const aliases = {
    peluqueria:'Peluquería', peluquerias:'Peluquería',
    panaderia:'Panaderías', panaderias:'Panaderías',
    mecanico:'Mecánicos', mecanicos:'Mecánicos',
    cafe:'Cafés', cafes:'Cafés',
    servicio:'Oficios y Profesiones', servicios:'Oficios y Profesiones',
    oficios:'Oficios y Profesiones', 'oficios-y-profesiones':'Oficios y Profesiones',
    bar:'Bares', bares:'Bares',
    farmacia:'Farmacias', farmacias:'Farmacias'
  };
  return aliases[normal] || categoria;
}
export function rutaComuna(comuna) { return `/${slug(comuna)}`; }
export function rutaRubro(comuna, categoria) {
  const cat = categoriaCanonica(categoria);
  const r = RUBROS.find(x => x[0] === cat);
  return `/${slug(comuna)}/${r ? r[1] : slug(cat)}`;
}
export function rutaNegocio(n, lista) {
  const base = rutaRubro(n.comuna, n.categoria);
  if (!base) return null;
  const raiz = n.slugSeo || slug(n.nombre) || `negocio-${n.id}`;
  const mismos = lista.filter(x => rutaRubro(x.comuna, x.categoria) === base && (x.slugSeo || slug(x.nombre) || `negocio-${x.id}`) === raiz);
  // Sólo cuando hay nombres idénticos se desambigua por ID.
  const sufijo = mismos.length > 1 ? `--${n.id}` : '';
  return `${base}/${raiz}${sufijo}`;
}
export function mismoRubro(n, categoria) {
  return categoriaCanonica(n.categoria) === categoriaCanonica(categoria);
}
export function fichaIndexable(n) {
  // Datos ficticios, sin verificar, no deben mostrarse como negocios confirmados en Google.
  return n.datosVerificados === true && n.publicado !== false &&
    (n.descripcion || '').trim().length >= 70 && !!(n.direccion || n.sitioWeb || n.telefono || n.whatsapp);
}

// Los negocios con nombres duplicados usan el sufijo --ID.
export function slugRutaValido(valor) {
  return typeof valor === 'string' && /^[a-z0-9]+(?:-+[a-z0-9]+)*$/.test(valor);
}
