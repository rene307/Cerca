# IA Local V11 — Pentesting práctico (primera fase)

## Qué es
Módulo separado, con controles de alcance. Hace una auditoría de configuración no intrusiva de un sitio web autorizado mediante Node.js: DNS, conexión TCP, una solicitud HTTP HEAD, cabeceras de seguridad y un informe JSON. `investigar` además solicita al modelo Qwen de Ollama una interpretación documentada del informe.

**No es todavía un pentest completo ni modifica los pesos del modelo.** No detecta de forma automática SQLi/XSS, no ejecuta exploits ni ataques y la conexión al agente se habilita opcionalmente con el parche de abajo. `server.js` no se modifica.

## Instalación (Windows / PowerShell)
1. Extrae el ZIP.
2. Abre PowerShell en la carpeta que contiene `INSTALAR.ps1`.
3. Inspecciona los archivos y ejecuta: `powershell -NoProfile -ExecutionPolicy Bypass -File .\INSTALAR.ps1`.
4. El instalador exige `C:\Users\usuario\Desktop\IA_LOCAL_WINDOWS` (donde `usuario` corresponde a tu usuario de Windows), crea `pentest_lab_v11` y no modifica otros archivos.

## Prueba real local
```
cd "$env:USERPROFILE\Desktop\IA_LOCAL_WINDOWS\pentest_lab_v11"
node herramienta.js validar http://127.0.0.1:3417
node herramienta.js auditar http://127.0.0.1:3417
node herramienta.js investigar http://127.0.0.1:3417
```
La prueba `investigar` usa Ollama en `http://127.0.0.1:11434` y toma el modelo de `agente_autonomo/config.json`, o `qwen3:4b` como predeterminado. Si Ollama falla, la auditoría JSON sigue guardada. Si el servidor V11 no está ejecutándose, el informe indicará conexión fallida.

Los reportes se guardan en `pentest_lab_v11\informes`. Nunca se copian chats ni secretos desde la carpeta `data`.

## Alcance
Los objetivos autorizados predeterminados son únicamente `http://127.0.0.1:3417` y `http://127.0.0.1:3000`. Para revisar una web propia, agrega expresamente su **origen** HTTP(S) en `alcance.json`, después de confirmar titularidad o permiso. El agente comprueba el origen antes de acceder y no sigue redirecciones. Evita apuntarlo a servidores de producción para pruebas intrusivas.

## Laboratorio de hacking
Para practicar vulnerabilidades web reales, considera OWASP Juice Shop en Docker **solo en localhost**:
```
docker run --rm --name v11-juice-lab -p 127.0.0.1:3000:3000 bkimminich/juice-shop
```
Puedes practicar en el navegador `http://127.0.0.1:3000`. Requiere Docker instalado. No está iniciado automáticamente por este kit. Documentación: https://github.com/juice-shop/juice-shop

Como siguiente fase, integrar OWASP ZAP Baseline (análisis pasivo con rastreo limitado) y, en un laboratorio aislado, pruebas activas con autorización. Documentación: https://www.zaproxy.org/docs/docker/baseline-scan/ y https://wstg.owasp.org/.

## Seguridad y limitaciones
- No cambia `server.js`, `agente.js`, `package.json`, bases de datos ni tareas programadas.
- No ejecuta comandos que el modelo elija libremente.
- La auditoría hace una única solicitud HEAD más DNS y conexión TCP, sin seguir redirecciones ni leer el cuerpo.
- El resultado de una cabecera ausente es una señal de revisión, NO una vulnerabilidad confirmada.
- La interpretación de Qwen no debe considerarse prueba técnica sin validación.
- Si editas `alcance.json`, verifica que sean sistemas tuyos o autorizados.
- El ZIP fue validado con pruebas Node del control de alcance, HTTP HEAD y redirecciones; la instalación PowerShell y la conexión con tu Ollama se deben verificar en tu Windows.

## Conexión opcional con `agente.js`
El kit incluye un parche específico para el `agente.js` del kit V11 entregado el 30-10-2026. Antes de modificarlo, comprueba sus anclas, genera copia de seguridad y valida sintaxis. Si tu versión difiere, se detiene sin editarla. No modifica `server.js`.

```powershell
cd "$env:USERPROFILE\Desktop\IA_LOCAL_WINDOWS\pentest_lab_v11"
node INTEGRAR_AGENTE.js --comprobar
node INTEGRAR_AGENTE.js --aplicar
cd ..\agente_autonomo
node agente.js pentest http://127.0.0.1:3417
```

El comando `pentest` consulta Qwen para interpretar el informe. Además, Qwen podrá elegir la herramienta `auditar_seguridad_web` cuando se ejecute una tarea del agente en un repositorio Git registrado. Solo se permite la lista exacta de orígenes de `alcance.json`.

**Advertencia:** Es una integración con la CLI del agente, todavía no con el chat HTTP del puerto 3417. No se ha probado con tu Ollama real.
