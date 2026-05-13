# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start Vite dev server (localhost:5173)
npm run build        # production build
npm run typecheck    # tsc --noEmit (no test suite exists)
npm run preview      # preview production build locally
```

There is no linter configured. Type-checking (`npm run typecheck`) is the only automated code quality gate.

## Environment

Requires a `.env.local` file with:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

The Supabase client is a singleton at `src/lib/supabase.ts`. Every DB query goes through it, and **Supabase RLS automatically scopes results to the authenticated user**.

## Architecture

### Role-based routing

Three active route trees protected by `<ProtectedRoute perfis="...">` in `src/app/routes.tsx`:

| Perfil | Root path | Layout |
|--------|-----------|--------|
| `MEDICO` | `/` | `Layout` (sidebar azul) |
| `TECNICO` | `/tecnico` | `TecnicoLayout` (sidebar verde) |
| `ADMIN` | `/admin-panel` | `AdminLayout` (sidebar azul + breadcrumbs) |
| `PACIENTE` | — | App React Native (colega) — sem acesso web |

After login, `rotaInicialPara(perfil)` in `AuthContext.tsx` redirects each role to its root.

**Auth loading**: `ProtectedRoute` shows a spinner while the session is being restored from localStorage (never returns `null`). `LoginScreen` also shows a spinner during session restore to avoid form flash followed by redirect.

### Data layer

All Supabase queries live in `src/data/repository/`:

| File | Responsibility |
|------|---------------|
| `auth.ts` | login, logout, session subscription, `ultimo_login` update, audit log on login |
| `estudos.ts` | dashboard KPIs, pending exams, weekly chart, exam history, AI validation, comparison |
| `pacientes.ts` | patient list, detail, notes, search, `getMedicos` (via RPC), `reatribuirMedico` |
| `tecnico.ts` | technician queue, exam upload, `criarEstudo`, `uploadImagemEstudo`, `getMedicoResponsavelDoPaciente` (via RPC) |
| `admin.ts` | admin KPIs, audit log, user management, `getUsoPorPerfil` (via RPC), `getUtilizadorCompleto`, `editarUtilizadorAdmin` |
| `audit.ts` | `registarAcao()` fire-and-forget helper — calls `registar_acao` RPC |
| `wellness.ts` | patient wellness log entries |

Types are in `src/data/types.ts` (snake_case DB → camelCase TS). `UtilizadorAutenticado` is a discriminated union of `Administrador | MedicoEspecialista | TecnicoSaude | Paciente`.

### Edge Functions (all deployed on Supabase)

| Function | Caller | What it does |
|----------|--------|--------------|
| `criar-paciente` | TECNICO, ADMIN | Creates auth user + `utilizadores` row as PACIENTE + `paciente_medico` association. Logs to `audit_log`. |
| `atualizar-paciente` | MEDICO (associado), ADMIN | Updates editable patient fields. MEDICO restricted to own patients. Logs to `audit_log`. |
| `criar-utilizador` | ADMIN | Creates auth user + `utilizadores` row as MEDICO, TECNICO or ADMIN. Logs to `audit_log`. |
| `reatribuir-medico` | TECNICO, ADMIN | Closes current `paciente_medico` association, inserts new one (history preserved). Logs to `audit_log`. |

Deploy: Supabase Dashboard → Edge Functions → Open Editor (paste file contents).

### Supabase DB functions (SECURITY DEFINER — bypass RLS)

| Function | Called by | Purpose |
|----------|-----------|---------|
| `get_medicos_ativos()` | client (TECNICO, MEDICO) | Lists active MEDICO users — bypasses RLS that blocks TECNICO from reading other profiles |
| `get_medico_responsavel(p_paciente_id)` | client (TECNICO, ADMIN) | Returns current `medico_id` from `paciente_medico` — bypasses RLS |
| `get_meu_perfil()` | RLS policies | Returns `perfil` of current user — used in INSERT policies to avoid recursive RLS |
| `registar_ultimo_login()` | client | Updates `utilizadores.ultimo_login = NOW()` for current user |
| `registar_acao(tipo, entidade, entidade_id)` | client | Inserts into `audit_log` with user snapshot from `utilizadores` |
| `get_uso_semanal()` | client (ADMIN) | Aggregates `audit_log` by day + profile for the last 7 days — powers admin dashboard chart |

### Design system

All shared UI components are in `src/app/components/scolio/` re-exported from `index.ts`. Import from `'../../components/scolio'` (never directly). Available: `Button`, `Input`, `SearchBar`, `Textarea`, `Select`, `StatusBadge`, `ExamCard`, `CobbAngleGauge`, `ProgressBar`, `Toast`, `Modal`, skeleton loaders.

Design tokens are CSS custom properties in `src/styles/theme.css` — always use `var(--scolio-*)`, never raw Tailwind colour classes.

### Database schema key points

- **Single-table inheritance**: all users in `public.utilizadores` with `perfil` enum (ADMIN, MEDICO, TECNICO, PACIENTE). Role-specific columns are nullable.
- **Removed columns**: `utilizadores.nivel_admin` (all admins have identical permissions), `audit_log.ip_origem` (never populated, removed from UI).
- **Kept but not yet populated**: `utilizadores.token_recuperacao`, `token_expiracao`, `secreto_totp`, `tentativas_login_falhadas`, `cert_digital_entidade`, `cert_digital_expiracao` — kept for potential future migration away from Supabase Auth.
- **Immutable tables**: `audit_log`, `historico_estado`, `glassbreak_log` — triggers block UPDATE/DELETE. To "rollback" a failed exam upload, use `UPDATE estudos SET arquivado = true` (never DELETE).
- **Glass-break**: médico accesses any patient via `glassbreak_log` (15-min window). `medico_tem_acesso_a_paciente(uuid)` used in RLS.
- **Archiving**: soft-delete — `arquivado = true` on estudos, `ativo = false` on utilizadores. Nothing is hard-deleted.
- **Patient-doctor history**: `paciente_medico` has no UNIQUE constraint on `(paciente_id, medico_id)` — multiple rows allowed to preserve full history. Always INSERT, never reuse old rows.
- **Exam state machine**: `UPLOADED → PROCESSING → PENDING_VALIDATION → VALIDATED → DIAGNOSED → SENT` (or `ARCHIVED` from any state).

### RLS constraints (important for new queries)

- TECNICO cannot read `paciente_medico` directly → use `get_medico_responsavel()` RPC
- TECNICO cannot read MEDICO rows in `utilizadores` → use `get_medicos_ativos()` RPC
- TECNICO cannot read `resultados` → confidence score unavailable in queue
- MEDICO cannot UPDATE `utilizadores` directly for patient data → use `atualizar-paciente` Edge Function
- MEDICO INSERT on `estudos` and `imagens_estudo` → RLS policies exist using `get_meu_perfil()`
- MEDICO INSERT on `storage/exam-images` → RLS policy using `get_meu_perfil()`
- Audit log INSERT → use `registar_acao()` RPC (SECURITY DEFINER)

### Audit logging

Key events recorded in `audit_log`:

| Event | `tipo_acao` | Origin |
|-------|-------------|--------|
| Login | `LOGIN` | `auth.ts` |
| Create patient | `CRIAR_PACIENTE` | Edge Function |
| Create user | `CRIAR_UTILIZADOR` | Edge Function |
| Edit patient | `EDITAR_PACIENTE` | Edge Function |
| Reassign doctor | `REATRIBUIR_MEDICO` | Edge Function |
| Upload exam (tech) | `CRIAR_ESTUDO` | `ExamUploadScreen` |
| Upload exam (doctor) | `CRIAR_ESTUDO` | `ExamUploadMedicoScreen` |
| Glass-break | `GLASS_BREAK` | `GlassBreakScreen` |

CSV export uses UTF-8 BOM (`﻿`) for correct rendering of Portuguese characters in Excel.

## Screens — current state

### Médico (`/`)
| Screen | Route | State |
|--------|-------|-------|
| DashboardScreen | `/` | ✅ Real KPIs, pending list, weekly chart |
| PatientListScreen | `/patients` | ✅ Filters, pagination, glass-break panel |
| PatientRecordScreen | `/patients/:id` | ✅ All tabs, notes, export, glass-break banner |
| PatientEditScreen | `/patients/:id/edit` | ✅ Edge Function `atualizar-paciente` |
| ExamViewerScreen | `/exam-viewer/:estudoId` | ✅ Validate/correct AI, notes, archive |
| ExamComparisonScreen | `/exam-comparison/:pacienteId` | ✅ Real exams + signed URLs; assessment persisted |
| ReportGenerationScreen | `/report-generation/:estudoId` | ✅ Real data; PDF via print window (PT/EN) |
| GlassBreakScreen | `/glass-break/:pacienteId` | ✅ 3 steps; persisted in `glassbreak_log` |
| ExamUploadMedicoScreen | `/exam-upload/:pacienteId` | ✅ Doctor uploads exam for own patients |

### Técnico (`/tecnico`)
| Screen | Route | State |
|--------|-------|-------|
| TecnicoDashboardScreen | `/tecnico` | ✅ Real KPIs, queue, recent activity |
| ExamUploadScreen | `/tecnico/upload` | ✅ Real upload to Storage + creates study |
| ExamQueueScreen | `/tecnico/queue` | ✅ Real data, archive, filters |
| TecnicoPatientsScreen | `/tecnico/patients` | ✅ Real list, "Mudar médico" modal per patient |
| TecnicoNewPatientScreen | `/tecnico/patients/new` | ✅ Edge Function `criar-paciente`; all fields incl. contacto, morada, cartao_cidadao |

### Admin (`/admin-panel`)
| Screen | Route | State |
|--------|-------|-------|
| AdminDashboardScreen | `/admin-panel` | ✅ Real KPIs + usage chart from `audit_log` |
| AdminAuditScreen | `/admin-panel/audit` | ✅ Real `audit_log` entries, CSV export (UTF-8 BOM) |
| AdminUsersScreen | `/admin-panel/users` | ✅ Toggle active/blocked, edit user data, create user, change patient's doctor |
| AdminAIScreen | `/admin-panel/ai` | ⚠️ ML metrics show N/D — requires ML pipeline integration |
| AdminComplianceScreen | `/admin-panel/compliance` | ⚠️ Empty state — needs `rgpd_pedidos` table |
| AdminSettingsScreen | `/admin-panel/settings` | ⚠️ Local form only — needs `system_settings` table |

## Known remaining work

### Requires new DB tables
- `AdminSettingsScreen` — persistence needs `system_settings` table
- `AdminComplianceScreen` — GDPR requests need `rgpd_pedidos` table
- `AdminAIScreen` — individual consents need `consentimentos_ia` table; ML metrics need external pipeline

### Polish
- `calcularIdade()` in several screens returns `"X anos"` hardcoded in PT — not using i18n
- `NewPatientScreen` at `/src/app/screens/medico/` is an orphan file (no route) — can be deleted

### Future
- Real push notifications (bell icon exists but badge is decorative — no count shown)
- Full 2FA flow (toggle exists in settings, no setup flow)
- ML model integration (`resultados` currently populated manually)
- React Native app for patients (built by team member)

## Language

Domain code, variable names, comments and UI strings are in **Portuguese**. Keep this convention when editing (e.g. `paciente`, `estudo`, `utilizador`, not `patient`, `exam`, `user`).
