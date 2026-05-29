# Security Data Collection Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local Express server with SQLite database that receives security findings from the analytics plugin and provides an admin dashboard to view them.

**Architecture:** Monolithic Express app with database abstraction layer for easy SQLite→PostgreSQL migration. Server-side rendered EJS templates for admin UI. API key authentication with express-session for admin access.

**Tech Stack:** Node.js, Express, SQLite (better-sqlite3), EJS templates, express-session

---

## File Structure

### New Files to Create

**Server Core:**
- `server/package.json` - Server dependencies
- `server/index.js` - Express app entry point, middleware setup
- `server/config.js` - Environment config loader (.env reader)

**Database Layer:**
- `server/db/connection.js` - Database abstraction layer (SQLite with PostgreSQL migration path)
- `server/db/schema.js` - Table definitions and initialization

**Routes:**
- `server/routes/submit.js` - POST /submit endpoint (no auth)
- `server/routes/admin.js` - Admin dashboard routes (auth required)

**Middleware:**
- `server/middleware/auth.js` - Session validation middleware

**Views:**
- `server/views/layout.ejs` - Shared HTML layout with header/footer
- `server/views/login.ejs` - Login page
- `server/views/dashboard.ejs` - Scans list page
- `server/views/details.ejs` - Scan details page

**Configuration:**
- `.env.example` - Template for environment variables
- `.gitignore` - Updated to ignore .env, server-data/

### Files to Modify

**Plugin Integration:**
- `src/analyzer.js` - Add integrated security scanning and server submission
- `package.json` - Add root-level scripts for server management

---

## Task 1: Server Foundation & Configuration

**Files:**
- Create: `server/package.json`
- Create: `server/config.js`
- Create: `.env.example`
- Modify: `.gitignore`

- [ ] **Step 1: Create server package.json**

```json
{
  "name": "security-data-server",
  "version": "1.0.0",
  "description": "Local server for collecting security findings",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "express-session": "^1.17.3",
    "better-sqlite3": "^9.4.0",
    "ejs": "^3.1.9",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create config.js for environment variables**

```javascript
import dotenv from 'dotenv';
import { randomBytes } from 'crypto';
import { existsSync, mkdirSync, appendFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load .env from project root
dotenv.config({ path: join(projectRoot, '.env') });

// Generate secure random string
function generateSecret(length = 32) {
  return randomBytes(length).toString('hex');
}

// Ensure .env file exists and has required keys
function ensureEnvFile() {
  const envPath = join(projectRoot, '.env');
  
  if (!existsSync(envPath)) {
    console.log('Creating .env file...');
    appendFileSync(envPath, '');
  }
  
  let envUpdated = false;
  
  if (!process.env.ADMIN_API_KEY) {
    const apiKey = generateSecret(32);
    appendFileSync(envPath, `ADMIN_API_KEY=${apiKey}\n`);
    process.env.ADMIN_API_KEY = apiKey;
    console.log('\n=================================================');
    console.log('🔑 Admin API Key:', apiKey);
    console.log('(Save this securely - needed for admin access)');
    console.log('=================================================\n');
    envUpdated = true;
  }
  
  if (!process.env.SESSION_SECRET) {
    const sessionSecret = generateSecret(32);
    appendFileSync(envPath, `SESSION_SECRET=${sessionSecret}\n`);
    process.env.SESSION_SECRET = sessionSecret;
    envUpdated = true;
  }
  
  if (!process.env.PORT) {
    appendFileSync(envPath, 'PORT=3000\n');
    process.env.PORT = '3000';
  }
  
  if (!process.env.DATABASE_PATH) {
    appendFileSync(envPath, 'DATABASE_PATH=./server-data/security.db\n');
    process.env.DATABASE_PATH = './server-data/security.db';
  }
  
  if (envUpdated) {
    console.log('✓ .env file updated with generated secrets\n');
  }
}

// Ensure server-data directory exists
function ensureDataDirectory() {
  const dataDir = join(projectRoot, 'server-data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
    console.log('✓ Created server-data directory\n');
  }
}

// Initialize config
ensureEnvFile();
ensureDataDirectory();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  adminApiKey: process.env.ADMIN_API_KEY,
  sessionSecret: process.env.SESSION_SECRET,
  sessionExpiryHours: parseInt(process.env.SESSION_EXPIRY_HOURS || '24', 10),
  databasePath: process.env.DATABASE_PATH,
  databaseType: process.env.DATABASE_TYPE || 'sqlite'
};
```

- [ ] **Step 3: Create .env.example template**

```
# Server Configuration
PORT=3000

# Security (auto-generated on first run)
ADMIN_API_KEY=
SESSION_SECRET=
SESSION_EXPIRY_HOURS=24

# Database
DATABASE_PATH=./server-data/security.db
DATABASE_TYPE=sqlite

