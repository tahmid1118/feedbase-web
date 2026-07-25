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
# Node 20 LTS via nvm, pnpm, PM2
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 20 && nvm alias default 20
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
mysql -u feedboard -p feedboard_db < feedboard_db.sql
```

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

`.env.local` (or export in the environment / PM2 config):
```
AUTH_SECRET=<openssl rand -base64 32>
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

## 8. Stripe webhook

In the Stripe Dashboard → Developers → Webhooks, add an endpoint:
```
https://api.feedboardapp.com/webhooks/stripe
```
Subscribe to `checkout.session.completed` and `customer.subscription.*`. Copy the **Signing secret** into the backend `.env` as `STRIPE_WEBHOOK_SECRET`, then `pm2 reload feedboard-server`.

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
