# 🇮🇳 Jan Samadhan AI
### AI-Based Citizen Grievance Classification System

> Automatically classifies citizen complaints using Groq LLaMA3 (free), routes them to the correct government department, and tracks resolution with SLA enforcement.

---

## 📁 Project Structure

```
jan_samadhan_ai/
├── backend/               ← Django REST API
│   ├── config/            ← Settings, URLs, Celery
│   ├── grievance_app/     ← Models, Views, AI Service
│   │   ├── ai_service.py  ← Groq classification engine
│   │   ├── models.py      ← User, Complaint, Department
│   │   ├── views.py       ← All API endpoints
│   │   ├── tasks.py       ← Celery SLA checker
│   │   └── serializers.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── manage.py
├── frontend/              ← React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Citizen/   ← Submit & track complaints
│   │   │   ├── Admin/     ← Dashboard, analytics, officers
│   │   │   └── Officer/   ← Field action & status updates
│   │   ├── api/           ← Axios API client
│   │   ├── hooks/         ← useAuth
│   │   └── utils/
│   └── vercel.json
├── docker-compose.yml
├── render.yaml
└── README.md
```

---

## ⚡ Tech Stack (100% Free / Open-Source)

| Layer | Technology |
|-------|-----------|
| AI / NLP | **Groq API** (free) — LLaMA3-8B, keyword fallback |
| Backend | Python 3.11, Django 4.2, DRF, FastAPI-compatible |
| Database | PostgreSQL (local or **Neon** free tier) |
| Cache / Queue | Redis + **Celery** (SLA auto-escalation) |
| Auth | JWT (SimpleJWT) + Django-OTP |
| Frontend | React 18, Vite, **Tailwind CSS**, TanStack Query |
| Charts | Recharts |
| Email | SMTP (Gmail app password) |
| Deployment | **Render** (backend, free tier) + **Vercel** (frontend, free) |
| CI/CD | GitHub Actions (free) |

---

## 🚀 Part 1 — Run Locally

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+ (or Docker)
- Git

---

### Step 1 — Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/jan-samadhan-ai.git
cd jan-samadhan-ai
```

---

### Step 2 — Get a FREE Groq API key

1. Go to → **https://console.groq.com**
2. Sign up (free, no credit card)
3. Click **API Keys** → **Create API Key**
4. Copy the key — you'll use it in `.env` below

---

### Step 3 — Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy env file
cp .env.example .env
```

Now open `backend/.env` and fill in:

```env
SECRET_KEY=any-random-long-string-here
DEBUG=True
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx    # ← paste your Groq key

# Database — use your local PostgreSQL
DB_NAME=jan_samadhan
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# Redis (if running locally)
REDIS_URL=redis://localhost:6379/0

# Email (optional for now — leave blank to skip)
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
```

---

### Step 4 — Create database & run migrations

```bash
# Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE jan_samadhan;"

# Run migrations
python manage.py migrate

# Seed departments + create admin user
python manage.py seed
# → Creates: admin / Admin@1234
# → Creates all 8 departments
```

---

### Step 5 — Start backend

```bash
python manage.py runserver
```

✅ Backend running at: **http://localhost:8000**
📖 API docs (Swagger): **http://localhost:8000/api/docs/**
🔧 Django admin: **http://localhost:8000/admin/** (admin / Admin@1234)

---

### Step 6 — Setup Frontend

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Copy env
cp .env.example .env.local
# .env.local already has: VITE_API_URL=/api
# The Vite proxy will forward /api → localhost:8000

# Start dev server
npm run dev
```

✅ Frontend running at: **http://localhost:5173**

---

### Step 7 — (Optional) Run Celery for SLA checks

Open two more terminals:

```bash
# Terminal 3 — Celery worker
cd backend
source venv/bin/activate
celery -A config.celery worker -l info

# Terminal 4 — Celery beat (scheduler)
cd backend
source venv/bin/activate
celery -A config.celery beat -l info
```

Or just use Docker Compose (see below).

---

### 🐳 Alternative — Docker Compose (easiest local setup)

```bash
# From project root
cp backend/.env.example backend/.env
# Edit backend/.env and add your GROQ_API_KEY

docker-compose up --build
```

This starts PostgreSQL + Redis + Django + Celery automatically.

---

## 🧪 Test the System

### Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `Admin@1234` |
| Citizen | register at /register | — |
| Officer | created by admin | set by admin |

### Quick Test Flow

1. Go to **http://localhost:5173/register** → create a citizen account
2. Login → click **New Complaint** → type in Hindi or English
3. Submit → AI auto-classifies it in ~1 second
4. Login as **admin** → see complaint with AI category
5. Admin assigns department + officer
6. Login as officer → update status + upload proof
7. Citizen gets notified → rates resolution

---

## 🌐 Part 2 — Deploy to GitHub + Render + Vercel

### Step 1 — Push to GitHub

```bash
cd jan-samadhan-ai
git init
git add .
git commit -m "Initial commit: Jan Samadhan AI"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/jan-samadhan-ai.git
git branch -M main
git push -u origin main
```

---

### Step 2 — Setup Free PostgreSQL (Neon)

1. Go to **https://neon.tech** → Sign up free
2. Create a new project: `jan-samadhan`
3. Copy the connection string — you'll get:
   - Host, Database, User, Password, Port

---

### Step 3 — Setup Free Redis (Upstash)

1. Go to **https://upstash.com** → Sign up free
2. Create Redis database → copy the **Redis URL**
   - Format: `redis://default:PASSWORD@HOST:PORT`

---

### Step 4 — Deploy Backend on Render

