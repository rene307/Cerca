// CERCA.cl: completitud factual de la ficha, distinta de reputación o pago.
// Sin acceso a datos personales ni consultas SQL adicionales; entrada JSONB existente.
const valor = x => typeof x === 'string' ? x.trim() : '';
const urlWebValida = x => /^https:\/\/[^\s.]+\.[^\s]+/i.test(valor(x));
const fotoPropia = x => {
  const s=valor(x);
  return !!s && !/images\.unsplash\.com|source\.unsplash\.com|picsum\.photos|placehold\.co|placeholder/i.test(s);
};
export function evaluarCalidadNegocio(n={}) {
  const faltantes=[];
  const pedir=(bien,nombre)=>{if(!bien)faltantes.push(nombre)};
  pedir(valor(n.nombre).length>=2,'Nombre');
  pedir(valor(n.categoria).length>=2,'Categoría');
  pedir(valor(n.comuna).length>=2,'Comuna');
  const descripcion=valor(n.descripcion);
  pedir(descripcion.length>=80 && !/local incluido desde las capturas|fotograf[ií]a gen[eé]rica representativa|texto de ejemplo|descripci[oó]n pendiente/i.test(descripcion),'Descripción original (mínimo 80 caracteres)');
  pedir(valor(n.direccion).length>=5,'Dirección o referencia');
  pedir(n.fotoTipo !== 'ilustrativa-generada' && fotoPropia(n.foto),'Foto real del local');
  pedir(valor(n.horario).length>=5 && !/por confirmar|\(publicado; confirmar\)|horario pendiente|sin confirmar/i.test(valor(n.horario)),'Horario confirmado');
  pedir(/^\+?56\s*9(?:[\s-]?\d){8}$/.test(valor(n.whatsapp)),'WhatsApp +569');
  pedir(urlWebValida(n.sitioWeb) || n.sitioWebEstado==='no posee','Web HTTPS o marcar «No posee»');
  const total=9;
  return {calidadFicha:Math.round(100*(total-faltantes.length)/total),fichaCompleta:faltantes.length===0,camposFaltantes:faltantes};
}
export function conCalidad(n) { return {...n,...evaluarCalidadNegocio(n)}; }
export function compararCalidadNegocios(a,b) {
  const pa=a.calidadFicha??evaluarCalidadNegocio(a).calidadFicha;
  const pb=b.calidadFicha??evaluarCalidadNegocio(b).calidadFicha;
  // Bajo ninguna circunstancia un destacado incompleto supera a uno completo.
  if(pa!==pb)return pb-pa;
  const desta=Number(Boolean(a.destacado)),destb=Number(Boolean(b.destacado));
  if(desta!==destb)return destb-desta;
  if(desta && destb) {
    const orden=(a.prioridadDestacado??100)-(b.prioridadDestacado??100);
    if(orden)return orden;
  }
  return (Number(a.id)||0)-(Number(b.id)||0);
}
