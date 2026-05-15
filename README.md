# TotalControlRH

Sistema operativo de RRHH construido con React, TypeScript y Tailwind CSS. La app mantiene un enfoque local-first y puede funcionar sin red, pero ya incorpora un modo colaborativo opcional con Supabase para autenticacion, workspaces, usuarios remotos, sincronizacion y Realtime. Esta preparada para despliegue en Vercel como SPA/PWA.

## Estado actual

| Area | Estado |
|------|--------|
| App base | React 19 + Vite 7 + TypeScript 5.9 |
| Persistencia local | `localStorage`, backups y cifrado AES-GCM opcional |
| Backend opcional | Supabase Auth, Postgres/RLS, workspaces, usuarios y Realtime |
| Deploy | Vercel o cualquier hosting estatico con HTTPS |
| PWA | Manifest, Service Worker e instalacion en escritorio/movil |
| CI | GitHub Actions con type-check, lint, test y build |
| Tests | 166 tests pasando en Vitest |

## Stack tecnologico

| Capa | Tecnologia |
|------|------------|
| Framework | React 19 + TypeScript 5.9 |
| Build | Vite 7 + vite-plugin-singlefile |
| Estilos | Tailwind CSS 4 |
| Iconos | lucide-react |
| Graficos | Chart.js + react-chartjs-2 |
| Exportacion | xlsx (SheetJS), JSON |
| Backend | Supabase JS v2 |
| Tests | Vitest 4 + Testing Library |
| Deploy | Vercel |

## Modulos funcionales

| Modulo | Descripcion |
|--------|-------------|
| Inicio | Accesos rapidos y metricas generales |
| Mi Dia | Urgentes, vencidos, bloqueados y registros por actualizar |
| Dashboard | KPIs, graficos y reporte mensual |
| Cursos / DNC | Gestion de cursos de capacitacion |
| OCs Pendientes | Ordenes de compra y seguimiento |
| Practicantes | Seguimiento de practicantes |
| Evaluaciones | Evaluaciones psicolaborales |
| Diplomas / Cert / Lic | Documentos, certificados y licencias |
| Procesos Pend. | Flujos y procesos internos |
| Presupuesto | Control presupuestario |
| Carga Semanal | Reporte de carga operativa |
| Contactos | Directorio de stakeholders |
| Reclutamiento | Procesos de seleccion |
| Vales de Gas | Control de vales de combustible |
| Administracion | Usuarios, equipo, cifrado, auditoria y datos |

## Instalacion local

### Requisitos

- Node.js 24, segun `.nvmrc`
- npm
- Proyecto Supabase solo si se usara sincronizacion remota

### Comandos

```bash
npm install
npm run dev
npm run build
npm run preview
npm test
npm run lint
```

El servidor de desarrollo queda normalmente en `http://localhost:5173`.

## Variables de entorno

Copia `.env.example` a `.env` para desarrollo local:

```bash
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

En Vercel agrega las mismas variables en:

`Project Settings -> Environment Variables`

Para un build puramente local/offline puedes omitirlas. En ese caso la app sigue funcionando con `localStorage`, pero no habilita usuarios remotos, workspaces ni sincronizacion.

## Supabase

El codigo actual espera el modelo colaborativo por workspace:

- `app_users`: registro funcional de usuarios de la app.
- `workspaces`: equipos de trabajo con codigo de invitacion.
- `workspace_members`: membresias y rol dentro del workspace.
- `app_data`: un JSONB con el estado completo por workspace.

### Setup recomendado para proyecto nuevo

1. Crear proyecto en Supabase.
2. En Authentication -> Providers -> Email, desactivar confirmacion de email si sera una app interna.
3. Ejecutar en SQL Editor:
   - `supabase/schema-v2.sql`
   - `supabase/schema-v3-users.sql`
4. Activar Realtime para `public.app_data` si Supabase no lo deja activo automaticamente.
5. Crear el primer usuario admin desde la UI o insertar el usuario bootstrap indicado en `schema-v3-users.sql`.
6. Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en local y Vercel.

`supabase/schema.sql` queda como esquema inicial/legacy por usuario. Para la version colaborativa actual, la referencia practica es `schema-v2.sql` + `schema-v3-users.sql`.

El flujo actual usa RPCs seguras para operaciones sensibles:

- `join_workspace_by_invite`: permite unirse por codigo sin abrir lectura global de workspaces.
- `verify_app_user`: valida usuario y hash dentro de Supabase sin exponer `password_hash` en lecturas anonimas.

## Vercel

Configuracion sugerida:

| Campo | Valor |
|-------|-------|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm ci` |
| Node.js | 24 si esta disponible, o alinear con `.nvmrc` |

