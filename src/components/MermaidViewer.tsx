import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Code, 
  Eye, 
  Copy, 
  Download, 
  Sparkles, 
  AlertCircle 
} from 'lucide-react';
import { toast } from '../core/toast/toastManager';

interface MermaidViewerProps {
  chart: string;
  title?: string;
  theme?: 'dark' | 'light' | string;
}

export const MermaidViewer: React.FC<MermaidViewerProps> = ({
  chart,
  title = 'Entity Relationship Diagram (ERD)',
  theme = 'dark'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');
  const [zoom, setZoom] = useState<number>(1);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Pan state
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'light' ? 'default' : 'dark',
      securityLevel: 'loose',
      er: {
        useMaxWidth: false,
        layoutDirection: 'TB',
        minEntityWidth: 140,
        minEntityHeight: 75,
        entityPadding: 15,
        stroke: '#6366f1',
        fill: theme === 'light' ? '#f8fafc' : '#1e1b4b',
        fontSize: 12
      }
    });

    let isMounted = true;
    const renderChart = async () => {
      if (!chart || !chart.trim()) {
        setSvgContent('');
        setRenderError(null);
        return;
      }

      try {
        setRenderError(null);
        const uniqueId = `mermaid_erd_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const { svg } = await mermaid.render(uniqueId, chart);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err: any) {
        console.error('Mermaid render error:', err);
        if (isMounted) {
          setRenderError(err.message || 'Failed to render Mermaid diagram');
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart, theme]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(chart);
    setIsCopied(true);
    toast.success('Mermaid ERD Code copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadSvg = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bubble_database_erd_${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('ERD SVG diagram exported!');
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewMode !== 'visual') return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || viewMode !== 'visual') return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResetZoomPan = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '720px', maxHeight: '80vh', border: '1px solid var(--border-subtle)' }}>
      {/* Header Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 18px',
        background: 'var(--bg-surface-elevated)',
        borderBottom: '1px solid var(--border-subtle)',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={18} color="var(--accent-cyan)" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-primary)' }}>
              {title}
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              Visual schema relations & foreign keys graph mapping
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-input)', padding: '2px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => setViewMode('visual')}
              className={`btn btn-sm ${viewMode === 'visual' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.725rem', padding: '3px 10px', height: '26px' }}
            >
              <Eye size={12} />
              <span>Interactive Visual</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('code')}
              className={`btn btn-sm ${viewMode === 'code' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.725rem', padding: '3px 10px', height: '26px' }}
            >
              <Code size={12} />
              <span>Mermaid Code</span>
            </button>
          </div>

          {viewMode === 'visual' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-input)', padding: '2px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setZoom(prev => Math.min(prev + 0.15, 3))}
                className="btn btn-secondary btn-sm"
                style={{ padding: '3px 8px', height: '26px' }}
                title="Zoom In"
              >
                <ZoomIn size={13} />
              </button>
              <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', minWidth: '42px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.25))}
                className="btn btn-secondary btn-sm"
                style={{ padding: '3px 8px', height: '26px' }}
                title="Zoom Out"
              >
                <ZoomOut size={13} />
              </button>
              <button
                type="button"
                onClick={handleResetZoomPan}
                className="btn btn-secondary btn-sm"
                style={{ padding: '3px 8px', height: '26px' }}
                title="Reset Zoom & Position"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleCopyCode}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.725rem', padding: '3px 10px', height: '28px' }}
            title="Copy Mermaid Code to Clipboard"
          >
            <Copy size={12} />
            <span>{isCopied ? 'Copied!' : 'Copy Code'}</span>
          </button>

          {viewMode === 'visual' && svgContent && (
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.725rem', padding: '3px 10px', height: '28px' }}
              title="Download SVG Diagram"
            >
              <Download size={12} />
              <span>Export SVG</span>
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div 
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--bg-app)',
          cursor: viewMode === 'visual' ? (isDragging ? 'grabbing' : 'grab') : 'default'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {viewMode === 'visual' ? (
          renderError ? (
            <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', textAlign: 'center' }}>
              <AlertCircle size={32} color="var(--accent-rose)" />
              <div style={{ fontWeight: 700, color: 'var(--accent-rose)' }}>Mermaid Rendering Warning</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '500px' }}>
                Some custom field names contain non-standard symbols. You can still inspect and copy the raw Mermaid code.
              </div>
              <button onClick={() => setViewMode('code')} className="btn btn-secondary btn-sm">
                <Code size={13} />
                <span>Switch to Mermaid Code View</span>
              </button>
            </div>
          ) : svgContent ? (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.1s ease',
                userSelect: 'none'
              }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Loading visual database graph...
            </div>
          )
        ) : (
          <div style={{ width: '100%', height: '100%', overflow: 'auto', padding: '16px' }}>
            <pre style={{
              margin: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.825rem',
              color: '#a5b4fc',
              lineHeight: 1.5
            }}>
              {chart}
            </pre>
          </div>
        )}

        {/* Pan Hint Overlay */}
        {viewMode === 'visual' && !renderError && svgContent && (
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '14px',
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.7rem',
            color: 'var(--text-secondary)',
            pointerEvents: 'none',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            🖱️ Click and drag canvas to Pan • Use zoom controls on top right
          </div>
        )}
      </div>
    </div>
  );
};
