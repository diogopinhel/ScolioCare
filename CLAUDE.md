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
| `admin.ts` | admin KPIs, audit log, user management, `getUsoPorPerfil` (via RPC), `getUtilizadorCompleto`, `editarUtilizadorAdmin`, `obterEmailUtilizador`/`editarEmailUtilizador` (Edge Function `gerir-email-utilizador`) — all operations audit-logged via `registarAcao` |
| `audit.ts` | `registarAcao()` fire-and-forget helper — calls `registar_acao` RPC |
| `wellness.ts` | patient wellness log entries |
| `medidas.ts` | patient weight/height history (`getMedidasPaciente`, `registarMedidaPaciente`), audit log on register |

Types are in `src/data/types.ts` (snake_case DB → camelCase TS). `UtilizadorAutenticado` is a discriminated union of `Administrador | MedicoEspecialista | TecnicoSaude | Paciente`.

### Edge Functions (all deployed on Supabase)

| Function | Caller | What it does |
|----------|--------|--------------|
| `atualizar-paciente` | TECNICO, ADMIN | Updates editable patient fields. Logs to `audit_log`. |
| `criar-utilizador` | ADMIN | Invites a new user (`auth.admin.inviteUserByEmail`, no password set by admin) + creates `utilizadores` row as MEDICO, TECNICO or ADMIN. Logs to `audit_log`. |
| `alterar-medico-paciente` | TECNICO, ADMIN | Closes current `paciente_medico` association, inserts new one (history preserved), sets `conta_ativada=true`. Idempotent if the same doctor is already assigned and the account is inactive. Notifies the new doctor (bilingual `notificacoes` row, one per exam) of any pre-validation exams it inherits (`UPLOADED`/`PROCESSING`/`PENDING_VALIDATION` — not just `PENDING_VALIDATION`, since the ML pipeline that advances to it may be inactive) — `estudos` RLS is association-based, so access transfers automatically but the old notification only went to the previous doctor. Logs to `audit_log`. |
| `gerir-email-utilizador` | ADMIN | Reads (`auth.admin.getUserById`) or updates (`auth.admin.updateUserById`) any user's `auth.users.email` — `utilizadores` has no `email` column, it's Auth-only. Without `novoEmail` in the body it returns the current email; with it, updates and logs to `audit_log`. Email and password are independent in Supabase Auth — changing email does not affect the user's password. |

Deploy: Supabase Dashboard → Edge Functions → Open Editor (paste file contents).

`criar-utilizador`'s `redirectTo` (`/auth/set-password`) must be added to Supabase Auth → URL Configuration → Redirect URLs (manual Dashboard step), otherwise the invite email link is rejected.

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
| `sincronizar_medidas_utilizador()` | trigger on `medidas_paciente` insert | Mirrors the new row's `peso`/`altura` into `utilizadores` (read by the mobile app). Source in `supabase/migrations/20260612_sync_medidas_utilizadores.sql` |

### Design system

All shared UI components are in `src/app/components/scolio/` re-exported from `index.ts`. Import from `'../../components/scolio'` (never directly). Available: `Button`, `Input`, `SearchBar`, `Textarea`, `Select`, `StatusBadge`, `ExamCard`, `CobbAngleGauge`, `ProgressBar`, `Toast`, `Modal`, skeleton loaders.

Design tokens are CSS custom properties in `src/styles/theme.css` — always use `var(--scolio-*)`, never raw Tailwind colour classes.

### Database schema key points

