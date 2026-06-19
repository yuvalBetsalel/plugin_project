# Manual Deployment Checklist for Fly.io

Use this checklist if you can't use the flyctl CLI on your work computer.

## ✅ Pre-Deployment Checklist

### 1. Generate Secrets

Run these commands to generate secure secrets:

```bash
# Generate ADMIN_API_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Result: ________________________________

# Generate SESSION_SECRET  
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Result: ________________________________
```

**Save these values!** You'll need them in the next steps.

### 2. Verify Files

Check that these files exist in `server/` directory:
- [ ] `Dockerfile`
- [ ] `fly.toml`
- [ ] `.dockerignore`
- [ ] All server code files

### 3. Test Locally (Optional)

Build and test the Docker container locally:

```bash
cd server

# Build
docker build -t security-server .

# Run with test environment
docker run -p 3000:3000 \
  -e ADMIN_API_KEY=test123 \
  -e SESSION_SECRET=test456 \
  -e NODE_ENV=production \
  -e DATABASE_PATH=/data/security.db \
  security-server

# Test in another terminal
curl http://localhost:3000/
```

## 🚀 Deployment Steps

### Step 1: Create Fly.io Account

1. Go to https://fly.io/
2. Click "Sign up"
3. Complete registration
4. Add payment method (free tier available)

### Step 2: Create Application

