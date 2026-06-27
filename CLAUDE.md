# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> **Keep this file current.** Whenever you change architecture, conventions, env vars, auth/session behavior, the API surface, the design system, or dependencies, update the relevant section here *in the same change*. A drifted CLAUDE.md is a bug. Prefer concise, additive edits.

> **Keep the SRS current.** Whenever you implement or modify a user-facing feature, update `feedbase_srs.txt` (project root) *in the same change*. Keep it clean and professional — a well-structured requirements spec that accurately reflects what's built, not a changelog or a dump of implementation detail.

## Commands

```bash
pnpm dev          # Start development server on http://localhost:3000
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

No test suite exists in this project.

## Architecture

### Overview

Feedbase is a multi-tenant SaaS feedback platform (a UserJot-style product). The Next.js frontend communicates exclusively with a backend REST API on `http://localhost:4560` — there is **no database access from this codebase**. The backend is a separate repo at `D:\Development\Backend\feedbase-backend` (with its own CLAUDE.md).

### Path Aliases

`@/*` resolves to the **project root** (not `src/`). All imports use this alias.

### App Router Structure

```
app/
├── (auth)/               # Unauthenticated layout — login, signup
├── api/auth/             # NextAuth route handlers + registration proxy
├── dashboard/            # Protected (admin) app — redirects to /login if no session
│   ├── feedback/         # Feedback list + [id] detail page
│   ├── roadmap/          # Kanban board (drag & drop via @dnd-kit)
│   ├── changelog/        # Release notes (markdown)
│   ├── notifications/    # User notifications
│   └── settings/         # 7 tabs: profile, team, tags, integrations, api-keys, audit, branding
├── portal/[tenant]/      # PUBLIC per-tenant portal — board, post, roadmap, changelog (read-only, unauthenticated)
└── page.tsx              # Landing page
```

Dashboard pages are `"use client"` and read the access token from `useSession()`. The dashboard layout (`app/dashboard/layout.tsx`) is a Server Component that gates auth via `await auth()`.

### Multi-tenant subdomain portal