- **Single-table inheritance**: all users in `public.utilizadores` with `perfil` enum (ADMIN, MEDICO, TECNICO, PACIENTE). Role-specific columns are nullable.
- **Removed columns**: `utilizadores.nivel_admin` (all admins have identical permissions), `audit_log.ip_origem` (never populated, removed from UI).
- **Kept but not yet populated**: `utilizadores.token_recuperacao`, `token_expiracao`, `secreto_totp`, `tentativas_login_falhadas`, `cert_digital_entidade`, `cert_digital_expiracao` — kept for potential future migration away from Supabase Auth.
- **Immutable tables**: `audit_log`, `historico_estado`, `glassbreak_log`, `medidas_paciente` — triggers block UPDATE/DELETE. To "rollback" a failed exam upload, use `UPDATE estudos SET arquivado = true` (never DELETE).
- **Patient measurements**: `medidas_paciente` is an append-only history of weight/height, registered by the médico (the patient is measured during the appointment). "Current value" (web) = most recent row (`data_registo DESC`). The pre-existing `utilizadores.peso`/`altura` columns (read by the mobile app, same units: kg/cm) are kept in sync by trigger `trg_medidas_paciente_sync_utilizador` on every INSERT — see `supabase/migrations/20260612_sync_medidas_utilizadores.sql`.
- **Glass-break**: médico accesses any patient via `glassbreak_log` (15-min window). `medico_tem_acesso_a_paciente(uuid)` used in RLS. A **global emergency-access banner** (`BannerGlassBreak` in the médico `Layout`) shows the live countdown on every médico screen while a session is active — so the protocol no longer "disappears" when navigating into the exam viewer. It reads the médico's own active sessions via RPC `get_sessoes_glassbreak_ativas()` (SECURITY DEFINER — médico has no direct SELECT on `glassbreak_log`; source in `supabase/migrations/20260613_rpc_glassbreak_ativas.sql`). "Active" = `encerrado_em IS NULL AND data_expiracao > now()` (same as the admin dashboard KPI). The countdown is derived from `data_expiracao` (single source of truth), not a client-local timer. The banner has an **End** button that closes the session early via `encerrar_glassbreak(p_paciente_id)` — it writes only `encerrado_em`, the single field the immutability trigger `fn_glassbreak_proteger` permits. When a session ends (manually or by expiry), a **summary modal** (`ResumoGlassBreakModal`) shows the session metadata + the médico's actions during the window, via `get_resumo_glassbreak(p_paciente_id)` (audit_log filtered by `utilizador_snapshot->>'nome'` + the `data_inicio`→end window, since `registar_acao` stores no `utilizador_id`). Both RPCs in `supabase/migrations/20260613_glassbreak_encerrar_resumo.sql`.
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
| Edit other user's email | `EDITAR_EMAIL_UTILIZADOR` | Edge Function `gerir-email-utilizador` |
| Change own password | `ALTERAR_PASSWORD` | `ProfileScreen` |
| Activate / deactivate account | `ATIVAR_UTILIZADOR` / `DESATIVAR_UTILIZADOR` | `admin.ts toggleAtivoUtilizador` |
| Block / unblock account | `BLOQUEAR_UTILIZADOR` / `DESBLOQUEAR_UTILIZADOR` | `admin.ts toggleBloqueioUtilizador` |
| Assign / reassign doctor | `ALTERAR_MEDICO_PACIENTE` | Edge Function `alterar-medico-paciente` |
| Upload exam (tech) | `CRIAR_ESTUDO` | `ExamUploadScreen` |
| Upload exam (doctor) | `CRIAR_ESTUDO` | `ExamUploadMedicoScreen` |
| Validate exam (accept AI) | `VALIDAR_EXAME` | `estudos.ts confirmarMetricasIA` |
| Correct AI metrics | `CORRIGIR_EXAME` | `estudos.ts corrigirMetricasIA` |
| Archive exam | `ARQUIVAR_EXAME` | `estudos.ts arquivarEstudoMedico` |
| Send report to patient | `ENVIAR_RELATORIO` | `estudos.ts enviarEstudoAoPaciente` |
| Export audit CSV | `EXPORTAR_AUDITORIA` | `AdminAuditScreen` |
| Glass-break | `GLASS_BREAK` | `GlassBreakScreen` |
| Register patient measurements (weight/height) | `REGISTAR_MEDIDAS` | `medidas.ts registarMedidaPaciente` |

CSV export uses UTF-8 BOM (`﻿`) for correct rendering of Portuguese characters in Excel.

## Screens — current state

### Médico (`/`)
| Screen | Route | State |
|--------|-------|-------|
| DashboardScreen | `/` | ✅ Real KPIs, pending list, weekly chart |
| PatientListScreen | `/patients` | ✅ Filters, pagination, glass-break panel |
| PatientRecordScreen | `/patients/:id` | ✅ All tabs, notes, export, weight/height (current + history) |
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
| AdminAuditScreen | `/admin-panel/audit` | ✅ Real `audit_log` entries (200 latest), categorized, CSV export (UTF-8 BOM). Search is server-side (debounced, includes `utilizador_snapshot->>nome/email`); category filter is client-side. |
| AdminUsersScreen | `/admin-panel/users` | ✅ Toggle active/blocked, edit user data + email (any profile, via `gerir-email-utilizador`), invite user (no password — sets own on first access via `SetPasswordScreen`), change patient's doctor — all audited |
| AdminAIScreen | `/admin-panel/ai` | ⚠️ ML metrics show N/D — requires ML pipeline integration |

