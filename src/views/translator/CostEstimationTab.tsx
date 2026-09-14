import React from 'react';
import { DollarSign } from 'lucide-react';
import { CostEstimate, TranslationItem } from '../../types';

interface CostEstimationTabProps {
  items: TranslationItem[];
  selectedTargetLangs: string[];
  costEstimates: CostEstimate[];
}

export const CostEstimationTab: React.FC<CostEstimationTabProps> = ({
  items,
  selectedTargetLangs,
  costEstimates
}) => {
  return (
    <div className="card" style={{ position: 'relative', zIndex: 1 }}>
      <div className="card-header">
        <div>
          <div className="card-title">
            <DollarSign size={18} color="var(--accent-emerald)" />
            <span>Real-Time Multi-LLM Cost Estimator</span>
          </div>
          <div className="card-subtitle">
            Calculated for {items.length} application strings across {selectedTargetLangs.length} target language(s)
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
        {costEstimates.map(est => {
          const multiCost = Math.round(est.estimatedCostUsd * selectedTargetLangs.length * 1000) / 1000;
          return (
            <div 
              key={est.provider + est.model} 
              style={{ 
                padding: '16px', 
                background: 'var(--bg-input)', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid var(--border-subtle)', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between' 
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{est.provider}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{est.model}</div>
              </div>
              
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: est.isFree ? 'var(--accent-emerald)' : 'var(--primary)' }}>
                  {est.isFree ? 'FREE (0.00$)' : `$${multiCost.toFixed(4)}`}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {est.estimatedInputTokens * selectedTargetLangs.length} In / {est.estimatedOutputTokens * selectedTargetLangs.length} Out Tokens
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
