# Control Operativo RH

Sistema de control operativo para la gestión de RRHH y capacitaciones. Aplicación web cliente-side con persistencia local, pensada para equipos operativos que necesitan trazabilidad de tareas, plazos y procesos.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 7 + vite-plugin-singlefile |
| Estilos | Tailwind CSS 4 |
| Gráficos | Chart.js + react-chartjs-2 |
| Exportación | xlsx (Excel) |
| Persistencia | localStorage (sin backend) |

---

## Módulos

| Módulo | Descripción |
|--------|-------------|
| **Inicio** | Pantalla de bienvenida |
| **Mi Día** | Vista diaria de tareas urgentes y pendientes |
| **Dashboard** | KPIs y gráficos de estado general |
| **Cursos / DNC** | Gestión de cursos de capacitación con priorización |
| **OCs Pendientes** | Órdenes de compra y su estado |
| **Practicantes** | Seguimiento de practicantes |
| **Evaluaciones** | Evaluaciones psicolaborales |
| **Diplomas / Cert / Lic** | Diplomas, certificados y licencias |
| **Procesos Pend.** | Flujos y procesos internos |
| **Presupuesto** | Control presupuestario (asignado vs. gastado) |
| **Carga Semanal** | Reporte de carga de trabajo semanal |
| **Contactos** | Directorio de stakeholders y personas clave |
| **Configuración** | Importar/exportar datos, resetear, ajustes |

---

## Instalación y uso

### Requisitos

- Node.js 18+
- npm 9+

### Comandos

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo (http://localhost:5173)
npm run dev

# Build de producción (genera un único archivo HTML autónomo)
npm run build

# Preview del build
npm run preview
```

### Despliegue

El build genera un **único archivo HTML** (via `vite-plugin-singlefile`) que puede distribuirse sin servidor. Simplemente abre el archivo `dist/index.html` en el navegador.

---

## Acceso

La aplicación tiene una pantalla de login básica para uso local/demo. Las credenciales están definidas directamente en `src/App.tsx`.

> **Advertencia de seguridad:** Este sistema de autenticación no es apto para entornos expuestos en red. Es solo una barrera de acceso local. No compartir el archivo HTML compilado con personas no autorizadas.

---

## Gestión de datos

- Los datos se guardan automáticamente en `localStorage` bajo la clave `control_operativo_kata_v5`.
- Desde **Configuración** se puede:
  - Exportar todo a **JSON** o **Excel (.xlsx)**
  - Importar desde JSON (con migración automática de versiones)
  - Descargar plantillas Excel vacías
  - Restaurar desde backup o hacer reset completo

---

## Estructura del proyecto

```
TotalControlRH/
├── src/
│   ├── main.tsx          # Punto de entrada React
│   ├── App.tsx           # Lógica completa de la aplicación
│   ├── index.css         # Estilos globales + tokens de diseño
│   └── utils/
│       └── cn.ts         # Helper para combinar clases Tailwind
├── index.html            # HTML base
├── vite.config.ts        # Configuración de Vite
├── tsconfig.json         # Configuración TypeScript
└── package.json
```

---

## Sistema de semáforo

Las entidades con fecha límite utilizan un sistema de semáforo visual:

| Color | Estado |
|-------|--------|
| 🔴 Rojo | Vencido o crítico |
| 🟡 Amarillo | Próximo a vencer |
| 🟢 Verde | En plazo |
| ⚫ Gris | Sin fecha / cerrado |