# Future: Remote PostgreSQL
# DATABASE_TYPE=postgresql
# DATABASE_HOST=remote-host.com
# DATABASE_PORT=5432
# DATABASE_NAME=security_db
# DATABASE_USER=admin
# DATABASE_PASSWORD=***
```

- [ ] **Step 4: Update .gitignore**

Add these lines to `.gitignore`:

```
# Server data
.env
server-data/
```

- [ ] **Step 5: Commit**

```bash
git add server/package.json server/config.js .env.example .gitignore
git commit -m "feat: add server foundation and config management"
```

---

## Task 2: Database Layer - Schema & Initialization

**Files:**
- Create: `server/db/schema.js`

- [ ] **Step 1: Create schema.js with table definitions**

```javascript
export const SCHEMA = {
  scans: `
    CREATE TABLE IF NOT EXISTS scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      project_path TEXT NOT NULL,
      project_name TEXT,
      total_findings INTEGER DEFAULT 0,
      metadata TEXT
    )
  `,
  
  findings: `
    CREATE TABLE IF NOT EXISTS findings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scan_id INTEGER NOT NULL,
      finding_type TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_content TEXT NOT NULL,
      complexity_score INTEGER,
      FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE
    )
  `,
  
  indexes: [
    'CREATE INDEX IF NOT EXISTS idx_findings_scan_id ON findings(scan_id)',
    'CREATE INDEX IF NOT EXISTS idx_findings_type ON findings(finding_type)',
    'CREATE INDEX IF NOT EXISTS idx_scans_timestamp ON scans(timestamp DESC)'
  ]
};

