import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load .env from project root
dotenv.config({ path: join(projectRoot, '.env') });

// Configuration for the analyzer plugin
export const config = {
  // Server mode: 'local' or 'remote'
  serverMode: process.env.SERVER_MODE || 'local',

  // Local server URL (default: http://localhost:3001)
  localServerUrl: process.env.LOCAL_SERVER_URL || 'http://localhost:3001',

  // Remote server URL (required when SERVER_MODE=remote)
  remoteServerUrl: process.env.REMOTE_SERVER_URL || '',

  // Get the active server URL based on mode
  getServerUrl() {
    if (this.serverMode === 'remote') {
      if (!this.remoteServerUrl) {
        throw new Error('REMOTE_SERVER_URL must be set when SERVER_MODE=remote');
      }
      return this.remoteServerUrl;
    }
    return this.localServerUrl;
  }
};
