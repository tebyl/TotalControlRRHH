# Importación y Exportación — TotalControlRH

## Exportación

### JSON (completo)

- Función: `exportJSON()` en App.tsx
- Genera: `total-control-rh-backup-YYYY-MM-DD.json`
- Contenido: snapshot completo de AppData
- Auditoría: registra `data:export` con detalle "Exportación JSON completa"
- Seguridad: requiere confirmación por incluir datos sensibles

### JSON (resumen)

- Función: `exportJSONSummary()` en App.tsx
- Genera: `total-control-rh-resumen-YYYY-MM-DD.json`
- Contenido: conteos por módulo y versión de esquema (sin datos personales)
- Auditoría: registra `data:export` con detalle "Exportación JSON resumen"

### JSON (anonimizado)

- Función: `exportJSONAnonymized()` en App.tsx
- Genera: `total-control-rh-backup-anon-YYYY-MM-DD.json`
- Contenido: datos completos con campos personales redactados
- Auditoría: registra `data:export` con detalle "Exportación JSON anonimizada"

### XLSX (completo)

- Función: `exportXLSX()` en App.tsx
- Genera: `control_operativo_kata_v5_YYYY-MM-DD.xlsx`
- Hojas: Contactos, Cursos, OCs, Practicantes, Presupuesto, Procesos, Diplomas, Evaluaciones, CargaSemanal, ValesGas, ValesGasOrg, Reclutamiento
- Auditoría: registra `data:export` con detalle "Exportación XLSX completa"
- Seguridad: requiere confirmación por incluir datos sensibles

### XLSX (anonimizado)

- Función: `exportXLSXAnonymized()` en App.tsx
- Genera: `control_operativo_kata_v5_anon_YYYY-MM-DD.xlsx`
- Contenido: datos completos con campos personales redactados
- Auditoría: registra `data:export` con detalle "Exportación XLSX anonimizada"

### XLSX (limpia)

- Función: `exportLimpia()` — genera plantilla vacía sin datos reales
- Útil para compartir estructura sin exponer datos sensibles

## Importación XLSX — flujo de 3 pasos

```
1. Descargar plantilla  →  2. Completar y subir  →  3. Revisar y confirmar
```

### Validaciones aplicadas (Fase 5)

| Validación | Detalle |
|-----------|---------|
| Tamaño máximo | 10 MB — rechaza archivos más grandes |
| Extensión | Solo `.xlsx` o `.xls` |
| Nombre de columnas | Verifica encabezados esperados por hoja |
| Campo obligatorio | Nombre (Contactos), Curso (Cursos), etc. |
| Registros con error | Se omiten en la importación, se muestran en el reporte |

### Modos de importación

| Modo | Comportamiento |
|------|---------------|
| **Fusionar** | Actualiza registros existentes (por ID), agrega los nuevos |
| **Reemplazar** | Borra las hojas presentes en el XLSX y las reemplaza |

Las hojas **no presentes** en el XLSX no se modifican en ningún modo.

### Backup automático

Antes de confirmar cualquier importación se crea automáticamente un backup. Si algo sale mal, se puede restaurar desde Configuración > Respaldos.

### Auditoría

Al confirmar una importación se registra `data:import` con el modo usado (merge/replace).

## Plantilla XLSX

La plantilla descargable contiene una hoja por módulo con los encabezados esperados y algunos registros de ejemplo (especialmente en Reclutamiento). Los IDs son opcionales al importar — si se omiten, se generan automáticamente.

## Importación JSON

- Acepta archivos `.json` exportados previamente por esta aplicación
- Aplica `migrateData()` automáticamente — compatible con versiones anteriores
- Crea backup automático antes de aplicar
