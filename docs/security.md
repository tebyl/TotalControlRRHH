# Seguridad — TotalControlRH

## Modelo de amenazas

TotalControlRH es una aplicación local-first sin backend. El principal vector de riesgo es el **acceso físico al equipo** o al navegador. No está diseñada para operar en red pública.

## Auditoría de seguridad (Fase 5)

### Crítico — Resuelto

| ID | Hallazgo | Estado |
|----|----------|--------|
| C-01 | Credenciales hardcodeadas en texto plano en `App.tsx` | ✅ Resuelto: contraseñas ahora verificadas con SHA-256 en `src/auth/authUsers.ts` |
| C-02 | Sesión sin expiración (token booleano en sessionStorage) | ✅ Resuelto: sesión con timestamp de expiración (8 h), se verifica cada 60 s |

### Alto — Resuelto

| ID | Hallazgo | Estado |
|----|----------|--------|
| A-01 | Sin auditoría de acciones | ✅ Resuelto: log de auditoría en `src/audit/` — registra login, logout, CRUD, import, export |
| A-02 | Sin límite de tamaño en importación XLSX | ✅ Resuelto: límite de 10 MB y validación de extensión |
| A-03 | Sin roles ni control de acceso | ✅ Resuelto: sistema de roles `admin | rrhh | lectura` con función `can()` |

### Medio — Pendiente

| ID | Hallazgo | Estado |
|----|----------|--------|
| M-01 | RUT, correo y teléfono almacenados en claro en localStorage | ⚠ Pendiente: requiere cifrado en cliente o migración a backend |
| M-02 | Export XLSX sin advertencia de datos sensibles | ⚠ Pendiente: implementar modal de confirmación antes de exportar |
| M-03 | Sin protección CSRF (no aplica sin backend hoy) | N/A hasta agregar backend |

### Bajo

| ID | Hallazgo | Estado |
|----|----------|--------|
| B-01 | Datos de evaluaciones psicolaborales no cifrados | ⚠ Pendiente |
| B-02 | Audit log almacenado sin protección en localStorage | Aceptado — sin backend no es posible garantizarlo |

## Controles implementados

### Autenticación (`src/auth/`)

- `authTypes.ts` — tipos `AppUser`, `Session`, constante `SESSION_DURATION_MS = 8h`
- `authUsers.ts` — registro de usuarios con contraseñas almacenadas como hash SHA-256
- `authService.ts` — `login()` async (calcula hash con Web Crypto API), `getSession()` con verificación de expiración, `refreshSession()` (renueva 8h en cada interacción), `logout()`

### Roles y permisos (`src/auth/permissions.ts`)

Función central `can(role, permission)` consultable en cualquier componente:

```ts
can("admin", "record:delete")   // true
can("lectura", "record:delete") // false
can("rrhh", "data:export:full") // false
```

Permisos disponibles: `record:create`, `record:edit`, `record:delete`, `record:close`, `record:duplicate`, `data:import`, `data:export:full`, `data:export:summary`, `data:export:anonymized`, `backup:create`, `backup:restore`, `config:edit`.

### Auditoría (`src/audit/`)

- `auditTypes.ts` — tipo `AuditEntry` con `timestamp`, `username`, `action`, `module`, `recordId`
- `auditService.ts` — `logAudit()` escribe a localStorage con clave `tcr_audit_log`, máximo 500 entradas (FIFO), nunca lanza excepciones

Acciones auditadas: login, logout, create, edit, delete, import, export, backup.

### Sesión

- Expiración automática verificada cada 60 segundos con `setInterval`
- Renovación automática en cada clic/tecla del usuario (throttled a 1 vez por minuto)
- Al expirar: `logAudit("logout", ...)` + `authLogout()` + redirect a login

## Recomendaciones para producción real

1. **Agregar backend**: mover autenticación a servidor con bcrypt, tokens JWT o sesiones HttpOnly
2. **Cifrar datos sensibles**: RUT, correo, teléfono antes de escribir a localStorage
3. **HTTPS obligatorio**: sin HTTPS, el localStorage es accesible por extensiones maliciosas
4. **Rotar credenciales**: cambiar `KataS / Tota95` antes de desplegar en cualquier equipo compartido
5. **Múltiples usuarios**: el registro en `authUsers.ts` soporta múltiples entradas — agregar según necesidad
