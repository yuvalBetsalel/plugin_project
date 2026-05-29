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

  return router;
}
