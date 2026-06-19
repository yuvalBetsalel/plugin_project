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
