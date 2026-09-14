import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Zap, Wifi } from 'lucide-react';
import { ProjectProfile } from '../types';
import { PerformanceProbe, LatencySample, LatencyStats } from '../core/metrics/performanceProbe';
import { PerformanceSparkline } from './PerformanceSparkline';
import { toast } from '../core/toast/toastManager';

interface ApiPerformanceWidgetProps {
  activeProject?: ProjectProfile;
}

export const ApiPerformanceWidget: React.FC<ApiPerformanceWidgetProps> = ({ activeProject }) => {
  const [samples, setSamples] = useState<LatencySample[]>([]);
  const [stats, setStats] = useState<LatencyStats>({
    samplesCount: 0,
    avgMs: 0,
    minMs: 0,
    maxMs: 0,
    p95Ms: 0,
    successRate: 100
  });
  const [isPinging, setIsPinging] = useState(false);

  const loadData = () => {
    if (!activeProject) return;
    const loaded = PerformanceProbe.getSamples(activeProject.id);
    setSamples(loaded);
    setStats(PerformanceProbe.calculateStats(loaded));
  };

  useEffect(() => {
    loadData();
  }, [activeProject?.id]);

  const handlePing = async () => {
    if (!activeProject || isPinging) return;
    setIsPinging(true);
    try {
      const sample = await PerformanceProbe.ping(activeProject);
      loadData();
      if (sample.success) {
        toast.info(`Bubble Data API ping: ${sample.latencyMs}ms (HTTP ${sample.statusCode})`);
      } else {
        toast.warn(`Bubble Data API ping responded with status ${sample.statusCode} (${sample.latencyMs}ms)`);
      }
    } catch (e: any) {
      toast.error(`Ping failed: ${e.message}`);
    } finally {
      setIsPinging(false);
    }
  };

  const lastSample = samples[samples.length - 1];

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="card-header" style={{ paddingBottom: '10px' }}>
        <div>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--accent-cyan)" />
            <span>Bubble API Latency & Health Probe</span>
          </div>
          <div className="card-subtitle">
            Live round-trip response time to {activeProject ? `${activeProject.appId} (${activeProject.environment})` : 'Bubble Data API'}
          </div>
        </div>

        <button
          onClick={handlePing}
          disabled={isPinging || !activeProject}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.75rem', padding: '4px 8px', gap: '4px' }}
          title="Run live ping now"
        >
          <RefreshCw size={12} className={isPinging ? 'spin' : ''} />
          <span>{isPinging ? 'Pinging...' : 'Ping Now'}</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
        <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>LATEST PING</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: lastSample?.latencyMs ? (lastSample.latencyMs < 300 ? 'var(--accent-emerald)' : 'var(--accent-amber)') : 'var(--text-primary)' }}>
            {lastSample ? `${lastSample.latencyMs} ms` : '—'}
          </div>
        </div>

        <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>AVERAGE (P50)</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>
            {stats.samplesCount > 0 ? `${stats.avgMs} ms` : '—'}
          </div>
        </div>

        <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>P95 TAIL LATENCY</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
            {stats.samplesCount > 0 ? `${stats.p95Ms} ms` : '—'}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <PerformanceSparkline samples={samples} stats={stats} height={45} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Wifi size={11} color="var(--accent-emerald)" />
          <span>Success Rate: <strong style={{ color: 'var(--text-primary)' }}>{stats.successRate}%</strong></span>
        </div>
        <span>{stats.samplesCount} sample(s) collected</span>
      </div>
    </div>
  );
};
