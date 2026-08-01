# Billing regression checklist

Every item here is a bug that **actually shipped** and was found by testing, not a
hypothetical. Most were invisible from the UI — the app looked fine while it
quoted one price and charged another. Re-run this after any billing change, after
switching `PADDLE_ENV`, and before going live.

**To have Claude run it:**

> Run the billing regression checklist in `BILLING_CHECKS.md` against production.
> Verify each item against the live Paddle account and the database — don't trust
> log output or the UI. Report anything that fails with the actual numbers.

The rule that catches most of these: **compare what is ADVERTISED with what Paddle
ACTUALLY CHARGES**, by creating a real transaction and reading its totals. Never
conclude from a script printing `OK`.

---

## 0. Run the automated audit first

```bash
node scripts/audit-billing.js      # read-only, safe on production
```

One command covering the checks that are easy to skip and expensive to miss:
every configured **price** matches `lib/plans.ts`; every active **offer** charges
its advertised price, expires with its window, and is restricted to its own price;
every active **promo code** has a discount that exists; and every stored
**customer/subscription id** resolves in the current environment. Exits non-zero
if anything fails, so it can gate a deploy.

Fix what it reports:

| It says | Run |
|---|---|
| offer discount missing / wrong / doesn't exist here | `backfill-offer-discounts.js --force` |
| customer or subscription doesn't exist here | `clear-stale-paddle-refs.js` |
| promo code discount doesn't exist here | re-create the code in the Admin Panel |

**A clean audit is necessary, not sufficient** — it reads configuration. The
sections below cover behaviour it can't observe (proration, cancel/resume,
redemption limits, webhooks), and a real purchase is still the final word.

### The class of bug this catches

Rows in our database point at objects in Paddle. Nothing enforces that the two
agree, and **nothing crosses environments** — prices, discounts, customers and
subscriptions are all separate between sandbox and live. When a reference goes
stale the app does not error; it quietly misbehaves:

- an offer with a missing discount → advertised **$5.60**, charged **$10.00**
- a subscription id from another environment → the account shows a **paid plan
  while nothing bills it**, and every plan change fails with *"Subscription not
  found"*, which `reconcile` cannot repair because the id does not exist

Both shipped. Re-run the audit after **any** environment or provider change.

---

## A. Advertised price == charged price

The whole class of bug. An offer is a DB row (what we display) *plus* a provider
discount (what makes checkout bill it); they drift independently.

- [ ] **Every active offer charges its advertised price to the cent.** For each
  plan+interval, create a transaction with the offer's `discountId` and check
  `details.totals.total` equals `offer_price × 100`.
  *Bug: offers had `paddle_discount_id = NULL` (created before the discount code
  existed) — the card said **$5.60/mo** and Paddle charged **$10.00**.*
- [ ] **No offer is displayed that cannot be charged.** `getActiveOffers` must hide
  any offer lacking a discount on the active provider. Check the logs for
  `has no discount on the active provider`.
- [ ] **A plan CHANGE is quoted at the offer price, not list.** `previewChange` for
  each target must equal the offer price (minus proration credit).
  *Bug: "Pro yearly $4.48/mo" on the card, **$95.30** in the confirm dialog —
  the discount was applied at checkout but not on plan changes.*
- [ ] **The plan you clicked is the plan you're charged for.** The pricing CTA
  carries an encrypted `?c=` token (`lib/plan-intent-token.ts`), not readable
  params. Click Pro yearly, walk to `/checkout`, confirm the card shows Pro
  yearly. Then edit the token in the address bar by one character and reload:
  it must fall back to **no intent** (dashboard), never to a different plan.
  Also confirm all four tokens are the **same length** — GCM ciphertext matches
  plaintext length, so a variable-width payload would leak `business` vs `pro`
  through the URL's size alone.

## B. Offer lifetime

- [ ] **Monthly offers expire; they are not a permanent price cut.** Each monthly
  offer's Paddle discount must have `maximumRecurringIntervals` = the window
  length in months (3-month window → `3`). `null` means **forever**.
  *Bug: `backfill-offer-discounts.js` omitted `starts_at`/`ends_at` from its
  SELECT, so the value was `undefined` → `null` → forever. It printed four clean
  `OK`s. Yearly looked correct only because it is hardcoded to `1`.*
- [ ] **Yearly offers are `maximumRecurringIntervals = 1`** — one billing period is
  a year.
- [ ] **A new subscription renews at the offer price**, not list. After a checkout,
  the subscription must carry a discount and `nextTransaction.details.totals`
  must equal the offer price.
  *Bug: Paddle does **not** copy a transaction discount onto the subscription it
  creates — the checkout itself read "$5.60 now, then $10.00/month". Fixed by
  `ensureOfferDiscount` in `reconcile`.*
- [ ] **Existing subscribers renewing during an offer get the offer price**, and the
  Billing tab says so (`billing.offerAppliesToRenewals`).
- [ ] **An existing discount is never overridden** — someone on a promo code or an
  earlier offer keeps their terms.
- [ ] **No orphaned active discounts in Paddle.** Re-minting leaves the old ones
  active and applicable by id. Archive anything not referenced by `offers`,
  `promo_codes`, or a live subscription.

## C. Promo codes

- [ ] **A code cannot be redeemed twice by the same account** — for **both**
  `free_plan` and `percent_off`. The DB must enforce it:
  `UNIQUE (promo_code_id, account_email)` on `promo_redemptions`.
  *Bug: only the `free_plan` branch recorded a redemption, so a percent-off code
  was infinitely reusable and `max_redemptions` never applied to it.*