- **`proxy.ts`** (project root — Next 16's `proxy` convention, which **replaced `middleware`**) reads the request host and rewrites `<tenant>.<root>/<path>` → `/portal/<tenant>/<path>`. A host that doesn't match the root domain is treated as a custom domain and passed through as the full tenant identifier. Reserved subdomains (`www`, `app`, `admin`, …) stay on the admin app. Root domain comes from `NEXT_PUBLIC_ROOT_DOMAIN` (default `localhost:3000`).
- **`app/portal/[tenant]/`** renders public pages from **`lib/api/public.ts`** — an unauthenticated **server-side** client that hits the backend `/public/*` routes. Only safe fields are exposed (no author emails; drafts hidden). Internal links use `/portal/<tenant>/…` so they work both on a subdomain and via the direct path.
- Visitors **can submit feedback** (`components/portal/feedback-submit.tsx`, POSTs to `/public/:tenant/feedback`) and **upvote** (`components/portal/portal-vote-button.tsx`, toggles `/public/:tenant/posts/:id/vote`). Anonymous identity for vote spam-control comes from `lib/portal/guest.ts` — a persistent `fb_guest_id` cookie (sent to the backend) plus a localStorage hint for the filled state. The tenant logo (`components/portal/portal-logo.tsx`) falls back to a brand-colored initial if missing/broken.
- Local testing: visit `http://<tenant>.localhost:3000` (Chrome resolves `*.localhost`) or `/portal/<tenant>` directly.

### Authentication & session

- NextAuth v5 (beta), **Credentials provider only**; config in `auth.ts`. The JWT stores `userId`, `accessToken`, `tenantId`, and `role`. Session type augmentation is in `types/next-auth.d.ts`.
- **Exactly one `SessionProvider`.** It lives in the root `app/layout.tsx` (`AuthSessionProvider`), seeded with the server session. **Do NOT add a second/nested `SessionProvider`** (e.g. in the dashboard layout) — nesting breaks `useSession().update()`, so client-side session refreshes silently fail (this caused the header avatar not to update after a profile edit).
- Profile edits call `update({ name, image })` to refresh the session in place; `auth.ts`'s `jwt` callback handles the `"update"` trigger. The header reads name/avatar from the live session so it re-renders immediately.
- **Multiple workspaces per account.** An email can be a user in several tenants. `components/dashboard/workspace-switcher.tsx` (sidebar) lists `usersApi.getWorkspaces()`, and switching/creating calls `usersApi.switchWorkspace()` / `createWorkspace()` then `update({ accessToken, tenantId, role, userId })` — the `jwt` "update" handler swaps the active identity so the dashboard re-scopes without a re-login. `resolveAvatarUrl` (`lib/avatar.ts`) normalizes avatars everywhere they're shown.
- Access tokens are forwarded as `Bearer` on every API call. Auth helpers (`lib/auth/`) handle login/register, Zod validation, and in-memory rate limiting.

### API Client

`lib/api/client.ts` — base `apiClient` with `get/post/put/patch/delete`. Mutating methods and many reads **automatically inject `lg: "en"` into the request body** (a backend convention); several logical GETs are implemented as POST.

Services live in `lib/api/` and are re-exported from `lib/api/index.ts`:

```typescript
import {
  postsApi, votesApi, commentsApi, roadmapApi, changelogApi,
  notificationsApi, tagsApi, analyticsApi, usersApi, tenantsApi,
  apiKeysApi, auditLogsApi, integrationsApi, uploaderApi, publicApi,
  extractRows, extractTotal, parseJsonField,
} from "@/lib/api";
```

Authenticated services take an `accessToken` from `session.user.accessToken`. The helpers `extractRows / extractTotal / parseJsonField` normalize the backend's varied response shapes. `publicApi` (unauthenticated server fetch) and `uploaderApi` (multipart, no JSON `lg` body) bypass the standard client.

### UI Components

shadcn/ui components (Radix UI primitives) live in `components/ui/`. Add new ones with:

```bash
pnpm dlx shadcn@latest add <component>
```

Toasts use `sonner` — `import { toast } from "sonner"`. Roadmap drag-and-drop uses `@dnd-kit/core`.

### Design System

**Light-only app.** A `prefers-color-scheme: dark` media query was removed and `color-scheme: light` is forced in `globals.css`. Do not reintroduce dark-mode variants — the app hardcodes light brand colors, so dark tokens make shadcn components unreadable.

Brand colors:
- Primary: `#c74959` (rose) · Secondary: `#da6a78` · Accent/border: `#e399a3` · Background: `#fdf8f9` · Text: `#1c0a0c`

Typography: **one family everywhere — Sora (sans).** `--font-heading` is remapped to the sans family in `globals.css`, so `font-heading` titles match body text. Mono (JetBrains) is reserved for code / API keys.

Conventions:
- Dialogs & alert-dialogs are glossy white (white→`#fdf8f9` gradient, soft shadow, rose ring); backdrop is `bg-[#1c0a0c]/30` blurred. `Select` dropdowns default to `position="popper"`.
- Form fields (Input / Textarea / Select trigger): white bg, soft rose border, rose focus ring, `h-10`.
- Buttons: filled primary = `bg-[#c74959]`; the `outline` and `ghost` variants have a rose hover (`hover:bg-[#c74959]/10 hover:text-[#c74959]`).

### Rendering & performance

- The single `AuthSessionProvider` (root `app/layout.tsx`) is **seeded server-side** via `await auth()` so authenticated pages have the session/token on first paint. Without the seed there's a loading gap where the dashboard fires token-less API calls and the backend replies plain-text `Access denied`. Every route is already dynamic (auth/portal reads), so seeding costs no static rendering.
- `lib/api/client.ts` reads each response as text then `JSON.parse`s defensively — non-JSON error bodies (like `Access denied`) become a clean `ApiError`, not a misleading "can't connect".
- Authenticated surfaces (dashboard, login/signup, landing) read the session/cookies and are **dynamic by design** — don't try to force them static.
- The **public portal is dynamic** because its backend reads are POST and Next's Data Cache only caches GET. `app/portal/[tenant]/layout.tsx` already sets `export const revalidate` (activates once those reads become GET + `next: { revalidate }`); until then `loading.tsx` provides streaming. `publicApi.getTenant` is wrapped in React `cache()` to dedupe the tenant lookup per render.
- Route transitions stream via `loading.tsx` skeletons (`app/dashboard/`, `app/portal/[tenant]/`).
- Remote images use `next/image`; allowed hosts are in `next.config.ts` → `images.remotePatterns`.
- Heavy libs in `components/ui/` (recharts, @tanstack/react-table, cmdk, react-day-picker, …) are scaffolding **not imported by any route**, so they're tree-shaken out of bundles. Don't import them into a route without weighing the bundle cost.

### Environment Variables

```
AUTH_SECRET                        # NextAuth secret
FEEDBASE_API_BASE_URL              # Server-side API URL (default: http://localhost:4560)
NEXT_PUBLIC_FEEDBASE_API_BASE_URL  # Client-side API URL (same)
NEXT_PUBLIC_ROOT_DOMAIN            # Root domain for subdomain routing (default: localhost:3000)
```

Configured in `.env.local` (already present, not committed).
