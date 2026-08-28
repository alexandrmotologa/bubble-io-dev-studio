import packageJson from '../package.json';

/**
 * Single source of truth for the application version.
 * Modify "version" in package.json and it will automatically propagate everywhere.
 */
export const APP_VERSION: string = packageJson.version;
export const APP_EDITION: string = 'Enterprise Suite';
export const APP_NAME: string = 'Bubble Studio';
export const APP_VERSION_LABEL: string = `v${APP_VERSION} • ${APP_EDITION}`;
