// Ejemplo de validación para integrar en POST y PUT de /api/admin/negocios.
// Evita más de 3 imágenes y conserva "foto" como portada compatible con el frontend.
const fotoValida = (url) => /^https:\/\/[\w.-]+(?:[:]\d+)?(?:[/?#]|$)/i.test(url) || /^\/api\/imagenes\/[0-9a-f-]{36}$/i.test(url);
export function prepararFotos(body) {
  const urls = Array.isArray(body.fotos) ? body.fotos : (body.foto ? [body.foto] : []);
  if (urls.length > 3) throw Object.assign(new Error('Máximo 3 fotografías por negocio.'), { status: 400 });
  if (urls.some(url=>typeof url !== 'string' || !fotoValida(url.trim()))) {
    throw Object.assign(new Error('Una fotografía tiene una URL inválida.'), { status: 400 });
  }
  const fotos = [...new Set(urls.map(x=>x.trim()))];
  return { fotos, foto: fotos[0] ?? '' };
}
