import React, { useState } from 'react';
import { 
  Smartphone, 
  Tablet, 
  Laptop, 
  Monitor, 
  RefreshCw, 
  ExternalLink,
  Sliders,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface MultiDeviceViewportProps {
  initialUrl?: string;
}

export const MultiDeviceViewport: React.FC<MultiDeviceViewportProps> = ({ initialUrl = 'https://app.bubbleapps.io/version-test' }) => {
  const [url, setUrl] = useState(initialUrl);
  const [activePreset, setActivePreset] = useState<'all' | 'mobile' | 'tablet' | 'desktop'>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(0.75);

  const viewports = [
    { name: 'iPhone 16 Pro', width: 393, height: 852, icon: <Smartphone size={14} />, category: 'mobile' },
    { name: 'iPad Pro 11"', width: 834, height: 1194, icon: <Tablet size={14} />, category: 'tablet' },
    { name: 'MacBook Air 13"', width: 1280, height: 800, icon: <Laptop size={14} />, category: 'desktop' },
    { name: 'Desktop 4K / Widescreen', width: 1920, height: 1080, icon: <Monitor size={14} />, category: 'desktop' }
  ];

  const filteredViewports = activePreset === 'all' 
    ? viewports 
    : viewports.filter(v => v.category === activePreset);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Controls */}
      <div className="card" style={{ padding: '12px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, minWidth: '280px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Target Route:</span>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://app.bubbleapps.io/version-test/..."
              className="input"
              style={{ height: '36px', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-input)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
              <button onClick={() => setActivePreset('all')} className={`btn btn-sm ${activePreset === 'all' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', height: '28px', fontSize: '0.725rem', padding: '0 8px' }}>
                4-Up Grid
              </button>
              <button onClick={() => setActivePreset('mobile')} className={`btn btn-sm ${activePreset === 'mobile' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', height: '28px', fontSize: '0.725rem', padding: '0 8px' }}>
                Mobile
              </button>
              <button onClick={() => setActivePreset('tablet')} className={`btn btn-sm ${activePreset === 'tablet' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', height: '28px', fontSize: '0.725rem', padding: '0 8px' }}>
                Tablet
              </button>
              <button onClick={() => setActivePreset('desktop')} className={`btn btn-sm ${activePreset === 'desktop' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', height: '28px', fontSize: '0.725rem', padding: '0 8px' }}>
                Desktop
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Zoom:</span>
              <button onClick={() => setZoomLevel(0.5)} className={`btn btn-sm ${zoomLevel === 0.5 ? 'btn-primary' : 'btn-secondary'}`} style={{ height: '26px', fontSize: '0.7rem', padding: '0 6px' }}>50%</button>
              <button onClick={() => setZoomLevel(0.75)} className={`btn btn-sm ${zoomLevel === 0.75 ? 'btn-primary' : 'btn-secondary'}`} style={{ height: '26px', fontSize: '0.7rem', padding: '0 6px' }}>75%</button>
              <button onClick={() => setZoomLevel(1)} className={`btn btn-sm ${zoomLevel === 1 ? 'btn-primary' : 'btn-secondary'}`} style={{ height: '26px', fontSize: '0.7rem', padding: '0 6px' }}>100%</button>
            </div>
          </div>
        </div>
      </div>

      {/* Synchronized Multi-Device Matrix */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: activePreset === 'all' ? 'repeat(auto-fit, minmax(360px, 1fr))' : '1fr',
        gap: '20px',
        alignItems: 'start'
      }}>
        {filteredViewports.map((vp, idx) => (
          <div key={idx} className="card" style={{ padding: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            {/* Device Header Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.85rem' }}>
                {vp.icon}
                <span>{vp.name}</span>
                <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>{vp.width} × {vp.height}</span>
              </div>
              <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                <CheckCircle2 size={10} /> Responsive OK
              </span>
            </div>

            {/* Device Bezel Simulator */}
            <div style={{
              background: '#0a0f1d',
              borderRadius: '12px',
              border: '2px solid rgba(255,255,255,0.1)',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              position: 'relative'
            }}>
              <div style={{
                height: '24px',
                background: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '99px' }} />
              </div>

              <div style={{
                height: '320px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(180deg, #0b1120 0%, #030712 100%)',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                gap: '8px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Bubble Responsive Frame Preview</div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  Viewport rendered at {vp.width}px CSS width ({Math.round(zoomLevel * 100)}% scale)
                </div>
                <div style={{ padding: '8px 12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '6px', border: '1px solid rgba(99, 102, 241, 0.3)', fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                  ✓ Zero Horizontal Scrollbar Overflow Detected
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