**Option A: Via Web Dashboard**
1. Go to https://fly.io/dashboard
2. Click "Create app"
3. Choose a name: `security-data-server` (or your choice)
4. Select region: `iad` (US East) or closest to you
5. Skip database setup (we're using SQLite)

**Option B: Via Personal Machine with flyctl**
```bash
cd server
flyctl launch --name security-data-server --region iad --no-deploy
```

### Step 3: Configure Secrets

**Via Web Dashboard:**
1. Go to your app dashboard
2. Navigate to "Secrets" section
3. Add these secrets:
   - Key: `ADMIN_API_KEY`, Value: (from Step 1)
   - Key: `SESSION_SECRET`, Value: (from Step 1)

**Via flyctl (if available):**
```bash
flyctl secrets set ADMIN_API_KEY=<your-key>
flyctl secrets set SESSION_SECRET=<your-secret>
```

### Step 4: Create Persistent Volume

**Via Web Dashboard:**
1. Navigate to "Volumes" section
2. Click "Create Volume"
3. Settings:
   - **Name**: `security_data`
   - **Region**: Same as your app (e.g., `iad`)
   - **Size**: 1 GB
4. Click "Create"

**Via flyctl:**
```bash
flyctl volumes create security_data --region iad --size 1
```

### Step 5: Deploy

**Via GitHub Integration (Recommended for work machines):**

1. Commit and push code:
   ```bash
   git add -A
   git commit -m "feat: add Fly.io deployment"
   git push origin main
   ```

2. In Fly.io Dashboard:
   - Go to your app
   - Navigate to "Deploy" → "GitHub"
   - Connect your repository
   - Select branch: `main`
   - Build settings:
     - **Dockerfile**: `server/Dockerfile`
     - **Build context**: `server`
   - Enable "Auto-deploy"

3. Click "Deploy"

**Via flyctl (if available):**
```bash
cd server
flyctl deploy
```

### Step 6: Verify Deployment

1. Check app status in dashboard or:
   ```bash
   flyctl status
   ```

2. Get your app URL:
   - Format: `https://<app-name>.fly.dev`
   - Example: `https://security-data-server.fly.dev`

3. Test health endpoint:
   ```bash
   curl https://your-app-name.fly.dev/
   ```
   Should return: redirect to `/admin`

4. Test admin dashboard:
   - Open: `https://your-app-name.fly.dev/admin`
   - Should show login page
   - Enter your `ADMIN_API_KEY`
   - Should see empty dashboard

5. Test submit endpoint:
   ```bash
   curl -X POST https://your-app-name.fly.dev/submit \
     -H "Content-Type: application/json" \
     -d '{
       "projectPath": "/test",
       "projectName": "test-deploy",
       "findings": []
     }'
   ```
   Should return: `204 No Content` (empty response)

## 🔧 Post-Deployment Configuration

### Update Local Project

Update `.env` in your project root:

```bash
# Switch to remote mode
SERVER_MODE=remote

# Set your Fly.io app URL
REMOTE_SERVER_URL=https://your-app-name.fly.dev
```

### Test End-to-End

Run the analyzer:
```bash
node src/analyzer.js .
```

Check if findings appear in admin dashboard:
```
https://your-app-name.fly.dev/admin
```

## 📊 Monitoring

### View Logs

**Via Dashboard:**
- Navigate to "Monitoring" → "Logs"

**Via flyctl:**
```bash
flyctl logs
flyctl logs --follow  # Live tail
```

### Check Metrics

**Via Dashboard:**
- Navigate to "Monitoring" → "Metrics"
- View CPU, memory, requests

**Via flyctl:**
```bash
flyctl dashboard
```

### Scale if Needed

If you need more resources:

**Via Dashboard:**
- Navigate to "Scale"
- Adjust VM size or count

**Via flyctl:**
```bash
flyctl scale memory 512  # Increase to 512MB
flyctl scale count 2      # Add second instance
```

## 🔐 Security Checklist

- [ ] ADMIN_API_KEY is strong (64+ characters)
- [ ] SESSION_SECRET is strong (64+ characters)
- [ ] HTTPS is enabled (automatic on Fly.io)
- [ ] Secrets are not committed to git
- [ ] Admin dashboard requires API key
- [ ] Volume is backed up regularly

## 📝 Important URLs

Save these for future reference:

- **App URL**: https://your-app-name.fly.dev
- **Admin Dashboard**: https://your-app-name.fly.dev/admin
- **Submit Endpoint**: https://your-app-name.fly.dev/submit
- **Fly.io Dashboard**: https://fly.io/dashboard
- **API Key**: _________________________

## 🆘 Troubleshooting

### App Won't Start
1. Check logs in dashboard
2. Verify all secrets are set
3. Ensure volume is created and mounted
4. Check `fly.toml` configuration

### Can't Access Dashboard
1. Verify app is running (check dashboard status)
2. Try accessing: `https://your-app-name.fly.dev/`
3. Check browser console for errors
4. Verify ADMIN_API_KEY is correct

### Submissions Not Working
1. Test endpoint with curl (see Step 6)
2. Check client `.env` has correct URL
3. Verify HTTPS (not HTTP)
4. Check server logs for errors

### Database Issues
1. Verify volume is mounted (check dashboard)
2. Check volume size hasn't exceeded limit
3. SSH into container to inspect:
   ```bash
   flyctl ssh console
   ls -la /data/
   ```

## 💰 Cost Monitoring

Free tier includes:
- 3 shared-cpu-1x VMs (256MB RAM)
- 160GB outbound transfer
- 3GB persistent storage

Current usage:
- 1 VM: ✅ Within free tier
- 1GB volume: ✅ Within free tier

**Expected monthly cost: $0** (free tier)

Monitor usage: https://fly.io/dashboard/personal/billing

## 🔄 Updates & Maintenance

### Deploying Updates

**Via GitHub:**
Just push to main branch - auto-deploys

**Via flyctl:**
```bash
git pull
cd server
flyctl deploy
```

### Rotating Secrets

Generate new secrets and update:
```bash
# Generate new key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update in dashboard or via flyctl
flyctl secrets set ADMIN_API_KEY=<new-key>
```

### Backing Up Database

```bash
# SSH into container
flyctl ssh console

# In container
cd /data
ls -lh security.db

# Exit and download
flyctl ssh sftp get /data/security.db ./backup-$(date +%Y%m%d).db
```

### Viewing All Settings

```bash
flyctl config show
flyctl secrets list
flyctl volumes list
flyctl status
```

## ✅ Deployment Complete!

Your security data server is now:
- ✅ Running on Fly.io
- ✅ Accessible via HTTPS
- ✅ Using persistent storage
- ✅ Ready to receive findings

Next: Update all team members' `.env` files to use the remote server!
