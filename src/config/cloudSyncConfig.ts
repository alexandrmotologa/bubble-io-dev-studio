export const CLOUD_SYNC_CONFIG = {
  // Official Oracle Cloud Managed Backend Endpoint
  defaultServerUrl: 'http://158.178.147.13:8080',
  
  // Official Collaborator Bot Account to be invited in Bubble Settings > Collaboration
  botEmail: 'bubbledevstudio.bot@gmail.com',

  /**
   * Retrieves active server endpoint (uses official Oracle cloud endpoint by default)
   */
  getActiveServerUrl(): string {
    if (typeof window !== 'undefined') {
      const custom = localStorage.getItem('bds_custom_cloud_url');
      if (custom && custom.trim()) return custom.trim();
    }
    return this.defaultServerUrl;
  },

  /**
   * Optional override for internal development / testing
   */
  setCustomServerUrl(url: string) {
    if (typeof window !== 'undefined') {
      if (url) {
        localStorage.setItem('bds_custom_cloud_url', url.trim());
      } else {
        localStorage.removeItem('bds_custom_cloud_url');
      }
    }
  }
};
