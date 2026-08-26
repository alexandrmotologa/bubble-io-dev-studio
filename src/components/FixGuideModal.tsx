import React from 'react';
import { X, CheckCircle2, AlertTriangle, ExternalLink, Trash2, ArrowRight } from 'lucide-react';
import { DeadItem } from '../types';

interface FixGuideModalProps {
  item: DeadItem | null;
  onClose: () => void;
  onMarkCleaned: (item: DeadItem) => void;
}

export const FixGuideModal: React.FC<FixGuideModalProps> = ({ item, onClose, onMarkCleaned }) => {
  if (!item) return null;

  const getStepInstructions = (item: DeadItem) => {
    switch (item.type) {
      case 'element':
        return [
          { step: '1. Open Bubble.io Editor', detail: `Navigate to page "${item.pageName || 'index'}" in the Design tab.` },
          { step: '2. Locate Element in Tree', detail: `Use the Element Tree search to find "${item.name}".` },
          { step: '3. Verify References', detail: 'Right-click the element and select "Show all uses" to confirm 0 active references.' },
          { step: '4. Delete & Optimize', detail: 'Press Delete (Backspace). The DOM node and redundant layout constraints are purged.' }
        ];
      case 'workflow':
      case 'custom_event':
        return [
          { step: '1. Open Workflow Tab', detail: `Go to Workflow tab on page "${item.pageName || 'your target page'}".` },
          { step: '2. Find Orphaned Trigger', detail: `Look for "${item.name}". Notice the greyed-out or missing target event.` },
          { step: '3. Remove Event', detail: 'Click on the event box and press Delete. This reduces server execution queue overhead.' }
        ];
      case 'db_field':
        return [
          { step: '1. Open Data Tab', detail: 'Navigate to Data > Data Types in your Bubble.io editor.' },
          { step: '2. Select Table & Field', detail: `Find field "${item.name}". Verify it contains no mission-critical active data.` },
          { step: '3. Delete or Hide Field', detail: 'Click the trash icon next to the field name to remove it from API schema.' }
        ];
      case 'style':
        return [
          { step: '1. Open Styles Tab', detail: 'Navigate to Styles in the left sidebar of your Bubble editor.' },
          { step: '2. Search Style', detail: `Locate style "${item.name}".` },
          { step: '3. Delete Style', detail: 'Delete the style to reduce CSS bundle size and initial page load speed.' }
        ];
      default:
        return [
          { step: '1. Open Bubble Editor', detail: 'Inspect the item under its respective editor tab.' },
          { step: '2. Verify & Delete', detail: 'Remove unused reference and deploy changes to test environment.' }
        ];
    }
  };

  const steps = getStepInstructions(item);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-sidebar)',
        border: '1px solid var(--border-active)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '560px',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-indigo" style={{ textTransform: 'uppercase' }}>{item.type}</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                How to Resolve in Bubble.io
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Item: <strong>{item.name}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            fontSize: '0.85rem'
          }}>
            <strong style={{ color: 'var(--accent-rose)' }}>Why it is marked as dead:</strong>
            <p style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{item.reason}</p>
          </div>

          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            Step-by-Step Resolution:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {steps.map((s, idx) => (
              <div
                key={idx}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>
                  {s.step}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {s.detail}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(255,255,255,0.02)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            Close
          </button>
          <button
            onClick={() => {
              onMarkCleaned(item);
              onClose();
            }}
            className="btn btn-success btn-sm"
          >
            <CheckCircle2 size={14} />
            <span>Mark as Cleaned in Bubble</span>
          </button>
        </div>
      </div>
    </div>
  );
};
