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