Despues del deploy:

1. Verificar login local y remoto.
2. Crear o unirse a un workspace.
3. Confirmar que un cambio en un navegador se refleja en otro.
4. Instalar la PWA desde HTTPS.

## Arquitectura

```text
src/
  App.tsx                  Orquestador principal
  backend/                 Cliente Supabase, auth, usuarios, workspace y sync
  state/                   useAppData, backups y modales
  storage/                 localStorage, migraciones y cifrado
  auth/                    sesion local, roles y permisos
  audit/                   log de acciones
  modules/                 modulos de negocio
  forms/                   formularios de captura
  components/              UI, tablas, sidebar y formularios compartidos
  importExport/            JSON/XLSX import-export
  domain/                  tipos, opciones, fechas, presupuesto y estado
  hooks/                   hooks reutilizables
  shared/                  helpers y tipos compartidos
```

La sincronizacion remota vive en `src/state/useAppData.ts`: primero hidrata desde localStorage, luego resuelve sesion/workspace en Supabase y sincroniza cambios con debounce. Si no hay Supabase configurado, se queda en modo local.

## Seguridad

Controles actuales:

- Sesion local con expiracion de 8 horas.
- Roles `admin`, `rrhh` y `lectura`.
- Hash SHA-256 para credenciales funcionales de la app.
- Cifrado local AES-GCM opcional.
- Auditoria local de login, logout, CRUD, import, export y backups.
- RLS en tablas Supabase.

Hallazgos a resolver antes de produccion sensible:

- El login remoto ya no lee `password_hash`, pero aun usa SHA-256 funcional de app. Para produccion sensible conviene migrar credenciales a Supabase Auth real, Edge Functions con rate limit o un proveedor corporativo.
- La gestion de usuarios remotos sigue disponible para cualquier sesion autenticada a nivel RLS; la UI la limita a admin, pero la regla ideal deberia validar rol admin en backend.
- El cifrado local no protege datos ya sincronizados en Supabase, porque `app_data.data` se guarda como JSONB legible para quien tenga permisos de base.

## Auditoria rapida del 2026-05-15

| Check | Resultado |
|-------|-----------|
| `npm test` | OK, 12 archivos y 166 tests pasando |
| `npm run build` | OK, genera `dist/index.html` single-file |
| `npm run lint` | OK |

Acciones completadas en prioridad alta:

- Corregidas reglas React Hooks/Compiler sin cambiar el flujo funcional.
- Endurecido Supabase: RLS de workspace por membresia y union por codigo via RPC.
- Login remoto ajustado para no leer `password_hash` desde el cliente.
- `schema-v2.sql` deja de hacer `DROP TABLE app_data` y se detiene si detecta tabla legacy por usuario.

## Proximas etapas sugeridas

| Fase | Objetivo | Prioridad |
|------|----------|-----------|
| 1 | Validar deploy Vercel end-to-end con variables, PWA y Realtime | Alta |
| 2 | Aplicar scripts SQL en Supabase real y probar create/join workspace con dos usuarios | Alta |
| 3 | Restringir gestion de usuarios a admin tambien desde backend/RLS | Alta |
| 4 | Agregar tests de sincronizacion: create/join workspace, load/save remoto, conflicto simple | Media |
| 5 | Mejorar estrategia offline: cola de cambios, ultimo escritor y aviso de conflicto | Media |
| 6 | Actualizar `docs/architecture.md` y `docs/security.md`, hoy aun describen solo local-first | Media |
| 7 | Evaluar cifrado remoto o minimizacion de datos sensibles antes de almacenar en JSONB | Media |
| 8 | Agregar smoke tests e2e para login, CRUD principal y exportacion | Baja |
| 9 | Monitoreo ligero en Vercel: errores cliente, web vitals y trazas de sync | Baja |

## Credenciales bootstrap

Existe un usuario local de respaldo para operar offline o iniciar el sistema:

| Usuario | Rol |
|---------|-----|
| KataS | admin |

Antes de usar en produccion, cambia o elimina el bootstrap en `src/auth/authUsers.ts` y crea usuarios remotos desde Administracion.

## Gestion de datos

- Auto-guardado local por usuario.
- Backups antes de operaciones destructivas.
- Exportacion JSON completa/resumen/anonimizada segun rol.
- Exportacion XLSX multi-hoja.
- Importacion XLSX con validacion y reporte.
- Cifrado local opcional con clave no persistida.
- Sincronizacion Supabase por workspace cuando esta configurado.
