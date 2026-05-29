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
      secret_lines TEXT,
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
