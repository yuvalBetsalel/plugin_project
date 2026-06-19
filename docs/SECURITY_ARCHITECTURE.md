# Security Architecture: Separating Plugin and Server Secrets

## 🔐 The Problem

When you share your plugin on GitHub, you don't want to expose the admin credentials. Here's how the architecture separates concerns:

## ✅ The Solution: Two Separate Configurations

### 1. Plugin Configuration (Project Root `.env`)
**Purpose:** Configure where the analyzer sends findings  
**Contains:** ONLY the remote server URL  
**Safe to commit:** YES (example values only)  
**Who needs it:** Everyone using the plugin

```bash
# .env (project root)
SERVER_MODE=remote
REMOTE_SERVER_URL=https://your-app-name.fly.dev
```

**What's NOT here:**
- ❌ No ADMIN_API_KEY
- ❌ No SESSION_SECRET
- ❌ No database credentials
- ❌ No sensitive secrets

### 2. Server Secrets (Fly.io Environment)
**Purpose:** Secure the admin dashboard  
**Contains:** ADMIN_API_KEY, SESSION_SECRET  
**Safe to commit:** NO - never in code  
**Who needs it:** Only the admin (you)

**Where they live:**
- **Local development:** `server/.env` (gitignored)
- **Production (Fly.io):** Environment secrets (encrypted)

## 🎯 How It Works

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Repository                     │
│  ✅ Safe to share publicly                               │
├─────────────────────────────────────────────────────────┤
│  .env (root)                                             │
│    SERVER_MODE=remote                                    │
│    REMOTE_SERVER_URL=https://your-app.fly.dev           │
│                                                          │
│  .env.example (root)                                     │
│    (Template with NO secrets)                            │
│                                                          │
│  server/.env.example                                     │
│    (Template for local dev)                              │
└─────────────────────────────────────────────────────────┘
                            ↓
                     Anyone can clone
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    Plugin User Setup                     │
├─────────────────────────────────────────────────────────┤
│  1. Clone repository                                     │
│  2. Update .env with remote server URL                   │
│  3. Run: node src/analyzer.js .                          │
│  4. Findings go to YOUR server                           │
│  5. NO ACCESS to admin dashboard (needs API key)         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              Your Server (Fly.io) - SECURE               │
│  🔒 Only YOU have access                                 │
├─────────────────────────────────────────────────────────┤
│  Environment Secrets (encrypted, not in code):           │
│    ADMIN_API_KEY=<64-char-random-string>                 │
│    SESSION_SECRET=<64-char-random-string>                │
│                                                          │
│  Set via:                                                │
│    flyctl secrets set ADMIN_API_KEY=...                  │
│    OR Fly.io dashboard → Secrets                         │
└─────────────────────────────────────────────────────────┘
```

## 📋 Access Control Matrix

| Who | Can Submit Findings | Can View Dashboard | Has Admin Key |
|-----|--------------------|--------------------|---------------|
| You (Admin) | ✅ Yes | ✅ Yes | ✅ Yes |
| Team Member | ✅ Yes | ✅ Yes (with key) | Depends |
| Plugin User | ✅ Yes | ❌ No | ❌ No |
| GitHub Visitor | ❌ No | ❌ No | ❌ No |

## 🔒 What's Secured

### Public (Safe to Share)
✅ Plugin source code  
✅ Server source code  
✅ Remote server URL  
✅ Documentation  
✅ Configuration templates (`.env.example`)

### Private (Never Share)
🔒 ADMIN_API_KEY  
🔒 SESSION_SECRET  
🔒 Database files  
🔒 Server logs  
🔒 Actual `.env` files with secrets

## 🚦 Two Usage Patterns

### Pattern 1: Public Plugin, Private Server (Your Case)

**GitHub Repository:**
```
plugin_project/
├── .env.example          ← Template (no secrets)
├── .env                  ← Your config (SERVER_MODE, URL only)
└── server/
    ├── .env.example      ← Template (no secrets)
    └── .env              ← GITIGNORED (never committed)
```

**Fly.io Server:**
- ADMIN_API_KEY → Set as Fly.io secret
- SESSION_SECRET → Set as Fly.io secret
- Only accessible to you via Fly.io dashboard

**Result:**
- ✅ Anyone can use the plugin
- ✅ Findings go to your server
- ✅ Only you can access admin dashboard
- ✅ No secrets in GitHub

### Pattern 2: Private Repository (Alternative)

If repository is private:
- Still don't commit secrets to .env
- Use same pattern (secrets in Fly.io)
- Better security practice

## 📝 Setup Instructions for Different Users

### For Admin (You)

**1. Initial Setup:**
```bash
# Clone repo
git clone <your-repo>
cd plugin_project

# Configure plugin
cat > .env << EOF
SERVER_MODE=remote
REMOTE_SERVER_URL=https://your-app.fly.dev
EOF

