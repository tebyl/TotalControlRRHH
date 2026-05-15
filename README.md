# TotalControlRH

Sistema de control operativo de RRHH — aplicación **local-first** construida con React + TypeScript + Tailwind CSS. Sin backend, sin base de datos remota: los datos viven en `localStorage` y se exportan a JSON/XLSX.

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | React 19 + TypeScript 5.9 |
| Build | Vite 7 + vite-plugin-singlefile |
| Estilos | Tailwind CSS 4 |
| Gráficos | Chart.js + react-chartjs-2 |
| Exportación | xlsx (SheetJS) |
| Persistencia | localStorage (cifrado AES-GCM opcional) |
| Tests | Vitest 4 — 95 tests, 6 suites |
| PWA | Service Worker + Web App Manifest |

## Módulos

| Módulo | Descripción |
|--------|-------------|
| **Inicio** | Pantalla de bienvenida con accesos rápidos y métricas |
| **Mi Día** | Vista diaria: urgentes, vencidos, bloqueados, a actualizar |
| **Dashboard** | KPIs y gráficos de estado general + reporte mensual |
| **Cursos / DNC** | Gestión de cursos de capacitación |
| **OCs Pendientes** | Órdenes de compra y su estado |
| **Practicantes** | Seguimiento de practicantes |
| **Evaluaciones** | Evaluaciones psicolaborales |
| **Diplomas / Cert / Lic** | Diplomas, certificados y licencias |
| **Procesos Pend.** | Flujos y procesos internos |
| **Presupuesto** | Control presupuestario |
| **Carga Semanal** | Reporte de carga operativa semanal |
| **Contactos** | Directorio de stakeholders |
| **Reclutamiento** | Procesos de selección |
| **Vales de Gas** | Control de vales de combustible |
| **Configuración** | Importar/exportar datos, backups, cifrado |

## Instalación y uso

### Requisitos

- Node.js 18+
- npm 9+

### Comandos

```bash
npm install        # instalar dependencias
npm run dev        # servidor de desarrollo (http://localhost:5173)
npm run build      # build de producción (dist/index.html — archivo único)
npm run preview    # previsualizar build local (necesario para probar PWA)
npm test           # ejecutar tests (vitest)
npm run lint       # análisis estático (eslint)
```

### Despliegue

El build genera un **único archivo HTML** autónomo (`dist/index.html`). Se puede distribuir sin servidor ni CDN. Para habilitar PWA e instalación, sirve el archivo con HTTPS (p.ej. Netlify, Vercel, o `npm run preview` en local).

## PWA — instalación

La app puede instalarse como aplicación de escritorio/móvil desde Chrome, Edge o Safari iOS:

- Aparece automáticamente un banner **"📲 Instalar Control RH"** cuando el navegador lo permite.
- En móvil: menú del navegador → "Agregar a pantalla de inicio".
- El Service Worker cachea la app para uso **offline**.

## Credenciales por defecto

| Usuario | Contraseña | Rol   |
|---------|-----------|-------|
| KataS   | Tota95    | admin |

Las contraseñas se verifican con SHA-256. Para cambiar credenciales o agregar usuarios, edita `src/auth/authUsers.ts` con el hash correspondiente:

```js
// Calcula el hash en la consola del navegador:
[...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('TuNuevaContraseña')))].map(b=>b.toString(16).padStart(2,'0')).join('')
```

La sesión expira automáticamente después de **8 horas** de inactividad.

## Seguridad y cifrado

- Cifrado **AES-GCM 256-bit** opcional sobre el JSON en localStorage.
- Contraseñas hasheadas con SHA-256; sin texto plano en ningún punto.
- Auditoría de acciones (login, exportaciones, borrado) en `localStorage`.
- Ver [docs/security.md](docs/security.md) para análisis completo de riesgos y controles.

## Arquitectura

```
src/
├── App.tsx                   # Orquestador principal (~650 líneas)
├── modules/                  # 16 módulos lazy-loaded + memo
├── forms/                    # 13 formularios de captura
├── state/                    # useAppData, useModals, useBackups
├── importExport/             # useExportImport (JSON + XLSX)
├── hooks/                    # useInstallPrompt (PWA)
├── storage/                  # localStorage + cifrado AES-GCM
├── auth/                     # login, sesión, roles, permisos
├── audit/                    # registro de acciones
├── layout/                   # AppLayout, sidebar, nav
├── components/               # ui/, tables/, forms/ compartidos
├── shared/                   # badges, helpers, formTypes
├── domain/                   # types.ts, options.ts
└── utils/                    # appHelpers, migrations
```

Ver [docs/architecture.md](docs/architecture.md) para el diagrama completo y decisiones de diseño.

## Modelo de datos

- Ver [docs/data-model.md](docs/data-model.md) para la descripción de tipos y esquema.
- Versión del esquema actual: `6` (`src/storage/migrations.ts`).

## Importación / Exportación

- Exportación a **JSON** (completo, resumen, o anonimizado según rol).
- Exportación a **XLSX** multi-hoja (completo o anonimizado).
- Importación desde XLSX con validación fila a fila y reporte de errores/advertencias.
- Ver [docs/import-export.md](docs/import-export.md) para el flujo completo.

## Gestión de datos

- Auto-guardado en `localStorage` bajo la clave `control_operativo_kata_v5`.
- Backups automáticos antes de operaciones destructivas.
- Desde **Configuración**: exportar JSON/XLSX, importar, crear backups, restaurar ejemplos, cifrar.
- Si se activa **Cifrado local**, la base queda cifrada y se solicita clave al iniciar.

## Sistema de semáforo

| Color | Estado |
|-------|--------|
| 🔴 Rojo | Vencido o crítico |
| 🟡 Amarillo | Próximo a vencer (≤ 3 días) |
| 🟢 Verde | En plazo |
| ⚫ Gris | Sin fecha / cerrado |

## Estado del proyecto — etapas completadas

| Fase | Descripción | Estado |
|------|-------------|--------|
| 1–6 | Extracción de shared/, forms/, modules/ desde App.tsx | ✅ |
| 7 | Hooks personalizados: useExportImport, useModals, useBackups, useAppData | ✅ |
| 8 | Performance: React.lazy + Suspense, memo, useCallback en todos los módulos | ✅ |
| 9 | PWA: manifest, service worker, iconos, install prompt | ✅ |

## Próximas etapas sugeridas

| Fase | Descripción | Prioridad |
|------|-------------|-----------|
| 10 | **Cobertura de tests**: tests de integración por módulo (FormCursos, FormOCs, etc.) | Alta |
| 11 | **Notificaciones nativas**: Web Notifications API para alertas de semáforo al abrir la app | Media |
| 12 | **Sincronización entre pestañas**: `BroadcastChannel` para mantener datos coherentes | Media |
| 13 | **Exportación a PDF**: reporte mensual y fichas individuales via `@react-pdf/renderer` | Baja |
| 14 | **Multi-usuario local**: soporte para más de un perfil en el mismo navegador | Baja |
| 15 | **CI/CD**: GitHub Actions para lint + test en cada push | Baja |
