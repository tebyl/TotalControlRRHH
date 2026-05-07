# Modelo de datos — TotalControlRH

## Esquema actual: versión 6

Definido en `src/domain/types.ts`. Persistido en `localStorage` bajo la clave `control_operativo_kata_v5`.

## AppData (raíz)

```typescript
interface AppData {
  cursos: Curso[];
  ocs: OC[];
  practicantes: Practicante[];
  presupuesto: PresupuestoItem[];
  procesos: Proceso[];
  diplomas: Diploma[];
  cargaSemanal: CargaSemanal[];
  contactos: Contacto[];
  evaluacionesPsicolaborales: EvaluacionPsicolaboral[];
  valesGas: ValeGas[];
  valesGasOrganizacion: ValeGasOrg[];
  reclutamiento: Reclutamiento[];
  meta: { version: string; ultimaExportacion: string; actualizado: string };
}
```

## Entidades principales

### Contacto

Campo de referencia para `responsableId` en todos los demás módulos.

```typescript
interface Contacto {
  id: string;
  nombre: string;
  rol: string;
  areaEmpresa: string;
  correo: string;      // ⚠ dato sensible
  telefono: string;    // ⚠ dato sensible
  relacion: string;    // "Interno" | "OTEC" | ...
  activo: string;      // "Sí" | "No"
  observaciones: string;
}
```

### Evaluacion (EvaluacionPsicolaboral)

```typescript
interface EvaluacionPsicolaboral {
  id: string;
  rut: string;         // ⚠ dato sensible
  candidato: string;   // ⚠ dato sensible
  cargo: string;
  area: string;
  // ... ver types.ts para detalle completo
}
```

## Relaciones

```
Contacto (1) ──▶ (N) Curso          [via responsableId]
Contacto (1) ──▶ (N) OC             [via responsableId]
Contacto (1) ──▶ (N) Practicante    [via responsableId]
Contacto (1) ──▶ (N) Presupuesto    [via responsableId]
Contacto (1) ──▶ (N) Diploma        [via responsableId]
Contacto (1) ──▶ (N) Evaluacion     [via responsableId]
Contacto (1) ──▶ (N) ValeGas        [via contactoId]
```

Al eliminar un `Contacto`, el sistema verifica referencias activas y ofrece reasignar a "Sin responsable" antes de borrar.

## Datos de almacenamiento adicional

| Clave localStorage | Contenido |
|-------------------|-----------|
| `control_operativo_kata_v5` | AppData principal |
| `kata_backups` | BackupItem[] (hasta 10) |
| `kata_last_json_export` | timestamp ISO |
| `kata_last_xlsx_export` | timestamp ISO |
| `kata_focus_mode` | "true" / "false" |
| `tcr_audit_log` | AuditEntry[] (hasta 500) |
| `tcr_session` | Session (expira en 8h) |

## Migraciones

Las migraciones son aplicadas en `src/storage/migrations.ts` mediante `migrateData()`, que se llama al leer datos del localStorage. Son one-way y acumulativas: siempre se migra al esquema actual.

`CURRENT_SCHEMA_VERSION = 6` — incrementar al agregar campos incompatibles.
