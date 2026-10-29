// CERCA.cl — parche seguro de lectura y completitud; no cambia el diseño.
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=__dirname;
const ts=path.join(root,'frontend','src','app','app.component.ts');
const cal=path.join(root,'backend','src','calidad-negocios.js');
function requireFile(p){if(!fs.existsSync(p))throw Error('No está el archivo esperado: '+p)}
requireFile(ts);requireFile(cal);
const t=fs.readFileSync(ts,'utf8'), c=fs.readFileSync(cal,'utf8');
const original=`  private async iniciarServidor():Promise<void> {
    try {
      const negocios=await this.api<Negocio[]>('/negocios');
      this.negocios=negocios;
      const [opiniones,reputacion]=await Promise.all([
        this.api<OpinionCerca[]>('/reputacion'),
        this.api<Record<number,{promedio:number;total:number}>>('/reputacion/resumen')]);
      this.opinionesCerca=opiniones;this.reputacionPorNegocio=reputacion;
      this.apiDisponible=true;this.apiError='';
      if(this.visitaPendiente){this.visitaPendiente=false;this.registrarEvento('visita');}
    }catch(e){this.apiDisponible=false;this.apiError=(e as Error).message;}
  }`;
const reparado=`  private async iniciarServidor():Promise<void> {
    try {
      // Mostrar los negocios desde PostgreSQL aunque falle el servicio auxiliar de reseñas.
      const negocios=await this.api<Negocio[]>('/negocios');
      this.negocios=negocios.map(n=>({ ...n,
        comuna: n.comuna === 'Nunoa' ? 'Ñuñoa' : n.comuna,
        categoria: (n.categoria === 'Cafeterías' ? 'Cafés' : n.categoria) as Negocio['categoria']
      }));
      this.apiDisponible=true;this.apiError='';
      if(this.visitaPendiente){this.visitaPendiente=false;this.registrarEvento('visita');}
      try {
        const [opiniones,reputacion]=await Promise.all([
          this.api<OpinionCerca[]>('/reputacion'),
          this.api<Record<number,{promedio:number;total:number}>>('/reputacion/resumen')]);
        this.opinionesCerca=opiniones;this.reputacionPorNegocio=reputacion;
      }catch(e){
        // Un error secundario no puede ocultar las fichas ya cargadas.
        this.opinionesCerca=[];this.reputacionPorNegocio={};
        console.warn('CERCA: no se pudieron leer opiniones; directorio disponible.',e);
      }
    }catch(e){this.apiDisponible=false;this.apiError=(e as Error).message;}
  }`;
let nt=t;
if(nt.includes('// Un error secundario no puede ocultar las fichas ya cargadas.')){
 console.log('Frontend: la reparación de carga ya estaba instalada.');
}else{
 if(!nt.includes(original))throw Error('El código de carga Angular difiere de la versión revisada. Sin cambios.');
 nt=nt.replace(original,reparado);
}
// Una imagen generada no debe contar como "foto real del local".
const originalQuality="pedir(fotoPropia(n.foto),'Foto real del local');";
const revisedQuality="pedir(fotoPropia(n.foto) && n.fotoTipo !== 'ilustrativa-generada' && n.fotoRealAutorizada !== false,'Foto real del local');";
let nc=c;
if(!nc.includes(revisedQuality)){
 if(!nc.includes(originalQuality))throw Error('La regla de completitud es distinta. Sin cambios.');
 nc=nc.replace(originalQuality,revisedQuality);
}
// Mismo criterio en el respaldo de la puntuación del frontend.
const fotoAnterior="if (n.foto && !/images\\.unsplash\\.com|source\\.unsplash\\.com|picsum\\.photos|placehold\\.co|placeholder/i.test(n.foto)) puntos++;";
const fotoNueva="if (n.foto && n.fotoTipo !== 'ilustrativa-generada' && n.fotoRealAutorizada !== false && !/images\\.unsplash\\.com|source\\.unsplash\\.com|picsum\\.photos|placehold\\.co|placeholder/i.test(n.foto)) puntos++;";
if(nt.includes(fotoAnterior) && !nt.includes(fotoNueva))nt=nt.replace(fotoAnterior,fotoNueva);
if(!nt.includes('  fotoTipo?: string;')){
 const marker='  foto: string;\n  icono: string;';
 if(!nt.includes(marker))throw Error('No se encuentra tipo de foto en Negocio. Sin cambios.');
 nt=nt.replace(marker,'  foto: string;\n  fotoTipo?: string;\n  fotoRealAutorizada?: boolean;\n  icono: string;');
}
const patchFiles=[[ts,nt,t],[cal,nc,c]].filter(([p,newText,oldText])=>newText!==oldText);
if(patchFiles.length){
 const backup=path.join(root,'RESPALDO_CERCA_NUNOA_LOGICA_'+new Date().toISOString().replace(/[:.]/g,'-'));
 fs.mkdirSync(backup,{recursive:true});
 for(const [p,newText] of patchFiles){
   fs.copyFileSync(p,path.join(backup,path.basename(p)));
   fs.writeFileSync(p+'.temp',newText,'utf8');
   fs.renameSync(p+'.temp',p);
 }
 console.log('Corrección de lectura y calidad: OK. Respaldo: '+backup);
}else console.log('Corrección de carga/calidad ya estaba instalada.');
console.log('Sin cambios de portada, filtros, URL ni diseño.');
