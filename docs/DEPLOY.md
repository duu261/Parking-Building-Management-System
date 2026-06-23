# ParkMaster — Deploy Guide

Free-tier deployment: **Vercel** (frontend) + **Render** (backend) + **Neon** (Postgres).

## 1. Neon (Database)

1. Go to [neon.tech](https://neon.tech), create a project named `parkmaster`
2. Create a database named `parkmaster`
3. Copy the connection string — looks like:
   ```
   postgresql://parkmaster:PASSWORD@ep-xxx.region.aws.neon.tech/parkmaster?sslmode=require
   ```
4. Note the username and password separately too

## 2. Render (Backend)

1. Go to [render.com](https://render.com) → New → **Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Name**: `parkmaster-api`
   - **Root Directory**: `backend`
   - **Environment**: `Docker`
   - **Instance Type**: Free
   - **Branch**: `deploy`

4. Set these **Environment Variables**:

| Variable | Value |
|----------|-------|
| `DB_URL` | `jdbc:postgresql://ep-xxx.region.aws.neon.tech/parkmaster?sslmode=require` |
| `DB_USERNAME` | *(from Neon)* |
| `DB_PASSWORD` | *(from Neon)* |
| `PARKMASTER_JWT_SECRET` | *(generate: `openssl rand -base64 32`)* |
| `FRONTEND_ORIGIN` | `https://parkmaster-xxx.vercel.app` *(update after Vercel deploy)* |
| `SPRING_PROFILES_ACTIVE` | `dev` |
| `VNPAY_RETURN_URL` | `https://parkmaster-api.onrender.com/api/public/payments/vnpay-return` |
| `VNPAY_RESULT_URL` | `https://parkmaster-xxx.vercel.app/app` |
| `GEMINI_API_KEY` | *(optional — leave empty for built-in FAQ fallback)* |

5. Click **Create Web Service** — first deploy takes ~5 min (Maven build + Docker)
6. Health check: `GET https://parkmaster-api.onrender.com/api/public/health`

## 3. Vercel (Frontend)

1. Go to [vercel.com](https://vercel.com) → Add New → **Project**
2. Import your GitHub repo
3. Settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
   - **Branch**: `deploy`

4. Set **Environment Variable**:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://parkmaster-api.onrender.com` |

5. Deploy — takes ~30 seconds

## 4. UptimeRobot (Keep-Alive)

Render free tier spins down after 15min idle. Prevent this:

1. Go to [uptimerobot.com](https://uptimerobot.com), create free account
2. Add Monitor:
   - **Type**: HTTP(s)
   - **URL**: `https://parkmaster-api.onrender.com/api/public/health`
   - **Interval**: 14 minutes
3. Done — backend stays warm

## 5. Post-Deploy Checklist

- [ ] Neon DB created, connection string works
- [ ] Render deploys successfully, health endpoint returns 200
- [ ] Seeder ran (check Render logs for "Dev seed complete")
- [ ] Vercel deploys, landing page loads
- [ ] Login works: `admin@parkmaster.dev` / `password123`
- [ ] All roles accessible: admin, manager, staff, driver
- [ ] CORS working (no browser console errors)
- [ ] Update `FRONTEND_ORIGIN` on Render if Vercel URL differs from initial guess

## 6. Update Deployed Version

```bash
git checkout deploy
git merge main
git push origin deploy
# Render + Vercel auto-redeploy on push
```

## Demo Logins

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@parkmaster.dev | password123 |
| Manager | manager@parkmaster.dev | password123 |
| Staff | staff@parkmaster.dev | password123 |
| Driver | driver@parkmaster.dev | password123 |

Extra drivers: minh.nguyen@gmail.com, lan.tran@gmail.com, etc. (all `password123`)
