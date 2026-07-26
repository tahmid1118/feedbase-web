# FeedBoard — Production Deployment (Hostinger VPS)

FeedBoard is **two Node apps + MySQL** behind **Nginx**:

- **Frontend** — Next.js (this repo), `next start` on port **3000**.
- **Backend** — Express API (`feedbase-backend`), PM2 cluster on port **4562** (production).
- **MySQL** — the database (`feedboard_db`).
- **Nginx** — reverse proxy + TLS for the app domain, the API subdomain, and the **wildcard** tenant portals (`*.yourdomain.com`).

> The multi-tenant portal needs **wildcard DNS + a wildcard TLS cert**, so use a **Hostinger VPS** (Ubuntu). Shared/Node hosting can't route `*.yourdomain.com` to one app. Replace `feedboardapp.com` below with your domain.

---

## 1. DNS (Hostinger → Domains → DNS)

| Type | Name | Value |
|------|------|-------|
| A | `@` | your VPS IPv4 |
| A | `www` | your VPS IPv4 |
| A | `api` | your VPS IPv4 |
| A | `*` | your VPS IPv4 |

The `*` wildcard is what makes `<tenant>.feedboardapp.com` resolve to the box.

---

## 2. Server prerequisites (Ubuntu VPS)

```bash
# Node 22 LTS via nvm, pnpm, PM2  (Next 16 requires >= 20.9.0; .nvmrc pins 22)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 22 && nvm alias default 22
npm i -g pnpm pm2

# MySQL + Nginx + Certbot
sudo apt update
sudo apt install -y mysql-server nginx
sudo snap install --classic certbot && sudo ln -s /snap/bin/certbot /usr/local/bin/certbot
```

---

## 3. Database

```bash
sudo mysql
```
```sql
CREATE DATABASE feedboard_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'feedboard'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON feedboard_db.* TO 'feedboard'@'localhost';
FLUSH PRIVILEGES; EXIT;
```
Import the schema (from the backend repo):
```bash
mysql -u feedboard -p feedboard_db < database/schema.sql
```
> Import **`database/schema.sql`**, never `feedboard_db.sql`. The latter is the development dump: the same 26 tables *plus* a dummy seed block — `Acme Labs`/`Beta Works` tenants and four users (`owner@acme.test`, `admin@acme.test`, `jane@acme.test`, `owner@beta.test`) sharing one bcrypt hash. In production those are live logins with a known password. `schema.sql` carries every column the `scripts/*.js` migrations add, so a new database needs that one file — don't run the migration scripts.

> **Match your dev database engine to production.** A local **MariaDB** (or any MySQL with a laxer `sql_mode`) will accept SQL that production **MySQL 8.x rejects**, because `ONLY_FULL_GROUP_BY` is **on by default** in MySQL 8 and off in older/MariaDB defaults. That difference shipped a broken analytics query: `GROUP BY DATE(created_at)` while selecting `DATE_FORMAT(DATE(created_at), …)` is a *different expression*, so MySQL 8 failed it with `ER_WRONG_FIELD_WITH_GROUP`, the `/analytics/overview` endpoint 500'd, and the dashboard reported it as "backend unreachable" — with every local test passing. Run MySQL 8.4 locally (Docker is easiest), or at minimum add `ONLY_FULL_GROUP_BY` to your dev `sql_mode`. **Rule: `GROUP BY` must repeat each selected non-aggregated expression verbatim.**

Then create the platform admin — the only account a fresh install needs:
```bash
node scripts/create-admin.js you@yourdomain.com 'STRONG_PASSWORD' 'Administrator'
```
It sets `users.is_platform_admin = 1` with `tenant_id NULL` (admin login, no workspace). Sign in at `/admin-login`.

---

## 4. Backend (Express API)

```bash
git clone <backend-repo> ~/feedbase-backend && cd ~/feedbase-backend
pnpm install --prod=false
cp .env.example .env      # then edit .env — see below
mkdir -p logs uploads && touch uploads/.gitkeep
```

Fill `.env` (see `.env.example` for the full list). The essentials:

```
NODE_ENV=production
TRUST_PROXY_HOPS=1
DB_HOST=127.0.0.1
DB_USER=feedboard
DB_PASSWORD=STRONG_PASSWORD
DB_NAME=feedboard_db
SECRET_ACCESS_TOKEN=<openssl rand -hex 48>
ACCESS_TOKEN_EXPIRE=7d
FRONTEND_URL=https://feedboardapp.com
ROOT_DOMAIN=feedboardapp.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...        # from step 8
# Stripe price IDs — create them once:  node scripts/stripe-setup.js  (prints IDs)
STRIPE_PRICE_PRO=... STRIPE_PRICE_PRO_YEARLY=...
STRIPE_PRICE_BUSINESS=... STRIPE_PRICE_BUSINESS_YEARLY=...
# Email — Resend (RESEND_API_KEY) OR SMTP (SMTP_HOST/PORT/USER/PASS + MAIL_FROM)
```

One-time setup scripts, then start under PM2:
```bash
node scripts/stripe-setup.js            # creates Stripe products/prices → paste IDs into .env
node scripts/create-admin.js            # your platform-admin account
node scripts/create-official-board.js   # the dogfooding "feedback" board
node scripts/set-official-branding.js   # app icon = admin avatar + board logo
node scripts/create-billing-accounts.js # ensure the billing_accounts table exists

pnpm start                              # pm2 start ecosystem.config.js --env production
pm2 save && pm2 startup                 # survive reboots (run the printed command)
```

> `pnpm start` runs the API on **4562** in cluster mode (one worker per core), with graceful shutdown and a 1 GB/worker memory guard — see `ecosystem.config.js`. Use `pnpm run staging` for the 4561 staging instance.

---

## 5. Frontend (Next.js)

```bash
git clone <frontend-repo> ~/feedbase && cd ~/feedbase
pnpm install --prod=false
cp .env.example .env.local   # then edit — see below
pnpm build
```

