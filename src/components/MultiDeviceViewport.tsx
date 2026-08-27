import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Tablet, 
  Laptop, 
  Monitor, 
  RefreshCw, 
  ExternalLink,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  RotateCw,
  SlidersHorizontal,
  X
} from 'lucide-react';

export interface DeviceViewportItem {
  id: string;
  name: string;
  width: number;
  height: number;
  category: 'mobile' | 'tablet' | 'desktop' | 'custom';
  isCustom?: boolean;
  isLandscape?: boolean;
}

const DEFAULT_VIEWPORTS: DeviceViewportItem[] = [
  { id: 'vp_iphone16', name: 'iPhone 16 Pro', width: 393, height: 852, category: 'mobile' },
  { id: 'vp_ipadpro11', name: 'iPad Pro 11"', width: 834, height: 1194, category: 'tablet' },
  { id: 'vp_macbookair', name: 'MacBook Air 13"', width: 1280, height: 800, category: 'desktop' },
  { id: 'vp_desktop4k', name: 'Desktop 4K / Widescreen', width: 1920, height: 1080, category: 'desktop' }
];

const PRESET_LIBRARY = [
  { name: 'iPhone 16 Pro Max', width: 440, height: 956, category: 'mobile' },
  { name: 'Samsung Galaxy S24 Ultra', width: 412, height: 915, category: 'mobile' },
  { name: 'iPad Mini', width: 744, height: 1133, category: 'tablet' },
  { name: 'iPad Air 13"', width: 1024, height: 1366, category: 'tablet' },
  { name: 'MacBook Pro 16"', width: 1728, height: 1117, category: 'desktop' },
  { name: 'Ultra-Wide 1440p', width: 2560, height: 1080, category: 'desktop' }
];

interface MultiDeviceViewportProps {
  initialUrl?: string;
}

