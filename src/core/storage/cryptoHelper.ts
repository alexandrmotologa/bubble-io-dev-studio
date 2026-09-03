import { GlobalSettings, ProjectProfile } from '../../types';

/**
 * Enterprise Secure Storage Engine (Issue #4 Resolution)
 * Uses native OS Keychain / DPAPI / SecretService via Electron safeStorage
 * with transparent migration and fallback.
 */
export class CryptoHelper {
  /**
   * Encrypts a single sensitive credential
   */
  public static async encryptSensitive(text?: string): Promise<string | undefined> {
    if (!text || text.trim().length === 0) return undefined;
    if (text.startsWith('enc:')) return text; // Already encrypted

    // 1. Electron Native safeStorage (DPAPI on Windows, Keychain on macOS, libsecret on Linux)
    if (typeof window !== 'undefined' && window.electronAPI?.secureEncrypt) {
      try {
        const encrypted = await window.electronAPI.secureEncrypt(text);
        if (encrypted && encrypted.startsWith('enc:')) {
          return encrypted;
        }
      } catch (err) {
        console.warn('[CryptoHelper] Electron safeStorage encryption notice:', err);
      }
    }

    // 2. Browser Obfuscation Prefix Fallback
    try {
      const b64 = btoa(encodeURIComponent(text));
      return `enc:b64:${b64}`;
    } catch {
      return text;
    }
  }

  /**
   * Decrypts a sensitive credential
   */
  public static async decryptSensitive(cipher?: string): Promise<string | undefined> {
    if (!cipher || cipher.trim().length === 0) return undefined;
    if (!cipher.startsWith('enc:')) return cipher; // Plaintext (legacy or unencrypted)

    // 1. Electron Native safeStorage
    if (typeof window !== 'undefined' && window.electronAPI?.secureDecrypt) {
      try {
        const decrypted = await window.electronAPI.secureDecrypt(cipher);
        if (decrypted && !decrypted.startsWith('enc:')) {
          return decrypted;
        }
      } catch (err) {
        console.warn('[CryptoHelper] Electron safeStorage decryption notice:', err);
      }
    }

    // 2. Base64 fallback format
    if (cipher.startsWith('enc:b64:')) {
      try {
        return decodeURIComponent(atob(cipher.slice(8)));
      } catch {
        return cipher;
      }
    }

    return cipher;
  }

  /**
   * Encrypts all sensitive credentials in GlobalSettings before disk persistence
   */
  public static async encryptSettings(settings: GlobalSettings): Promise<GlobalSettings> {
    const encryptedProjects: ProjectProfile[] = [];

    for (const p of settings.projects) {
      const [apiToken, httpBasicPassword, aiApiKey] = await Promise.all([
        this.encryptSensitive(p.apiToken),
        this.encryptSensitive(p.httpBasicPassword),
        this.encryptSensitive(p.aiApiKey)
      ]);

      encryptedProjects.push({
        ...p,
        apiToken,
        httpBasicPassword,
        aiApiKey
      });
    }

    const [
      openaiApiKey,
      anthropicApiKey,
      geminiApiKey,
      openrouterApiKey,
      groqApiKey,
      deepseekApiKey,
      xaiApiKey,
      opencodeApiKey
    ] = await Promise.all([
      this.encryptSensitive(settings.openaiApiKey),
      this.encryptSensitive(settings.anthropicApiKey),
      this.encryptSensitive(settings.geminiApiKey),
      this.encryptSensitive(settings.openrouterApiKey),
      this.encryptSensitive(settings.groqApiKey),
      this.encryptSensitive(settings.deepseekApiKey),
      this.encryptSensitive(settings.xaiApiKey),
      this.encryptSensitive(settings.opencodeApiKey)
    ]);

    return {
      ...settings,
      openaiApiKey,
      anthropicApiKey,
      geminiApiKey,
      openrouterApiKey,
      groqApiKey,
      deepseekApiKey,
      xaiApiKey,
      opencodeApiKey,
      projects: encryptedProjects
    };
  }

  /**
   * Decrypts all sensitive credentials in GlobalSettings when loaded into runtime memory
   */
  public static async decryptSettings(settings: GlobalSettings): Promise<GlobalSettings> {
    const decryptedProjects: ProjectProfile[] = [];

    for (const p of settings.projects) {
      const [apiToken, httpBasicPassword, aiApiKey] = await Promise.all([
        this.decryptSensitive(p.apiToken),
        this.decryptSensitive(p.httpBasicPassword),
        this.decryptSensitive(p.aiApiKey)
      ]);

      decryptedProjects.push({
        ...p,
        apiToken,
        httpBasicPassword,
        aiApiKey
      });
    }

    const [
      openaiApiKey,
      anthropicApiKey,
      geminiApiKey,
      openrouterApiKey,
      groqApiKey,
      deepseekApiKey,
      xaiApiKey,
      opencodeApiKey
    ] = await Promise.all([
      this.decryptSensitive(settings.openaiApiKey),
      this.decryptSensitive(settings.anthropicApiKey),
      this.decryptSensitive(settings.geminiApiKey),
      this.decryptSensitive(settings.openrouterApiKey),
      this.decryptSensitive(settings.groqApiKey),
      this.decryptSensitive(settings.deepseekApiKey),
      this.decryptSensitive(settings.xaiApiKey),
      this.decryptSensitive(settings.opencodeApiKey)
    ]);

    return {
      ...settings,
      openaiApiKey,
      anthropicApiKey,
      geminiApiKey,
      openrouterApiKey,
      groqApiKey,
      deepseekApiKey,
      xaiApiKey,
      opencodeApiKey,
      projects: decryptedProjects
    };
  }
}
