# Remote Server Setup Guide

This guide explains how to configure and use the remote server mode for collecting security findings from multiple clients.

## Overview

The plugin supports two server modes:

1. **Local Mode** (default): Submits findings to a locally running server
2. **Remote Mode**: Submits findings to a centralized remote server that's always running

## When to Use Remote Mode

Use remote mode when:
- You want to centralize security findings from multiple team members
- You need the server to be always available without manual startup
- You're deploying to a production/staging environment
- Multiple projects need to report to the same server

## Configuration

### Step 1: Update .env File

Edit your `.env` file in the project root:

```bash
# Switch to remote mode
SERVER_MODE=remote

# Set your remote server URL
REMOTE_SERVER_URL=https://security.yourdomain.com

# Optional: Keep local URL for development fallback
LOCAL_SERVER_URL=http://localhost:3001
```

### Step 2: Deploy the Server

Deploy the Express server to a cloud provider. The server needs to:
- Accept POST requests at `/submit` endpoint
- Be accessible from client machines
- Have a public URL or internal network URL

#### Deployment Options

**Option 1: Cloud Platforms (Recommended)**
- AWS (EC2, Elastic Beanstalk, ECS)
- Azure (App Service, Container Instances)
- Google Cloud (App Engine, Cloud Run)
- DigitalOcean (Droplets, App Platform)
- Heroku
- Railway
- Render

**Option 2: Internal Server**
- Deploy on company infrastructure
- Ensure network accessibility from client machines
- Use internal DNS or IP address

### Step 3: Server Environment Variables

On your deployed server, configure these environment variables:

```bash
# Server Configuration
PORT=3000

# Security (generate secure random strings)
ADMIN_API_KEY=<generate-secure-random-string>
SESSION_SECRET=<generate-secure-random-string>
SESSION_EXPIRY_HOURS=24

# Database
DATABASE_TYPE=sqlite  # or postgresql for production
DATABASE_PATH=./server-data/security.db

# For PostgreSQL (production recommended)
# DATABASE_TYPE=postgresql
# DATABASE_HOST=your-db-host.com
# DATABASE_PORT=5432
# DATABASE_NAME=security_db
# DATABASE_USER=admin
# DATABASE_PASSWORD=***
```

### Step 4: Secure Your Deployment

**For Production:**

1. **Enable HTTPS/TLS:**
   - Use Let's Encrypt for free SSL certificates
   - Or use cloud provider's certificate management

2. **Set Secure Cookies:**
   Update `server/index.js`:
   ```javascript
   cookie: {
     httpOnly: true,
     secure: true,  // Set to true for HTTPS
     maxAge: config.sessionExpiryHours * 60 * 60 * 1000
   }
   ```

3. **Add Rate Limiting:**
   Install express-rate-limit:
   ```bash
   npm install express-rate-limit
   ```
   
   Add to `server/index.js`:
   ```javascript
   import rateLimit from 'express-rate-limit';
   
   const submitLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   
   app.use('/submit', submitLimiter);
   ```

4. **Configure Firewall:**
   - Only allow traffic on required ports (443 for HTTPS, 80 for HTTP redirect)
   - Restrict admin access by IP if possible

5. **Use PostgreSQL:**
   - SQLite is fine for development but PostgreSQL is recommended for production
   - Better concurrent access handling
   - More robust for multiple clients

## Client Configuration

Each client machine running the plugin only needs to:

1. Install the plugin
2. Create/update `.env` file:
   ```bash
   SERVER_MODE=remote
   REMOTE_SERVER_URL=https://your-remote-server.com
   ```

That's it! Clients don't need to start a local server.

## Testing

### Test Local Mode
```bash
# .env
SERVER_MODE=local
LOCAL_SERVER_URL=http://localhost:3001

# Start local server
npm run server

# Run analyzer
node src/analyzer.js .
```

