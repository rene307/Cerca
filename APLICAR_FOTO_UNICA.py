#!/usr/bin/env python3
"""CERCA.cl | parche acotado: una foto por ficha (sin sobreescribir el panel original).
Uso: python APLICAR_FOTO_UNICA.py "C:/ruta/panel-admin.html"
Salida: panel-admin_FOTO1.html en la misma carpeta.
"""
from pathlib import Path
import sys

if len(sys.argv) != 2:
    raise SystemExit('Uso: python APLICAR_FOTO_UNICA.py "C:/ruta/panel-admin.html"')
p = Path(sys.argv[1]).expanduser()
if not p.is_file():
    raise SystemExit('No existe el archivo indicado: ' + str(p))
s = p.read_text(encoding='utf-8-sig')
needle = '<label class="full">URL de fotografía<input name="foto" value="${esc(d.foto||\'\')}" placeholder="https://"></label>'
if 'id="fotoPrincipalArchivo"' in s:
    raise SystemExit('Este archivo ya contiene el editor de una fotografía; no se duplica.')
if 'data-photo-slot=' in s or 'galeriaEditor' in s:
    raise SystemExit('Detectado editor de varias fotografías. Aplica sobre tu panel ORIGINAL (anterior al cambio de 3 fotos).')
if '</style>' not in s or 'function businessForm(n)' not in s or 'async function feature(id)' not in s:
    raise SystemExit('No coincide la estructura HTML/JS del panel. No se modifica nada.')
a = s.index('function businessForm(n)')
b = s.index('async function feature(id)', a)
func = s[a:b]
for token in [needle, "$('cancelEditor').onclick", 'try{await api(n?', "$('businessEditor').innerHTML="]:
    if token not in func:
        raise SystemExit('No se encontró un anclaje seguro: '+repr(token)+'. No se modifica nada.')

