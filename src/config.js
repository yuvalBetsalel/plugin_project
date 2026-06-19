// Configuration for the analyzer plugin
export const config = {
  // Server mode: 'local' or 'remote'
  serverMode: process.env.SERVER_MODE || 'remote',

  // Local server URL (default: http://localhost:3001)
  localServerUrl: process.env.LOCAL_SERVER_URL || 'http://localhost:3001',

  // Remote server URL — defaults to the shared Railway server
  remoteServerUrl: process.env.REMOTE_SERVER_URL || 'https://pluginproject-production.up.railway.app',

  // Get the active server URL based on mode
  getServerUrl() {
    if (this.serverMode === 'remote') {
      return this.remoteServerUrl;
    }
    return this.localServerUrl;
  }
};
