-- CERCA.cl | Ficha destacada de Carlos Mecánico
-- Base seleccionada en pgAdmin: cerca (PostgreSQL 18)
-- Comuna PROVISIONAL: La Florida. Confirmar con Carlos antes de publicar.
-- IMPORTANTE: obtener consentimiento para publicar la foto y número de WhatsApp.
-- 5.0 = recomendación editorial, NO promedio de opiniones de usuarios.
-- Seguro al repetir: busca por WhatsApp o por nombre y actualiza en vez de duplicar.
BEGIN;
DO $cerca$
DECLARE
  ficha jsonb := $json${"nombre": "Carlos Mecánico", "categoria": "Mecánicos", "comuna": "La Florida", "descripcion": "Mecánico de confianza, recomendado por una familia que conoce su trabajo. Destaca por su excelente atención, buena disposición y servicio profesional. Consulta directamente por WhatsApp para coordinar tu vehículo.", "foto": "assets/carlos-mecanico.jpg", "icono": "🔧", "origen": "manual", "publicado": true, "destacado": true, "prioridadDestacado": 1, "whatsapp": "+56957691917", "telefono": "+56 9 5769 1917", "calificacion": 5.0, "recomendacionEditorial": true, "opiniones": 0, "datosVerificados": false, "observacionRevision": "5.0 corresponde a una recomendación editorial personal; no representa un promedio de reseñas. Comuna provisional; confirmar con Carlos antes de publicar."}$json$::jsonb;
  encontrado bigint;
BEGIN
  SELECT id INTO encontrado FROM public.negocios
  WHERE lower(btrim(datos->>'nombre')) = lower('Carlos Mecánico')
     OR regexp_replace(coalesce(datos->>'whatsapp',''), '[^0-9]', '', 'g') = '56957691917'
  ORDER BY id LIMIT 1;

  IF encontrado IS NULL THEN
    INSERT INTO public.negocios (datos) VALUES (ficha) RETURNING id INTO encontrado;
    RAISE NOTICE 'Carlos creado con id %', encontrado;
  ELSE
    UPDATE public.negocios
       SET datos = datos || ficha, actualizado_en = now()
     WHERE id = encontrado;
    RAISE NOTICE 'Carlos actualizado con id %', encontrado;
  END IF;
END;
$cerca$;
COMMIT;

-- Comprobar resultado:
SELECT id,datos->>'nombre' AS nombre,datos->>'categoria' AS categoria,
  datos->>'comuna' AS comuna,datos->>'whatsapp' AS whatsapp,
  datos->>'destacado' AS destacado,datos->>'calificacion' AS valoracion_editorial
FROM public.negocios
WHERE lower(datos->>'nombre') = lower('Carlos Mecánico');
