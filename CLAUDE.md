# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> **Keep this file current.** Whenever you change architecture, conventions, env vars, auth/session behavior, the API surface, the design system, or dependencies, update the relevant section here *in the same change*. A drifted CLAUDE.md is a bug. Prefer concise, additive edits.

> **Keep the SRS current.** Whenever you implement or modify a user-facing feature, update `feedbase_srs.txt` (project root) *in the same change*. Keep it clean and professional — a well-structured requirements spec that accurately reflects what's built, not a changelog or a dump of implementation detail.

> **Always push after a change.** After completing and verifying a change, commit it and `git push` to the GitHub remote — do not leave finished work uncommitted or unpushed. The frontend and backend are separate repos; when a task touches both, commit and push **both**. (This guards against the working tree being reverted between sessions.)

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
- **Multiple workspaces per account.** An email can be a user in several tenants. `components/dashboard/workspace-switcher.tsx` (sidebar) lists `usersApi.getWorkspaces()`, and switching/creating calls `usersApi.switchWorkspace()` / `createWorkspace()` then `update({ accessToken, tenantId, role, userId })` — the `jwt` "update" handler swaps the active identity. **After `await update(...)` do a hard reload (`window.location.assign("/dashboard")`), not `router.refresh()`** — a soft refresh races the session-cookie write, so the switch wouldn't take effect until a second click. The create forms (onboarding + switcher dialog) check subdomain uniqueness live via `usersApi.checkSubdomain` + `useSubdomainAvailability` (debounced) and disable Create unless it's available; the backend also enforces it (pre-insert check + `UNIQUE` constraint + `ER_DUP_ENTRY` fallback). `resolveUploadUrl` (`lib/avatar.ts`, aliased as `resolveAvatarUrl`) turns a backend-relative upload path into a loadable API-origin URL — used for avatars **and** the tenant logo (uploaded via `uploaderApi.uploadImage` in Branding settings and shown by `PortalLogo` on the public board; the portal layout resolves it before rendering).
- **Onboarding.** A new signup has **no workspace** (`session.user.tenantId` is null). The dashboard layout redirects such users to `app/onboarding/page.tsx` (and signup redirects there directly) to create their first workspace; creating it claims their account row and re-scopes the session. They never see other tenants' data.
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

### Billing & subscriptions

- Three tiers — **Free / Pro / Business** (monthly). The display config (names, prices, feature bullets, which card is highlighted) lives in **`lib/plans.ts`** and is the single source of truth for both the dashboard Billing tab and the public pricing page. The enforced limits + Stripe Price IDs live on the backend (`src/consts/plans.js`); `lib/plans.ts` is presentation-only.
- **Hosted Stripe Checkout + Customer Portal** — no card data touches this app. `lib/api/billing.ts` (`billingApi.getStatus / checkout / portal`) calls the backend, which returns a Stripe URL; the client just `window.location.assign`es to it.
- **Billing settings tab** (`components/settings/billing-settings.tsx`, admin-only) shows the current plan + a 3-card grid. Free users get **Upgrade** (→ Checkout); subscribers get **Manage billing** (→ Portal) for tier changes/cancellation. Stripe Checkout returns to `/dashboard/settings?tab=billing&checkout=success|cancelled`; the settings page reads `?tab=` to deep-link the tab and the component toasts on the `checkout` param.
- **Public pricing**: `components/pricing/pricing-section.tsx` (display-only, CTAs → `/signup`) is rendered on the landing page (`#pricing`) and a dedicated `app/pricing/page.tsx`.
- The **plan is set only by Stripe** (checkout + webhook). The old plan dropdown in Branding settings was removed and `planName` dropped from `UpdateTenantData` — clients can't change their plan directly. A Free workspace that tries a paid capability (custom domain, integrations) gets a `402` with an upgrade message, surfaced as a toast.
- No client-side Stripe key is needed (hosted Checkout only redirects to a backend-provided URL).

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
