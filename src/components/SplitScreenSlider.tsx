import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Sparkles,
  Columns,
  Eye,
  Sliders,
  AlertCircle
} from 'lucide-react';

interface SplitScreenSliderProps {
  baselineUrl: string;
  currentUrl: string;
  baselineLabel?: string;
  currentLabel?: string;
  diffPercentage?: number;
  height?: number;
}

export const SplitScreenSlider: React.FC<SplitScreenSliderProps> = ({
  baselineUrl,
  currentUrl,
  baselineLabel = 'Baseline Capture',
  currentLabel = 'Current Capture',
  diffPercentage = 0.42,
  height = 500
}) => {
  const [sliderPos, setSliderPos] = useState(50); // 0 to 100%
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showHighlight, setShowHighlight] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pos);
  }, []);

  const handleMouseDown = () => setIsDragging(true);
  const handleTouchStart = () => setIsDragging(true);

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientX);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) handleMove(e.touches[0].clientX);
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isDragging, handleMove]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      backgroundColor: 'var(--bg-surface-elevated)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-subtle)',
      padding: '16px',
      overflow: 'hidden'
    }}>
      {/* Control Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sliders size={16} color="var(--primary)" />
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              Interactive Visual Diff Slider
            </span>
          </div>

          <div style={{
            fontSize: '0.725rem',
            padding: '2px 8px',
            borderRadius: '12px',
            background: diffPercentage > 1 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            color: diffPercentage > 1 ? 'var(--accent-rose)' : 'var(--accent-emerald)',
            fontWeight: 700,
            border: '1px solid var(--border-subtle)'
          }}>
            {diffPercentage}% Pixel Shift Detected
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowHighlight(!showHighlight)}
            className={`btn btn-sm ${showHighlight ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Sparkles size={13} />
            <span>Highlight Shifts</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-input)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
            <button
              onClick={() => setZoom(prev => Math.max(0.6, prev - 0.15))}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '3px' }}
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', minWidth: '34px', textAlign: 'center' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(prev => Math.min(2.5, prev + 0.15))}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '3px' }}
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => { setZoom(1); setSliderPos(50); }}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '3px', marginLeft: '4px' }}
              title="Reset Zoom & Position"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Container */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: `${height}px`,
          backgroundColor: '#0a0d14',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          cursor: isDragging ? 'ew-resize' : 'default',
          userSelect: 'none'
        }}
      >
        {/* Baseline (Underneath Layer - Right) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.1s ease'
          }}
        >
          {baselineUrl ? (
            <img
              src={baselineUrl}
              alt="Baseline"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No baseline image captured yet
            </div>
          )}

          {/* Baseline Badge */}
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.725rem',
            fontWeight: 700,
            color: 'var(--accent-cyan)'
          }}>
            {baselineLabel} (Baseline)
          </div>
        </div>

        {/* Current (Clipped Layer - Left) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.1s ease'
          }}
        >
          {currentUrl ? (
            <img
              src={currentUrl}
              alt="Current"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: showHighlight ? 'drop-shadow(0 0 8px rgba(244, 63, 94, 0.8))' : 'none'
              }}
            />
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No current capture available
            </div>
          )}

          {/* Current Badge */}
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            backgroundColor: 'rgba(99, 102, 241, 0.85)',
            backdropFilter: 'blur(6px)',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.725rem',
            fontWeight: 700,
            color: '#ffffff'
          }}>
            {currentLabel} (Live Test)
          </div>
        </div>

        {/* Draggable Divider Handle Line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${sliderPos}%`,
            width: '2px',
            backgroundColor: '#ffffff',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.8), 0 0 8px rgba(99, 102, 241, 0.6)',
            cursor: 'ew-resize',
            zIndex: 10,
            transform: 'translateX(-50%)'
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Central Handle Pill */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0f172a',
              cursor: 'ew-resize'
            }}
          >
            <Columns size={16} />
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
        <span>Drag the center divider slider left/right to compare pixel shifts</span>
        <span>Split position: {Math.round(sliderPos)}%</span>
      </div>
    </div>
  );
};
