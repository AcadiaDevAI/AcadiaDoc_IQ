# Acadia Log IQ v2.0 — React + FastAPI + Clerk Auth

AI-powered log analysis with Hybrid Search (Vector + BM25) and LLM Re-ranking.
Clerk authentication for user sign-in / sign-out / account management.

---

## Project Structure

```
acadia-log-iq/
├── backend/
│   ├── api.py                   # FastAPI (chat, upload, auth)
│   ├── clerk_auth.py            # Clerk JWT verification module
│   ├── config.py                # Settings (incl. Clerk config)
│   ├── vector_store.py          # ChromaDB + BM25
│   ├── requirements.txt         # Python deps (incl. PyJWT)
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── public/index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthGate.js      # Sign-in/sign-up landing page
│   │   │   ├── ChatArea.js      # Main chat interface
│   │   │   ├── ChatInput.js     # Message input
│   │   │   ├── ChatMessage.js   # Message with markdown + sources
│   │   │   ├── MobileHeader.js  # Mobile nav + UserButton
│   │   │   ├── Sidebar.js       # History, upload, files tabs
│   │   │   ├── UploadPanel.js   # Drag-and-drop upload
│   │   │   └── UserProfile.js   # Clerk UserButton in sidebar
│   │   ├── hooks/
│   │   │   ├── ChatContext.js   # Global state (React Context)
│   │   │   └── useAuthInterceptor.js  # Connects Clerk token to API calls
│   │   ├── services/
│   │   │   └── api.js           # Axios client + Bearer token injection
│   │   ├── App.js               # Root (Ant Design theme + AuthGate)
│   │   ├── index.js             # Entry (ClerkProvider wraps app)
│   │   └── index.css            # Tailwind + dark theme styles
│   ├── package.json             # Includes @clerk/clerk-react
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── nginx.conf
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml           # Local development
├── docker-compose.ec2.yml       # EC2 deployment
├── .github/workflows/
│   └── docker-test.yml
├── .gitignore
└── README.md
```

### Files to Delete from Old Project
- `chat.py` (Streamlit frontend)
- `dockerfile.ui` (Streamlit Docker image)
- `Dockerfile` (old single-container build)

---

## Clerk Dashboard Configuration

### Step 1: Create Clerk Application

1. Go to [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Click **"Add application"**
3. Name: `Acadia Log IQ` (or whatever you prefer)
4. Select sign-in methods: **Email**, **Google**, **GitHub** (your choice)
5. Click **Create**

### Step 2: Get Your Keys

1. In your Clerk dashboard, go to **API Keys** (left sidebar)
2. You'll see two keys:

| Key | Where to use | Example |
|-----|-------------|---------|
| **Publishable Key** | Frontend `.env` + Docker build arg | `pk_test_abc123...` |
| **Secret Key** | Backend `.env` only (NEVER expose) | `sk_test_xyz789...` |

### Step 3: Configure Allowed Origins

1. Go to **Settings → Domains** in Clerk dashboard
2. Add your allowed origins:

**For local development:**
```
http://localhost:3000
```

**For EC2 deployment:**
```
http://<YOUR-EC2-PUBLIC-IP>:3000
```

**For production (with domain):**
```
https://yourdomain.com
```

### Step 4: Configure Redirect URLs

1. Go to **Settings → Paths** (or **URLs** depending on Clerk version)
2. Set:
   - **Sign-in URL:** `/` (Clerk modal handles this)
   - **After sign-in URL:** `/`
   - **After sign-out URL:** `/`

---

## Environment Variables Reference

### Frontend (`frontend/.env`)

```bash
# API connection
REACT_APP_API_BASE=http://localhost:8000
REACT_APP_API_KEY=

# Clerk (PUBLISHABLE key only — this is safe for frontend)
# Leave blank to run WITHOUT authentication
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxx
```

### Backend (`backend/.env`)

```bash
# AWS / Bedrock
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=           # Leave blank on EC2 (use IAM Role)
AWS_SECRET_ACCESS_KEY=       # Leave blank on EC2 (use IAM Role)
AWS_SESSION_TOKEN=

# Bedrock models
BEDROCK_EMBED_MODEL=amazon.titan-embed-text-v2:0
BEDROCK_LLM_MODEL=mistral.mistral-7b-instruct-v0:2

# Storage
CHROMA_PERSIST_DIR=/app/data/chroma
UPLOAD_DIR=/app/uploads
COLLECTION_NAME=logs_titan_v2_1024

# Tuning
MAX_CHARS=4000
BATCH_SIZE=10
MAX_FILE_SIZE_MB=100

# Server
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO

# Clerk Authentication
# Set CLERK_ENABLED=true to ENFORCE JWT auth on all endpoints
# Set CLERK_ENABLED=false to allow open access (or API key only)
CLERK_ENABLED=true
CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxx
```

> **IMPORTANT:** The `CLERK_SECRET_KEY` is a **secret**. Never commit it to git or expose it in frontend code.

---

## How Authentication Works

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Browser     │         │   FastAPI     │         │   Clerk      │
│   (React)     │         │   Backend     │         │   Servers    │
└──────┬───────┘         └──────┬───────┘         └──────┬───────┘
       │                        │                        │
       │  1. User clicks        │                        │
       │     "Sign In"          │                        │
       │───────────────────────────────────────────────► │
       │                        │    2. Clerk modal       │
       │  ◄─────────────────────────────────────────────│
       │  3. User enters        │       opens            │
       │     credentials        │                        │
       │───────────────────────────────────────────────► │
       │                        │                        │
       │  4. Clerk returns      │                        │
       │     session JWT  ◄─────────────────────────────│
       │                        │                        │
       │  5. React stores       │                        │
       │     token in memory    │                        │
       │                        │                        │
       │  6. API call with      │                        │
       │  Authorization: Bearer │                        │
       │  <clerk-jwt>           │                        │
       │──────────────────────► │                        │
       │                        │  7. Verify JWT          │
       │                        │     via JWKS endpoint   │
       │                        │───────────────────────► │
       │                        │  ◄─────────────────────│
       │                        │  8. Public key returned │
       │                        │                        │
       │  9. Response           │  Signature verified ✓  │
       │  ◄────────────────────│  Expiry checked ✓      │
       │                        │  user_id extracted ✓   │
```

**Key points:**
- Frontend gets a session JWT from Clerk (automatic, no code needed)
- `useAuthInterceptor` hook adds `Authorization: Bearer <token>` to every API call
- Backend `clerk_auth.py` verifies the JWT using Clerk's public JWKS keys
- The `sub` claim in the JWT = Clerk user ID

---

## Run Locally (Without Docker)

### Prerequisites
- Python 3.11+
- Node.js 18+
- AWS credentials (for Bedrock)
- Clerk account with keys (optional — app works without Clerk too)

### Backend
```bash
cd backend

# Setup env
cp .env.example .env
# Edit .env:
#   - Add AWS credentials
#   - Add CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY
#   - Set CLERK_ENABLED=true

# Install
pip install -r requirements.txt

# Run
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend
```bash
cd frontend

# Setup env
cp .env.example .env
# Edit .env:
#   - Set REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_xxx

# Install
npm install

# Run
npm start
```

Open `http://localhost:3000` → you'll see the sign-in page.

---

## Run with Docker (Local)

```bash
# 1. Setup backend env
cd backend
cp .env.example .env
# Edit .env with AWS + Clerk keys
cd ..

# 2. Setup frontend env (only needed for non-Docker npm start)
cd frontend
cp .env.example .env
cd ..

# 3. Build and run (pass Clerk key as build arg)
export CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
docker compose up --build -d

# 4. Verify
curl http://localhost:8000/health
# Should show "auth_mode": "clerk"

# 5. Open
open http://localhost:3000
```

### Stop
```bash
docker compose down
docker compose down -v   # also remove data volumes
```

---

## Deploy on AWS EC2

### 1. EC2 Instance Setup
- **AMI:** Ubuntu 22.04 LTS
- **Type:** `t3.medium` (2 vCPU, 4 GB RAM minimum)
- **Storage:** 30+ GB
- **Security Group ports:** 22, 3000, 8000

### 2. IAM Role
Attach to EC2 with this policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v2:0",
        "arn:aws:bedrock:us-east-1::foundation-model/mistral.mistral-7b-instruct-v0:2"
      ]
    }
  ]
}
```

### 3. Install Docker
```bash
ssh -i your-key.pem ubuntu@<EC2-IP>

sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin git
sudo usermod -aG docker $USER
newgrp docker
```

### 4. Deploy
```bash
git clone https://github.com/your-org/acadia-log-iq.git
cd acadia-log-iq

# Backend env
cd backend
cp .env.example .env
nano .env
# Set:
#   AWS_REGION=us-east-1
#   CLERK_ENABLED=true
#   CLERK_PUBLISHABLE_KEY=pk_test_xxx
#   CLERK_SECRET_KEY=sk_test_xxx
#   (Leave AWS keys blank — IAM Role handles it)
cd ..

# Set env vars for docker build
export EC2_PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
export CLERK_PUBLISHABLE_KEY=pk_test_your_key_here

# Add EC2 IP to Clerk dashboard allowed origins!
# Go to: dashboard.clerk.com → Settings → Domains
# Add: http://<EC2_PUBLIC_IP>:3000

# Build and deploy
docker compose -f docker-compose.ec2.yml up --build -d

# Check
docker compose -f docker-compose.ec2.yml logs -f
```

### 5. Access
- **Frontend:** `http://<EC2-IP>:3000`
- **Backend:** `http://<EC2-IP>:8000`
- **Health:** `http://<EC2-IP>:8000/health`

### 6. Clerk Domain Configuration for EC2
This is critical — Clerk will block sign-in if your origin isn't allowed:

1. Go to [Clerk Dashboard → Settings → Domains](https://dashboard.clerk.com)
2. Add: `http://<EC2-PUBLIC-IP>:3000`
3. If using a custom domain later, add that too

---

## Running WITHOUT Authentication

The app is fully backwards-compatible. To run without Clerk:

**Backend:** Set `CLERK_ENABLED=false` in `backend/.env` (or don't set it at all)

**Frontend:** Don't set `REACT_APP_CLERK_PUBLISHABLE_KEY` (or leave it blank)

The app will work exactly as before — no sign-in page, direct access to chat.

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | None | Health check (shows auth_mode) |
| GET | `/me` | Yes | Current user info |
| POST | `/upload?file_type=log\|kb` | Yes | Upload file |
| GET | `/upload_status/{job_id}` | Yes | Processing status |
| POST | `/ask` | Yes | Ask question |
| GET | `/files` | Yes | List uploaded files |
| DELETE | `/files/{file_id}` | Yes | Delete file |
| GET | `/chat/sessions` | Yes | List chat sessions |
| GET | `/chat/sessions/{id}` | Yes | Get session messages |
| DELETE | `/chat/sessions/{id}` | Yes | Delete session |
| DELETE | `/chat/sessions` | Yes | Clear all sessions |
| POST | `/reset` | Yes | Full data reset |

When `CLERK_ENABLED=true`, "Yes" means a valid `Authorization: Bearer <clerk-jwt>` header is required.
When `CLERK_ENABLED=false`, the legacy `X-API-Key` header check applies (if `API_KEY` is set in backend .env).
