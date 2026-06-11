# Deploying Security Data Server to Fly.io

This guide walks you through deploying the security data collection server to Fly.io.

## Prerequisites

1. **Fly.io Account**: Sign up at https://fly.io/
2. **Docker** (optional): For local testing
3. **Git**: For version control

## Deployment Steps

### Method 1: Using Fly.io Web Interface (Recommended for Corporate Machines)

Since flyctl CLI might be blocked on your work computer, we'll use the web interface.

#### Step 1: Prepare the Server Code

The server directory already has all necessary files:
- `Dockerfile` - Container configuration
- `fly.toml` - Fly.io configuration
- `.dockerignore` - Files to exclude from container

#### Step 2: Create a Fly.io Account

1. Go to https://fly.io/
2. Sign up or log in
3. Add payment method (free tier available, but credit card required)

#### Step 3: Install Fly CLI on Personal Machine (Alternative)

If you have a personal machine without restrictions:

**Windows:**
```powershell
irm https://fly.io/install.ps1 | iex
```

**Mac/Linux:**
```bash
curl -L https://fly.io/install.sh | sh
```

**Or use npm:**
```bash
npm install -g flyctl
```

#### Step 4: Authenticate with Fly.io

On personal machine or using Fly.io web console:

```bash
flyctl auth login
```

This opens a browser for authentication.

#### Step 5: Generate Secrets

Generate secure secrets for production:

```bash
# Generate ADMIN_API_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save these values securely - you'll need them for the next step.

#### Step 6: Deploy from Server Directory

Navigate to the server directory and initialize the app:

```bash
cd server
flyctl launch
```

When prompted:
- **App name**: `security-data-server` (or choose your own unique name)
- **Region**: Choose closest to you (e.g., `iad` for US East)
- **Postgres database**: No (we're using SQLite)
- **Redis**: No

The `fly.toml` file will be used automatically.

#### Step 7: Set Secrets

Set the environment secrets:

```bash
# Set Admin API Key (use the one you generated in Step 5)
flyctl secrets set ADMIN_API_KEY=<your-generated-key>

# Set Session Secret
flyctl secrets set SESSION_SECRET=<your-generated-secret>
```

These secrets are encrypted and never exposed in logs or config files.

#### Step 8: Create Persistent Volume

Create a volume for the SQLite database:

```bash
flyctl volumes create security_data --region iad --size 1
```

This creates a 1GB persistent volume that survives deployments.

#### Step 9: Deploy

Deploy the application:

```bash
flyctl deploy
```

This will:
1. Build the Docker image
2. Upload to Fly.io
3. Deploy to your app
4. Start the server

#### Step 10: Verify Deployment

Check if the app is running:

```bash
flyctl status
```

Open in browser:
```bash
flyctl open
```

Or visit: `https://security-data-server.fly.dev` (replace with your app name)

### Method 2: Using GitHub Integration (For Corporate Restrictions)

If you can't install flyctl locally, deploy via GitHub:

#### Step 1: Push to GitHub

```bash
git add -A
git commit -m "feat: add Fly.io deployment configuration"
git push origin main
```

#### Step 2: Connect to Fly.io

1. Go to https://fly.io/dashboard
2. Click "Create app"
3. Choose "Import from GitHub"
4. Select your repository
5. Configure:
   - **Dockerfile location**: `server/Dockerfile`
   - **Build context**: `server/`
   - **Region**: Choose your region

#### Step 3: Configure Environment Variables

In Fly.io Dashboard:
1. Go to your app
2. Click "Secrets"
3. Add:
   - `ADMIN_API_KEY=<generated-value>`
   - `SESSION_SECRET=<generated-value>`
   - `NODE_ENV=production`

#### Step 4: Configure Volume

1. Go to "Volumes" in dashboard
2. Create new volume:
   - **Name**: `security_data`
   - **Region**: Same as your app
   - **Size**: 1GB

#### Step 5: Deploy

The app will auto-deploy from GitHub on every push to main branch.

## Post-Deployment Configuration

### Get Your App URL

Your app will be available at:
```
https://<your-app-name>.fly.dev
```

### Get Admin API Key

If you forgot the API key you generated:

```bash
flyctl secrets list
```

Or regenerate:
```bash
flyctl secrets set ADMIN_API_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

### Test the Deployment

1. **Check health endpoint:**
   ```bash
   curl https://your-app-name.fly.dev/
   ```

2. **Test admin login:**
   - Visit `https://your-app-name.fly.dev/admin`
   - Enter your ADMIN_API_KEY
   - Should see empty dashboard