css = '''
/* CERCA.cl — un solo archivo fotográfico por ficha */
.foto-unica{padding:15px;border:1px solid #eadbd0;border-radius:12px;background:#fff}
.foto-unica h3{font-size:14px;margin:0 0 5px}
.foto-unica p{font-size:12px;color:#786e78;font-weight:400;margin:0 0 11px}
.foto-unica-contenido{display:flex;flex-wrap:wrap;align-items:center;gap:16px}
.foto-unica-vista{width:190px;height:132px;max-width:100%;flex-shrink:0;display:flex;justify-content:center;align-items:center;border-radius:10px;background:#f5f3f0;overflow:hidden;border:1px solid #ede7e3}
.foto-unica-vista img{object-fit:cover;width:100%;height:100%}
.foto-unica-vista span{font-size:12px;color:#7e747e;text-align:center;padding:12px}
.foto-unica-botones{display:flex;flex-wrap:wrap;align-items:center;gap:10px}
.foto-unica .error-foto{color:#af392e;font-size:12px;font-weight:650;margin-top:10px;min-height:16px}
.foto-unica input[type=file]{display:none}
@media(max-width:700px){.foto-unica-contenido{display:block}.foto-unica-botones{margin-top:12px}}
'''
markup = '''<div class="full foto-unica"><h3>Foto del negocio</h3><p>Una foto principal por ficha · JPG, PNG o WEBP · máximo 5 MB. Puedes subir, reemplazar o eliminar.</p><div class="foto-unica-contenido"><div class="foto-unica-vista"><img id="fotoPrincipalPreview" alt="Foto principal del negocio" hidden><span id="fotoPrincipalVacia">Todavía no hay una foto</span></div><div class="foto-unica-botones"><input type="file" id="fotoPrincipalArchivo" accept="image/jpeg,image/png,image/webp"><input name="foto" type="hidden" value="${esc(d.foto||'')}"><button class="btn xs primary" type="button" id="seleccionarFotoPrincipal">Subir / cambiar foto</button><button class="btn xs danger" type="button" id="quitarFotoPrincipal">Eliminar foto</button></div></div><div class="error-foto" id="errorFotoPrincipal" role="alert" aria-live="polite"></div></div>'''
# New methods in the same scope (token accessible) and no separate async submit listener.
uploader = r'''// CERCA.cl — carga de una sola imagen; ruta protegida por autenticación de administrador.
async function subirFotoUnicaCERCA(archivo){
  const datos=new FormData();datos.append('imagen',archivo,archivo.name);
  let r;
  try{r=await fetch('/api/admin/imagenes',{method:'POST',headers:token?{Authorization:'Bearer '+token}:{},body:datos,cache:'no-store'});}
  catch{throw new Error('No conecta con /api/admin/imagenes. Comprueba el backend.');}
  const json=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(json.error||('Error HTTP '+r.status+' al guardar la fotografía.'));
  const url=json.url;
  if(typeof url!=='string'||!(/^(https:\/\/[^\\s]+|\/api\/imagenes\/[a-f0-9-]{36})$/i.test(url)))throw new Error('El backend no devolvió una URL válida de fotografía.');
  return url;
}
'''
# note regex escaped in JS string exactly; test later
setup = r'''const fotoArch=$('fotoPrincipalArchivo'), fotoURL=$('businessForm').elements.foto;
const fotoImg=$('fotoPrincipalPreview'), fotoVacia=$('fotoPrincipalVacia'), fotoError=$('errorFotoPrincipal');
let fotoTemporal=null;
function vistaFotoUnica(url){
 const permitido=typeof url==='string'&&(url===fotoTemporal&&url.startsWith('blob:')||/^(https:\/\/|\/api\/imagenes\/)/i.test(url));
 fotoImg.hidden=!permitido;fotoVacia.hidden=permitido;
 if(permitido)fotoImg.src=url;else fotoImg.removeAttribute('src');
}
function limpiarFotoTemporal(){if(fotoTemporal){URL.revokeObjectURL(fotoTemporal);fotoTemporal=null;}}
vistaFotoUnica(fotoURL.value);
$('seleccionarFotoPrincipal').onclick=()=>fotoArch.click();
$('quitarFotoPrincipal').onclick=()=>{limpiarFotoTemporal();fotoArch.value='';fotoURL.value='';vistaFotoUnica('');fotoError.textContent='';};
fotoArch.onchange=()=>{
 const f=fotoArch.files?.[0];if(!f)return;
 if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>5*1024*1024){
    fotoError.textContent='Solo JPG, PNG o WEBP de máximo 5 MB.';fotoArch.value='';limpiarFotoTemporal();vistaFotoUnica(fotoURL.value);return;
 }
 limpiarFotoTemporal();fotoError.textContent='';fotoTemporal=URL.createObjectURL(f);vistaFotoUnica(fotoTemporal);
};
'''
func = func.replace(needle, markup, 1)
# Only intercept before existing POST/PUT, leaving all other original data mapping intact.
func = func.replace('try{await api(n?', '''try{
 const archivo=fotoArch.files?.[0];
 if(archivo){fotoError.textContent='';o.foto=await subirFotoUnicaCERCA(archivo);}
 await api(n?''', 1)
# Preserve cancellation + object url cleanup. Existing button behavior kept.
func = func.replace("$('cancelEditor').onclick=$('cancelBusiness').onclick=()=>{$('businessEditor').innerHTML=''};", "$('cancelEditor').onclick=$('cancelBusiness').onclick=()=>{limpiarFotoTemporal();$('businessEditor').innerHTML=''};", 1)
# Ensure setup runs after the template interpolation is constructed.
func = func.replace("$('cancelEditor').onclick", setup + "$('cancelEditor').onclick", 1)
assert "subirFotoUnicaCERCA(archivo)" in func
assert markup in func
s = s[:a]+func+s[b:]
s = s.replace('function businessForm(n)', uploader+'function businessForm(n)', 1)
s = s.replace('</style>', css+'\n</style>', 1)
out = p.with_name(p.stem+'_FOTO1'+p.suffix)
out.write_text(s,encoding='utf-8')
print('CREADO:',out)
print('No se modificó:',p)
print('FOTO1: subir/reemplazar/eliminar, vista previa y guardado usando campo existente foto.')