1. Go to **https://render.com** → Sign up free → New Web Service
2. Connect your GitHub repo
3. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `sh -c "python manage.py migrate && python manage.py seed && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2"`
   - **Instance:** Free tier
4. Add **Environment Variables** in Render dashboard:

```
DEBUG = False
SECRET_KEY = (generate a random 50-char string)
ALLOWED_HOSTS = jan-samadhan-backend.onrender.com
GROQ_API_KEY = gsk_your_groq_key_here
DB_HOST = (from Neon)
DB_NAME = (from Neon)
DB_USER = (from Neon)
DB_PASSWORD = (from Neon)
DB_PORT = 5432
REDIS_URL = (from Upstash)
EMAIL_HOST_USER = your_gmail@gmail.com
EMAIL_HOST_PASSWORD = your_gmail_app_password
CORS_ALLOWED_ORIGINS = https://jan-samadhan.vercel.app
```

5. Click **Deploy** — wait ~3 minutes

✅ Backend live at: `https://jan-samadhan-backend.onrender.com`

---

### Step 5 — Deploy Frontend on Vercel

1. Go to **https://vercel.com** → Sign up free → New Project
2. Import your GitHub repo
3. Settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add **Environment Variable**:
   ```
   VITE_API_URL = https://jan-samadhan-backend.onrender.com/api
   ```
5. Click **Deploy**

✅ Frontend live at: `https://jan-samadhan.vercel.app`

---

### Step 6 — Update CORS on Render

Go back to Render → your backend service → Environment:
```
CORS_ALLOWED_ORIGINS = https://jan-samadhan.vercel.app
```
Redeploy.

---

## 🤖 How the AI Works

### Classification Flow

```
Citizen types complaint
        ↓
Language detection (langdetect)
        ↓
If not English → Google Translate (free)
        ↓
Groq API → LLaMA3-8B prompt:
  "Classify into: ELECTRICITY/WATER/SANITATION/ROADS/..."
  "Priority: LOW/MEDIUM/HIGH/CRITICAL"
  Response: JSON {category, priority, confidence, summary}
        ↓
If Groq fails → Keyword fallback classifier
        ↓
Auto-assign department + calculate SLA deadline
        ↓
Ticket created, citizen notified
```

### Sample Classification

| Complaint | AI Output |
|-----------|-----------|
| "बिजली का खंभा गिर गया, जल्दी ठीक करें" | ELECTRICITY / CRITICAL |
| "Ward 5 mein kachra nahi uthaya 3 din se" | SANITATION / MEDIUM |
| "Street light not working near govt school" | ELECTRICITY / LOW |
| "Road has potholes near main market" | ROADS / MEDIUM |
| "Hospital mein doctor nahi hai" | HEALTH / HIGH |

---

## 📊 API Reference

### Auth
```
POST /api/auth/register/     → Register citizen
POST /api/auth/login/        → Login (returns JWT)
POST /api/auth/refresh/      → Refresh token
GET  /api/auth/me/           → Current user profile
```

### Citizen
```
GET  /api/complaints/        → My complaints
POST /api/complaints/        → Submit new complaint (AI classifies)
GET  /api/complaints/:id/    → Complaint detail
PATCH /api/complaints/:id/feedback/ → Rate resolution
GET  /api/track/:ticket_id/  → Public ticket tracking (no auth)
```

### Admin
```
GET   /api/admin/complaints/      → All complaints (with filters)
PATCH /api/admin/complaints/:id/  → Update status/assign officer
GET   /api/admin/stats/           → Dashboard analytics
POST  /api/admin/create-officer/  → Create officer account
GET   /api/admin/users/?role=OFFICER → List officers
```

### Officer
```
GET   /api/officer/complaints/     → My assigned complaints
PATCH /api/officer/complaints/:id/ → Update status + proof
```

---

## 🔒 Security Features

- JWT authentication with auto-refresh
- Role-based access control (Citizen / Admin / Officer)
- Brute-force protection (django-axes — 5 attempts → 15 min lockout)
- CORS restricted to your domain
- HTTPS enforced on Render + Vercel
- No sensitive data in frontend bundle

---

## 🛠️ Common Issues

**`ModuleNotFoundError: No module named 'grievance_app'`**
```bash
# Make sure you're in the backend/ folder
cd backend && python manage.py runserver
```

**`FATAL: database "jan_samadhan" does not exist`**
```bash
psql -U postgres -c "CREATE DATABASE jan_samadhan;"
```

**`Connection refused` on Redis**
```bash
# Start Redis locally
redis-server
# Or use Docker: docker run -p 6379:6379 redis:alpine
```

**Groq classification not working**
- Check `GROQ_API_KEY` in `.env`
- System auto-falls back to keyword classifier
- Test: `curl http://localhost:8000/api/docs/`

**CORS error in browser**
- Check `CORS_ALLOWED_ORIGINS` in `.env` matches your frontend URL exactly

---

## 📈 Hackathon Demo Script

1. **Open** http://localhost:5173
2. **Register** as citizen → submit complaint in Hindi
3. Show AI classification (category + priority + confidence %)
4. **Login as admin** → show dashboard with analytics charts
5. Assign complaint to officer
6. **Login as officer** → update status + upload proof
7. **Show citizen view** — status updated, SLA timer
8. **Track page** — no login needed, paste ticket ID
9. Show **Swagger docs** at /api/docs/ for technical evaluation

---

## 🙏 Credits

Built for Smart India Hackathon / Government Grievance Portal challenge.
Uses Groq (free LLM API), Neon (free PostgreSQL), Render + Vercel (free hosting).