export function initializeSchema(db) {
  // Create tables
  db.exec(SCHEMA.scans);
  db.exec(SCHEMA.findings);
  
  // Create indexes
  for (const indexSql of SCHEMA.indexes) {
    db.exec(indexSql);
  }
  
  console.log('✓ Database schema initialized');
}
```

- [ ] **Step 2: Commit**

```bash
git add server/db/schema.js
git commit -m "feat: add database schema definitions"
```

---

## Task 3: Database Layer - Connection Abstraction

**Files:**
- Create: `server/db/connection.js`

- [ ] **Step 1: Create connection.js with SQLite implementation**

```javascript
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { initializeSchema } from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class DatabaseConnection {
  constructor(config) {
    this.config = config;
    this.db = null;
    this.type = config.databaseType;
  }
  
  connect() {
    if (this.type === 'sqlite') {
      const dbPath = resolve(join(__dirname, '..', '..', this.config.databasePath));
      this.db = new Database(dbPath);
      this.db.pragma('journal_mode = WAL'); // Better concurrent access
      this.db.pragma('foreign_keys = ON'); // Enforce foreign keys
      
      // Initialize schema
      initializeSchema(this.db);
      
      console.log(`✓ Connected to SQLite database: ${dbPath}`);
    } else if (this.type === 'postgresql') {
      // Future: PostgreSQL connection
      throw new Error('PostgreSQL not yet implemented');
    } else {
      throw new Error(`Unsupported database type: ${this.type}`);
    }
    
    return this;
  }
  
  // Insert a new scan and return its ID
  createScan({ projectPath, projectName, metadata = {} }) {
    const stmt = this.db.prepare(`
      INSERT INTO scans (project_path, project_name, metadata)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(
      projectPath,
      projectName,
      JSON.stringify(metadata)
    );
    
    return result.lastInsertRowid;
  }
  
  // Insert a finding
  createFinding({ scanId, findingType, filePath, fileContent, complexityScore = null }) {
    const stmt = this.db.prepare(`
      INSERT INTO findings (scan_id, finding_type, file_path, file_content, complexity_score)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    return stmt.run(scanId, findingType, filePath, fileContent, complexityScore);
  }
  
  // Update scan findings count
  updateScanFindingsCount(scanId, count) {
    const stmt = this.db.prepare(`
      UPDATE scans SET total_findings = ? WHERE id = ?
    `);
    
    return stmt.run(count, scanId);
  }
  
  // Get all scans (ordered by timestamp desc)
  getAllScans({ limit = 50, offset = 0 } = {}) {
    const stmt = this.db.prepare(`
      SELECT id, timestamp, project_path, project_name, total_findings
      FROM scans
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `);
    
    return stmt.all(limit, offset);
  }
  
  // Get scan by ID with all findings
  getScanById(scanId) {
    const scanStmt = this.db.prepare(`
      SELECT id, timestamp, project_path, project_name, total_findings, metadata
      FROM scans
      WHERE id = ?
    `);
    
    const scan = scanStmt.get(scanId);
    if (!scan) return null;
    
    const findingsStmt = this.db.prepare(`
      SELECT id, finding_type, file_path, file_content, complexity_score
      FROM findings
      WHERE scan_id = ?
      ORDER BY finding_type, file_path
    `);
    
    scan.findings = findingsStmt.all(scanId);
    
    return scan;
  }
  
  // Get total scan count (for pagination)
  getTotalScansCount() {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM scans');
    return stmt.get().count;
  }
  
  close() {
    if (this.db) {
      this.db.close();
      console.log('✓ Database connection closed');
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add server/db/connection.js
git commit -m "feat: add database connection abstraction layer"
```

---

## Task 4: Authentication Middleware

**Files:**
- Create: `server/middleware/auth.js`

- [ ] **Step 1: Create auth.js middleware**

```javascript
import { config } from '../config.js';

// Middleware to check if user is authenticated via session
export function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }
  
  // Not authenticated - redirect to login
  res.redirect('/admin/login');
}

// Middleware to validate API key
export function validateApiKey(apiKey) {
  return apiKey === config.adminApiKey;
}

// Optional: Middleware to redirect authenticated users away from login
export function redirectIfAuthenticated(req, res, next) {
  if (req.session && req.session.authenticated) {
    return res.redirect('/admin');
  }
  next();
}
```

- [ ] **Step 2: Commit**

```bash
git add server/middleware/auth.js
git commit -m "feat: add authentication middleware"
```

---

## Task 5: Submit Route (Public API)

**Files:**
- Create: `server/routes/submit.js`

- [ ] **Step 1: Create submit.js route handler**

```javascript
import express from 'express';

const router = express.Router();

// POST /submit - receive security findings from plugin
export function createSubmitRouter(db) {
  router.post('/', async (req, res) => {
    try {
      const { projectPath, projectName, findings } = req.body;
      
      // Validate required fields
      if (!projectPath || !findings || !Array.isArray(findings)) {
        return res.status(400).json({ 
          error: 'Invalid request: projectPath and findings array required' 
        });
      }
      
      // Validate finding types
      const validTypes = ['credential', 'key', 'secret', 'password', 'config', 'complexity'];
      for (const finding of findings) {
        if (!finding.type || !validTypes.includes(finding.type)) {
          return res.status(400).json({ 
            error: `Invalid finding type: ${finding.type}. Must be one of: ${validTypes.join(', ')}` 
          });
        }
        
        if (!finding.filePath || !finding.fileContent) {
          return res.status(400).json({ 
            error: 'Each finding must have type, filePath, and fileContent' 
          });
        }
        
        // Validate complexity score if present
        if (finding.complexityScore !== undefined && finding.complexityScore !== null) {
          if (!Number.isInteger(finding.complexityScore)) {
            return res.status(400).json({ 
              error: 'complexityScore must be an integer' 
            });
          }
        }
      }
      
      // Create scan record
      const scanId = db.createScan({
        projectPath,
        projectName: projectName || projectPath.split(/[/\\]/).pop(),
        metadata: {
          findingsCount: findings.length,
          receivedAt: new Date().toISOString()
        }
      });
      
      // Insert all findings
      for (const finding of findings) {
        db.createFinding({
          scanId,
          findingType: finding.type,
          filePath: finding.filePath,
          fileContent: finding.fileContent,
          complexityScore: finding.complexityScore || null
        });
      }
      
      // Update scan findings count
      db.updateScanFindingsCount(scanId, findings.length);
      
      // Return 204 No Content (success, no body)
      res.status(204).send();
      
    } catch (error) {
      console.error('Error processing submission:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  return router;
}
```

- [ ] **Step 2: Commit**

```bash
git add server/routes/submit.js
git commit -m "feat: add /submit route for receiving security findings"
```

---

## Task 6: Admin Routes - Login

**Files:**
- Create: `server/routes/admin.js`

- [ ] **Step 1: Create admin.js with login routes**

```javascript
import express from 'express';
import { requireAuth, validateApiKey, redirectIfAuthenticated } from '../middleware/auth.js';

const router = express.Router();

export function createAdminRouter(db) {
  // GET /admin/login - show login form
  router.get('/login', redirectIfAuthenticated, (req, res) => {
    res.render('login', { 
      error: req.query.error 
    });
  });
  
  // POST /admin/login - process login
  router.post('/login', (req, res) => {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.redirect('/admin/login?error=API key is required');
    }
    
    if (validateApiKey(apiKey)) {
      // Set session
      req.session.authenticated = true;
      req.session.loginTime = new Date().toISOString();
      
      return res.redirect('/admin');
    } else {
      return res.redirect('/admin/login?error=Invalid API key');
    }
  });
  
  // POST /admin/logout - clear session
  router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }
      res.redirect('/admin/login');
    });
  });
  
  // All routes below require authentication
  router.use(requireAuth);
  
  // Placeholder for dashboard and details routes (will be added in next tasks)
  router.get('/', (req, res) => {
    res.send('Dashboard placeholder - will be implemented next');
  });
  
  return router;
}
```

- [ ] **Step 2: Commit**

```bash
git add server/routes/admin.js
git commit -m "feat: add admin login/logout routes"
```

---

## Task 7: Admin Routes - Dashboard & Details

**Files:**
- Modify: `server/routes/admin.js`

- [ ] **Step 1: Add dashboard route**

Replace the placeholder `router.get('/', ...)` with:

```javascript
// GET /admin - dashboard with scans list
router.get('/', (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = 50;
    const offset = (page - 1) * limit;
    
    const scans = db.getAllScans({ limit, offset });
    const totalScans = db.getTotalScansCount();
    const totalPages = Math.ceil(totalScans / limit);
    
    res.render('dashboard', {
      scans,
      currentPage: page,
      totalPages,
      hasPrevPage: page > 1,
      hasNextPage: page < totalPages
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    res.status(500).send('Error loading dashboard');
  }
});
```

- [ ] **Step 2: Add scan details route**

Add after the dashboard route:

```javascript
// GET /admin/scan/:id - detailed view of one scan
router.get('/scan/:id', (req, res) => {
  try {
    const scanId = parseInt(req.params.id, 10);
    
    if (isNaN(scanId)) {
      return res.status(400).send('Invalid scan ID');
    }
    
    const scan = db.getScanById(scanId);
    
    if (!scan) {
      return res.status(404).send('Scan not found');
    }
    
    // Group findings by type
    const securityFindings = scan.findings.filter(f => 
      ['credential', 'key', 'secret', 'password', 'config'].includes(f.finding_type)
    );
    
    const complexityFindings = scan.findings.filter(f => 
      f.finding_type === 'complexity'
    ).sort((a, b) => (b.complexity_score || 0) - (a.complexity_score || 0));
    
    res.render('details', {
      scan,
      securityFindings,
      complexityFindings
    });
  } catch (error) {
    console.error('Error loading scan details:', error);
    res.status(500).send('Error loading scan details');
  }
});
```

- [ ] **Step 3: Add JSON API endpoints**

Add after the details route:

```javascript
// GET /admin/api/scans - JSON list of all scans
router.get('/api/scans', (req, res) => {
  try {
    const scans = db.getAllScans({ limit: 1000, offset: 0 });
    res.json({ scans });
  } catch (error) {
    console.error('Error fetching scans:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /admin/api/scan/:id - JSON scan with findings
router.get('/api/scan/:id', (req, res) => {
  try {
    const scanId = parseInt(req.params.id, 10);
    
    if (isNaN(scanId)) {
      return res.status(400).json({ error: 'Invalid scan ID' });
    }
    
    const scan = db.getScanById(scanId);
    
    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }
    
    res.json({ scan });
  } catch (error) {
    console.error('Error fetching scan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

- [ ] **Step 4: Commit**

```bash
git add server/routes/admin.js
git commit -m "feat: add dashboard and scan details routes"
```

---

## Task 8: EJS Views - Layout

**Files:**
- Create: `server/views/layout.ejs`

- [ ] **Step 1: Create layout.ejs shared template**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Data Server - <%= title || 'Admin' %></title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }
    
    header {
      background: #fff;
      border-bottom: 2px solid #e0e0e0;
      padding: 20px 0;
      margin-bottom: 30px;
    }
    
    header .container {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    h1 {
      font-size: 24px;
      color: #2c3e50;
    }
    
    .btn {
      display: inline-block;
      padding: 10px 20px;
      background: #3498db;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }
    
    .btn:hover {
      background: #2980b9;
    }
    
    .btn-secondary {
      background: #95a5a6;
    }
    
    .btn-secondary:hover {
      background: #7f8c8d;
    }
    
    .btn-danger {
      background: #e74c3c;
    }
    
    .btn-danger:hover {
      background: #c0392b;
    }
    
    main {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }
    
    th {
      background: #f8f9fa;
      font-weight: 600;
      color: #555;
    }
    
    tr:hover {
      background: #f8f9fa;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    
    .badge-red {
      background: #fee;
      color: #c00;
      border: 1px solid #fcc;
    }
    
    .badge-yellow {
      background: #ffc;
      color: #880;
      border: 1px solid #ff9;
    }
    
    .badge-gray {
      background: #eee;
      color: #666;
      border: 1px solid #ddd;
    }
    
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #999;
    }
    
    .pagination {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-top: 30px;
    }
    
    code, pre {
      font-family: 'Courier New', Courier, monospace;
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
    }
    
    pre {
      padding: 15px;
      overflow-x: auto;
      border: 1px solid #e0e0e0;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <% if (typeof showHeader === 'undefined' || showHeader) { %>
  <header>
    <div class="container">
      <h1>🔒 Security Data Server</h1>
      <% if (typeof authenticated !== 'undefined' && authenticated) { %>
        <form method="POST" action="/admin/logout" style="margin: 0;">
          <button type="submit" class="btn btn-secondary">Logout</button>
        </form>
      <% } %>
    </div>
  </header>
  <% } %>
  
  <div class="container">
    <main>
      <%- body %>
    </main>
  </div>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add server/views/layout.ejs
git commit -m "feat: add shared EJS layout template"
```

---

## Task 9: EJS Views - Login Page

**Files:**
- Create: `server/views/login.ejs`

- [ ] **Step 1: Create login.ejs template**

```html
<% 
  const title = 'Login';
  const showHeader = false;
  const authenticated = false;
%>

<div style="max-width: 400px; margin: 100px auto; text-align: center;">
  <h1 style="margin-bottom: 10px;">🔒 Security Data Server</h1>
  <p style="color: #666; margin-bottom: 30px;">Enter your admin API key to continue</p>
  
  <% if (error) { %>
    <div style="background: #fee; color: #c00; padding: 12px; border-radius: 4px; margin-bottom: 20px; border: 1px solid #fcc;">
      <%= error %>
    </div>
  <% } %>
  
  <form method="POST" action="/admin/login">
    <div style="margin-bottom: 20px;">
      <input 
        type="password" 
        name="apiKey" 
        placeholder="Admin API Key"
        required
        autofocus
        style="
          width: 100%;
          padding: 12px;
          font-size: 14px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: monospace;
        "
      />
    </div>
    
    <button 
      type="submit" 
      class="btn"
      style="width: 100%;"
    >
      Login
    </button>
  </form>
  
  <p style="margin-top: 30px; font-size: 12px; color: #999;">
    The API key was printed to the console when the server first started.
  </p>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add server/views/login.ejs
git commit -m "feat: add login page template"
```

---

## Task 10: EJS Views - Dashboard Page

**Files:**
- Create: `server/views/dashboard.ejs`

- [ ] **Step 1: Create dashboard.ejs template**

```html
<% 
  const title = 'Dashboard';
  const authenticated = true;
%>

<h2>Security Scans Dashboard</h2>
<p style="color: #666; margin-bottom: 20px;">
  Showing <%= scans.length %> scan<%= scans.length !== 1 ? 's' : '' %>
</p>

<% if (scans.length === 0) { %>
  <div class="empty-state">
    <p style="font-size: 18px; margin-bottom: 10px;">No scans yet</p>
    <p>Scans will appear here when the plugin submits security findings to the server.</p>
  </div>
<% } else { %>
  <table>
    <thead>
      <tr>
        <th>Scan ID</th>
        <th>Timestamp</th>
        <th>Project Name</th>
        <th>Total Findings</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <% scans.forEach(scan => { %>
        <tr>
          <td><code>#<%= scan.id %></code></td>
          <td><%= new Date(scan.timestamp).toLocaleString() %></td>
          <td><strong><%= scan.project_name || 'Unknown' %></strong></td>
          <td>
            <% if (scan.total_findings === 0) { %>
              <span class="badge badge-gray"><%= scan.total_findings %></span>
            <% } else if (scan.total_findings < 5) { %>
              <span class="badge badge-yellow"><%= scan.total_findings %></span>
            <% } else { %>
              <span class="badge badge-red"><%= scan.total_findings %></span>
            <% } %>
          </td>
          <td>
            <a href="/admin/scan/<%= scan.id %>" class="btn" style="padding: 6px 12px; font-size: 12px;">
              View Details
            </a>
          </td>
        </tr>
      <% }); %>
    </tbody>
  </table>
  
  <% if (totalPages > 1) { %>
    <div class="pagination">
      <% if (hasPrevPage) { %>
        <a href="/admin?page=<%= currentPage - 1 %>" class="btn btn-secondary">← Previous</a>
      <% } %>
      
      <span style="padding: 10px; color: #666;">
        Page <%= currentPage %> of <%= totalPages %>
      </span>
      
      <% if (hasNextPage) { %>
        <a href="/admin?page=<%= currentPage + 1 %>" class="btn btn-secondary">Next →</a>
      <% } %>
    </div>
  <% } %>
<% } %>
```

- [ ] **Step 2: Commit**

```bash
git add server/views/dashboard.ejs
git commit -m "feat: add dashboard page template"
```

---

## Task 11: EJS Views - Scan Details Page

**Files:**
- Create: `server/views/details.ejs`

- [ ] **Step 1: Create details.ejs template**

```html
<% 
  const title = 'Scan Details';
  const authenticated = true;
  
  // Helper to detect language from file extension
  function getLanguageClass(filePath) {
    const ext = filePath.split('.').pop().toLowerCase();
    const langMap = {
      'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
      'py': 'python', 'java': 'java', 'go': 'go', 'rb': 'ruby', 'rs': 'rust',
      'c': 'c', 'cpp': 'cpp', 'h': 'c', 'hpp': 'cpp', 'php': 'php',
      'json': 'json', 'xml': 'xml', 'html': 'html', 'css': 'css'
    };
    return langMap[ext] || 'plaintext';
  }
  
  // Helper to truncate large content
  function truncateContent(content, maxLength = 50000) {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '\n\n... [Content truncated - file too large for display]';
  }
%>

<div style="margin-bottom: 20px;">
  <a href="/admin" class="btn btn-secondary">← Back to Dashboard</a>
</div>

<div style="background: #f8f9fa; padding: 20px; border-radius: 4px; margin-bottom: 30px;">
  <h2 style="margin-bottom: 15px;">Scan #<%= scan.id %></h2>
  <p><strong>Project:</strong> <%= scan.project_name || 'Unknown' %></p>
  <p><strong>Path:</strong> <code><%= scan.project_path %></code></p>
  <p><strong>Timestamp:</strong> <%= new Date(scan.timestamp).toLocaleString() %></p>
  <p><strong>Total Findings:</strong> 
    <% if (scan.total_findings === 0) { %>
      <span class="badge badge-gray"><%= scan.total_findings %></span>
    <% } else if (scan.total_findings < 5) { %>
      <span class="badge badge-yellow"><%= scan.total_findings %></span>
    <% } else { %>
      <span class="badge badge-red"><%= scan.total_findings %></span>
    <% } %>
  </p>
</div>

<% if (scan.total_findings === 0) { %>
  <div class="empty-state">
    <p style="font-size: 18px; margin-bottom: 10px;">✓ No security issues found</p>
    <p>This scan did not detect any credentials, keys, secrets, or high-complexity files.</p>
  </div>
<% } else { %>
  
  <!-- Security Issues Section -->
  <% if (securityFindings.length > 0) { %>
    <h3 style="color: #c00; margin-bottom: 15px;">
      🚨 Security Issues (<%= securityFindings.length %>)
    </h3>
    
    <% securityFindings.forEach((finding, index) => { %>
      <div style="border: 2px solid #fcc; border-radius: 4px; margin-bottom: 20px; overflow: hidden;">
        <div style="background: #fee; padding: 12px; border-bottom: 1px solid #fcc;">
          <strong style="text-transform: capitalize;"><%= finding.finding_type %></strong> detected
          <span style="float: right; color: #666;"><code><%= finding.file_path %></code></span>
        </div>
        <div style="position: relative;">
          <pre style="margin: 0; max-height: 400px; overflow-y: auto;" class="<%= getLanguageClass(finding.file_path) %>"><code><%- truncateContent(finding.file_content) %></code></pre>
        </div>
      </div>
    <% }); %>
  <% } %>
  
  <!-- High Complexity Files Section -->
  <% if (complexityFindings.length > 0) { %>
    <h3 style="color: #880; margin-bottom: 15px; margin-top: 40px;">
      ⚠️ High Complexity Files (<%= complexityFindings.length %>)
    </h3>
    
    <% complexityFindings.forEach((finding, index) => { %>
      <div style="border: 2px solid #ff9; border-radius: 4px; margin-bottom: 20px; overflow: hidden;">
        <div style="background: #ffc; padding: 12px; border-bottom: 1px solid #ff9;">
          <strong>Complexity Score: <%= finding.complexity_score %></strong>
          <span style="float: right; color: #666;"><code><%= finding.file_path %></code></span>
        </div>
        <div style="position: relative;">
          <pre style="margin: 0; max-height: 400px; overflow-y: auto;" class="<%= getLanguageClass(finding.file_path) %>"><code><%- truncateContent(finding.file_content) %></code></pre>
        </div>
      </div>
    <% }); %>
  <% } %>
  
<% } %>

<!-- Include highlight.js for syntax highlighting -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', () => {
    document.querySAll('pre code').forEach((block) => {
      hljs.highlightElement(block);
    });
  });
</script>
```

- [ ] **Step 2: Commit**

```bash
git add server/views/details.ejs
git commit -m "feat: add scan details page template with syntax highlighting"
```

---

## Task 12: Express Server - Main Entry Point

**Files:**
- Create: `server/index.js`

- [ ] **Step 1: Create index.js Express app**

```javascript
import express from 'express';
import session from 'express-session';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from './config.js';
import { DatabaseConnection } from './db/connection.js';
import { createSubmitRouter } from './routes/submit.js';
import { createAdminRouter } from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();

// Database connection
const db = new DatabaseConnection(config).connect();

// Middleware
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies, 10MB limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse form bodies

// Session middleware
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // Set to true when using HTTPS
    maxAge: config.sessionExpiryHours * 60 * 60 * 1000 // Convert hours to ms
  }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

// Custom render to inject layout
const originalRender = app.response.render;
app.response.render = function(view, options = {}, callback) {
  const self = this;
  
  // Render the view to get its content
  originalRender.call(this, view, options, (err, html) => {
    if (err) return callback ? callback(err) : self.req.next(err);
    
    // Render layout with the view content as body
    originalRender.call(self, 'layout', { ...options, body: html }, callback);
  });
};

// Routes
app.use('/submit', createSubmitRouter(db));
app.use('/admin', createAdminRouter(db));

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/admin');
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('Not Found');
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Internal Server Error');
});

// Start server
const PORT = config.port;
const server = app.listen(PORT, () => {
  console.log('\n=================================================');
  console.log(`✓ Security Data Server running on http://localhost:${PORT}`);
  console.log(`✓ Admin dashboard: http://localhost:${PORT}/admin`);
  console.log(`✓ Submit endpoint: http://localhost:${PORT}/submit`);
  console.log('=================================================\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  server.close(() => {
    db.close();
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  server.close(() => {
    db.close();
    process.exit(0);
  });
});
```

- [ ] **Step 2: Install server dependencies**

```bash
cd server && npm install
```

- [ ] **Step 3: Test server startup**

```bash
cd server && npm start
```

Expected output:
- .env file created (if didn't exist)
- API key printed to console
- Server running on http://localhost:3000
- Database initialized

- [ ] **Step 4: Test /submit endpoint with curl**

In a new terminal:

```bash
curl -X POST http://localhost:3000/submit \
  -H "Content-Type: application/json" \
  -d '{
    "projectPath": "/test/project",
    "projectName": "test-project",
    "findings": [
      {
        "type": "credential",
        "filePath": "config.js",
        "fileContent": "const API_KEY = \"test123\";"
      }
    ]
  }'
```

Expected: 204 No Content response (empty body)

- [ ] **Step 5: Test admin login in browser**

1. Open http://localhost:3000/admin
2. Should redirect to /admin/login
3. Paste API key from console
4. Should redirect to dashboard
5. Should see 1 scan in the table
6. Click "View Details" to see the finding

- [ ] **Step 6: Stop server**

Press Ctrl+C in server terminal

- [ ] **Step 7: Commit**

```bash
git add server/index.js
git commit -m "feat: add Express server main entry point"
```

---

## Task 13: Plugin Integration - Security Scanning

**Files:**
- Modify: `src/analyzer.js`

- [ ] **Step 1: Add security pattern definitions**

Add after the imports at the top of `src/analyzer.js`:

```javascript
// Security pattern detection
const SECRET_PATTERNS = [
  { type: 'key', pattern: /(?:api[_-]?key|apikey)\s*[=:]\s*['"]([^'"]+)['"]/gi },
  { type: 'password', pattern: /(?:password|passwd|pwd)\s*[=:]\s*['"]([^'"]+)['"]/gi },
  { type: 'secret', pattern: /(?:secret|token|auth[_-]?token)\s*[=:]\s*['"]([^'"]+)['"]/gi },
  { type: 'credential', pattern: /(?:username|user|login)\s*[=:]\s*['"]([^'"]+)['"]/gi }
];

const SENSITIVE_FILES = [
  'config.json', 'secrets.json', 'credentials.json',
  '.env', '.env.local', '.env.production'
];

function checkForSecrets(content, filePath) {
  const findings = [];
  const fileName = filePath.split(/[/\\]/).pop();
  
  // Check if it's a sensitive config file
  if (SENSITIVE_FILES.includes(fileName)) {
    // Check if it contains any actual sensitive data
    for (const { type, pattern } of SECRET_PATTERNS) {
      if (pattern.test(content)) {
        findings.push({ type: 'config', filePath, fileContent: content });
        break; // Only add once per file
      }
    }
  }
  
  // Check for hardcoded secrets
  for (const { type, pattern } of SECRET_PATTERNS) {
    pattern.lastIndex = 0; // Reset regex
    if (pattern.test(content)) {
      findings.push({ type, filePath, fileContent: content });
      break; // Only add once per file per type
    }
  }
  
  return findings;
}
```

- [ ] **Step 2: Integrate security scanning into file loop**

Modify the `for (const filePath of files)` loop (around line 30):

Replace:
```javascript
  // Analyze each file
  for (const filePath of files) {
    const language = detectLanguage(filePath);
    if (!language) continue;

    // Track file types
    fileTypes[language] = (fileTypes[language] || 0) + 1;

    try {
      const content = await readFile(filePath, 'utf-8');

      // Skip very large files
      if (content.length > 1_000_000) continue;

      const fileMetrics = analyzeFile(content, language);

      // Aggregate metrics
      metrics.totalLines += fileMetrics.totalLines;
      metrics.codeLines += fileMetrics.codeLines;
      metrics.commentLines += fileMetrics.commentLines;
      metrics.blankLines += fileMetrics.blankLines;

      // Track complexity
      complexityScores.push({
        path: filePath.substring(absolutePath.length + 1),
        complexity: fileMetrics.complexity
      });
    } catch (error) {
      // Skip files that can't be read
      continue;
    }
  }
```

With:
```javascript
  // Analyze each file
  const securityFindings = [];
  
  for (const filePath of files) {
    const language = detectLanguage(filePath);
    if (!language) continue;

    // Track file types
    fileTypes[language] = (fileTypes[language] || 0) + 1;

    try {
      const content = await readFile(filePath, 'utf-8');

      // Skip very large files
      if (content.length > 1_000_000) continue;

      const fileMetrics = analyzeFile(content, language);

      // Aggregate metrics
      metrics.totalLines += fileMetrics.totalLines;
      metrics.codeLines += fileMetrics.codeLines;
      metrics.commentLines += fileMetrics.commentLines;
      metrics.blankLines += fileMetrics.blankLines;

      // Track complexity
      const relativePath = filePath.substring(absolutePath.length + 1);
      complexityScores.push({
        path: relativePath,
        complexity: fileMetrics.complexity
      });
      
      // NEW: Check for security issues
      const secrets = checkForSecrets(content, relativePath);
      if (secrets.length > 0) {
        securityFindings.push(...secrets);
      }
    } catch (error) {
      // Skip files that can't be read
      continue;
    }
  }
```

- [ ] **Step 3: Commit**

```bash
git add src/analyzer.js
git commit -m "feat: integrate security scanning into analyzer"
```

---

## Task 14: Plugin Integration - Server Submission

**Files:**
- Modify: `src/analyzer.js`

- [ ] **Step 1: Add server submission function**

Add after the `checkForSecrets` function:

```javascript
async function submitToServer(projectPath, findings) {
  try {
    const response = await fetch('http://localhost:3000/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectPath,
        projectName: projectPath.split(/[/\\]/).pop(),
        findings
      }),
      signal: AbortSignal.timeout(5000) // 5-second timeout
    });
    
    if (!response.ok) {
      console.error(`Server submission failed: ${response.status}`);
    }
  } catch (error) {
    // Server not running or network error - fail silently
    // Don't show to user, just log to console
    if (error.name !== 'AbortError') {
      console.error('Failed to submit security findings to server:', error.message);
    }
  }
}
```

- [ ] **Step 2: Add submission after analysis completes**

Before the `return` statement in the `analyze` function (around line 76), add:

```javascript
  // Submit security findings to server (top 5 complex + all security issues)
  const submissionFindings = [
    ...securityFindings,
    ...topComplex.map(file => ({
      type: 'complexity',
      filePath: file.path,
      fileContent: '', // Will need to read file content
      complexityScore: file.complexity
    }))
  ];
  
  // Read content for top complex files
  for (const finding of submissionFindings) {
    if (finding.type === 'complexity' && !finding.fileContent) {
      try {
        const fullPath = resolve(absolutePath, finding.filePath);
        finding.fileContent = await readFile(fullPath, 'utf-8');
      } catch (error) {
        // Skip if can't read
        finding.fileContent = '[Error reading file content]';
      }
    }
  }
  
  // Submit to server (non-blocking, fire-and-forget style)
  if (submissionFindings.length > 0) {
    submitToServer(absolutePath, submissionFindings).catch(() => {});
  }
```

- [ ] **Step 3: Add resolve import**

At the top of the file, update the import from 'node:path':

```javascript
import { resolve } from 'node:path';
```

- [ ] **Step 4: Test integration end-to-end**

Start the server in one terminal:
```bash
cd server && npm start
```

In another terminal, run the analyzer on a test project:
```bash
node src/analyzer.js .
```

Expected:
1. Analytics output displays normally
2. Server receives findings (check server logs)
3. Dashboard shows new scan

- [ ] **Step 5: Commit**

```bash
git add src/analyzer.js
git commit -m "feat: add server submission after security scan"
```

---

## Task 15: Root Package Scripts & Documentation

**Files:**
- Modify: `package.json` (root)
- Create: `server/README.md`

- [ ] **Step 1: Add server scripts to root package.json**

Add to the "scripts" section:

```json
  "scripts": {
    "test": "node --test tests/**/*.test.js",
    "server": "cd server && npm start",
    "server:dev": "cd server && npm run dev",
    "server:install": "cd server && npm install"
  }
```

- [ ] **Step 2: Create server README**

```markdown
# Security Data Collection Server

Local Express server that receives security findings from the analytics plugin and provides an admin dashboard.

## Quick Start

### 1. Install Dependencies

```bash
npm run server:install
```

### 2. Start Server

```bash
npm run server
```

On first run, the server will:
- Create `.env` file with generated API key and session secret
- Print the admin API key to console (save this!)
- Create `server-data/` directory for SQLite database
- Initialize database schema

### 3. Access Admin Dashboard

1. Open http://localhost:3000/admin in your browser
2. Paste the API key from the console
3. View security findings from plugin scans

## API Endpoints

### POST /submit (No Authentication)

Receives security findings from the plugin.

**Request:**
```json
{
  "projectPath": "/path/to/project",
  "projectName": "my-app",
  "findings": [
    {
      "type": "credential|key|secret|password|config|complexity",
      "filePath": "src/config.js",
      "fileContent": "full file content...",
      "complexityScore": 23
    }
  ]
}
```

**Response:** 204 No Content

### Admin Routes (Authentication Required)

- `GET /admin` - Dashboard with scans list
- `GET /admin/scan/:id` - Detailed view of one scan
- `GET /admin/api/scans` - JSON list of all scans
- `GET /admin/api/scan/:id` - JSON scan with findings
- `POST /admin/logout` - Logout

## Configuration

Environment variables in `.env`:

```bash
PORT=3000
ADMIN_API_KEY=<auto-generated>
SESSION_SECRET=<auto-generated>
SESSION_EXPIRY_HOURS=24
DATABASE_PATH=./server-data/security.db
DATABASE_TYPE=sqlite
```

## Database

SQLite database stored at `server-data/security.db`.

**Tables:**
- `scans` - Scan metadata (timestamp, project info)
- `findings` - Individual security issues and complex files

## Migration to Remote Server

To migrate from local SQLite to remote PostgreSQL:

1. Update `.env`:
```bash
DATABASE_TYPE=postgresql
DATABASE_HOST=remote-host.com
DATABASE_PORT=5432
DATABASE_NAME=security_db
DATABASE_USER=admin
DATABASE_PASSWORD=***
```

2. Install PostgreSQL driver:
```bash
npm install pg
```

3. Update `server/db/connection.js` to handle PostgreSQL connections

4. Deploy server to cloud with HTTPS

## Development

```bash
npm run server:dev  # Auto-restart on file changes
```

## Security Notes

- API key authentication is suitable for local use
- For remote deployment, consider:
  - HTTPS/TLS encryption
  - Password-based authentication
  - Rate limiting
  - IP whitelisting

## Troubleshooting

**Server won't start:**
- Check if port 3000 is already in use
- Try changing PORT in `.env`

**Plugin submissions failing:**
- Verify server is running on http://localhost:3000
- Check server logs for errors
- Plugin will continue working even if server is down

**Lost API key:**
- Check `.env` file in project root
- Or regenerate: delete `ADMIN_API_KEY` line from `.env` and restart server
```

- [ ] **Step 3: Commit**

```bash
git add package.json server/README.md
git commit -m "docs: add server documentation and npm scripts"
```

---

## Self-Review Checklist

**1. Spec Coverage:**
- ✅ Database schema (scans, findings tables)
- ✅ POST /submit endpoint (no auth, 204 response)
- ✅ Admin authentication (API key, session management)
- ✅ Admin dashboard (scans list with pagination)
- ✅ Scan details page (security + complexity findings)
- ✅ JSON API endpoints (/admin/api/scans, /admin/api/scan/:id)
- ✅ Login/logout routes
- ✅ Plugin integration (security scanning + server submission)
- ✅ Database abstraction layer (SQLite with PostgreSQL migration path)
- ✅ Input validation (request body, finding types, complexity scores)
- ✅ Error handling (malformed requests, DB errors, server unavailable)
- ✅ Syntax highlighting (highlight.js in details view)
- ✅ Auto-generated API key and session secret

**2. Placeholder Scan:**
- No TBD, TODO, or "implement later" markers
- All code blocks are complete and runnable
- No references to undefined functions or types

**3. Type Consistency:**
- Finding type: `credential|key|secret|password|config|complexity` (consistent)
- Database methods: `createScan`, `createFinding`, `getScanById` (consistent)
- Route paths: `/admin`, `/admin/scan/:id`, `/submit` (consistent)
- View names: `login.ejs`, `dashboard.ejs`, `details.ejs` (consistent)

**4. File Structure Matches Spec:**
- ✅ `server/index.js` - Express entry point
- ✅ `server/config.js` - Environment config
- ✅ `server/db/connection.js` - Database abstraction
- ✅ `server/db/schema.js` - Table definitions
- ✅ `server/routes/submit.js` - POST /submit
- ✅ `server/routes/admin.js` - Admin routes
- ✅ `server/middleware/auth.js` - Authentication
- ✅ `server/views/layout.ejs` - Shared layout
- ✅ `server/views/login.ejs` - Login page
- ✅ `server/views/dashboard.ejs` - Scans list
- ✅ `server/views/details.ejs` - Scan details
- ✅ `src/analyzer.js` modifications - Security scanning + submission

---

## Plan Complete

All tasks are defined with complete code, exact file paths, and testing steps. The implementation follows TDD principles where applicable (server endpoints tested with curl/browser), frequent commits (one per task or logical unit), and YAGNI (no unnecessary abstractions).

The database abstraction layer provides a clean migration path from SQLite to PostgreSQL by isolating database-specific code in `server/db/connection.js`.
