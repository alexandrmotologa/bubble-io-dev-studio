import { ProjectProfile } from '../../types';

export interface LatencySample {
  timestamp: number;
  latencyMs: number;
  statusCode: number;
  endpoint: string;
  success: boolean;
}

export interface LatencyStats {
  samplesCount: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  p95Ms: number;
  successRate: number;
}

const MAX_SAMPLES = 50;

export class PerformanceProbe {
  private static getKey(projectId: string): string {
    return `bubble_dev_studio_latency_samples_${projectId}`;
  }

  public static getSamples(projectId: string): LatencySample[] {
    try {
      const raw = localStorage.getItem(this.getKey(projectId));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public static recordSample(projectId: string, sample: LatencySample): void {
    try {
      const current = this.getSamples(projectId);
      current.push(sample);
      const trimmed = current.slice(-MAX_SAMPLES);
      localStorage.setItem(this.getKey(projectId), JSON.stringify(trimmed));
    } catch (e) {
      console.warn('[PerformanceProbe] Failed to persist sample:', e);
    }
  }

  public static clearSamples(projectId: string): void {
    try {
      localStorage.removeItem(this.getKey(projectId));
    } catch (e) {
      console.warn('[PerformanceProbe] Failed to clear samples:', e);
    }
  }

  public static calculateStats(samples: LatencySample[]): LatencyStats {
    if (samples.length === 0) {
      return {
        samplesCount: 0,
        avgMs: 0,
        minMs: 0,
        maxMs: 0,
        p95Ms: 0,
        successRate: 100
      };
    }

    const latencies = samples.map(s => s.latencyMs).sort((a, b) => a - b);
    const sum = latencies.reduce((acc, val) => acc + val, 0);
    const avgMs = Math.round(sum / latencies.length);
    const minMs = latencies[0];
    const maxMs = latencies[latencies.length - 1];

    const p95Index = Math.min(Math.floor(latencies.length * 0.95), latencies.length - 1);
    const p95Ms = latencies[p95Index];

    const successful = samples.filter(s => s.success).length;
    const successRate = Math.round((successful / samples.length) * 100);

    return {
      samplesCount: samples.length,
      avgMs,
      minMs,
      maxMs,
      p95Ms,
      successRate
    };
  }

  /**
   * Pings the Bubble Data API or health endpoint for the project.
   */
  public static async ping(project: ProjectProfile, table: string = 'user'): Promise<LatencySample> {
    const baseDomain = project.customDomain || `${project.appId}.bubbleapps.io`;
    const protocol = baseDomain.startsWith('http') ? '' : 'https://';
    const envPrefix = project.environment && project.environment !== 'version-live' ? `/${project.environment}` : '';
    const url = `${protocol}${baseDomain}${envPrefix}/api/1.1/obj/${table.toLowerCase()}?limit=1`;

    const headers: Record<string, string> = {};
    if (project.apiToken) {
      headers['Authorization'] = `Bearer ${project.apiToken}`;
    }
    if (project.httpBasicUser && project.httpBasicPassword) {
      headers['Authorization'] = `Basic ${btoa(`${project.httpBasicUser}:${project.httpBasicPassword}`)}`;
    }

    const startTime = performance.now();
    let statusCode = 0;
    let success = false;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(8000)
      });
      statusCode = response.status;
      success = response.ok || response.status === 401 || response.status === 403; // Auth response still proves Bubble is reachable
    } catch (e: any) {
      statusCode = 0;
      success = false;
    }

    const latencyMs = Math.round(performance.now() - startTime);

    const sample: LatencySample = {
      timestamp: Date.now(),
      latencyMs,
      statusCode,
      endpoint: url,
      success
    };

    this.recordSample(project.id, sample);
    return sample;
  }
}
