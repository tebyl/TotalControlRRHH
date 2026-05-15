const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/App.tsx');
let src = fs.readFileSync(filePath, 'utf8');
src = src.replace(/\r\n/g, '\n');

// 1. Add lazy imports for CargaSemanal and ReporteMensual after ModuloValesGas line
src = src.replace(
  'const ModuloValesGas = lazy(() => import("./modules/ModuloValesGas"));\n',
  'const ModuloValesGas = lazy(() => import("./modules/ModuloValesGas"));\nconst ModuloCargaSemanal = lazy(() => import("./modules/ModuloCargaSemanal"));\nconst ModuloReporteMensual = lazy(() => import("./modules/ModuloReporteMensual"));\n'
);

// 2. Remove the inline ModuloCargaSemanal function (lines 641-673 area)
// Find from "// ── HELPER COMPONENTS" to start of ModuloReporteMensual
const helperStart = src.indexOf('\n// ── HELPER COMPONENTS ────────────────────────\n// ── MODULE COMPONENTS ────────────────────────');
const reporteMensualStart = src.indexOf('\nfunction ModuloReporteMensual(');
if (helperStart === -1) { console.error('Could not find HELPER COMPONENTS comment'); process.exit(1); }
if (reporteMensualStart === -1) { console.error('Could not find ModuloReporteMensual function'); process.exit(1); }

src = src.slice(0, helperStart) + src.slice(reporteMensualStart);

// 3. Remove the inline ModuloReporteMensual function
// It starts with "\nfunction ModuloReporteMensual(" and ends before "// ── MÓDULO VALES DE GAS"
const rmStart = src.indexOf('\nfunction ModuloReporteMensual(');
const rmEnd = src.indexOf('\n// ── MÓDULO VALES DE GAS ─────────────────────────');
if (rmStart === -1) { console.error('Could not find ModuloReporteMensual'); process.exit(1); }
if (rmEnd === -1) { console.error('Could not find VALES DE GAS comment'); process.exit(1); }

src = src.slice(0, rmStart) + '\n' + src.slice(rmEnd + '\n// ── MÓDULO VALES DE GAS ─────────────────────────'.length);

// 4. Remove unused imports that were only needed for the inline functions
// Remove CalendarRange import
src = src.replace(/\nimport { CalendarRange } from "lucide-react";\n/, '\n');

// Remove CargaSemanal, ProcesoReclutamiento, ValeGas, ValeGasOrg from domain/types import
// Current: import type { AppData, CargaSemanal, ModuloKey, ProcesoReclutamiento, ValeGas, ValeGasOrg } from "./domain/types";
src = src.replace(
  /import type \{ AppData, CargaSemanal, ModuloKey, ProcesoReclutamiento, ValeGas, ValeGasOrg \} from "\.\/domain\/types";/,
  'import type { AppData, ModuloKey } from "./domain/types";'
);

// Remove MESES import
src = src.replace(/\nimport { MESES } from "\.\/domain\/options";\n/, '\n');

// Remove getXlsx from useAppData import (keep hydrateData and useAppData)
src = src.replace(
  'import { getXlsx, hydrateData, useAppData } from "./state/useAppData";',
  'import { hydrateData, useAppData } from "./state/useAppData";'
);

// Remove fmtCLP from dataHelpers (keep getResponsableName only if used, else remove whole line)
// Check if getResponsableName is still used
const usesGetResponsableName = src.includes('getResponsableName');
const usesFmtCLP = src.includes('fmtCLP');

if (!usesFmtCLP && usesGetResponsableName) {
  src = src.replace(
    'import { fmtCLP, getResponsableName } from "./shared/dataHelpers";',
    'import { getResponsableName } from "./shared/dataHelpers";'
  );
} else if (!usesFmtCLP && !usesGetResponsableName) {
  src = src.replace(/\nimport { fmtCLP, getResponsableName } from "\.\/shared\/dataHelpers";\n/, '\n');
}

// Remove calcPctRecl import if not used
if (!src.includes('calcPctRecl')) {
  src = src.replace(/\nimport { calcPctRecl } from "\.\/shared\/reclutamientoHelpers";\n/, '\n');
}

// Remove Select from fields if not used
if (!src.includes('<Select') && !src.includes('Select,')) {
  src = src.replace(/\nimport { Select } from "\.\/components\/forms\/fields";\n/, '\n');
}

// Remove DataTable/Table import if only used in inline ModuloCargaSemanal
if (!src.includes('<Table') && !src.includes('Table ')) {
  src = src.replace(/\nimport { DataTable as Table } from "\.\/components\/tables\/DataTable";\n/, '\n');
}

// Write back with CRLF
fs.writeFileSync(filePath, src.replace(/\n/g, '\r\n'), 'utf8');
console.log('Done. App.tsx updated.');
