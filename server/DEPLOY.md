# Quick Start: Deploy to Fly.io

This guide gets your security data server running on Fly.io in 10 minutes.

## Prerequisites

- Fly.io account (sign up at https://fly.io/ - free tier available)
- Node.js installed
- Git

## 🚀 5-Minute Deployment

### Step 1: Generate Secrets (30 seconds)

```bash
cd server
npm run generate-secrets
```

**Save the output!** You'll need both keys.

### Step 2: Deploy Options

Choose based on your access level:

#### Option A: Using flyctl CLI (fastest)

If you can install flyctl:

```bash
# Install flyctl
npm install -g flyctl

# Login
flyctl auth login

# Deploy
cd server
flyctl launch --name my-security-server

# Set secrets (use values from Step 1)
flyctl secrets set ADMIN_API_KEY=<your-key>
flyctl secrets set SESSION_SECRET=<your-secret>

# Create volume
flyctl volumes create security_data --size 1

# Deploy
flyctl deploy
```

Done! Your server is at: `https://my-security-server.fly.dev`

#### Option B: Using Web Dashboard (if CLI blocked)

1. **Push to GitHub:**
   ```bash
   git add -A
   git commit -m "Deploy to Fly.io"
   git push
   ```

2. **In Fly.io Dashboard:**
   - Go to https://fly.io/dashboard
   - Create new app → Import from GitHub
   - Select repository
   - Configure:
     - **Dockerfile**: `server/Dockerfile`
     - **Context**: `server/`
   
3. **Add Secrets:**
   - Go to app → Secrets
   - Add `ADMIN_API_KEY` (from Step 1)
   - Add `SESSION_SECRET` (from Step 1)

4. **Create Volume:**
   - Go to Volumes → Create
   - Name: `security_data`
   - Size: 1 GB

5. **Deploy:**
   - Should auto-deploy from GitHub

### Step 3: Test (1 minute)

```bash
# Test health
curl https://your-app-name.fly.dev/

# Test submission
curl -X POST https://your-app-name.fly.dev/submit \
  -H "Content-Type: application/json" \
  -d '{"projectPath":"/test","findings":[]}'

# Should return: 204 No Content
```

Visit admin dashboard:
```
https://your-app-name.fly.dev/admin
```

Login with your `ADMIN_API_KEY` from Step 1.

### Step 4: Update Local Config (30 seconds)

Edit `.env` in project root:

```bash
SERVER_MODE=remote
REMOTE_SERVER_URL=https://your-app-name.fly.dev
```

### Step 5: Test End-to-End (1 minute)

```bash
# Run analyzer
node src/analyzer.js .

# Check dashboard - findings should appear!
# https://your-app-name.fly.dev/admin
```

## ✅ You're Done!

Your server is now:
- 🌐 Running on Fly.io (HTTPS enabled)
- 💾 Using persistent storage
- 🔐 Secured with API key
- 📊 Ready to collect findings

## 📱 Important Links

- **Server**: https://your-app-name.fly.dev
- **Admin**: https://your-app-name.fly.dev/admin
- **Dashboard**: https://fly.io/dashboard
- **Logs**: `flyctl logs` or dashboard

## 🔄 Making Updates

```bash
# Make code changes
git add -A
git commit -m "Update server"
git push

# Auto-deploys via GitHub
# Or manually: flyctl deploy
```

## 💰 Cost

**Free Tier includes:**
- 3 shared VMs (256MB)
- 160GB transfer
- 3GB storage

**This setup uses:**
- 1 VM ✅
- 1GB storage ✅

**Monthly cost: $0** (free!)

## 🆘 Need Help?

See detailed guides:
- `DEPLOY_TO_FLY.md` - Full deployment guide
- `MANUAL_DEPLOY_CHECKLIST.md` - Step-by-step checklist
- Fly.io docs: https://fly.io/docs

## 🔧 Common Commands

```bash
# View logs
flyctl logs

# Check status
flyctl status

# Open dashboard
flyctl dashboard

# SSH into container
flyctl ssh console

# Scale resources
flyctl scale memory 512

# Update secrets
flyctl secrets set ADMIN_API_KEY=new-key
```

## 🎉 What's Next?

1. Share `REMOTE_SERVER_URL` with team
2. Everyone updates their `.env` files
3. All findings go to centralized server
4. Review findings in admin dashboard

---

**Having issues?** Check `MANUAL_DEPLOY_CHECKLIST.md` for troubleshooting.
