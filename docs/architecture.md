# Arquitectura — TotalControlRH

## Visión general

Aplicación SPA (Single Page Application) local-first. No requiere backend ni red. Todos los datos residen en `localStorage` del navegador.

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (sin backend)                 │
│                                                         │
│  ┌────────────┐   ┌──────────────────────────────────┐  │
│  │ src/auth/  │   │           src/App.tsx            │  │
│  │ authService│──▶│  estado global React (useState)  │  │
│  │ permissions│   │  módulos de negocio (inline)     │  │
│  └────────────┘   └────────────┬─────────────────────┘  │
│                                │                        │
│  ┌─────────────────────────────▼────────────────────┐   │
│  │                  src/storage/                    │   │
│  │  localStorage.ts  │  migrations.ts  │ backups.ts │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │               src/importExport/                  │   │
│  │  xlsxImport.ts  │  xlsxExport.ts  │ jsonExport  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │               src/audit/                         │   │
│  │  auditService.ts — log en localStorage           │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Estructura de directorios

```
src/
├── App.tsx                  # Componente raíz + todos los módulos de UI
├── main.tsx                 # Punto de entrada
├── index.css                # Estilos globales
│
├── auth/                    # Autenticación y autorización
│   ├── authTypes.ts         # Tipos: AppUser, Session, UserRole
│   ├── authUsers.ts         # Registro de usuarios (contraseñas hasheadas)
│   ├── authService.ts       # login(), logout(), getSession(), refreshSession()
│   └── permissions.ts       # can(role, permission) — sistema de permisos
│
├── audit/                   # Auditoría de acciones
│   ├── auditTypes.ts        # Tipo AuditEntry
│   └── auditService.ts      # logAudit(), getAuditLog()
│
├── domain/                  # Lógica de dominio pura
│   ├── types.ts             # Interfaces AppData, Curso, OC, etc.
│   ├── status.ts            # isTableRowClosed(), isClosedRecord()
│   ├── budget.ts            # Cálculos de presupuesto
│   ├── dates.ts             # Helpers de fechas
│   └── moduleConfig.ts      # Configuración por módulo
│
├── storage/                 # Persistencia
│   ├── localStorage.ts      # read/write/remove + STORAGE_KEY
│   ├── migrations.ts        # migrateData() + CURRENT_SCHEMA_VERSION
│   └── backupStorage.ts     # createBackup(), getLocalBackups()
│
├── importExport/            # Importación y exportación de datos
│   ├── xlsxImport.ts        # xlsxSheetToObjects(), XlsxParseResult
│   ├── xlsxExport.ts        # buildExportSheets()
│   └── jsonExport.ts        # createJsonBlob()
│
├── utils/                   # Utilidades
│   ├── appHelpers.ts        # genId, hoy, ahora, semaforo, etc.
│   └── cn.ts                # Helper de clases Tailwind
│
├── components/
│   ├── ui/index.tsx         # Librería de UI compartida (KpiCard, PageHeader, etc.)
│   ├── tables/DataTable.tsx # Tabla reutilizable con paginación
│   └── forms/DateInput.tsx  # Input de fecha localizado
│
└── test/
    ├── helpers.test.ts      # 23 tests de utilidades
    └── setup.ts
```

## Decisiones de diseño

### Un solo App.tsx

Todos los módulos de UI están en `App.tsx` (~4500 líneas) por diseño inicial. El estado global se maneja con `useState` en el componente raíz y se pasa hacia abajo como props. No se usa Context API ni Zustand para evitar complejidad innecesaria en una app single-user.

### Local-first

No hay red. Todo ocurre en el navegador. Ventaja: funciona offline, es rápida, sin infraestructura. Desventaja: datos atados al navegador/equipo, sin sincronización multi-usuario.

### Persistencia

La clave `STORAGE_KEY = "control_operativo_kata_v5"` contiene todo el estado como JSON. Las migraciones (`migrateData`) son one-way: siempre migran al esquema actual al leer. El número de versión `CURRENT_SCHEMA_VERSION` permite detectar necesidad de migración futura.

### Build único

`vite-plugin-singlefile` genera un único `index.html` con JS y CSS inlineados. Permite distribución por email o pendrive sin servidor.

## Escalabilidad

Para escalar a múltiples usuarios o datos mayores a ~5 MB, los próximos pasos recomendados son:

1. Migrar `LocalStorageRepository` a `IndexedDbRepository` (interfaz `DataRepository` preparada)
2. Agregar backend con autenticación real (el módulo `src/auth/` ya abstrae la capa de auth)
3. Separar los módulos de UI de `App.tsx` en archivos individuales por módulo
