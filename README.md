# TotalControlRH

Sistema de control operativo de RRHH — aplicación local-first construida con React + TypeScript + Tailwind CSS.

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 7 + vite-plugin-singlefile |
| Estilos | Tailwind CSS 4 |
| Gráficos | Chart.js + react-chartjs-2 |
| Exportación | xlsx (SheetJS) |
| Persistencia | localStorage (sin backend) |
| Tests | Vitest |

## Módulos

| Módulo | Descripción |
|--------|-------------|
| **Inicio** | Pantalla de bienvenida |
| **Mi Día** | Vista diaria de tareas urgentes y pendientes |
| **Dashboard** | KPIs y gráficos de estado general |
| **Cursos / DNC** | Gestión de cursos de capacitación |
| **OCs Pendientes** | Órdenes de compra y su estado |
| **Practicantes** | Seguimiento de practicantes |
| **Evaluaciones** | Evaluaciones psicolaborales |
| **Diplomas / Cert / Lic** | Diplomas, certificados y licencias |
| **Procesos Pend.** | Flujos y procesos internos |
| **Presupuesto** | Control presupuestario |
| **Carga Semanal** | Reporte de carga de trabajo semanal |
| **Contactos** | Directorio de stakeholders |
| **Reclutamiento** | Procesos de selección |
| **Vales de Gas** | Control de vales de combustible |
| **Configuración** | Importar/exportar datos, backups |

## Instalación y uso

### Requisitos

- Node.js 18+
- npm 9+

### Comandos

```bash
npm install        # instalar dependencias
npm run dev        # servidor de desarrollo (http://localhost:5173)
npm run build      # build de producción (dist/index.html — archivo único)
npm run test       # ejecutar tests (vitest)
npm run lint       # análisis estático (eslint)
```

### Despliegue

El build genera un **único archivo HTML** autónomo. Se puede distribuir sin servidor: abre `dist/index.html` en el navegador.

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

## Seguridad

Ver [docs/security.md](docs/security.md) para el análisis de riesgos y controles implementados.

## Arquitectura

Ver [docs/architecture.md](docs/architecture.md) para el diagrama de módulos y decisiones de diseño.

## Modelo de datos

Ver [docs/data-model.md](docs/data-model.md) para la descripción de tipos y esquema actual.

## Importación / Exportación

Ver [docs/import-export.md](docs/import-export.md) para el flujo XLSX y las validaciones aplicadas.

## Gestión de datos

- Los datos se guardan automáticamente en `localStorage` bajo la clave `control_operativo_kata_v5`.
- Versión del esquema actual: `6` (ver `src/storage/migrations.ts`).
- Desde **Configuración** se puede exportar a JSON/XLSX, importar, crear backups y restaurar.

## Sistema de semáforo

| Color | Estado |
|-------|--------|
| 🔴 Rojo | Vencido o crítico |
| 🟡 Amarillo | Próximo a vencer |
| 🟢 Verde | En plazo |
| ⚫ Gris | Sin fecha / cerrado |
