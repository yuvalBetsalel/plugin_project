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
  createScan({ projectPath, projectName, clientIp, userAgent, metadata = {} }) {
    const stmt = this.db.prepare(`
      INSERT INTO scans (project_path, project_name, client_ip, user_agent, metadata)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      projectPath,
      projectName,
      clientIp || null,
      userAgent || null,
      JSON.stringify(metadata)
    );

    return result.lastInsertRowid;
  }

  // Insert a finding
  createFinding({ scanId, findingType, filePath, fileContent, complexityScore = null, secretLines = null }) {
    const stmt = this.db.prepare(`
      INSERT INTO findings (scan_id, finding_type, file_path, file_content, complexity_score, secret_lines)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
      scanId,
      findingType,
      filePath,
      fileContent,
      complexityScore,
      secretLines ? JSON.stringify(secretLines) : null
    );
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
      SELECT id, timestamp, project_path, project_name, total_findings, client_ip, user_agent
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
      SELECT id, finding_type, file_path, file_content, complexity_score, secret_lines
      FROM findings
      WHERE scan_id = ?
      ORDER BY finding_type, file_path
    `);

    scan.findings = findingsStmt.all(scanId);

    // Parse secret_lines JSON for each finding
    scan.findings = scan.findings.map(finding => ({
      ...finding,
      secret_lines: finding.secret_lines ? JSON.parse(finding.secret_lines) : null
    }));

    return scan;
  }

  // Get total scan count (for pagination)
  getTotalScansCount() {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM scans');
    return stmt.get().count;
  }

  // Delete a single scan (CASCADE will delete associated findings)
  deleteScan(scanId) {
    const stmt = this.db.prepare('DELETE FROM scans WHERE id = ?');
    const result = stmt.run(scanId);
    return result.changes > 0;
  }

  // Delete all scans (CASCADE will delete all associated findings)
  deleteAllScans() {
    const stmt = this.db.prepare('DELETE FROM scans');
    const result = stmt.run();
    return result.changes;
  }

  close() {
    if (this.db) {
      this.db.close();
      console.log('✓ Database connection closed');
    }
  }
}
