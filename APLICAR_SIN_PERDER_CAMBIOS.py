# Ejecutar: python APLICAR_SIN_PERDER_CAMBIOS.py "C:/proyecto/frontend/public/panel-admin.html"
# Genera panel-admin_FOTOS3.html, sin sobreescribir tu panel vigente.
import sys
from pathlib import Path

if len(sys.argv)!=2:
    raise SystemExit('Uso: python APLICAR_SIN_PERDER_CAMBIOS.py ruta/al/panel-admin.html')
actual=Path(sys.argv[1]); s=actual.read_text(encoding='utf-8')
if 'data-photo-slot=' in s:
    raise SystemExit('Este archivo ya parece tener un editor de hasta tres fotografías. No se modifica.')
base=Path(__file__).resolve().parent/'frontend'/'panel-admin.html'
plantilla=base.read_text(encoding='utf8')

def segmento(src,a,b):
    inicio=src.index(a);final=src.index(b,inicio)
    return src[inicio:final]

if '</style>' not in s or 'function businessForm(n)' not in s or 'async function feature(id)' not in s:
    raise SystemExit('No coincide la estructura del panel; no se realiza ningún cambio.')
css=segmento(plantilla,'/* CERCA.cl: editor de galería','</style>')
helpers=segmento(plantilla,'// Una ficha contiene hasta tres fotos.','function businessForm(n){')
# Selección de secciones para conservar la validación de calidad y los módulos
# adicionales que el panel real haya recibido después de esta versión.
a=s.index('function businessForm(n)');b=s.index('async function feature(id)',a)
func=s[a:b]
# Comprobar los puntos de anclaje antes de escribir.
needle='<label class="full">URL de fotografía<input name="foto" value="${esc(d.foto||\'\')}" placeholder="https://"></label>'
for token in [needle, "$('businessEditor').innerHTML=", "$('businessEditor').scrollIntoView", "'descripcion','foto'", 'try{await api(n?']:
    if token not in func:
        raise SystemExit('No se encontró el punto de integración '+repr(token)+'. No se modifica el panel.')
# En esta variable se conservan las fotos existentes y su vista previa.
setup="""const fotos=urlsFotosNegocio(d).map(url=>({tipo:'url',url,preview:url}));
function liberarFotoTemporal(obj){if(obj?.tipo==='archivo'&&obj.preview)URL.revokeObjectURL(obj.preview)}
function finalizarFotos(){fotos.forEach(liberarFotoTemporal);$('businessEditor').innerHTML=''}
"""
func=func.replace("$('businessEditor').innerHTML=",setup+"$('businessEditor').innerHTML=",1)
# Reemplazo de un único campo de URL por tres espacios de fotos.
markup='''<div class="full" aria-label="Administrar fotografías"><div class="photo-editor-header"><h3>Fotografías del negocio</h3><span class="photo-editor-counter" id="contadorFotos">${fotos.length} / 3 fotos</span></div><p class="photo-editor-note">Subir, cambiar o eliminar hasta 3 fotos (JPG, PNG o WEBP; 5 MB por foto). La primera será la portada. Los cambios se aplican al guardar.</p><div id="galeriaEditor" class="photo-editor-grid"></div><p id="errorFoto" class="photo-editor-alert" role="alert" aria-live="polite"></p></div>'''
func=func.replace(needle,markup,1)
# No sobrescribir lo que tu panel ya hace con el resto de los datos.
func=func.replace("'descripcion','foto'","'descripcion'",1)
func=func.replace("$('cancelEditor').onclick=$('cancelBusiness').onclick=()=>{$('businessEditor').innerHTML=''};", "$('cancelEditor').onclick=$('cancelBusiness').onclick=finalizarFotos;",1)
# El POST de foto se hace antes del POST/PUT de la ficha: si falla, la ficha no se sobrescribe.
func=func.replace('try{await api(n?', '''try{const urls=[];for(const f of fotos){urls.push(f.tipo==='archivo'?await subirFotoAdministrador(f.archivo):f.url)}o.fotos=urls;o.foto=urls[0]||'';await api(n?''',1)
# La función de galería de la plantilla está dentro de businessForm.
render=segmento(plantilla,' const mostrarError='," $('cancelEditor').onclick")
func=func.replace("$('businessEditor').scrollIntoView",render+"$('businessEditor').scrollIntoView",1)
if "$('cancelEditor').onclick=$('cancelBusiness').onclick=()=>" in func:
    raise SystemExit('No se pudo integrar correctamente el cierre/cancelación; no se modifica.')
s=s[:a]+func+s[b:]
s=s.replace('</style>',css+'</style>',1)
s=s.replace('function businessForm(n)',helpers+'function businessForm(n)',1)
out=actual.with_name(actual.stem+'_FOTOS3'+actual.suffix)
out.write_text(s,encoding='utf-8')
print('Archivo creado:',out)
print('El panel original NO se modificó.')
