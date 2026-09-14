import React from 'react';
import { Loader2 } from 'lucide-react';

interface ViewLoadingFallbackProps {
  label?: string;
}

export const ViewLoadingFallback: React.FC<ViewLoadingFallbackProps> = ({ 
  label = 'Loading workspace module...' 
}) => {
  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: '400px',
        width: '100%',
        gap: '16px',
        animation: 'fadeIn 0.25s ease-out'
      }}
    >
      <div 
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
          border: '1px solid var(--border-active)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
        }}
      >
        <Loader2 
          size={26} 
          className="spin" 
          style={{ 
            color: 'var(--accent-primary)',
            animation: 'spin 1s linear infinite' 
          }} 
        />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {label}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Preparing optimized runtime components...
        </div>
      </div>
    </div>
  );
};
