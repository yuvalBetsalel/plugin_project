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

  // Skip layout for layout itself to prevent infinite recursion
  if (view === 'layout') {
    return originalRender.call(this, view, options, callback);
  }

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