# Deploy server to Fly.io
cd server
npm run generate-secrets
# Save these keys securely!

# Set on Fly.io (not in code)
flyctl secrets set ADMIN_API_KEY=<generated>
flyctl secrets set SESSION_SECRET=<generated>
flyctl deploy
```

**2. Using the Plugin:**
```bash
node src/analyzer.js .
```

**3. Access Dashboard:**
```
https://your-app.fly.dev/admin
Login with ADMIN_API_KEY
```

### For Team Members (With Dashboard Access)

**1. Get from admin:**
- Remote server URL
- ADMIN_API_KEY (for dashboard access)

**2. Setup:**
```bash
# Clone repo
git clone <your-repo>
cd plugin_project

# Configure
cat > .env << EOF
SERVER_MODE=remote
REMOTE_SERVER_URL=https://your-app.fly.dev
EOF
```

**3. Use:**
```bash
# Submit findings
node src/analyzer.js .

# View dashboard (with API key from admin)
https://your-app.fly.dev/admin
```

### For Plugin Users (No Dashboard Access)

**1. Setup:**
```bash
# Clone repo
git clone <your-repo>
cd plugin_project

# Configure
cat > .env << EOF
SERVER_MODE=remote
REMOTE_SERVER_URL=https://your-app.fly.dev
EOF
```

**2. Use:**
```bash
# Only submit findings
node src/analyzer.js .
```

**3. What they CAN'T do:**
- ❌ Access admin dashboard (no API key)
- ❌ View submitted findings
- ❌ See other users' findings

## 🔐 Security Best Practices

### 1. Never Commit Secrets
```bash
# WRONG ❌
git add .env
git commit -m "Add config"

# RIGHT ✅
# .env is in .gitignore
# Only .env.example is committed
```

### 2. Use Environment-Specific Configs

```bash
# Development (local)
server/.env
  ADMIN_API_KEY=dev-key-12345
  SESSION_SECRET=dev-secret-67890

# Production (Fly.io)
flyctl secrets set ADMIN_API_KEY=<secure-64-char>
flyctl secrets set SESSION_SECRET=<secure-64-char>
```

### 3. Rotate Secrets Regularly

```bash
# Every 90 days
npm run generate-secrets
flyctl secrets set ADMIN_API_KEY=<new-key>
flyctl secrets set SESSION_SECRET=<new-key>
```

### 4. Share API Key Securely

❌ Don't: Email, Slack, SMS  
✅ Do: Password manager (1Password, LastPass, Bitwarden)  
✅ Do: Encrypted messaging (Signal)  
✅ Do: In-person exchange

## 🎯 Verification Checklist

Before pushing to GitHub:

```bash
# 1. Check .gitignore
cat .gitignore | grep -E "\.env$"
# Should show: .env

# 2. Check what's staged
git status
# Should NOT show: .env (only .env.example)

# 3. Check for secrets in staged files
git diff --cached | grep -i "api_key"
# Should be empty or only show .env.example

# 4. Verify .env.example has NO real secrets
cat .env.example | grep "ADMIN_API_KEY="
# Should show: ADMIN_API_KEY=

# 5. Verify server/.env is gitignored
git check-ignore server/.env
# Should output: server/.env
```

## 🆘 What If Secrets Were Committed?

If you accidentally committed secrets:

**1. Remove from Git History:**
```bash
# Remove file from all commits
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (dangerous!)
git push origin --force --all
```

**2. Rotate ALL Secrets:**
```bash
# Generate new secrets
npm run generate-secrets

# Update on Fly.io
flyctl secrets set ADMIN_API_KEY=<new>
flyctl secrets set SESSION_SECRET=<new>
```

**3. Better Solution:**
Delete the repository and create a new one without the secret.

## 📊 What Goes Where

| Configuration | File | Committed | Contains |
|--------------|------|-----------|----------|
| Plugin config | `.env` (root) | ❌ No | Server URL only |
| Plugin template | `.env.example` (root) | ✅ Yes | Empty values |
| Server local dev | `server/.env` | ❌ No | Secrets (local) |
| Server template | `server/.env.example` | ✅ Yes | Empty values |
| Server production | Fly.io secrets | N/A | Secrets (cloud) |

## 🎉 Summary

**The Key Principle:**
- Plugin needs: Where to send data (URL) ✅
- Plugin doesn't need: How to access admin (API key) ❌

**Result:**
- ✅ Plugin can be public on GitHub
- ✅ Anyone can submit findings to your server
- ✅ Only you (and those you share key with) can view findings
- ✅ No secrets ever in version control

**Your `.env` file is NOW SAFE to commit** because it only contains:
- SERVER_MODE=remote
- REMOTE_SERVER_URL=https://...

No secrets!