> **Package manager: pnpm, pinned** via `"packageManager": "pnpm@10.26.2"` in `package.json`. `pnpm-lock.yaml` is the **only** committed lockfile — never add a `package-lock.json` (a second lockfile makes auto-detecting builders such as Nixpacks/Dokploy, Railway, or Heroku pick the wrong manager).
>
> **Node 20.9+ is required** (Next 16's own `engines`). `.nvmrc` pins **22**, and `nixpacks.toml` pins `nodejs_22` for Nixpacks-based platforms (Dokploy, Railway, Coolify) — without it Nixpacks defaults to **Node 18** and `next build` fails with `For Next.js, Node.js version ">=20.9.0" is required`. Don't express the requirement as a semver *range* in `engines.node`: Nixpacks reads that field first and falls back to its Node 18 default when it can't parse the value, which is worse than saying nothing. Keep `nixpacks.toml` and `.nvmrc` on the same major.
>
> There is deliberately **no `pnpm-workspace.yaml`** — this is a single package, not a workspace. pnpm 10 tolerates a settings-only workspace file, but pnpm 9 and earlier read its presence as "workspace root" and abort with `ERROR packages field missing or empty`, which broke container builds. pnpm settings therefore live in the `"pnpm"` field of `package.json`. Don't reintroduce the file.

`.env.local` (or export in the environment / PM2 config):
```
AUTH_SECRET=<openssl rand -base64 32>
AUTH_URL=https://feedboardapp.com                     # canonical origin — REQUIRED behind Nginx
FEEDBOARD_API_BASE_URL=http://127.0.0.1:4562          # server→API, internal
NEXT_PUBLIC_FEEDBOARD_API_BASE_URL=https://api.feedboardapp.com   # browser→API, public
NEXT_PUBLIC_ROOT_DOMAIN=feedboardapp.com
NEXT_PUBLIC_FEEDBACK_SUBDOMAIN=feedback
```

Start it under PM2 (`next start`, port 3000):
```bash
pm2 start "pnpm start" --name feedboard-web
pm2 save
```

---

## 6. Nginx (reverse proxy)

`/etc/nginx/sites-available/feedboard` — note the **three** server_names; Nginx matches the exact `api.` block before the `*.` wildcard:

```nginx
# Shared proxy headers
map $http_upgrade $connection_upgrade { default upgrade; '' close; }

# API → backend :4562
server {
  server_name api.feedboardapp.com;
  location / {
    proxy_pass http://127.0.0.1:4562;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 55M;      # feedback video attachments
  }
  listen 80;
}

# App + tenant portals → Next :3000
server {
  server_name feedboardapp.com www.feedboardapp.com *.feedboardapp.com;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;                 # proxy.ts reads this for the tenant
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;      # HMR/websockets
    proxy_set_header Connection $connection_upgrade;
  }
  listen 80;
}
```
```bash
sudo ln -s /etc/nginx/sites-available/feedboard /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 7. TLS (wildcard cert required)

The `*.feedboardapp.com` portals need a **wildcard certificate**, which requires a **DNS-01** challenge:

```bash
sudo certbot certonly --manual --preferred-challenges dns \
  -d feedboardapp.com -d '*.feedboardapp.com' -d api.feedboardapp.com
```
Add the TXT record it prints in Hostinger DNS, finish, then point the `ssl_certificate`/`ssl_certificate_key` in both server blocks at `/etc/letsencrypt/live/feedboardapp.com/…`, add `listen 443 ssl;`, redirect 80→443, and `sudo systemctl reload nginx`. (Hostinger also has an ACME DNS API plugin if you want auto-renewal of the wildcard.)

---

## 8. Stripe — go LIVE (real payments)

The app code is mode-agnostic: it uses whatever key you set. **Test and live are
separate universes** — keys, prices, coupons, and webhooks all differ. To take
real payments:

1. **Activate** your Stripe account (Dashboard → business details + bank account), then flip the dashboard toggle to **Live mode**.
2. Get the **live secret key** (`sk_live_…`, Developers → API keys) and set it in the backend `.env`:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   ```
3. **Create the live prices** (test price IDs won't work with a live key):
   ```bash
   node scripts/stripe-setup.js      # prints "Stripe LIVE mode" then the price IDs
   ```
   Paste the printed `STRIPE_PRICE_PRO / _PRO_YEARLY / _BUSINESS / _BUSINESS_YEARLY` into `.env`.
4. **Create the live webhook** (Developers → Webhooks → *Add endpoint*, in **Live** mode):
   ```
   https://api.feedboardapp.com/webhooks/stripe
   ```
   Events: `checkout.session.completed`, `customer.subscription.created`, `.updated`, `.deleted`. Copy the **Signing secret** (`whsec_…`) into `.env` as `STRIPE_WEBHOOK_SECRET`.
5. Ensure `NODE_ENV=production`, then `pm2 reload feedboard-server`.

**Verify the mode:** on boot the API logs `Stripe configured in LIVE mode.` If it
logs a **TEST-mode-in-production** warning, you're still on sandbox keys. (It also
warns if a live key is used outside production, so you can't charge real cards from
a dev box.) Do a real test purchase with a live card, then refund it in the
dashboard.

---

## 9. Verify

- `https://feedboardapp.com` — landing page loads.
- Sign up → onboarding creates a workspace → dashboard.
- `https://<your-tenant>.feedboardapp.com` — public portal loads.
- `https://api.feedboardapp.com/public/feedback/posts` (POST `{"lg":"en"}`) — API responds.
- A test checkout completes and the plan updates (webhook + reconcile).

---

## 10. Updating a release

```bash
# backend
cd ~/feedbase-backend && git pull && pnpm install && pm2 reload feedboard-server
# frontend
cd ~/feedbase && git pull && pnpm install && pnpm build && pm2 reload feedboard-web
```
Run any new `scripts/*` migration mentioned in the changelog (they're idempotent).

---

### Notes / gotchas
- **Cookie sharing:** in production the auth cookie is scoped to `.feedboardapp.com` so a login works across every `*.feedboardapp.com` portal. This only works on a **real dotted domain** (not an IP/`localhost`).
- **CORS:** with `NODE_ENV=production` + `ROOT_DOMAIN` set, the API restricts browser origins to the app domain + any subdomain of it. Add others via `CORS_EXTRA_ORIGINS`.
- **Uploads** live on disk under the backend's `uploads/` (served at `/uploads`). Back them up, or move to object storage if you scale to multiple API hosts. `client_max_body_size 55M` in Nginx must allow video attachments.
- **MySQL backups:** schedule `mysqldump feedboard_db` (cron) — the app data + billing_accounts live here.

---

## 11. Deploying on Dokploy (containers) — alternative to §2–§7

Sections 2–7 describe a VPS with Nginx + PM2. Dokploy (Nixpacks + Docker) replaces
them: it builds each repo, runs the container, and terminates TLS itself. Three
services: **DB** (MySQL), **Backend**, **Frontend**.

Both repos commit a `nixpacks.toml`. **Node 22 is pinned there** — Nixpacks
defaults to Node 18, which fails the frontend build outright (`For Next.js,
Node.js version ">=20.9.0" is required`).

### DB service

Create a MySQL service with `Database Name = feedboard_db`, `Database User =
feedboard` (matching `.env.example`, so nothing needs overriding). Leave the
external port unexposed — only the other containers need it.

`DB_HOST` is **not** `127.0.0.1`: containers reach each other by the service's
internal hostname on the Docker network. Copy it from the DB service page.

Import the schema from the **Backend** container's terminal (the Nixpacks image
has no `mysql` client, so use the app's own `mysql2`):
```bash
node scripts/import-schema.js          # idempotent; creates 26 tables
node scripts/create-admin.js you@yourdomain.com 'STRONG_PASSWORD' 'Administrator'
```

### Backend service

**PM2 runs in the container too**, with the same `ecosystem.config.js` and the same
cluster mode as the VPS — `nixpacks.toml` sets `cmd = "npm run start:container"` →
`pm2-runtime start ecosystem.config.js --env production`.

`pm2-runtime` (not `pm2 start`) is the difference that matters. `pm2 start`
spawns a background daemon and returns, so the container's main process exits and
Docker stops it — that is exactly what `pnpm start` does, and why it can't be the
container entrypoint. `pm2-runtime` stays in the foreground as PID 1, forwards
SIGTERM to the graceful shutdown in `app.js`, and streams worker logs to stdout so
`docker logs` and the Dokploy log view work. `pm2` is a **dependency** (not a
global install as on the VPS), so it's present in the image.

**Pin `PM2_INSTANCES`.** `instances: "max"` counts the *host's* cores, not the
container's CPU limit, so on a shared box "max" forks far more workers than the
container can use and each one is a full V8 heap. Start at `PM2_INSTANCES=2`.

Two consequences of running PM2 under Docker worth knowing: restarts are now
handled at two levels (PM2 restarts a dead worker, Docker restarts the container
if PM2 itself dies), and if you also scale Dokploy replicas the worker count
multiplies — `replicas × PM2_INSTANCES`. Pick one axis to scale on.

**`APP_PORT` must be set** — `app.js` reads it with no fallback, so unset it binds
a random port and the proxy can never reach it. Note that PM2 applies
`ecosystem.config.js`'s env *over* the inherited environment, so its
`env_production` block now reads `Number(process.env.APP_PORT) || 4562` — without
that pass-through it would force 4562 in the container and silently ignore the
service's setting. Set `APP_PORT=4560` and point the
service's domain at container port **4560**.

Required env: `NODE_ENV=production`, `APP_PORT`, `TRUST_PROXY_HOPS=1`, the five
`DB_*`, `SECRET_ACCESS_TOKEN`, `ACCESS_TOKEN_EXPIRE`, `FRONTEND_URL`,
`ROOT_DOMAIN`, the Stripe keys, and one email provider (§4).

`FRONTEND_URL` + `ROOT_DOMAIN` are what open CORS to the app and its portal
subdomains — with `NODE_ENV=production` and `ROOT_DOMAIN` set, anything else is
refused. Get them wrong and every browser call fails while curl still works.

### Frontend service

`NEXT_PUBLIC_*` values are **inlined into the client bundle at build time**, so
they must be present when Dokploy builds, not only at runtime. Supplied late, the
bundle ships the `localhost` fallbacks (`lib/api/client.ts`, `proxy.ts`) and the
app breaks in the browser while the build and logs look clean.

| Var | Value | Why |
|---|---|---|
| `AUTH_SECRET` | `openssl rand -base64 32` | NextAuth |
| `AUTH_URL` | `https://<domain>` | **Canonical origin.** Unset, every NextAuth redirect is built against the container's internal origin — signing out lands on `https://localhost:3000`. Runtime-read, so a restart applies it (no rebuild). |
| `FEEDBOARD_API_BASE_URL` | internal backend hostname:4560 | server→API, stays on the Docker network |
| `NEXT_PUBLIC_FEEDBOARD_API_BASE_URL` | `https://api.<domain>` | browser→API, must be public HTTPS |
| `NEXT_PUBLIC_ROOT_DOMAIN` | `<domain>` | subdomain routing + cookie scope |
| `NEXT_PUBLIC_FEEDBACK_SUBDOMAIN` | `feedback` | dogfooding board |

Verify the inlining after deploy — this must print nothing:
```bash
curl -s https://<domain>/_next/static/chunks/*.js | grep -o 'localhost:4560'
```

### Still required from the VPS sections

- **Wildcard DNS + TLS** (§1, §7): `*.<domain>` must resolve and be covered by the
  certificate, or tenant portals 404/fail TLS. Dokploy needs a wildcard domain on
  the frontend service.
- **Stripe webhook** (§8) pointed at the backend's public URL.
- **Uploads** (`uploads/`) are on the container filesystem and die with it —
  mount a Dokploy volume or move to object storage.
