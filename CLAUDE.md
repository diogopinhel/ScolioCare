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
| `estudos.ts` | dashboard KPIs, pending exams, weekly chart, exam history, AI validation, comparison, audit log on validate/correct/archive/send |
| `pacientes.ts` | patient list, detail, notes, search, `getMedicos` (via RPC), `alterarMedicoPaciente`, `atualizarPaciente` |
| `tecnico.ts` | technician queue, exam upload, `criarEstudo`, `uploadImagemEstudo`, `getMedicoResponsavelDoPaciente` (via RPC) |
| `admin.ts` | admin KPIs, audit log, user management, `getUsoPorPerfil` (via RPC), `getUtilizadorCompleto`, `editarUtilizadorAdmin`, RGPD requests, system settings — all operations audit-logged via `registarAcao` |
| `audit.ts` | `registarAcao()` fire-and-forget helper — calls `registar_acao` RPC |
| `wellness.ts` | patient wellness log entries |

Types are in `src/data/types.ts` (snake_case DB → camelCase TS). `UtilizadorAutenticado` is a discriminated union of `Administrador | MedicoEspecialista | TecnicoSaude | Paciente`.

### Edge Functions (all deployed on Supabase)

| Function | Caller | What it does |
|----------|--------|--------------|
| `atualizar-paciente` | TECNICO, ADMIN | Updates editable patient fields. Logs to `audit_log`. |
| `criar-utilizador` | ADMIN | Creates auth user + `utilizadores` row as MEDICO, TECNICO or ADMIN. Logs to `audit_log`. |
| `alterar-medico-paciente` | TECNICO, ADMIN | Closes current `paciente_medico` association, inserts new one (history preserved), sets `conta_ativada=true`. Idempotent if the same doctor is already assigned and the account is inactive. Logs to `audit_log`. |

Deploy: Supabase Dashboard → Edge Functions → Open Editor (paste file contents).

Patient creation: PACIENTE users self-register via the mobile app (React Native) with `conta_ativada=false`. The technician then assigns a doctor (via `alterar-medico-paciente`), which flips `conta_ativada=true` and unlocks access in the mobile app. There is no edge function for creating patients from the web app.

### Supabase DB functions (SECURITY DEFINER — bypass RLS)

