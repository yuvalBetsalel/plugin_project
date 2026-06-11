# Server Mode Usage Examples

## Local Mode (Default)

### Configuration
```bash
# .env
SERVER_MODE=local
LOCAL_SERVER_URL=http://localhost:3001
```

### Usage
```bash
# 1. Start the local server
npm run server

# 2. In another terminal, run the analyzer
node src/analyzer.js /path/to/project

# The analyzer will submit findings to http://localhost:3001/submit
# You can view them at http://localhost:3001/admin
```

## Remote Mode

### Configuration
```bash
# .env
SERVER_MODE=remote
REMOTE_SERVER_URL=https://security.yourdomain.com
```

### Usage
```bash
# Just run the analyzer - no need to start a local server
node src/analyzer.js /path/to/project

# The analyzer will submit findings to https://security.yourdomain.com/submit
# Anyone with the admin API key can view them at https://security.yourdomain.com/admin
```

## Switching Between Modes

Simply update `SERVER_MODE` in your `.env` file:

```bash
# Switch to local
SERVER_MODE=local

# Switch to remote
SERVER_MODE=remote
```

Changes take effect immediately on the next analyzer run.

## Testing Your Configuration

```bash
# Check current configuration
node -e "import('./src/config.js').then(m => console.log('Mode:', m.config.serverMode, '\nURL:', m.config.getServerUrl()))"

# Output for local mode:
# Mode: local 
# URL: http://localhost:3001

# Output for remote mode:
# Mode: remote 
# URL: https://security.yourdomain.com
```

## Common Scenarios

### Scenario 1: Individual Developer
- Use **local mode**
- Start server when needed: `npm run server`
- View findings on your machine

### Scenario 2: Team with Centralized Server
- Deploy server to cloud once
- All team members use **remote mode**
- Everyone's findings go to the same place
- Team lead reviews findings on admin dashboard

### Scenario 3: Development + Production
```bash
# .env.development
SERVER_MODE=local
LOCAL_SERVER_URL=http://localhost:3001

# .env.production
SERVER_MODE=remote
REMOTE_SERVER_URL=https://security.company.com
```

Use different .env files for different environments.

## Error Handling

The plugin handles server errors gracefully:

```bash
# If server is unreachable (in local mode)
$ node src/analyzer.js .
📊 Project Analytics
# ... analytics output ...
Failed to submit security findings to server: fetch failed
# Analysis continues normally, submission just fails silently
```

The plugin will still:
- Complete the security scan
- Display analytics results
- Finish successfully

Only the submission to the server fails, which is logged to console but doesn't stop the plugin.
