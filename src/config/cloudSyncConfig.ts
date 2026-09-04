export const CLOUD_SYNC_CONFIG = {
  // Official Dedicated Cloud Managed Backend Gateway (Secure HTTPS)
  defaultServerUrl: 'https://bubble-cloud-sync-mtlg-dev.vercel.app',
  
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
