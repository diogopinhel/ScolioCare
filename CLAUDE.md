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

The Supabase client is a singleton at `src/lib/supabase.ts`. Every DB query goes through it, and **Supabase RLS automatically scopes results to the authenticated user** — no manual `WHERE user_id = X` is needed for per-user data.

## Architecture

### Role-based routing

There are four completely separate route trees, each protected by `<ProtectedRoute perfis="...">` in `src/app/routes.tsx`:

| Perfil | Root path | Layout |
|--------|-----------|--------|
| `MEDICO` | `/` | `Layout` |
| `TECNICO` | `/tecnico` | `TecnicoLayout` |
| `ADMIN` | `/admin-panel` | `AdminLayout` |
| `PACIENTE` | `/mobile` | bare `<Outlet>` |

After login, `rotaInicialPara(perfil)` in `AuthContext.tsx` redirects each role to its root.

### Data layer

All Supabase queries live in `src/data/repository/`:
- `auth.ts` — login, logout, session subscription, `UtilizadorAutenticado` mapping
- `estudos.ts` — dashboard metrics, pending exams, weekly chart, patient exam history, state history
- `pacientes.ts` — patient list (with exam aggregation), patient detail, associated patients
- `wellness.ts` — wellness log entries

Types are in `src/data/types.ts` and mirror the DB schema (snake_case DB → camelCase TS). The `UtilizadorAutenticado` union type is the discriminated union of all four role interfaces.

### Authentication flow

`AuthProvider` (wrapping the whole app in `main.tsx`) subscribes to `supabase.auth.onAuthStateChange`. On any auth event it calls `fetchPerfil()` which loads the `utilizadores` row and maps it to the typed union. A 5-second timeout prevents infinite loading if Supabase is unreachable.

### Design system

All shared UI components are in `src/app/components/scolio/` and re-exported from `index.ts`. Import from `'../../components/scolio'` (never directly from individual files). Available primitives: `Button`, `Input`, `SearchBar`, `Textarea`, `Select`, `StatusBadge`, `ExamCard`, `CobbAngleGauge`, `ProgressBar`, `Toast`, `Modal`, skeleton loaders.

Design tokens (colours, radii, spacing, font sizes) are CSS custom properties defined in `src/styles/theme.css` and always referenced as `var(--scolio-*)` — never as raw Tailwind colour classes.

### Database schema key points

- **Single-table inheritance**: all users are in `public.utilizadores` with a `perfil` enum column. Role-specific columns are nullable (e.g. `cedula_profissional` only relevant for `MEDICO`).
- **Immutable tables**: `audit_log`, `historico_estado`, `glassbreak_log` have triggers that block UPDATE/DELETE.
- **Glass-break access**: a medico can access any patient via `glassbreak_log` (15-minute emergency window). `medico_tem_acesso_a_paciente(uuid)` is the DB function used in RLS policies and in `medico_tem_acesso_a_paciente` JS function.
- **Archiving**: soft-delete everywhere — set `arquivado = true` on estudos, `ativo = false` on utilizadores. Nothing is ever hard-deleted.
- State machine for estudos: `UPLOADED → PROCESSING → PENDING_VALIDATION → VALIDATED → DIAGNOSED → SENT` (or `ARCHIVED` from any state).

## Known incomplete areas

Several screens have UI wired up but no DB persistence yet:
- `ExamViewerScreen` — fully mocked; route `/exam-viewer` takes no exam ID param
- `NewPatientScreen` — form submit does not call Supabase
- Archive actions in `PatientListScreen` and `ExamViewerScreen` — modals close without calling any API
- Clinical notes save in `PatientRecordScreen` — toast only, no DB write
- Age filter and sort dropdown in `PatientListScreen` — decorative, not wired to state
- Route `/patients/:id/edit` is referenced in buttons but not defined in `routes.tsx`

## Language

Domain code, variable names, comments and UI strings are in **Portuguese**. Keep this convention when editing existing files (e.g. `paciente`, `estudo`, `utilizador`, not `patient`, `exam`, `user`).
