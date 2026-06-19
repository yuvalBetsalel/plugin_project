# Important: Understanding .env Files

## 🔐 Two Different .env Files, Two Different Purposes

This project has TWO different `.env` configurations that serve different purposes:

### 1. Project Root `.env` - Plugin Configuration (SAFE)
**Location:** `plugin_project/.env`  
**Purpose:** Configure where the analyzer sends findings  
**Safe to commit example:** YES  
**Contains secrets:** NO

```bash
# This is SAFE - no secrets here
SERVER_MODE=remote
REMOTE_SERVER_URL=https://your-app-name.fly.dev
```

### 2. Server `.env` - Server Secrets (PRIVATE)
**Location:** `plugin_project/server/.env`  
**Purpose:** Secure the admin dashboard  
**Safe to commit:** NO - gitignored  
**Contains secrets:** YES

```bash
# This contains SECRETS - never commit
ADMIN_API_KEY=64-char-secret-key
SESSION_SECRET=64-char-secret-key
```

## 📁 What's in Version Control

```
✅ Committed (Safe):
├── .env                     ← Plugin config (URL only, no secrets)
├── .env.example             ← Template
└── server/
    └── .env.example         ← Template

❌ Gitignored (Secrets):
└── server/
    └── .env                 ← Local dev secrets (never committed)

🔒 Fly.io Only (Production Secrets):
    ADMIN_API_KEY            ← Set via: flyctl secrets set
    SESSION_SECRET           ← Set via: flyctl secrets set
```

## 🎯 The Key Principle

**Plugin users need to know:**
- ✅ Where to send findings (server URL)

**Plugin users DON'T need to know:**
- ❌ Admin dashboard password (ADMIN_API_KEY)
- ❌ Session encryption key (SESSION_SECRET)

## 🚦 Quick Setup Guide

### For Plugin Users (Using the Plugin)

1. Clone repository:
   ```bash
   git clone <repo-url>
   cd plugin_project
   ```

2. The `.env` file already has safe configuration:
   ```bash
   cat .env
   # Shows: SERVER_MODE=remote
   #        REMOTE_SERVER_URL=https://...
   ```

3. Run the analyzer:
   ```bash
   node src/analyzer.js .
   ```

4. That's it! Findings go to the remote server.

### For Server Admin (Deploying the Server)

1. Generate secrets:
   ```bash
   cd server
   npm run generate-secrets
   ```

2. Deploy to Fly.io and set secrets:
   ```bash
   flyctl secrets set ADMIN_API_KEY=<generated>
   flyctl secrets set SESSION_SECRET=<generated>
   flyctl deploy
   ```

3. Share server URL with plugin users (NOT the secrets!).

## ⚠️ What NOT to Do

❌ **DON'T** put ADMIN_API_KEY in project root `.env`  
❌ **DON'T** commit `server/.env`  
❌ **DON'T** share ADMIN_API_KEY publicly  
❌ **DON'T** email/Slack secrets  

✅ **DO** use Fly.io secrets for production  
✅ **DO** use password manager to share API key  
✅ **DO** keep `server/.env` gitignored  
✅ **DO** share only the server URL publicly  

## 🔍 Verify Your Setup

Check that secrets are NOT in version control:

```bash
# Should show .env is tracked (safe - no secrets)
git ls-files | grep "^\.env$"

# Should show server/.env is ignored
git check-ignore server/.env

# Should NOT find secrets in repo
git grep -i "admin_api_key" -- ':!*.example' ':!docs/'
```

## 📖 More Information

- **Security Architecture:** See `docs/SECURITY_ARCHITECTURE.md`
- **Deployment Guide:** See `server/DEPLOY.md`
- **Manual Checklist:** See `docs/MANUAL_DEPLOY_CHECKLIST.md`

## ✅ Current State

After the recent updates:
- ✅ Project root `.env` has NO secrets (safe)
- ✅ `server/.env` is gitignored (not tracked)
- ✅ `.env.example` files are templates only
- ✅ Real secrets only live on Fly.io
- ✅ Safe to share repository publicly
