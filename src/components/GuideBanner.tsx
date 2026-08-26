import React, { useState } from 'react';
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Lightbulb, 
  CheckCircle2, 
  ArrowRight 
} from 'lucide-react';

interface GuideStep {
  title: string;
  desc: string;
  bubbleLocation?: string;
}

interface GuideBannerProps {
  moduleName: string;
  summary: string;
  steps: GuideStep[];
  bubbleDocUrl?: string;
  badgeText?: string;
}

export const GuideBanner: React.FC<GuideBannerProps> = ({
  moduleName,
  summary,
  steps,
  bubbleDocUrl,
  badgeText = 'HOW TO USE'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)',
      border: '1px solid var(--border-active)',
      borderRadius: 'var(--radius-lg)',
      padding: '16px 20px',
      transition: 'all 0.2s ease'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setIsExpanded(!isExpanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'var(--primary-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)'
          }}>
            <Lightbulb size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>{badgeText}</span>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                How to use {moduleName} with your Bubble.io App
              </h4>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {summary}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>
            {isExpanded ? 'Hide Guide' : 'View Step-by-Step Guide'}
          </span>
          <button
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`, gap: '14px' }}>
            {steps.map((step, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-input)',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: '#fff',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {idx + 1}
                  </span>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{step.title}</strong>
                </div>

                <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {step.desc}
                </p>

                {step.bubbleLocation && (
                  <div style={{
                    marginTop: 'auto',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.04)',
                    fontSize: '0.7rem',
                    color: 'var(--accent-cyan)',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    📍 {step.bubbleLocation}
                  </div>
                )}
              </div>
            ))}
          </div>

          {bubbleDocUrl && (
            <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
              <a
                href={bubbleDocUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  fontWeight: 600
                }}
              >
                <span>Read Official Bubble.io Documentation</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
