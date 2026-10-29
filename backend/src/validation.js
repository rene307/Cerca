export const frecuencias=['diaria','semanal','mensual'];
export const intenciones=['ahora','pronto','explorando'];
export const tiposContenido=['promociones','actualizaciones','ambas'];
export const tiposEvento=['visita','busqueda','categoria','ficha','whatsapp','web','ruta','telefono','favorito','suscripcion','gps','campana'];
export function contactoNormalizado(canal, raw){
  if(typeof raw!=='string')return null;
  const s=raw.trim().toLowerCase();
  if(canal==='email')return s.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)?s:null;
  if(canal==='whatsapp'){const d=s.replace(/\D/g,'');return /^569\d{8}$/.test(d)?'+'+d:null;}
  return null;
}
export function validarSuscriptor(v){
  if(!v||typeof v!=='object')return null;
  const canal=v.canal==='whatsapp'?'whatsapp':v.canal==='email'?'email':null;
  if(!canal||!frecuencias.includes(v.frecuencia)||!intenciones.includes(v.intencion)||!tiposContenido.includes(v.contenido)||v.consentimiento!==true)return null;
  const contacto=contactoNormalizado(canal,v.contacto);
  if(typeof v.nombre!=='string'||v.nombre.trim().length<2||v.nombre.length>90)return null;
  if(!contacto||typeof v.comuna!=='string'||!v.comuna.trim()||v.comuna.length>90)return null;
  if(!Array.isArray(v.intereses)||v.intereses.length<1||v.intereses.length>8||!v.intereses.every(x=>typeof x==='string'&&x.length>0&&x.length<=60))return null;
  return {canal,nombre:v.nombre.trim(),contacto,frecuencia:v.frecuencia,intencion:v.intencion,contenido:v.contenido,comuna:v.comuna.trim(),intereses:[...new Set(v.intereses.map(x=>x.trim()))]};
}
export function validarNegocio(v){
  if(!v||typeof v!=='object'||Array.isArray(v)||typeof v.nombre!=='string'||!v.nombre.trim()||v.nombre.length>140||typeof v.categoria!=='string'||v.categoria.length>90||typeof v.comuna!=='string'||!v.comuna.trim()||v.comuna.length>90)return null;
  const o={...v,nombre:v.nombre.trim(),comuna:v.comuna.trim()};
  if(JSON.stringify(o).length>250000)return null; // Foto base64 grande: subir por almacenamiento de objetos en producción.
  if(o.sitioWeb&& !/^https:\/\//i.test(o.sitioWeb))return null;
  if(o.latitud!=null&&(!Number.isFinite(Number(o.latitud))||Math.abs(Number(o.latitud))>90))return null;
  if(o.longitud!=null&&(!Number.isFinite(Number(o.longitud))||Math.abs(Number(o.longitud))>180))return null;
  return o;
}
export function validarOpinion(v){
  if(!v||!Number.isInteger(v.negocioId)||v.negocioId<1||!Number.isInteger(v.estrellas)||v.estrellas<1||v.estrellas>5||!Array.isArray(v.motivos)||v.motivos.length<1||v.motivos.length>6||!v.motivos.every(x=>typeof x==='string'&&x.length<=80)||typeof v.dispositivo!=='string'||v.dispositivo.length<12||v.dispositivo.length>150||typeof(v.comentario||'')!=='string'||String(v.comentario||'').length>500)return null;
  return {negocioId:v.negocioId,estrellas:v.estrellas,motivos:v.motivos,dispositivo:v.dispositivo,comentario:String(v.comentario||'')};
}
