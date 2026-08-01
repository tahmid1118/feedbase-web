# Signup → payment flow, and a yearly-first Billing tab

**Status:** design agreed, awaiting review. Not implemented.
**Date:** 2026-08-01

## Problem

A visitor who picks **Pro** or **Business** on the public pricing page is sent to
signup and then dropped on the dashboard, on the **Free** plan, with no mention of
the plan they just chose. The purchase intent is lost at the door: to actually buy
they have to find Settings → Billing and start again.

Separately, both the pricing page and the Billing tab default to **monthly**, so
the yearly saving (~20%, and the larger Early Bird discount) is never the first
thing anyone sees.

## Hard constraint that shapes the whole flow

`POST /billing/checkout` requires `role === "owner"`
(`src/main/billing/paddleBilling.js:252`, `BILLING_ROLES = ["owner"]`).

A brand-new signup has **no workspace and no role** — `session.user.tenantId` is
null until onboarding creates one. So **checkout cannot run immediately after
signup**. Onboarding has to come first, because that is what makes the account an
owner. Any design that puts payment straight after signup is unimplementable
without weakening a billing authorisation rule, which we are not going to do.

## Flow

Intent travels as **one encrypted token** `?c=<token>` (AES-256-GCM, keyed off
`AUTH_SECRET` — see `lib/plan-intent-token.ts`), decrypted and **re-signed at
each hop** rather than trusted:

```
Pricing card → /signup?c=thQMv8Mr6fWgLXjq1u7n5H12ecqLUFYRSNeoKRTVwmDL3UT1HswSaBpWBQ
             → /onboarding?c=…                       (workspace created ⇒ owner)
             → /checkout?c=…                         (Paddle overlay)
             → /dashboard
```

Rules:

- A token that fails to decrypt — forged, tampered, expired, or signed under a
  different secret — means **no intent**: the visitor lands on the dashboard as
  today. Old plaintext `?plan=pro` links fall into this case by design.
- The token carries `{plan, interval, expiry}` only. **Never a price** — that is
  resolved server-side at checkout.
- Tokens expire after **7 days**.
- Decryption needs the server secret, so each hop's `page.tsx` is a Server
  Component that decodes and passes the result to its client body.
- If `/onboarding` carries `?invited=`, the plan intent is **dropped**. That user
  becomes a *member* of someone else's workspace, and members cannot buy.

Already-signed-in visitors skip ahead (`PricingCards` is a client component, so
`useSession()` is available):

| Viewer | Sent to |
|---|---|
| Owner with a workspace | `/checkout?…` |
| Signed in, no workspace | `/onboarding?…` |
| Member only (no owned workspace) | `/onboarding?…` — buying requires owning one |
| Signed out | `/signup?…` |

## New route: `app/checkout/page.tsx`

A standalone client page, styled like `app/onboarding` — not part of the
dashboard shell.

**Guards, in order.** Each redirect preserves the params where it makes sense:

1. Unauthenticated → `/login`
2. No `tenantId` → `/onboarding?…`
3. `role !== "owner"` → `/dashboard`
4. Missing / invalid / `free` plan → `/dashboard`
5. Already has a live subscription (per `getStatus()`) →
   `/dashboard/settings?tab=billing`

**Content:** logo; an "activate &lt;Plan&gt;" heading; a plan summary carrying the
name and badge, the feature list, the offer strike-through price and SAVE badge
*identical to the pricing card*, the billed note, and the offer-duration line so a
time-limited price never reads as permanent; an `IntervalToggle` seeded from the
URL; a primary **"Pay & activate &lt;Plan&gt;"**; and a quiet **"Continue on the
Free plan"** link.

**Show `Taxes calculated at checkout`, not a "Total today" figure.** Paddle is
Merchant of Record and adds tax on top of our price, which varies by buyer
location. Printing a concrete total on our own page is precisely the
advertised-price ≠ charged-price failure that `BILLING_CHECKS.md` exists to catch —
we would be stating a number we do not compute and cannot guarantee.

**Payment reuses the existing seam unchanged:**
`billingApi.checkout(plan, token, { interval })` → `transactionId` →
`openPaddleCheckout`; Stripe's `{ url }` redirect still handled;
`successUrl` → `/dashboard?checkout=success`.

Errors: `subscription_already_active` → toast + send to the Billing tab. Anything
else → toast and stay on the page, so the attempt can be retried.

**No promo-code field here** — deliberate. Redemption stays in Settings → Billing,
where the once-per-account rules and error states already live.

## Yearly-first defaults

| Surface | Default | Why |
|---|---|---|
| `PricingCards` | `"year"` | Lead with the better-value option |
| `/checkout` | URL interval, else `"year"` | Honour the choice already made |
| Billing tab | **the subscriber's own `billingInterval`**, else `"year"` | — |

The Billing tab is the exception worth stating explicitly: a flat `"year"` there
would show a **monthly** subscriber yearly prices and "switch" CTAs against their
own current plan, which reads as though we had changed their billing.

## Required cleanup (do this first, not after)

The offer strike / per-month / percent math is duplicated verbatim in
`components/pricing/pricing-cards.tsx:53-69` and
`components/settings/billing-settings.tsx:648-662`. Extract to `lib/plans.ts`:

```ts
offerDisplay(plan, interval, offer) → { strike, perMonth, percent }
```

and use it in **all three** places. Pure extraction, no behaviour change. Doing it
first stops the checkout page becoming a third copy of pricing arithmetic — the
exact shape of bug that produced "advertised $5.60, charged $10".

## Scope

**Touched:** `app/checkout/page.tsx` (new), `components/pricing/pricing-cards.tsx`,
`components/settings/billing-settings.tsx`, `app/(auth)/signup`, `app/onboarding`,
`lib/plans.ts`, `lib/i18n/locales/*/common.json` (new `checkout.*` keys in all 8),
frontend `CLAUDE.md` (billing section), `feedboard_srs.txt`.

**Untouched:** no backend changes, so `API_FULL_LIST.md` is unaffected. No change
to what is charged, refunded or stored, so the legal pages are unaffected.

## Verification

No test suite in this project. `pnpm lint` and `pnpm build`, then manually against
the **Paddle sandbox**:

1. Pro-yearly signup end to end — pricing card → signup → onboarding → checkout →
   dashboard on Pro.
2. The offer price on `/checkout` matches the sandbox transaction **to the cent**.
3. Abandoning `/checkout` leaves a usable Free account with its workspace intact.
4. An already-subscribed owner visiting `/checkout` lands on the Billing tab.
5. The invite flow still ignores plan intent (invitee ends up a member, unbilled).
6. Billing tab still opens on a monthly subscriber's *own* interval.

## Open question for review

The flow adds a step between signup and the dashboard. If a visitor abandons at
`/checkout` they still have a working Free account and workspace — no dead end —
but they have seen one more screen than before. That is the intended trade, and
worth confirming it reads as intended before implementation.
