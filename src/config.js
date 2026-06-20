// Configuration for the analyzer plugin
export const config = {
  // Statistics mode: 'local' or 'remote'
  statisticsMode: process.env.SERVER_MODE || 'remote',

  // Local statistics URL (default: http://localhost:3001)
  localStatisticsUrl: process.env.LOCAL_SERVER_URL || 'http://localhost:3001',

  // Remote statistics URL — defaults to the shared Railway server
  remoteStatisticsUrl: process.env.REMOTE_SERVER_URL || 'https://pluginproject-production.up.railway.app',

  // Get the active statistics URL based on mode
  getStatisticsUrl() {
    if (this.statisticsMode === 'remote') {
      return this.remoteStatisticsUrl;
    }
    return this.localStatisticsUrl;
  }
};
