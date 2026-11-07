# SugarTrack – HANDOFF (contexto del proyecto)

## Qué es
App personal/familiar para registrar glicemias e insulina (Lispro rápida, Lantus lenta, o ambas). Idioma: español. Rangos fijos: <70 hipo (rojo), 70–180 en rango (verde), >180 hiper (amarillo).

## Dónde vive
- Repo: `Nancyms1012/glicemia-app` (rama `main`).
- Hosting: Cloudflare Pages, proyecto `glicemia-app` → `glicemia.raceclubhub.com` y `glicemia-app.pages.dev`. Deploy automático al hacer merge a `main`.
- Supabase: proyecto `ymtiobihwezxhlmfxoci`. URL y llave `anon` están en `src/utils/supabase.js` (la llave anon es pública por diseño; la protección real es RLS).

## Estructura
- `src/App.jsx`: sesión, pestañas (Registrar, Historial, Gráficas, Stats, Alertas, Reporte), encabezado.
- `src/hooks/useGlicemias.js`: CRUD de `registros` + estadísticas (carga paginada de 1000 en 1000).
- `src/hooks/useRecordatorios.js`: lee/guarda `recordatorios` (upsert por `user_id`).
- `src/components/`: Login (con recuperar contraseña), NuevaPassword, CambiarPassword, Respaldo, RegistroForm, Historial, Graficas, Estadisticas, OnePager, Recordatorios, AlertaRecordatorio.
- `src/utils/`: constants (rangos, momentos, insulinas, `parseFechaLocal`), respaldo (JSON/CSV), exportarPDF, tablaBGLog (estilo Tidepool), generarGraficas.
- `supabase/schema.sql`: tablas, RLS y políticas.

## Datos
- `registros`: id, user_id, fecha, hora, valor (nullable: se puede registrar solo insulina), momento, insulina, dosis_insulina, notas, creado_en.
- `recordatorios`: user_id (PK), horarios (jsonb), activados, actualizado_en.
- Cuando insulina = "ambas", las dosis se guardan como texto en `notas` ("Lispro: XU, Lantus: YU") y `dosis_insulina` es la suma.
- Fechas: usar `parseFechaLocal` (evita el corrimiento de un día por zona horaria).

## Decisiones
- Todo vive en la nube (Supabase), no en localStorage. Respaldo: botón "Respaldo" en la app (JSON completo y CSV).
- Se quitó el botón "Borrar todo" (eran datos reales). Solo se borra registro por registro desde Historial.

## Historial relevante
- Nov 2026: respaldo exportado desde Supabase; PR de respaldo, contraseña (recuperar/cambiar), quitar "Borrar todo", schema.sql, carga paginada.
- La tabla `recordatorios` NO existía en Supabase hasta ejecutar `supabase/schema.sql`.

## Pendientes
1. **Recordatorios con la app cerrada:** hoy solo avisan con la app abierta (temporizador en `AlertaRecordatorio`). Requiere PWA (manifest + service worker) y notificaciones push (Cloudflare Worker + claves VAPID).
2. PWA instalable (manifest, íconos) y modo sin conexión.
3. Guardar dosis de Lispro/Lantus en columnas separadas (hoy van como texto en `notas`) con migración de los registros viejos.
4. Metas/rangos configurables; HbA1c estimada (GMI) y tiempo en rango.