- [ ] **`max_redemptions` is respected under concurrency** — claimed via
  `UPDATE … WHERE times_redeemed < max_redemptions`, not check-then-insert.
- [ ] **A code scoped to one plan is rejected on another** → `promo_plan_mismatch`,
  enforced server-side at checkout (the client sends the discount id).
- [ ] **A discount that drops the total below the processor minimum fails with a
  clear message**, not "Failed to start checkout".
  *Paddle's USD minimum is **$0.70**, so 99% off the $10 plan ($0.10) is refused.
  Near-total discounts must be `free_plan` comp codes instead.*
- [ ] **A revoked code can be reactivated** with new terms, and reactivation mints a
  **fresh** provider discount (the old one was archived).

## D. Plan changes

- [ ] **Upgrade: the previewed amount equals the amount actually charged.** Compare
  the preview's `immediateTransaction.details.totals.grandTotal` with the
  resulting transaction. Already-paid time must be credited.
- [ ] **Downgrade: no charge, no refund, current plan kept until period end.** The
  in-app plan must NOT drop immediately; `pending_plan`/`pending_effective_at`
  hold it, and `reconcile` flips it only after the date passes.
  *Bug: `prorated_next_billing_period` charged **$9.68 extra with zero credit**
  and **errored outright** on interval changes.*
- [ ] **Yearly → monthly is applied at period end by the scheduler**, not
  immediately (`do_not_bill` would reset the period and destroy the paid year).
- [ ] **Cancelling a scheduled change doesn't reset the billing period.** It must
  compare the live Paddle price first — a deferred change never swapped the item,
  so re-sending the same price silently shortens a paid year.
- [ ] **The billing scheduler is running** (`Billing scheduler started` on boot) and
  its sweep succeeds. Alert on `MISSED the change window`.

## E. Cancel / resume / comps

- [ ] Cancel sets `scheduledChange.action = cancel`, status stays `active`, access
  continues to period end, card reads "ends on `<date>`".
- [ ] Resume clears it — same billing date, no new charge, discount kept. This is
  how a customer "comes back" during a cancelled period; resubscribing would
  charge again and reset the period they already paid for.
- [ ] **Buying again while cancelled-but-active is REFUSED**
  (`subscription_already_active`). Cancelling leaves the subscription ACTIVE
  until period end, so a checkout in that window would create a SECOND Paddle
  subscription — both billing, with the app tracking only the newest.
- [ ] **A discount that cannot apply to the current plan is replaced, not kept.**
  Ours are `restrictTo` one price, so after a plan change the old plan’s discount
  lingers inert and would block a later offer for the plan they are actually on.
- [ ] An admin comp or free-plan promo **cancels any live subscription first** —
  otherwise the provider keeps charging an account the app shows as comped.
- [ ] Comped accounts are never touched by the scheduler or by offer attachment.

## F. Config and deployment footguns

- [ ] **Schema migrations have been run** on the target database:
  `add-paddle-columns.js`, `add-paddle-discount-columns.js`,
  `add-promo-redemption-uniqueness.js`.
  *Bug: production was on a pre-Paddle schema — the scheduler failed every tick
  with `Unknown column 'paddle_subscription_id'` and checkout would have failed
  on the first real customer.*
- [ ] **After switching `PADDLE_ENV`:** *nothing* crosses environments — not
  prices, discounts, customers, or subscriptions.
  1. `backfill-offer-discounts.js --force` (plain runs skip rows that still hold
     sandbox ids)
  2. **Re-create promo codes** in the Admin Panel
  3. `clear-stale-paddle-refs.js` — accounts that subscribed during sandbox
     testing still point at a `sub_…` the live account has never heard of.
     *Bug: two accounts showed a PAID plan with nothing billing them, and every
     plan change failed with "Subscription not found". reconcile cannot repair it,
     because the id it looks up does not exist.*
- [ ] **Boot warnings are clean** — no sandbox key with `PADDLE_ENV=production`,
  no missing `PADDLE_PRICE_*`, no missing `PADDLE_WEBHOOK_SECRET`.
- [ ] **Webhooks return 200.** The secret is the destination's **Secret key**
  (`pdl_ntfset_…`, ~85 chars), *not* the destination ID from "Copy ID" (~33
  chars). Paddle does not re-deliver after its retries are exhausted, so old
  failures never turn green — replay one to test.
- [ ] **`NEXT_PUBLIC_*` are baked at build time** — changing the Paddle token or env
  requires a frontend **rebuild**, not a restart.
- [ ] Frontend and backend agree on provider and environment
  (`BILLING_PROVIDER` / `NEXT_PUBLIC_BILLING_PROVIDER`, `PADDLE_ENV` /
  `NEXT_PUBLIC_PADDLE_ENV`).
- [ ] **The Paddle customer's email matches the account email** for every row in
  `billing_accounts` — it's where the portal sign-in link, receipts and invoices
  go. Compare `paddle.customers.get(paddle_customer_id).email` with `email`.

> **Not a bug: sandbox emails arrive at the seller's address.** Paddle's sandbox
> redirects customer-facing email (portal sign-in links, receipts) to the Paddle
> *account owner's* address instead of the customer's, so a test purchase by
> `customer@example.com` lands in the seller's inbox. Verify the customer record
> holds the right address (above) rather than judging by which inbox received it;
> production delivers to the real customer. We send none of these emails — they
> come from Paddle.