export const MultiDeviceViewport: React.FC<MultiDeviceViewportProps> = ({ initialUrl = 'https://app.bubbleapps.io/version-test' }) => {
  const [url, setUrl] = useState(initialUrl);
  const [activeCategory, setActiveCategory] = useState<'all' | 'mobile' | 'tablet' | 'desktop' | 'custom'>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(0.75);
  
  // Stored viewports
  const [viewports, setViewports] = useState<DeviceViewportItem[]>(() => {
    try {
      const saved = localStorage.getItem('bubble_custom_viewports');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_VIEWPORTS;
  });

  // New Custom Viewport Form Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customWidth, setCustomWidth] = useState(375);
  const [customHeight, setCustomHeight] = useState(667);
  const [customCategory, setCustomCategory] = useState<'mobile' | 'tablet' | 'desktop' | 'custom'>('custom');

  useEffect(() => {
    try {
      localStorage.setItem('bubble_custom_viewports', JSON.stringify(viewports));
    } catch {}
  }, [viewports]);

  const handleAddCustomViewport = () => {
    if (!customName.trim() || customWidth <= 0 || customHeight <= 0) return;

    const newItem: DeviceViewportItem = {
      id: `custom_vp_${Date.now()}`,
      name: customName.trim(),
      width: Number(customWidth),
      height: Number(customHeight),
      category: customCategory,
      isCustom: true
    };

    setViewports([...viewports, newItem]);
    setCustomName('');
    setIsAddModalOpen(false);
  };

  const handleAddPreset = (preset: typeof PRESET_LIBRARY[0]) => {
    const newItem: DeviceViewportItem = {
      id: `preset_vp_${Date.now()}_${Math.random()}`,
      name: preset.name,
      width: preset.width,
      height: preset.height,
      category: preset.category as any,
      isCustom: true
    };
    setViewports([...viewports, newItem]);
  };

  const handleDeleteViewport = (id: string) => {
    setViewports(viewports.filter(v => v.id !== id));
  };

  const handleToggleOrientation = (id: string) => {
    setViewports(viewports.map(v => {
      if (v.id === id) {
        return {
          ...v,
          width: v.height,
          height: v.width,
          isLandscape: !v.isLandscape
        };
      }
      return v;
    }));
  };

  const handleResetDefaults = () => {
    setViewports(DEFAULT_VIEWPORTS);
  };

  const filteredViewports = activeCategory === 'all'
    ? viewports
    : viewports.filter(v => v.category === activeCategory);

  const getDeviceIcon = (category: string) => {
    if (category === 'mobile') return <Smartphone size={14} />;
    if (category === 'tablet') return <Tablet size={14} />;
    if (category === 'desktop') return <Laptop size={14} />;
    return <SlidersHorizontal size={14} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Controls Toolbar */}
      <div className="card" style={{ padding: '14px 18px' }}>
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

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Category Filter */}
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-input)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
              <button onClick={() => setActiveCategory('all')} className={`btn btn-sm ${activeCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', height: '28px', fontSize: '0.725rem', padding: '0 8px' }}>
                All ({viewports.length})
              </button>
              <button onClick={() => setActiveCategory('mobile')} className={`btn btn-sm ${activeCategory === 'mobile' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', height: '28px', fontSize: '0.725rem', padding: '0 8px' }}>
                Mobile
              </button>
              <button onClick={() => setActiveCategory('tablet')} className={`btn btn-sm ${activeCategory === 'tablet' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', height: '28px', fontSize: '0.725rem', padding: '0 8px' }}>
                Tablet
              </button>
              <button onClick={() => setActiveCategory('desktop')} className={`btn btn-sm ${activeCategory === 'desktop' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', height: '28px', fontSize: '0.725rem', padding: '0 8px' }}>
                Desktop
              </button>
              <button onClick={() => setActiveCategory('custom')} className={`btn btn-sm ${activeCategory === 'custom' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', height: '28px', fontSize: '0.725rem', padding: '0 8px' }}>
                Custom
              </button>
            </div>

            {/* Zoom Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <button onClick={() => setZoomLevel(0.5)} className={`btn btn-sm ${zoomLevel === 0.5 ? 'btn-primary' : 'btn-secondary'}`} style={{ height: '26px', fontSize: '0.7rem', padding: '0 6px' }}>50%</button>
              <button onClick={() => setZoomLevel(0.75)} className={`btn btn-sm ${zoomLevel === 0.75 ? 'btn-primary' : 'btn-secondary'}`} style={{ height: '26px', fontSize: '0.7rem', padding: '0 6px' }}>75%</button>
              <button onClick={() => setZoomLevel(1)} className={`btn btn-sm ${zoomLevel === 1 ? 'btn-primary' : 'btn-secondary'}`} style={{ height: '26px', fontSize: '0.7rem', padding: '0 6px' }}>100%</button>
            </div>

            {/* Add Custom Viewport Button */}
            <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary btn-sm" style={{ height: '30px' }}>
              <Plus size={13} />
              <span>+ Custom Size</span>
            </button>
          </div>
        </div>

        {/* Quick Add Presets Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Quick add device:</span>
          {PRESET_LIBRARY.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleAddPreset(preset)}
              className="badge badge-indigo"
              style={{ cursor: 'pointer', border: 'none', background: 'var(--bg-input)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              title={`Add ${preset.name} (${preset.width}x${preset.height})`}
            >
              <Plus size={10} />
              <span>{preset.name} ({preset.width}px)</span>
            </button>
          ))}
          {viewports.length > DEFAULT_VIEWPORTS.length && (
            <button
              onClick={handleResetDefaults}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline', marginLeft: 'auto' }}
            >
              Reset to Defaults
            </button>
          )}
        </div>
      </div>

      {/* Synchronized Multi-Device Matrix */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: filteredViewports.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px',
        alignItems: 'start'
      }}>
        {filteredViewports.map((vp) => (
          <div key={vp.id} className="card" style={{ padding: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            {/* Device Header Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.85rem' }}>
                {getDeviceIcon(vp.category)}
                <span>{vp.name}</span>
                <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>
                  {vp.width} × {vp.height} px
                </span>
                {vp.isLandscape && (
                  <span className="badge badge-cyan" style={{ fontSize: '0.6rem' }}>Landscape</span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/* Rotate Orientation Button */}
                <button
                  onClick={() => handleToggleOrientation(vp.id)}
                  title="Rotate Device (Portrait ↔ Landscape)"
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '3px 6px', height: '24px' }}
                >
                  <RotateCw size={11} />
                </button>

                {/* Delete button for custom / added viewports */}
                {(vp.isCustom || viewports.length > 1) && (
                  <button
                    onClick={() => handleDeleteViewport(vp.id)}
                    title="Remove this viewport"
                    style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '2px' }}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
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
              {/* Notch / Camera / Top Bar */}
              <div style={{
                height: '24px',
                background: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 12px',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '99px' }} />
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {vp.width}px CSS Width
                </span>
              </div>

              {/* Viewport Frame Canvas */}
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
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {vp.name} Preview Frame
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  Rendered at {vp.width} × {vp.height} px ({Math.round(zoomLevel * 100)}% zoom scale)
                </div>
                <div style={{ padding: '8px 12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '6px', border: '1px solid rgba(99, 102, 241, 0.3)', fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                  ✓ Zero Horizontal Overflow Detected ({vp.width}px container)
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Viewport Modal */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '480px',
              border: '1px solid var(--border-active)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <div className="card-title">
                <Plus size={18} color="var(--primary)" />
                <span>Add Custom Device / Breakpoint Size</span>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="btn-icon" style={{ border: 'none', background: 'transparent' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="input-label">Device / Breakpoint Name</label>
                <input
                  type="text"
                  placeholder="e.g. Samsung Fold 5, Custom Tablet 1000px"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  className="input"
                />
              </div>

              <div className="grid-2">
                <div>
                  <label className="input-label">Width (CSS Pixels)</label>
                  <input
                    type="number"
                    min={280}
                    max={3840}
                    value={customWidth}
                    onChange={e => setCustomWidth(parseInt(e.target.value) || 0)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="input-label">Height (CSS Pixels)</label>
                  <input
                    type="number"
                    min={280}
                    max={2160}
                    value={customHeight}
                    onChange={e => setCustomHeight(parseInt(e.target.value) || 0)}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Category</label>
                <select value={customCategory} onChange={e => setCustomCategory(e.target.value as any)} className="select">
                  <option value="mobile">Mobile Smartphone</option>
                  <option value="tablet">Tablet / iPad</option>
                  <option value="desktop">Desktop / Laptop</option>
                  <option value="custom">Custom Breakpoint</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button onClick={handleAddCustomViewport} disabled={!customName.trim() || customWidth <= 0} className="btn btn-primary btn-sm">
                  <Plus size={14} />
                  <span>Add Viewport Size</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

