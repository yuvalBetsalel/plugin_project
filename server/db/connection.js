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
