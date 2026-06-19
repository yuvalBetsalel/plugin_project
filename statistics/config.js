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

// Ensure .env file exists and has required keys (only for local development)
function ensureEnvFile() {
  // Skip in production - use environment variables instead
  if (process.env.NODE_ENV === 'production') {
    return;
  }

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

// Ensure database directory exists
function ensureDataDirectory() {
  const dbPath = process.env.DATABASE_PATH || './server-data/security.db';
  const dataDir = dirname(dbPath);

  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
    console.log(`✓ Created database directory: ${dataDir}\n`);
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
