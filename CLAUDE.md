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
│   └── settings/         # 8 tabs: profile, team, tags, integrations, api-keys, audit, branding, billing (owner-only tabs gated)
├── admin/                # PLATFORM Admin Panel — overview, workspaces, users, admins, promo-codes, offers (isAdmin only)
├── portal/[tenant]/      # PUBLIC per-tenant portal — board, post, roadmap, changelog (read-only, unauthenticated)
└── page.tsx              # Landing page
```

Dashboard pages are `"use client"` and read the access token from `useSession()`. The dashboard layout (`app/dashboard/layout.tsx`) is a Server Component that gates auth via `await auth()`.

### Multi-tenant subdomain portal

- **`proxy.ts`** (project root — Next 16's `proxy` convention, which **replaced `middleware`**) reads the request host and rewrites `<tenant>.<root>/<path>` → `/portal/<tenant>/<path>`. A host that doesn't match the root domain is treated as a custom domain and passed through as the full tenant identifier. Reserved subdomains (`www`, `app`, `admin`, …) stay on the admin app. Root domain comes from `NEXT_PUBLIC_ROOT_DOMAIN` (default `localhost:3000`).
- **`app/portal/[tenant]/`** renders public pages from **`lib/api/public.ts`** — an unauthenticated **server-side** client that hits the backend `/public/*` routes. Only safe fields are exposed (no author emails; drafts hidden). Internal links use `/portal/<tenant>/…` so they work both on a subdomain and via the direct path.
- **Portal nav** (`components/portal/portal-nav.tsx`, in the portal layout header) has **Board** and **Changelog** tabs. The public **changelog** (`app/portal/[tenant]/changelog`, list + `[id]` detail) shows only **published** entries (backend `getPublicChangelog` filters `is_published = 1`). The **roadmap** portal route stays a redirect-to-board (not public). Nav/detail links use absolute `/portal/<tenant>/…` hrefs — the proxy passes any `/portal/…` path straight through, so they work on a subdomain and via the direct path; the active tab is derived from the pathname suffix (client `usePathname`).
- Visitors **can submit feedback** (`components/portal/feedback-submit.tsx`, POSTs to `/public/:tenant/feedback`) and **upvote** (`components/portal/portal-vote-button.tsx`, toggles `/public/:tenant/posts/:id/vote`). A guest submission **requires a contact email** (name stays optional) so the team can reach the submitter about their post — enforced on the client and again in `createPublicPost` (`400 email_required` when `author_id` is null and no email); a logged-in submitter is identified by their account instead, so the email isn't asked for. The email is never exposed in public reads. Anonymous identity for vote spam-control comes from `lib/portal/guest.ts` — a persistent `fb_guest_id` cookie (sent to the backend) plus a localStorage hint for the filled state. The tenant logo (`components/portal/portal-logo.tsx`) falls back to a brand-colored initial if missing/broken.
- **Guest display identity.** A guest who leaves no name isn't shown as a flat "Anonymous". `lib/portal/anon-identity.ts` (`guestIdentity` / `colorFor`) deterministically derives a friendly pseudonym (e.g. "Brave Otter") + an avatar colour from the guest's `fb_guest_id`, so one guest is **consistent** across their posts/comments and **distinct** from other guests. The `fb_guest_id` is now stored on the post/comment (`posts.guest_id` / `comments.guest_id`, sent by `feedback-submit` and `portalActions.createComment`, returned by the public read endpoints) so the identity is stable server-side too; older rows without it fall back to a per-item key. Guests who *do* leave a name keep it (just coloured); logged-in authors always show their real name + avatar. Purely presentational — no PII is derived or exposed.
- **Logged-in users on the portal.** `PortalComments` and `PostOwnerActions` read `useSession()`; when logged in, a comment/post is sent with the Bearer token (backend attributes it to the user, showing their name + avatar) and the author can **edit/delete their own** post/comment via `lib/portal/actions.ts` (`portalActions`). Ownership is compared client-side (`comment.author_id === session.user.id`) for showing controls and **enforced server-side**. The session must reach the portal host, so in **production** the auth cookie is scoped to the parent domain (`auth.ts` `SESSION_COOKIE_DOMAIN` = `.<root domain>`) and every `*.<root domain>` subdomain shares the login. Changing that cookie domain invalidates existing sessions, so re-login after deploying it. The cookie is only scoped to a **real, dotted** root domain — browsers/RFC 6265 never set a `Domain` cookie for a single-label host like `localhost` or a bare IP (verified against curl), so those stay host-only. **Consequence in dev:** with `NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000` the cookie is host-only and a logged-in session **cannot** reach a `*.localhost` subdomain. Two ways to test logged-in portal actions locally: **(1)** the direct path `http://localhost:3000/portal/<tenant>` (same origin as login → cookie present); or **(2)** set `NEXT_PUBLIC_ROOT_DOMAIN=lvh.me:3000` (wildcard `*.lvh.me` resolves to 127.0.0.1), log in at `http://lvh.me:3000`, and open `http://<tenant>.lvh.me:3000` — the `.lvh.me` cookie is shared across subdomains exactly like production. `SESSION_COOKIE_DOMAIN` is computed from the domain *shape* (dotted-and-not-IP → `.<root>`, else host-only), so it's correct in every environment with no `NODE_ENV` branch.
- **Sharing & rich previews.** The post page (`app/portal/[tenant]/post/[id]`) has `SharePost` (`components/portal/share-post.tsx`) — copy link, native `navigator.share`, and social intents — and a `generateMetadata` that emits Open Graph + Twitter Card tags. `SharePost` takes an optional `url` (defaults to the current page) so the **dashboard** feedback detail reuses it: it resolves the tenant (`tenantsApi.getMine`), builds the public URL (`<subdomain>.<root>` or custom domain), and shows a **Share** action. (The team does not edit or open feedback for editing from the dashboard — the feedback text belongs to its author; the detail page only offers Share, Pin, and owner/Pro-gated Delete.) `opengraph-image.tsx` in the same segment renders a **dynamic branded preview image** (`next/og` `ImageResponse`, 1200×630) per post. `metadataBase` is derived from the request `host` header so OG URLs are correct on the tenant's subdomain/custom domain. `publicApi.getPost` is wrapped in React `cache()` so metadata + page + OG image share one backend call.
- **Timestamps.** `components/local-time.tsx` (`LocalTime`) renders timestamps in the **viewer's** locale/timezone — `relative` gives a live "time ago" label (via `Intl.RelativeTimeFormat`, refreshed each minute, absolute date/time on hover), else an absolute localized date/time (`Intl.DateTimeFormat`). Formatting lives in `lib/time.ts`. It's client-only (with `suppressHydrationWarning`) so it localizes per viewer. Used on board cards, comments/replies, and the post detail.
- Local testing: visit `http://<tenant>.localhost:3000` (Chrome resolves `*.localhost`) or `/portal/<tenant>` directly. **For *logged-in* portal actions, use `http://localhost:3000/portal/<tenant>`, or switch to a dotted loopback domain (`NEXT_PUBLIC_ROOT_DOMAIN=lvh.me:3000` → `http://<tenant>.lvh.me:3000`)** — a `*.localhost` subdomain can't receive the login cookie in dev (see the logged-in-users note above).

### Authentication & session

- NextAuth v5 (beta), **Credentials provider only**; config in `auth.ts`. The JWT stores `userId`, `accessToken`, `tenantId`, `role`, and (for admins) `isAdmin` + `adminId`. Session type augmentation is in `types/next-auth.d.ts`.
- **Three roles total.** Tenant roles are **`owner`** (manages the workspace — all admin-only settings tabs, billing, feedback deletion) and **`user`** (member; Profile tab only). The **platform `admin`** is a *separate identity*, not a tenant role — see below.
- **Platform admin & Admin Panel.** The app operator lives in a separate `admins` table (same email may also be a tenant user). The Credentials provider takes an `accountType` field: `accountType:"admin"` authenticates via `loginAsAdmin` (`lib/auth/auth-service.ts` → backend `POST /admin/auth/login`) and sets `isAdmin:true`, `adminId`, an admin `accessToken`, `tenantId:null`, `role:null`. Sign in at **`app/admin-login`** (a standalone, admin-styled page outside the customer `(auth)` layout); the dashboard layout redirects an `isAdmin` session to `/admin`. The gated panel (`app/admin/`, `layout.tsx` redirects non-admins to `/admin-login`) uses **`lib/api/admin.ts` (`adminApi`)** — a REST client sending the admin token to backend `/admin/*` — to manage all workspaces (incl. plan grant/comp, and **moderate their posts** — status/pin/delete, plus each post's **comments** (view/delete via a dialog — no editing) — at `app/admin/workspaces/[id]`), all users (role/reset/deactivate/delete), other admins, promo codes, **offers** (promotional plan prices), and view platform stats.
- **Exactly one `SessionProvider`.** It lives in the root `app/layout.tsx` (`AuthSessionProvider`), seeded with the server session. **Do NOT add a second/nested `SessionProvider`** (e.g. in the dashboard layout) — nesting breaks `useSession().update()`, so client-side session refreshes silently fail (this caused the header avatar not to update after a profile edit).
- Profile edits call `update({ name, image })` to refresh the session in place; `auth.ts`'s `jwt` callback handles the `"update"` trigger. The header reads name/avatar from the live session so it re-renders immediately.
- **Multiple workspaces per account.** An email can be a user in several tenants. `components/dashboard/workspace-switcher.tsx` (sidebar) lists `usersApi.getWorkspaces()`, and switching/creating calls `usersApi.switchWorkspace()` / `createWorkspace()` then `update({ accessToken, tenantId, role, userId })` — the `jwt` "update" handler swaps the active identity. **After `await update(...)` do a hard reload (`window.location.assign("/dashboard")`), not `router.refresh()`** — a soft refresh races the session-cookie write, so the switch wouldn't take effect until a second click. The create forms (onboarding + switcher dialog) check subdomain uniqueness live via `usersApi.checkSubdomain` + `useSubdomainAvailability` (debounced) and disable Create unless it's available; the backend also enforces it (pre-insert check + `UNIQUE` constraint + `ER_DUP_ENTRY` fallback). `resolveUploadUrl` (`lib/avatar.ts`, aliased as `resolveAvatarUrl`) turns a backend-relative upload path into a loadable API-origin URL — used for avatars **and** the tenant logo (uploaded via `uploaderApi.uploadImage` in Branding settings and shown by `PortalLogo` on the public board; the portal layout resolves it before rendering).
- **Onboarding.** A new signup has **no workspace** (`session.user.tenantId` is null). The dashboard layout redirects such users to `app/onboarding/page.tsx` (and signup redirects there directly) to create their first workspace; creating it claims their account row and re-scopes the session. They never see other tenants' data.
- **Delete account.** `components/settings/delete-account.tsx` (a Danger-zone card at the bottom of Settings → Profile). The dialog first loads `usersApi.getDeletionSummary()` and spells out exactly what dies: **workspaces you own are deleted** (with their posts/roadmap/changelog, all members lose access, subscription cancelled) while **shared workspaces survive** (your posts/comments there stay but become anonymous). Deleting requires the **password** plus typing `DELETE`, then signs out. Owned workspaces are destroyed because a workspace has exactly one owner and there is no ownership transfer.
- **Team invitations.** The **owner** invites teammates by email from Settings → Team (`invitationsApi`); the backend emails a single-use, 7-day link to `/invite/<token>`. `app/invite/[token]/page.tsx` (Server Component) resolves the token via `publicApi.getInvitation` and renders `components/invite/invite-accept.tsx`: an **existing** account must be signed in as the invited email and joins in one click; a **new** person sets a name + password, is signed in, and is sent to `/onboarding?invited=<tenantId>` — they create their **own** workspace and are then switched into the workspace that invited them. Over the plan's seat limit the invite returns `402` and the UI toasts an **Upgrade** action. The limit counts team members **besides the owner** (`limits.seats`): Free = owner + 2, Pro = owner + 5, Business = unlimited.
- **Two kinds of workspace.** A workspace has exactly **one owner**; everyone else is a member. `usersApi.getWorkspaces()` returns `role`, so `WorkspaceSwitcher` groups the sidebar dropdown into **"Your workspaces"** (owned) and **"Shared with you"** (joined by invite), and tags the active one with a **Member** chip when it isn't owned. The Team tab therefore shows roles as read-only badges — there is no valid role change under the one-owner rule.
- **Per-account workspace limits.** How many workspaces an account may **own** and **join** is capped by the account's tier (the best plan among workspaces it owns): Free owns 1 / joins 1, Pro 3 / 3, Business unlimited. `usersApi.getWorkspaces()` now returns a `limits` object (`WorkspaceLimits`: `canCreate` / `canJoin` / counts / `ownLimit` / `joinLimit`, limits `null` = unlimited). `WorkspaceSwitcher` reads it: at the owned cap it replaces **Add Workspace** with a locked "upgrade to add more" item routing to `settings?tab=billing`, and a `402` on create still toasts an **Upgrade** action. Enforced server-side (`402 plan_limit_workspaces_own` on create, `402 plan_limit_workspaces_join` on invite accept). The invite-accept page surfaces the join-limit message directly. To lift the cap, upgrade a workspace you **own** to Pro/Business.
- **One device at a time (Free/Pro) — device sessions.** Every user JWT carries an `sid` claim naming a row in the backend's `user_sessions` table, keyed by **email** (so switching workspaces re-uses the same session and is *not* a new device). On plans without the `multiDevice` limit (Free, Pro) a **second login is refused with `409`**; Business allows unlimited devices. Three consequences for this codebase:
  - **Surfacing the error.** A Credentials provider normally collapses every failure into one opaque error. `auth.ts` throws an `ActiveSessionError extends CredentialsSignin` with `code = "active_session"` (from `lib/auth/signin-errors.ts`) when the backend answers `409`, and NextAuth hands it back as `signIn(...).code` — that's how `login-form.tsx` shows "already signed in on another device" instead of "invalid password".
  - **Takeover escape hatch.** A `409` means the password was *correct*, so the account owner isn't locked out: `login-form.tsx` shows a **"This is me — sign out other devices and sign in here"** button that re-submits `signIn` with `force: "true"`. `auth.ts` passes it through as a `force` credential → `loginWithCredentials({ force })` → `POST /users/login` with `userData.force`, which revokes the other sessions and logs in. Without this, a stale session (browser closed without signing out) would block the owner for up to the 15-min idle window.
  - **Signing out must revoke the session.** Use **`endSession(accessToken)`** (`lib/auth/end-session.ts`) — never bare `signOut()`. Dropping the cookie alone leaves the server-side session alive, and the user is then told they're "already signed in elsewhere" when they try to come back. (Best-effort: if the revoke call fails we still sign out locally.)
  - **A revoked token 401s.** `lib/api/client.ts` turns any `401` into a one-shot sign-out to `/login?reason=session_ended` (the login form explains it), so a taken-over device doesn't sit in a dashboard where every request fails.
  - **Abandoned sessions** (browser closed without signing out) are taken over by the next login once idle >15 min — otherwise the user would be locked out for good. The takeover revokes the old session, so at most one is ever live.
- **Second *tab*** is a client-only problem: it reuses the session cookie, so there's no login event for the server to refuse. `components/dashboard/single-tab-guard.tsx` (mounted in the dashboard layout, `multiDevice` read server-side from `billingApi.getStatus()`, **failing open**) does a `BroadcastChannel` claim/taken/released handshake between tabs and blocks the duplicate. Simultaneous opens are tiebroken by open time — without that, two tabs would each object to the other and *both* would lock out.
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

- Three tiers — **Free / Pro / Business**, billable **monthly or yearly** (yearly is 20% off — `YEARLY_DISCOUNT` in `lib/plans.ts`, mirroring the backend). The display config (numeric `monthlyPrice`, feature bullets, highlight) lives in **`lib/plans.ts`**; `planPricing(plan, interval)` derives the shown price (yearly shows the discounted per-month equivalent + "billed annually ($X/yr)"). It's the single source of truth for both the dashboard Billing tab and the public pricing page. The enforced limits + Stripe Price IDs (monthly **and** yearly) live on the backend (`src/consts/plans.js`); `lib/plans.ts` is presentation-only.
- **Monthly/Yearly toggle** — `components/pricing/interval-toggle.tsx` (shared). The **public** pricing page splits into a server wrapper (`pricing-section.tsx`, fetches offers) + a client `pricing-cards.tsx` that owns the toggle. The **Billing tab** (`billing-settings.tsx`) has the same toggle and passes `interval` to `billingApi.checkout(plan, token, { interval, promotionCode })`. An admin promotional **offer** (diagonal-strike) applies to the **monthly** price only — yearly shows its built-in 20%-off price with a "Save 20%" badge. `billingApi.getStatus().billingInterval` (`'month'|'year'|null`) drives the "Billed yearly/monthly" line on the current-plan card.
- **Hosted Stripe Checkout + Customer Portal** — no card data touches this app. `lib/api/billing.ts` (`billingApi.getStatus / checkout / portal`) calls the backend, which returns a Stripe URL; the client just `window.location.assign`es to it.
- **Billing settings tab** (`components/settings/billing-settings.tsx`, admin-only) shows the current plan + a 3-card grid. Free users get **Upgrade** (→ Checkout); subscribers get **Manage billing** (→ Portal) for tier changes/cancellation. Stripe Checkout returns to `/dashboard/settings?tab=billing&checkout=success|cancelled`; the settings page reads `?tab=` to deep-link the tab and the component toasts on the `checkout` param.
- **Public pricing**: `components/pricing/pricing-section.tsx` (display-only, CTAs → `/signup`) is rendered on the landing page (`#pricing`) and a dedicated `app/pricing/page.tsx`.
- The **plan is set by Stripe** (checkout + webhook) **or by an admin comp** (Admin Panel plan grant / free-plan promo). A comped plan carries `subscription_status='comped'` with no Stripe subscription; the backend reconcile guard preserves it. The old plan dropdown in Branding settings was removed and `planName` dropped from `UpdateTenantData` — clients can't change their plan directly. A Free workspace that tries a paid capability (custom domain, integrations, deleting feedback) gets a `402` with an upgrade message, surfaced as a toast.
- **Offers.** Admins set a promotional **price** on Pro/Business (Admin Panel → Offers). When an offer is active, `billingApi.getStatus().offers[planKey]` drives the Billing tab plan card: the list price gets a **diagonal** rose strikethrough (a `linear-gradient` line, not `line-through`) with the green offer price beside it and a "SAVE X%" badge. The discount is real — checkout auto-applies the offer's Stripe coupon server-side (no client action). The **public pricing page** (`components/pricing/pricing-section.tsx`, async Server Component on the landing + `/pricing`) shows the same offer via `publicApi.getOffers()` → unauthenticated `GET /public/offers`.
- **Promo codes.** Admins generate codes in the Admin Panel; owners redeem them in the Billing tab's "Have a promo code?" field (`billingApi.redeem`). A **free-plan** code comps the plan instantly (the comped status renders as "Active" in the Billing tab so it never reads as charity); a **percent-off** code stores a Stripe promotion code that the next `billingApi.checkout(plan, token, promotionCode)` applies as a discount (checkout keeps `allow_promotion_codes` when no code is passed, so users can also type one at Stripe Checkout).
- **Multiple devices** (`limits.multiDevice`) is **Business-only** — Free and Pro are one-device-at-a-time. See the device-sessions bullet under *Authentication & session*.
- **Feedback attachments** (`limits.attachments`) are a **Pro+** capability: a feedback post can carry up to **3 photos or short videos** (images ≤10MB; video ≤50MB, capped by size not duration). Two upload surfaces share one flow — upload first, then link the returned ids on submit:
  - **Public board** (`components/portal/feedback-submit.tsx`): a *guest* can attach when the workspace is paid. The portal page passes `attachmentsEnabled` from `publicApi.getTenant().attachments_enabled` (the public tenant read exposes only the boolean, never the plan). Uploads go to `uploaderApi.uploadPublicAttachment(file, tenant)` → unauthenticated `POST /public/:tenant/attachments`; the submit body carries `attachmentIds`.
  - **Dashboard** (`components/feedback/create-post-dialog.tsx`): the dialog reads `billingApi.getStatus().limits.attachments` on open; on Pro+ it shows the picker (Free shows an inline “Upgrade to Pro” hint). Uploads go to `uploaderApi.uploadAttachment(file, token)` → authenticated `POST /posts/attachment`; `attachmentIds` ride on `postsApi.create`.
  - Shared UI: **`components/feedback/attachment-picker.tsx`** (upload/preview/remove, client-validates type+size via `lib/attachments.ts`) and **`components/feedback/attachment-gallery.tsx`** (image grid + lightbox, inline `<video controls>`), rendered on both post-detail pages. Board cards show a 📎 count. Attachment paths are backend-relative — always run them through `resolveUploadUrl`. The plan gate runs **server-side before multer**, so a Free workspace never streams a rejected file; the id-linking is tenant-scoped so an attachment can't be claimed onto another workspace's post.
- **Reject / restore feedback.** The dashboard board (`components/feedback/feedback-list.tsx`) has a **Rejected** tab. On the **Open** tab, the bulk selection bar offers **Reject** next to **Send to Roadmap** (sets the selected posts' status to `rejected` via `postsApi.updateStatus`). Rejected posts still appear in the **All** tab (and their own Rejected tab), but are hidden from the **public board + post detail** entirely (always excluded server-side). From the **Rejected** tab, a bulk **Restore to Open** brings them back; a rejected post's **detail page** shows a "Restore to open" button instead of the status dropdown. `rejected` is a real `posts.status` enum value (distinct from the legacy, unused `closed`); `updatePostStatus` validates against the allowed set.
- **Contact & notify submitter** is an **owner-only, Pro+** capability (`limits.contactSubmitter`). On a post's detail page (`app/dashboard/feedback/[id]/page.tsx`) a Pro+ owner sees the **submitter's email** (backend `getPostById` returns `author_email` as `null` on Free, so it never reaches the client), and when the post is **Completed** a **"Notify: implemented"** button emails the submitter that their feedback shipped (`postsApi.notifyImplemented` → `POST /posts/:id/notify-implemented`; a branded `feedbackImplementedEmail`). The send is recorded (`implemented_notified_at`) so the card shows "✓ Implemented email sent …" and the button becomes **Resend**. A Free owner sees a locked upsell instead. Enforced server-side (`402` on Free, `400` unless completed / when no submitter email).
- **Deleting feedback** is an **owner-only, Pro+** capability. The dashboard feedback detail (`app/dashboard/feedback/[id]/page.tsx`) only renders the Delete control for the `owner` role; it reads `billingApi.getStatus().limits.deleteFeedback` and, on Free, shows a locked button that toasts an **Upgrade** action (→ `settings?tab=billing`) instead of deleting. Enforced server-side (`deletePost`: `403` non-owner, `402` on Free). Comments/replies are unaffected.
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
