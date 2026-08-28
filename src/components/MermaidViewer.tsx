import React, { useEffect, useRef, useState, useMemo } from 'react';
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
  AlertCircle,
  Maximize2,
  Minimize2,
  Layers,
  Search,
  Check,
  Move,
  Focus
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
  theme
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');
  const [zoom, setZoom] = useState<number>(1);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active theme detection
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(() => {
    if (theme === 'light' || theme === 'dark') return theme;
    if (typeof document !== 'undefined') {
      const docTheme = document.documentElement.getAttribute('data-theme');
      return docTheme === 'light' ? 'light' : 'dark';
    }
    return 'dark';
  });

  // Listen to global data-theme changes
  useEffect(() => {
    if (theme === 'light' || theme === 'dark') {
      setCurrentTheme(theme);
      return;
    }

    const checkTheme = () => {
      const docTheme = document.documentElement.getAttribute('data-theme');
      setCurrentTheme(docTheme === 'light' ? 'light' : 'dark');
    };

    checkTheme();

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'data-theme') {
          checkTheme();
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => observer.disconnect();
  }, [theme]);

  // Pan state
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Compute stats from Mermaid chart code
  const stats = useMemo(() => {
    if (!chart) return { entities: 0, relations: 0 };
    const entityMatches = chart.match(/([a-zA-Z0-9_]+)\s*\{/g) || [];
    const relationMatches = chart.match(/\|\|--|\}--|--\{|--\|\||--/g) || [];
    return {
      entities: entityMatches.length,
      relations: Math.floor(relationMatches.length / 2) || relationMatches.length
    };
  }, [chart]);

  // Render Mermaid SVG with adaptive theme configuration
  useEffect(() => {
    const isLight = currentTheme === 'light';

    mermaid.initialize({
      startOnLoad: false,
      theme: isLight ? 'default' : 'dark',
      securityLevel: 'loose',
      themeVariables: isLight ? {
        primaryColor: '#e0e7ff',
        primaryTextColor: '#1e1b4b',
        primaryBorderColor: '#6366f1',
        lineColor: '#4f46e5',
        textColor: '#0f172a',
        mainBkg: '#ffffff',
        nodeBorder: '#6366f1',
        clusterBkg: '#f8fafc',
        clusterBorder: '#cbd5e1',
        entityFill: '#ffffff',
        entityBorder: '#4f46e5',
        background: '#f8fafc'
      } : {
        primaryColor: '#1e1b4b',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#818cf8',
        lineColor: '#818cf8',
        textColor: '#f1f5f9',
        mainBkg: '#0f172a',
        nodeBorder: '#6366f1',
        clusterBkg: '#1e1b4b',
        clusterBorder: '#4338ca',
        entityFill: '#0f172a',
        entityBorder: '#6366f1',
        background: '#0b0f19'
      },
      er: {
        useMaxWidth: false,
        layoutDirection: 'TB',
        minEntityWidth: 150,
        minEntityHeight: 80,
        entityPadding: 16,
        stroke: isLight ? '#4f46e5' : '#818cf8',
        fill: isLight ? '#ffffff' : '#0f172a',
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
          // Inject custom SVG styling to ensure crisp text & entity boxes in Light and Dark mode
          const styledSvg = svg
            .replace(/<svg/, `<svg class="mermaid-erd-svg" style="max-width: none; overflow: visible; font-family: inherit;"`)
            .replace(/class="er entityBox"/g, `class="er entityBox" style="fill: ${isLight ? '#ffffff' : '#0f172a'}; stroke: ${isLight ? '#4f46e5' : '#818cf8'}; stroke-width: 1.5px; rx: 6px; ry: 6px;"`)
            .replace(/class="er entityLabel"/g, `class="er entityLabel" style="font-weight: 700; fill: ${isLight ? '#0f172a' : '#f8fafc'} !important; font-size: 13px;"`);

          setSvgContent(styledSvg);
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
  }, [chart, currentTheme]);

  // Handle Fullscreen ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
      if (viewMode === 'visual') {
        if ((e.ctrlKey || e.metaKey) && e.key === '=') {
          e.preventDefault();
          setZoom(prev => Math.min(Number((prev + 0.15).toFixed(2)), 3.5));
        } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
          e.preventDefault();
          setZoom(prev => Math.max(Number((prev - 0.15).toFixed(2)), 0.2));
        } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
          e.preventDefault();
          handleResetZoomPan();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, viewMode]);

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

  const handleWheel = (e: React.WheelEvent) => {
    if (viewMode !== 'visual') return;
    // Smooth zoom on wheel
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.min(Math.max(Number((prev + delta).toFixed(2)), 0.2), 3.5));
  };

  const handleResetZoomPan = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    toast.info('Zoom reset to 100%');
  };

  const handleFitToCenter = () => {
    setZoom(0.85);
    setPan({ x: 0, y: 0 });
    toast.info('Centered diagram view');
  };

  const isLight = currentTheme === 'light';

  return (
    <div 
      className="card" 
      style={{ 
        padding: '0', 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column', 
        height: isFullscreen ? '100vh' : '720px', 
        maxHeight: isFullscreen ? '100vh' : '82vh', 
        border: '1px solid var(--border-subtle)',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        width: isFullscreen ? '100vw' : '100%',
        zIndex: isFullscreen ? 99999 : 'auto',
        borderRadius: isFullscreen ? 0 : 'var(--radius-lg)',
        boxShadow: isFullscreen ? '0 25px 50px -12px rgba(0, 0, 0, 0.6)' : 'none',
        transition: 'height 0.2s ease, width 0.2s ease'
      }}
    >
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
        {/* Left: Title & Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: isLight ? 'rgba(79, 70, 229, 0.1)' : 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)'
          }}>
            <Layers size={17} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-primary)' }}>
                {title}
              </span>
              <span className="badge badge-indigo" style={{ fontSize: '0.675rem' }}>
                {stats.entities} Tables • {stats.relations} Relations
              </span>
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              Interactive entity relationship schema mapping & foreign key graph
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          {viewMode === 'visual' && (
            <div style={{ position: 'relative', width: '180px' }}>
              <Search size={12} style={{ position: 'absolute', left: '10px', top: '8px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Find entity..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input"
                style={{
                  height: '28px',
                  paddingLeft: '28px',
                  fontSize: '0.75rem',
                  borderRadius: 'var(--radius-sm)'
                }}
              />
            </div>
          )}

          {/* View Mode Toggle: Interactive Visual vs Mermaid Code */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-input)',
            padding: '2px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              type="button"
              onClick={() => setViewMode('visual')}
              className={`btn btn-sm ${viewMode === 'visual' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.725rem', padding: '3px 10px', height: '26px' }}
            >
              <Eye size={12} />
              <span>Interactive Graph</span>
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

          {/* Intuitive Zoom Controls: [ - (Zoom Out) ] [ 100% ] [ + (Zoom In) ] [ ⛶ (Fit) ] [ ↺ (Reset) ] */}
          {viewMode === 'visual' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              background: 'var(--bg-input)',
              padding: '2px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}>
              {/* 1. Zoom Out (-) */}
              <button
                type="button"
                onClick={() => setZoom(prev => Math.max(Number((prev - 0.15).toFixed(2)), 0.2))}
                className="btn btn-secondary btn-sm"
                style={{ padding: '3px 8px', height: '26px' }}
                title="Zoom Out (-)"
              >
                <ZoomOut size={13} />
              </button>

              {/* 2. Percentage display (Clickable to reset to 100%) */}
              <button
                type="button"
                onClick={handleResetZoomPan}
                className="btn btn-ghost btn-sm"
                style={{
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono)',
                  minWidth: '46px',
                  padding: '2px 4px',
                  height: '24px',
                  color: zoom === 1 ? 'var(--accent-cyan)' : 'var(--text-primary)',
                  fontWeight: 600
                }}
                title="Click to reset zoom to 100%"
              >
                {Math.round(zoom * 100)}%
              </button>

              {/* 3. Zoom In (+) */}
              <button
                type="button"
                onClick={() => setZoom(prev => Math.min(Number((prev + 0.15).toFixed(2)), 3.5))}
                className="btn btn-secondary btn-sm"
                style={{ padding: '3px 8px', height: '26px' }}
                title="Zoom In (+)"
              >
                <ZoomIn size={13} />
              </button>

              {/* 4. Fit to Center */}
              <button
                type="button"
                onClick={handleFitToCenter}
                className="btn btn-secondary btn-sm"
                style={{ padding: '3px 8px', height: '26px' }}
                title="Fit diagram in view"
              >
                <Focus size={12} />
              </button>

              {/* 5. Reset Zoom & Pan */}
              <button
                type="button"
                onClick={handleResetZoomPan}
                className="btn btn-secondary btn-sm"
                style={{ padding: '3px 8px', height: '26px' }}
                title="Reset Zoom & Pan (Ctrl+0)"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          )}

          {/* Copy Mermaid Code */}
          <button
            type="button"
            onClick={handleCopyCode}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.725rem', padding: '3px 10px', height: '28px' }}
            title="Copy Mermaid Code to Clipboard"
          >
            {isCopied ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
            <span>{isCopied ? 'Copied!' : 'Copy Code'}</span>
          </button>

          {/* Export SVG */}
          {viewMode === 'visual' && svgContent && (
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.725rem', padding: '3px 10px', height: '28px' }}
              title="Download SVG Vector Diagram"
            >
              <Download size={12} />
              <span>Export SVG</span>
            </button>
          )}

          {/* Fullscreen / Maximize Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(prev => !prev)}
            className={`btn ${isFullscreen ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            style={{ fontSize: '0.725rem', padding: '3px 9px', height: '28px' }}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Maximize Diagram Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* Content Canvas Area */}
      <div 
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: isLight ? '#f8fafc' : 'var(--bg-app, #0b0f19)',
          backgroundImage: isLight 
            ? 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 1px, transparent 1px)' 
            : 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          cursor: viewMode === 'visual' ? (isDragging ? 'grabbing' : 'grab') : 'default'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {viewMode === 'visual' ? (
          renderError ? (
            <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', textAlign: 'center' }}>
              <AlertCircle size={32} color="var(--accent-rose)" />
              <div style={{ fontWeight: 700, color: 'var(--accent-rose)', fontSize: '0.95rem' }}>Mermaid Diagram Notice</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '500px', lineHeight: 1.5 }}>
                Some custom table or field names contain characters that require escaping. You can inspect or copy the raw Mermaid code.
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
          <div style={{ width: '100%', height: '100%', overflow: 'auto', padding: '18px', background: 'var(--bg-input)' }}>
            <pre style={{
              margin: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.825rem',
              color: isLight ? '#1e1b4b' : '#86efac',
              lineHeight: 1.6
            }}>
              {chart}
            </pre>
          </div>
        )}

        {/* Floating Help & Interactive Hint Bar */}
        {viewMode === 'visual' && !renderError && svgContent && (
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '14px',
            background: isLight ? 'rgba(255, 255, 255, 0.88)' : 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.725rem',
            color: 'var(--text-secondary)',
            pointerEvents: 'none',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span>🖱️ <strong>Drag</strong> to pan canvas</span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span>🔍 <strong>Scroll Wheel / Buttons</strong> to zoom</span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span>⛶ <strong>Fullscreen</strong> available</span>
          </div>
        )}
      </div>
    </div>
  );
};
