import React, { useState, useRef, useCallback } from 'react';
import { SlidersHorizontal } from 'lucide-react';

interface DiffSliderProps {
  baselineImage: string;
  currentImage: string;
  baselineLabel?: string;
  currentLabel?: string;
}

export const DiffSlider: React.FC<DiffSliderProps> = ({
  baselineImage,
  currentImage,
  baselineLabel = 'Baseline (Production)',
  currentLabel = 'Current Build (Changes)'
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  }, []);

  const handleMouseDown = () => {
    isDraggingRef.current = true;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      handleMove(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  return (
    <div
      ref={containerRef}
      className="diff-slider-container"
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      style={{ cursor: 'ew-resize', userSelect: 'none', height: '340px' }}
    >
      {/* Background Current Image */}
      <img
        src={currentImage}
        alt="Current"
        className="diff-image"
        style={{ height: '100%', objectFit: 'cover' }}
      />

      <div style={{
        position: 'absolute',
        top: 12,
        right: 12,
        background: 'rgba(0,0,0,0.7)',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: '#38bdf8'
      }}>
        {currentLabel}
      </div>

      {/* Top Baseline Image Clipped */}
      <div
        className="diff-image-top"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={baselineImage}
          alt="Baseline"
          className="diff-image"
          style={{ width: containerRef.current?.offsetWidth || '100%', height: '100%', objectFit: 'cover', maxWidth: 'none' }}
        />
        <div style={{
          position: 'absolute',
          top: 12,
          left: 12,
          background: 'rgba(0,0,0,0.7)',
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: '#34d399'
        }}>
          {baselineLabel}
        </div>
      </div>

      {/* Slider Divider Bar */}
      <div
        className="diff-divider"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="diff-handle">
          <SlidersHorizontal size={14} />
        </div>
      </div>
    </div>
  );
};