3. **Test submit endpoint:**
   ```bash
   curl -X POST https://your-app-name.fly.dev/submit \
     -H "Content-Type: application/json" \
     -d '{
       "projectPath": "/test",
       "projectName": "test",
       "findings": []
     }'
   ```
   
   Should return `204 No Content`

## Update Local Project Configuration

Update your local `.env` to use the remote server:

```bash
# .env
SERVER_MODE=remote
REMOTE_SERVER_URL=https://your-app-name.fly.dev
```

Test it:
```bash
node src/analyzer.js .
```

The analyzer should now submit findings to your Fly.io server!

## Monitoring & Maintenance

### View Logs

```bash
flyctl logs
```

### Check Status

```bash
flyctl status
```

### View Metrics

```bash
flyctl dashboard
```

Or visit: https://fly.io/dashboard

### Scale Resources

If you need more resources:

```bash
# Increase memory
flyctl scale memory 512

# Add more machines
flyctl scale count 2

# View current scaling
flyctl scale show
```

### Database Backup

Backup the SQLite database:

```bash
# SSH into the container
flyctl ssh console

# Inside container
cd /data
ls -lh security.db

# Exit and copy database
flyctl ssh sftp get /data/security.db ./backups/security-backup-$(date +%Y%m%d).db
```

### Update Secrets

To rotate secrets:

```bash
flyctl secrets set ADMIN_API_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

This will trigger a redeployment.

## Troubleshooting

### App Won't Start

Check logs:
```bash
flyctl logs
```

Common issues:
- Missing secrets: Set `ADMIN_API_KEY` and `SESSION_SECRET`
- Volume not mounted: Check `fly.toml` mounts section
- Port mismatch: Ensure `PORT=3000` in fly.toml matches code

### Can't Access Admin Dashboard

1. Verify app is running: `flyctl status`
2. Check HTTPS is enabled (should redirect automatically)
3. Verify API key is correct: `flyctl secrets list`
4. Check logs for errors: `flyctl logs`

### Database Errors

1. Verify volume is mounted: `flyctl volumes list`
2. Check directory permissions in logs
3. SSH in and check: `flyctl ssh console -C "ls -la /data"`

### Submissions Failing

1. Test endpoint: `curl -X POST https://your-app.fly.dev/submit -d '{...}'`
2. Check client `.env` has correct `REMOTE_SERVER_URL`
3. Verify no firewall blocking HTTPS
4. Check server logs for errors

## Cost Estimate

Fly.io Free Tier:
- ✅ Up to 3 shared-cpu-1x VMs
- ✅ 160GB outbound data transfer
- ✅ 3GB persistent volume storage

This configuration uses:
- 1 VM (256MB RAM)
- 1GB volume
- Minimal bandwidth

**Expected cost: FREE** (within free tier limits)

If you exceed free tier:
- VM: ~$2/month
- Volume: ~$0.15/GB/month
- Bandwidth: ~$0.02/GB

## Security Recommendations

1. **Use HTTPS**: Fly.io provides free SSL (already configured)
2. **Rotate secrets**: Change API keys every 90 days
3. **Monitor access**: Check logs regularly
4. **Backup data**: Backup SQLite database weekly
5. **Limit access**: Consider IP whitelisting if possible

## Updating the App

When you make code changes:

```bash
cd server
git pull
flyctl deploy
```

Or if using GitHub integration, just push to main:
```bash
git push origin main
```

## Deleting the App

If you need to remove the deployment:

```bash
# Delete volume (this deletes all data!)
flyctl volumes destroy security_data

# Delete app
flyctl apps destroy security-data-server
```

## Alternative: Railway, Render, or DigitalOcean

If Fly.io doesn't work, you can use these alternatives with the same Docker setup:

### Railway
1. Sign up at https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select repository
4. Set environment variables
5. Deploy

### Render
1. Sign up at https://render.com
2. Click "New Web Service"
3. Connect GitHub repository
4. Configure:
   - **Docker**: Yes
   - **Dockerfile path**: `server/Dockerfile`
5. Add environment variables
6. Deploy

### DigitalOcean App Platform
1. Sign up at https://www.digitalocean.com
2. Create new app from GitHub
3. Configure Docker deployment
4. Add environment variables
5. Deploy

All three support similar features and free tiers!

## Support

For issues:
1. Check Fly.io docs: https://fly.io/docs
2. Fly.io community: https://community.fly.io
3. Check server logs: `flyctl logs`
4. Review this guide's troubleshooting section
