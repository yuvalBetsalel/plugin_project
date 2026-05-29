# Security Data Collection Server

A local Express server for collecting and viewing security findings from Claude Code scans.

## Quick Start

### Installation

From the project root:
```bash
npm run server:install
```

Or from the server directory:
```bash
cd server
npm install
```

### Configuration

1. Copy `.env.example` to `.env` in the project root:
```bash
cp .env.example .env
```

2. Set your admin credentials in `.env`:
```env
ADMIN_USERNAME=your_username
ADMIN_PASSWORD=your_secure_password
SESSION_SECRET=your_random_secret_string
```

3. (Optional) Configure data directory and port:
```env
SECURITY_DATA_DIR=./server-data
SERVER_PORT=3000
```

### Starting the Server

From the project root:
```bash
# Production mode
npm run server

# Development mode (with auto-reload)
npm run server:dev
```

Or from the server directory:
```bash
# Production mode
npm start

# Development mode
npm run dev
```

The server will start on `http://localhost:3000` (or your configured port).

## API Endpoints

### Public API

#### POST /api/submit
Submit security scan findings from Claude Code.

**Request Body:**
```json
{
  "project": "project-name",
  "timestamp": "2024-01-15T10:30:00Z",
  "findings": [
    {
      "file": "src/app.js",
      "line": 42,
      "severity": "high",
      "type": "hardcoded-secret",
      "description": "Hardcoded API key detected",
      "code": "const API_KEY = 'secret123';"
    }
  ],
  "summary": {
    "totalFiles": 150,
    "scannedFiles": 150,
    "totalFindings": 5,
    "high": 2,
    "medium": 2,
    "low": 1
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Scan results saved",
  "scanId": "abc123def456"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid request: missing required field 'project'"
}
```

### Admin Web Interface

#### GET /admin/login
Admin login page. Accessible without authentication.

#### POST /admin/login
Authenticate admin user.

**Form Data:**
- `username`: Admin username
- `password`: Admin password

**Response:** Redirects to `/admin` on success, back to `/admin/login` on failure.

#### GET /admin
Admin dashboard showing all scans. Requires authentication.

**Features:**
- View all security scans ordered by date (newest first)
- Filter by project
- See scan summaries (total findings, severity breakdown)
- Click to view detailed findings

#### GET /admin/scan/:id
Detailed view of a specific scan. Requires authentication.

**Features:**
- View all findings from the scan
- Filter by severity
- Filter by file
- See code snippets with line numbers
- View scan metadata (project, timestamp, summary)

#### POST /admin/logout
Log out of admin interface.

## Configuration

### Environment Variables