## Known remaining work

### Requires new DB tables (or external pipelines)
- `AdminAIScreen` — individual consents need `consentimentos_ia` table; ML metrics depend on `resultados` being populated by an external pipeline

### Polish
- `calcularIdade()` in several screens returns `"X anos"` hardcoded in PT — not using i18n

### Future
- Real push notifications (bell icon exists but badge is decorative — no count shown)
- ML model integration (`resultados` currently populated manually)
- React Native app for patients (built by team member)

## 2FA (email OTP)

Same approach as the mobile app: `signInWithOtp` + `verifyOtp` (type: `email`) via the Supabase project's shared Gmail SMTP. Optional for all web profiles (MEDICO/TECNICO/ADMIN); the `utilizadores.two_factor_ativo` column drives it.

| Layer | Code |
|---|---|
| Repo | `src/data/repository/auth.ts` — `login` returns `LoginResult` union (`needsTwoFactor`), `enviarOtpEmail`, `verificarOtpEmail`, `ativar2FA`, `desativar2FA` |
| Context | `src/app/auth/AuthContext.tsx` — `pendente2FA: { email, modo: 'login' \| 'ativar' } \| null` persisted in `localStorage` (fail-closed: survives tab close, same lifetime as the Supabase session; cleared when the session dies); `estaAutenticado` is `false` while `modo='login'` is pending |
| Verify screen | `src/app/screens/auth/TwoFactorVerifyScreen.tsx` at `/auth/two-factor-verify` — `NUM_DIGITOS` input boxes (must match the Supabase "Email OTP Length" setting; i18n interpolates the count), paste, backspace, 60s resend cooldown |
| Profile | `src/app/screens/shared/ProfileScreen.tsx` mounted at `/perfil`, `/tecnico/perfil`, `/admin-panel/perfil` — toggle 2FA; deactivation only needs confirmation (no OTP). Also has a "change password" form (current + new + confirm) that re-authenticates via `signInWithPassword` before calling `supabase.auth.updateUser({ password })`. |
| Audit | New `tipo_acao` values `ATIVAR_2FA` / `DESATIVAR_2FA`, categorized as `AUTH` in `AdminAuditScreen` |

`onAuthStateChange` listener ignores `SIGNED_IN` — `verifyOtp` triggers it, and processing it would mark the user authenticated before `pendente2FA` is cleared. `INITIAL_SESSION` (page reload or tab reopen) is still handled normally, so a refresh or tab close during pending-2FA-login keeps the user on the verify screen because `pendente2FA` is restored from `localStorage`. Fail-closed hardening: a blocked/inactive account detected after `signInWithPassword`/`verifyOtp` triggers `signOut`; an OTP send failure during login also signs out (a refresh can't skip the second factor). Note the 2FA gate is still client-side only — the Supabase session itself is valid before OTP verification, so direct API access is limited only by RLS, not by 2FA.

## New user invite flow

The admin never sets or sees a new user's password. `criar-utilizador` calls `auth.admin.inviteUserByEmail` with `redirectTo: '<origin>/auth/set-password'`; Supabase sends its built-in invite email with a link carrying `access_token`/`refresh_token` in the URL hash.

`src/app/screens/auth/SetPasswordScreen.tsx` (public route `/auth/set-password`) reads `supabase.auth.getSession()` directly — `detectSessionInUrl` (default `true`, see `src/lib/supabase.ts`) already established the session before mount, but the resulting `SIGNED_IN` event is ignored by `AuthContext` (same as the 2FA flow above), so the screen bypasses the context entirely. After `updateUser({ password })` succeeds, it calls `signOut()` and redirects to `/login` with a success message (`location.state.mensagem`, shown by `LoginScreen`) — the user then logs in fresh through the normal path.

## Git

Quando pedido para fazer commit, criar o commit sem linha `Co-Authored-By`.

## Language

Domain code, variable names, comments and UI strings are in **Portuguese**. Keep this convention when editing (e.g. `paciente`, `estudo`, `utilizador`, not `patient`, `exam`, `user`).
