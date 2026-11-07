# SugarTrack – Control de glucosa

App web para registrar glicemias e insulina, ver historial, gráficas y estadísticas, y generar un reporte (PDF one-pager) para el médico.

- **Producción:** https://glicemia.raceclubhub.com (también https://glicemia-app.pages.dev)
- **Datos reales de uso:** no hacer cambios destructivos en la base de datos.

## Tecnología
React 19 · Vite · Tailwind 4 · Supabase (auth correo/contraseña + base de datos) · Chart.js · jsPDF · lucide-react.

## Desarrollo
```bash
npm install
npm run dev      # desarrollo local
npm run build    # genera dist/
npm run lint
```

## Despliegue
Cloudflare Pages (proyecto `glicemia-app`) conectado a este repo. Cada push/merge a `main` publica automáticamente. Las ramas y PR generan una vista previa.
Configuración: preset Vite · build `npm run build` · output `dist`.

## Base de datos (Supabase)
El esquema y las políticas de seguridad (RLS) están en [`supabase/schema.sql`](supabase/schema.sql). Se ejecuta en el SQL Editor y es seguro repetirlo (no borra datos).
En Authentication → URL Configuration: Site URL `https://glicemia.raceclubhub.com`, y Redirect URLs con ese dominio y `https://glicemia-app.pages.dev` (necesario para el correo de recuperar contraseña).

Más contexto, decisiones y pendientes en [`HANDOFF.md`](HANDOFF.md).
