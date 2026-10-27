import test from 'node:test';
import assert from 'node:assert/strict';
import { slug, comunaPorSlug, rubroPorSlug, rutaComuna, rutaRubro, rutaNegocio,
  fichaIndexable, negociosPublicos, slugRutaValido } from '../src/seo-utils.js';

test('URL de comunas y rubros legible y sin acentos',()=>{
  assert.equal(slug('Peñalolén'),'penalolen');
  assert.equal(rutaComuna('La Florida'),'/la-florida');
  assert.equal(rutaRubro('La Florida','Peluquería'),'/la-florida/peluquerias');
  assert.equal(comunaPorSlug('la-florida'),'La Florida');
  assert.equal(rubroPorSlug('peluquerias')[0],'Peluquería');
});
test('URL de negocio única y colisiones',()=>{
  const n={id:3,nombre:'Estudio Norte',comuna:'La Florida',categoria:'Peluquería'};
  assert.equal(rutaNegocio(n,[n]),'/la-florida/peluquerias/estudio-norte');
  const m={...n,id:99};
  assert.equal(rutaNegocio(n,[n,m]),'/la-florida/peluquerias/estudio-norte--3');
  assert.equal(rutaNegocio(m,[n,m]),'/la-florida/peluquerias/estudio-norte--99');
});
test('contenido inventado o sin verificar no debe entrar al sitemap',()=>{
  const n={id:3,nombre:'Demo',comuna:'La Florida',categoria:'Peluquería',descripcion:'Ejemplo',publicado:true};
  assert.equal(fichaIndexable(n),false);
  assert.equal(fichaIndexable({...n,datosVerificados:true,descripcion:'Servicio confirmado y descripción completa de este local para consulta de vecinos.',direccion:'Calle 1'}),true);
  assert.equal(negociosPublicos([n,{...n,id:4,publicado:false}]).length,1);
});

test('rutas validas de fichas con nombres duplicados no quedan bloqueadas por el router',()=>{
  const a={id:3,nombre:'Estudio Norte',comuna:'La Florida',categoria:'Peluquería'};
  const b={...a,id:4};
  const nombreRuta=rutaNegocio(a,[a,b]).split('/').at(-1);
  assert.equal(nombreRuta,'estudio-norte--3');
  assert.equal(slugRutaValido(nombreRuta),true);
  assert.equal(slugRutaValido('estudio-norte'),true);
  assert.equal(slugRutaValido('../secret'),false);
  assert.equal(slugRutaValido('estudio norte'),false);
});
test('una comuna y rubro nuevos tienen rutas legibles sin configuracion manual del backend',()=>{
  const n={id:400,nombre:'Taller Nuevo',comuna:'San Miguel',categoria:'Cerrajería'};
  assert.equal(comunaPorSlug('san-miguel',[n]),'San Miguel');
  assert.equal(rubroPorSlug('cerrajeria',[n])[0],'Cerrajería');
  assert.equal(rutaNegocio(n,[n]),'/san-miguel/cerrajeria/taller-nuevo');
});

test('oficios y servicios que comparten URL no producen fichas duplicadas',()=>{
  const a={id:501,nombre:'Electricista del Barrio',comuna:'La Florida',categoria:'Servicios'};
  const b={...a,id:502,categoria:'Oficios y Profesiones'};
  assert.equal(rutaNegocio(a,[a,b]),'/la-florida/oficios-y-profesiones/electricista-del-barrio--501');
  assert.equal(rutaNegocio(b,[a,b]),'/la-florida/oficios-y-profesiones/electricista-del-barrio--502');
});