The server uses environment variables from the project root `.env` file:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ADMIN_USERNAME` | Yes | - | Admin login username |
| `ADMIN_PASSWORD` | Yes | - | Admin login password |
| `SESSION_SECRET` | Yes | - | Secret for session encryption |
| `SECURITY_DATA_DIR` | No | `./server-data` | Directory for database and logs |
| `SERVER_PORT` | No | `3000` | Port for the server to listen on |

### Data Directory

By default, the server stores data in `./server-data` relative to the project root:
```
server-data/
├── security-findings.db   # SQLite database
└── logs/                  # Server logs (future)
```

You can change this location by setting `SECURITY_DATA_DIR` in your `.env` file.

## Database

### Schema

The server uses SQLite with the following schema:

**scans table:**
```sql
CREATE TABLE scans (
  id TEXT PRIMARY KEY,
  project TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**findings table:**
```sql
CREATE TABLE findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scan_id TEXT NOT NULL,
  file TEXT NOT NULL,
  line INTEGER,
  severity TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  code TEXT,
  FOREIGN KEY (scan_id) REFERENCES scans(id)
);
```

### Database Location

The database file is created at `${SECURITY_DATA_DIR}/security-findings.db` on first startup.

### Backup

The database is a single SQLite file. To backup:
```bash
cp server-data/security-findings.db server-data/security-findings.backup.db
```

## Migration from File-Based Storage

If you have existing security scan JSON files, you can migrate them:

1. Place JSON files in a directory (e.g., `old-scans/`)
2. Start the server to initialize the database
3. Use the `/api/submit` endpoint to submit each scan:

```bash
for file in old-scans/*.json; do
  curl -X POST http://localhost:3000/api/submit \
    -H "Content-Type: application/json" \
    -d @"$file"
done
```

The server will automatically generate scan IDs and store the data in the database.

## Development

### Project Structure

```
server/
├── index.js              # Main server entry point
├── config.js             # Configuration loader
├── package.json          # Dependencies and scripts
├── db/
│   ├── schema.js         # Database schema definition
│   └── connection.js     # Database connection abstraction
├── middleware/
│   └── auth.js           # Authentication middleware
├── routes/
│   ├── submit.js         # Public API routes
│   └── admin.js          # Admin web interface routes
└── views/
    ├── layout.ejs        # Base HTML layout
    ├── login.ejs         # Login page
    ├── dashboard.ejs     # Scan list dashboard
    └── scan-details.ejs  # Individual scan details
```

### Adding Features

**To add a new route:**
1. Create a route file in `routes/`
2. Import and use it in `index.js`

**To add a new database table:**
1. Update `db/schema.js` with the new schema
2. The schema runs on every startup (uses `CREATE TABLE IF NOT EXISTS`)

**To add a new view:**
1. Create an EJS file in `views/`
2. Use `res.render('view-name', data)` in your route

### Testing

Test the API with curl:
```bash
# Submit a scan
curl -X POST http://localhost:3000/api/submit \
  -H "Content-Type: application/json" \
  -d '{
    "project": "test-project",
    "timestamp": "2024-01-15T10:30:00Z",
    "findings": [],
    "summary": {"totalFiles": 10, "scannedFiles": 10, "totalFindings": 0, "high": 0, "medium": 0, "low": 0}
  }'
```

Access the admin interface:
1. Navigate to `http://localhost:3000/admin/login`
2. Log in with credentials from `.env`
3. View scans at `http://localhost:3000/admin`

## Security Notes

### Authentication

- Admin routes require session-based authentication
- Sessions are encrypted using `SESSION_SECRET`
- No authentication required for the public `/api/submit` endpoint (designed for local use)

### Running in Production

If you need to run this server in a production environment:

1. **Use HTTPS**: Put the server behind a reverse proxy (nginx, Apache) with SSL
2. **Add API authentication**: Consider adding API keys or tokens to the `/api/submit` endpoint
3. **Restrict access**: Use firewall rules to limit access to trusted networks
4. **Use strong credentials**: Set complex values for `ADMIN_PASSWORD` and `SESSION_SECRET`
5. **Regular backups**: Backup the database file regularly

### Local Development Only

This server is designed for **local development use**. It assumes:
- Running on localhost
- Trusted local environment
- Single-user access
- No external network exposure

## Troubleshooting

### Server won't start

**Error: "Missing required environment variable"**
- Solution: Check that `.env` exists in the project root and contains all required variables

**Error: "Port 3000 already in use"**
- Solution: Change `SERVER_PORT` in `.env` or stop the other process using port 3000

**Error: "Cannot find module 'express'"**
- Solution: Run `npm run server:install` from the project root

### Database issues

**Error: "SQLITE_CANTOPEN: unable to open database file"**
- Solution: Check that `SECURITY_DATA_DIR` exists and is writable
- Solution: Create the directory: `mkdir -p server-data`

**Database is corrupted**
- Solution: Restore from backup or delete the database file to start fresh
- Location: `server-data/security-findings.db`

### Admin login issues

**Can't log in with correct credentials**
- Check that `.env` is in the project root (not in `server/`)
- Verify `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env`
- Clear browser cookies for localhost:3000
- Restart the server

**Session expires immediately**
- Check that `SESSION_SECRET` is set in `.env`
- Make sure `SESSION_SECRET` is not empty
- Restart the server after changing `.env`

### API submission issues

**"Invalid request" errors**
- Verify JSON format matches the API specification
- Check that all required fields are present (project, timestamp, findings, summary)
- Ensure `Content-Type: application/json` header is set

**Scan saves but doesn't appear in admin**
- Refresh the admin dashboard page
- Check server logs for errors
- Verify the database file exists and is not corrupted

### Getting Help

1. Check server logs: The server logs to console output
2. Enable development mode: Run `npm run server:dev` for detailed logging
3. Check the database: Use a SQLite browser to inspect the database file
4. Verify configuration: Ensure `.env` is correctly set up

## Integration with Claude Code

This server is designed to work with the Claude Code security scanning plugin.

### Plugin Configuration

The plugin automatically submits scans to this server when configured:

1. The security scanning skill detects findings
2. The plugin packages them in the required format
3. Results are POST'd to `/api/submit`
4. Scan ID is returned for reference

### Viewing Results

After running a security scan with Claude Code:
1. Navigate to `http://localhost:3000/admin/login`
2. Log in with your admin credentials
3. Find your project scan in the dashboard
4. Click to view detailed findings

## License

This server is part of the claude-code-project-analytics plugin and shares the same MIT license.
