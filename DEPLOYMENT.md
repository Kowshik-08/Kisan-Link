# KisanLink: Production Deployment Guide

This guide provides end-to-end instructions for deploying the **KisanLink** agricultural marketplace platform into production.

---

## 🏗️ Architecture Overview

```mermaid
graph LR
    subgraph Users ["Client Devices"]
        Farmer["🌾 Farmer (Mobile/Desktop)"]
        Buyer["🏢 Buyer (Trader/FPO)"]
    end

    subgraph Frontend ["Frontend Hosting (Vercel)"]
        VercelCDN["Vercel Edge CDN<br/>https://kisanlink-drab.vercel.app"]
        VercelRewrite["API Rewrite Proxy<br/>/api/* &rarr; Backend"]
    end

    subgraph Backend ["Backend Hosting (Render / Railway / Docker)"]
        ExpressAPI["Node.js Express Server<br/>Port: $PORT<br/>/api/v1/* & /api/health"]
        PrismaORM["Prisma ORM Client"]
    end

    subgraph Database ["Database Layer"]
        Postgres["PostgreSQL 16 Database<br/>Managed (Neon / Render / Supabase)"]
    end

    Farmer --> VercelCDN
    Buyer --> VercelCDN
    VercelCDN --> VercelRewrite
    VercelRewrite -->|HTTPS + Authorization| ExpressAPI
    ExpressAPI --> PrismaORM
    PrismaORM -->|Connection Pool| Postgres
```

---

## ⚙️ Required Environment Variables

Configure these environment variables in your hosting provider's dashboard (e.g. Render, Railway, Vercel, or `.env` in production):

### Backend Environment Variables

| Variable | Required | Example / Description |
| :--- | :---: | :--- |
| `NODE_ENV` | **Yes** | `production` |
| `PORT` | **Yes** | Assigned automatically by hosting platforms (default: `5000`) |
| `DATABASE_URL` | **Yes** | `postgresql://user:password@host:5432/kisanlink?sslmode=require` |
| `JWT_SECRET` | **Yes** | Secret string (min 32 chars) for Access Tokens (`openssl rand -base64 48`) |
| `JWT_REFRESH_SECRET` | **Yes** | Distinct secret string (min 32 chars) for Refresh Tokens |
| `FRONTEND_URL` | **Yes** | Whitelisted origin: `https://kisanlink-drab.vercel.app` |
| `CLIENT_URL` | Optional | Alias for `FRONTEND_URL` (supports comma-separated origins) |

### Frontend Environment Variables (Optional / Build Time)

| Variable | Required | Example / Description |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_API_URL` | Optional | `https://your-backend-api.onrender.com` (If not using Vercel rewrites) |

> [!NOTE]
> If deploying the frontend to Vercel, the included `vercel.json` automatically proxies all `/api/*` calls directly to your backend, eliminating the need to hardcode API URLs in client code.

---

## 🗄️ Setting Up PostgreSQL Database

KisanLink uses PostgreSQL with Prisma ORM. Choose any of these managed providers:

### Option A: Neon.tech (Recommended Free Serverless Postgres)
1. Go to [neon.tech](https://neon.tech) and create a free project named `kisanlink`.
2. Copy the **Pooled connection string** (e.g., `postgresql://kisanlink_owner:***@ep-***.us-east-2.aws.neon.tech/kisanlink?sslmode=require`).
3. Set this as your `DATABASE_URL` in your backend environment variables.

### Option B: Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. Under **Project Settings &rarr; Database**, copy the **Transaction Connection Pooler** string (Port 6543) or direct connection string (Port 5432).
3. Set this as `DATABASE_URL`.

### Option C: Render PostgreSQL
1. When using the included `render.yaml`, a managed PostgreSQL database (`kisanlink-db`) is automatically provisioned and connected to your backend service without any manual credential entry.

---

## 🚀 Deployment Options

### Method 1: Deploying Backend to Render.com (Recommended)

1. Push your repository to GitHub or GitLab.
2. Log in to [dashboard.render.com](https://dashboard.render.com).
3. Click **New &rarr; Blueprint** and select your repository.
4. Render will detect [`render.yaml`](file:///c:/Users/KOWSHIK/Desktop/SEM%203/render.yaml) and automatically create:
   - **Database**: `kisanlink-db` (PostgreSQL)
   - **Web Service**: `kisanlink-api` (Node.js)
5. The build command will execute:
   ```bash
   npm install && npm run build && npx prisma migrate deploy && npm run prisma:seed
   ```
6. Once deployed, note your backend URL (e.g., `https://kisanlink-api.onrender.com`).

---

### Method 2: Deploying Backend to Railway.app

1. Go to [railway.app](https://railway.app) and create a **New Project**.
2. Select **Deploy from GitHub repo** &rarr; choose your KisanLink repository.
3. Click **New &rarr; Database &rarr; Add PostgreSQL**.
4. In your Backend Service **Settings**:
   - Set **Root Directory** to `backend`.
   - In **Variables**, add:
     - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
     - `NODE_ENV`: `production`
     - `JWT_SECRET`: *(Generate a secure random string)*
     - `JWT_REFRESH_SECRET`: *(Generate a secure random string)*
     - `FRONTEND_URL`: `https://kisanlink-drab.vercel.app`
5. In **Build & Start**:
   - Build Command: `npm install && npm run build && npx prisma migrate deploy && npm run prisma:seed`
   - Start Command: `npm start`
6. Generate a public domain under **Networking** (e.g., `https://kisanlink-backend.up.railway.app`).

---

### Method 3: Deploying Backend with Docker

A production-ready multi-stage `Dockerfile` and `docker-compose.yml` are included.

To deploy on any Linux VPS (Ubuntu/Debian, AWS EC2, DigitalOcean):
```bash
# Clone repository
git clone <your-repo-url>
cd "SEM 3"

# Start entire stack (PostgreSQL + Backend)
docker compose up -d --build

# View logs
docker compose logs -f
```

---

## 🌐 Deploying Frontend to Vercel

1. Log in to [vercel.com](https://vercel.com) and click **Add New &rarr; Project**.
2. Import your KisanLink Git repository.
3. In project settings:
   - **Framework Preset**: `Other`
   - **Root Directory**: Select `frontend` (or leave root `./` — both have `vercel.json` configured).
4. Update `vercel.json` with your deployed backend URL:
   Replace `https://kisanlink-api.onrender.com` with your real backend URL.
5. Click **Deploy**.
6. Vercel will deploy the site (e.g., `https://kisanlink-drab.vercel.app`).

---

## 🔄 Running Prisma Migrations in Production

Whenever you deploy schema changes, migrations must be applied using:

```bash
# In your deployment build step or SSH shell:
npx prisma migrate deploy
```

> [!CAUTION]
> Never run `npx prisma migrate dev` in a production environment. `prisma migrate deploy` is non-interactive and applies pending migration files safely without resetting database tables.

To seed initial commodity benchmarks and sample accounts in a new production database:
```bash
node prisma/seed.js
```

---

## 🧪 Verifying the Deployed Application

Verify that your deployment is operating properly by testing these endpoints:

### 1. Health Checks
```bash
# Should return HTTP 200 with status: ok
curl https://<your-backend-url>/api/health
curl https://<your-backend-url>/health
curl https://<your-backend-url>/api/v1/health
```

### 2. Commodity Price Ticker
```bash
curl https://<your-backend-url>/api/v1/farmer/ticker
```

### 3. Login Verification
```bash
curl -X POST https://<your-backend-url>/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"9876543210","password":"farmer123","role":"FARMER"}'
```

### 4. End-to-End Browser Check
1. Open your Vercel URL in a browser: `https://kisanlink-drab.vercel.app`
2. Log in with:
   - Mobile: `9876543210`
   - Password: `farmer123`
3. Verify live Mandi ticker ribbons load prices.
4. Run the Take-Home Calculator for Tomato (500 kg).
5. Advance a deal through the 7 stages in the Deal Tracker modal.

---

## 🛠️ Common Deployment Issues & Solutions

### 1. `CORS Error: Origin not permitted`
- **Cause**: The browser origin does not match `FRONTEND_URL` in backend environment variables.
- **Solution**: In your backend hosting dashboard, set `FRONTEND_URL` to your exact frontend domain without trailing slashes (e.g. `https://kisanlink-drab.vercel.app`).

### 2. `Can't reach database server at ...` (Error P1001)
- **Cause**: The database connection string is invalid, firewalled, or requires SSL.
- **Solution**:
  - Append `?sslmode=require` to your `DATABASE_URL`.
  - In cloud providers (like Render or Supabase), ensure connections from external IP addresses (`0.0.0.0/0`) are permitted in database network access settings.

### 3. `PrismaClientInitializationError` / Missing Client
- **Cause**: `prisma generate` was not run after installing dependencies.
- **Solution**: Ensure your hosting build command includes `npm run build` or `npx prisma generate`.

### 4. Mixed Content (`HTTPS` frontend calling `HTTP` backend)
- **Cause**: Frontend is on `https://...` but attempting to call `http://...`.
- **Solution**: Deploy your backend with an SSL certificate (Render, Railway, and Cloud Run provide free automatic HTTPS). Alternatively, use the included `vercel.json` rewrites to proxy requests through Vercel.
