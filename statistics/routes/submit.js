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

      // Get client IP — x-forwarded-for contains a comma-separated list of IPs
      // added by each proxy in order; the first one is the original client IP
      const forwarded = req.headers['x-forwarded-for'];
      let clientIp = forwarded
        ? forwarded.split(',')[0].trim()
        : req.socket.remoteAddress;

      // Clean up IPv4-mapped IPv6 addresses (::ffff:127.0.0.1 -> 127.0.0.1)
      if (clientIp && clientIp.startsWith('::ffff:')) {
        clientIp = clientIp.substring(7);
      }

      const userAgent = req.headers['user-agent'];

      // Create scan record
      const scanId = db.createScan({
        projectPath,
        projectName: projectName || projectPath.split(/[/\\]/).pop(),
        clientIp,
        userAgent,
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
          complexityScore: finding.complexityScore || null,
          secretLines: finding.secretLines || null
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