| Function | Called by | Purpose |
|----------|-----------|---------|
| `get_medicos_ativos()` | client (TECNICO, MEDICO) | Lists active MEDICO users — bypasses RLS that blocks TECNICO from reading other profiles |
| `get_medico_responsavel(p_paciente_id)` | client (TECNICO, ADMIN) | Returns current `medico_id` from `paciente_medico` — bypasses RLS |
| `get_medicos_dos_pacientes(p_ids[])` | client (TECNICO) | Bulk version of `get_medico_responsavel` — returns `{paciente_id, medico_id, medico_nome}` for a list of patient IDs. Source in `supabase/migrations/20260610_rpc_get_medicos_dos_pacientes.sql` |
| `get_meu_perfil()` | RLS policies | Returns `perfil` of current user — used in INSERT policies to avoid recursive RLS |
| `registar_ultimo_login()` | client | Updates `utilizadores.ultimo_login = NOW()` for current user |
| `registar_acao(tipo, entidade, entidade_id)` | client | Inserts into `audit_log` with user snapshot from `utilizadores` |
| `get_uso_semanal()` | client (ADMIN) | Aggregates `audit_log` by day + profile for the last 7 days — powers admin dashboard chart |
| `notify_tecnicos_new_patient()` | trigger on `utilizadores` insert | Notifies all active TECNICO users when a new PACIENTE row is inserted with `conta_ativada=false`. Source in `supabase/migrations/20260609_trigger_notificacao_novo_paciente.sql` |

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
| Create user (med/tec/admin) | `CRIAR_UTILIZADOR` | Edge Function `criar-utilizador` |
| Edit patient | `EDITAR_PACIENTE` | Edge Function `atualizar-paciente` |
| Edit other user | `EDITAR_UTILIZADOR` | `admin.ts editarUtilizadorAdmin` |
| Activate / deactivate account | `ATIVAR_UTILIZADOR` / `DESATIVAR_UTILIZADOR` | `admin.ts toggleAtivoUtilizador` |
| Block / unblock account | `BLOQUEAR_UTILIZADOR` / `DESBLOQUEAR_UTILIZADOR` | `admin.ts toggleBloqueioUtilizador` |
| Assign / reassign doctor | `ALTERAR_MEDICO_PACIENTE` | Edge Function `alterar-medico-paciente` |
| Upload exam (tech) | `CRIAR_ESTUDO` | `ExamUploadScreen` |
| Upload exam (doctor) | `CRIAR_ESTUDO` | `ExamUploadMedicoScreen` |
| Validate exam (accept AI) | `VALIDAR_EXAME` | `estudos.ts confirmarMetricasIA` |
| Correct AI metrics | `CORRIGIR_EXAME` | `estudos.ts corrigirMetricasIA` |
| Archive exam | `ARQUIVAR_EXAME` | `estudos.ts arquivarEstudoMedico` |
| Send report to patient | `ENVIAR_RELATORIO` | `estudos.ts enviarEstudoAoPaciente` |
| Save system settings | `EDITAR_SETTINGS` | `admin.ts saveSystemSettings` |
| Update RGPD request | `ATUALIZAR_PEDIDO_RGPD` | `admin.ts atualizarRgpdPedido` |
| Export audit CSV | `EXPORTAR_AUDITORIA` | `AdminAuditScreen` |
| Export RGPD CSV | `EXPORTAR_RGPD` | `AdminComplianceScreen` |
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
| TecnicoPatientsScreen | `/tecnico/patients` | ✅ Real list with Todos/Pendentes tabs; "Atribuir médico" modal for pending |
| PatientEditScreen | `/tecnico/patients/:id/edit` | ✅ Edit patient data + (re)assign doctor |

### Admin (`/admin-panel`)
| Screen | Route | State |
|--------|-------|-------|
| AdminDashboardScreen | `/admin-panel` | ✅ Real KPIs + usage chart from `audit_log` |
| AdminAuditScreen | `/admin-panel/audit` | ✅ Real `audit_log` entries (200 latest), categorized, CSV export (UTF-8 BOM). Search is client-side over the loaded 200. |
| AdminUsersScreen | `/admin-panel/users` | ✅ Toggle active/blocked, edit user data, create user, change patient's doctor — all audited |
| AdminAIScreen | `/admin-panel/ai` | ⚠️ ML metrics show N/D — requires ML pipeline integration |
| AdminComplianceScreen | `/admin-panel/compliance` | Reads from `rgpd_pedidos` (empty by default); KPIs by tipo (Art. 15 / Art. 17) |
| AdminSettingsScreen | `/admin-panel/settings` | Persists to `system_settings` table via upsert by `chave` |

## Known remaining work

### Requires new DB tables (or external pipelines)
- `AdminAIScreen` — individual consents need `consentimentos_ia` table; ML metrics depend on `resultados` being populated by an external pipeline

### Polish
- `calcularIdade()` in several screens returns `"X anos"` hardcoded in PT — not using i18n
- `AdminAuditScreen` search is client-side over the latest 200 events — older entries aren't searchable. `getAuditLog` accepts a `pesquisa` parameter that isn't currently wired to the UI.

### Future
- Real push notifications (bell icon exists but badge is decorative — no count shown)
- Full 2FA flow (toggle exists in settings, no setup flow)
- ML model integration (`resultados` currently populated manually)
- React Native app for patients (built by team member)

## Git

Quando pedido para fazer commit, criar o commit sem linha `Co-Authored-By`.

## Language

Domain code, variable names, comments and UI strings are in **Portuguese**. Keep this convention when editing (e.g. `paciente`, `estudo`, `utilizador`, not `patient`, `exam`, `user`).