### Test Remote Mode
```bash
# .env
SERVER_MODE=remote
REMOTE_SERVER_URL=https://your-remote-server.com

# Run analyzer (no server startup needed)
node src/analyzer.js .
```

### Verify Configuration
```bash
# Check current configuration
node -e "import('./src/config.js').then(m => console.log('Mode:', m.config.serverMode, 'URL:', m.config.getServerUrl()))"
```

## Troubleshooting

### Plugin can't reach remote server

**Error:** `Failed to submit security findings to server: fetch failed`

**Solutions:**
1. Verify `REMOTE_SERVER_URL` is correct and accessible
2. Check firewall rules on server and client
3. Ensure server is running and healthy
4. Try accessing `https://your-remote-server.com/submit` in browser
5. Check server logs for errors

### Server not receiving submissions

**Check:**
1. Server logs show incoming POST requests
2. Client is using correct URL (check with node command above)
3. Network connectivity between client and server
4. Server's `/submit` endpoint is not blocked by authentication

### Configuration not taking effect

**Solutions:**
1. Restart the plugin/analyzer after changing `.env`
2. Verify `.env` is in project root (same directory as `package.json`)
3. Check for typos in environment variable names
4. Run configuration verification command (see Testing section)

## Security Considerations

**Data Transmission:**
- Always use HTTPS in production to encrypt findings in transit
- Security findings may contain sensitive information (credentials, keys)

**Access Control:**
- Protect admin dashboard with strong API key
- Consider IP whitelisting for admin access
- Rotate API keys periodically

**Data Storage:**
- Database contains full file contents with detected secrets
- Ensure database is secured and backed up
- Consider data retention policies

**Network:**
- Deploy on private network if possible
- Use VPN for remote access to admin dashboard
- Monitor for unusual traffic patterns

## Example Deployment: DigitalOcean

1. **Create a Droplet:**
   - Ubuntu 24.04 LTS
   - Basic plan ($6/month is sufficient)
   - Enable backups

2. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone and Setup:**
   ```bash
   git clone <your-repo>
   cd plugin_project/server
   npm install
   ```

4. **Configure Environment:**
   ```bash
   nano .env
   # Set PORT, ADMIN_API_KEY, etc.
   ```

5. **Install PM2 (Process Manager):**
   ```bash
   sudo npm install -g pm2
   pm2 start index.js --name security-server
   pm2 startup
   pm2 save
   ```

6. **Setup Nginx (Reverse Proxy):**
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/security
   ```
   
   Add:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. **Enable Site and SSL:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/security /etc/nginx/sites-enabled/
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   sudo systemctl restart nginx
   ```

8. **Update Client .env:**
   ```bash
   SERVER_MODE=remote
   REMOTE_SERVER_URL=https://your-domain.com
   ```

## Migration Path

**From Local to Remote:**
1. Export local SQLite database
2. Deploy server with same database
3. Update all clients' `.env` to use `SERVER_MODE=remote`
4. Verify submissions are working
5. Decommission local servers

**From SQLite to PostgreSQL:**
1. Set up PostgreSQL database
2. Export SQLite data: `sqlite3 security.db .dump > dump.sql`
3. Import to PostgreSQL (adjust SQL syntax as needed)
4. Update server's `.env` with PostgreSQL credentials
5. Test before switching clients

## Monitoring

**Server Health:**
```bash
# Check if server is running
curl https://your-remote-server.com/

# Check logs
pm2 logs security-server

# Monitor resource usage
pm2 monit
```

**Database Size:**
```bash
# SQLite
du -h server-data/security.db

# PostgreSQL
psql -U admin -d security_db -c "SELECT pg_size_pretty(pg_database_size('security_db'));"
```

## Support

For issues or questions:
1. Check server logs: `pm2 logs security-server`
2. Verify configuration: Run verification command
3. Test connectivity: `curl -X POST https://your-server.com/submit -H "Content-Type: application/json" -d '{"projectPath":"test","findings":[]}'`
4. Review server/README.md for additional details
