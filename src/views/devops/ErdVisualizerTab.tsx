import React, { useState, useEffect } from 'react';
import { Focus } from 'lucide-react';
import { BubbleSchema } from '../../types';
import { DevOpsEngine } from '../../core/devops/devopsEngine';
import { MermaidViewer } from '../../components/MermaidViewer';

interface ErdVisualizerTabProps {
  schema: BubbleSchema | null;
}

export const ErdVisualizerTab: React.FC<ErdVisualizerTabProps> = ({ schema }) => {
  const [erdFocusedTable, setErdFocusedTable] = useState<string>('ALL');
  const [erdCompactMode, setErdCompactMode] = useState<boolean>(false);
  const [mermaidErd, setMermaidErd] = useState<string>('');

  useEffect(() => {
    if (!schema) {
      setMermaidErd('');
      return;
    }
    const erd = DevOpsEngine.generateMermaidERD(schema, erdFocusedTable, { compact: erdCompactMode });
    setMermaidErd(erd);
  }, [schema, erdFocusedTable, erdCompactMode]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Subgraph Focus Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--bg-card)',
        padding: '10px 16px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Focus size={15} color="var(--primary)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Subgraph Focus:
            </span>
          </div>
          <select
            value={erdFocusedTable}
            onChange={(e) => setErdFocusedTable(e.target.value)}
            className="select"
            style={{ fontSize: '0.775rem', padding: '4px 10px', width: 'auto', minWidth: '220px' }}
          >
            <option value="ALL">🌐 All Tables ({schema?.dataTypes.length || 0} Models)</option>
            {schema?.dataTypes.map(dt => (
              <option key={dt.name} value={dt.name}>
                🎯 Focus: {dt.name} + Relations ({dt.fields.length} fields)
              </option>
            ))}
          </select>

          {erdFocusedTable !== 'ALL' && (
            <button
              type="button"
              onClick={() => setErdFocusedTable('ALL')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.7rem', padding: '3px 8px' }}
            >
              Reset Focus
            </button>
          )}

          {/* View Density Mode Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-input)', padding: '2px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginLeft: '4px' }}>
            <button
              type="button"
              onClick={() => setErdCompactMode(false)}
              className={`btn btn-sm ${!erdCompactMode ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.7rem', padding: '3px 8px', height: '24px' }}
              title="Show all fields and types inside each table box"
            >
              Full Fields
            </button>
            <button
              type="button"
              onClick={() => setErdCompactMode(true)}
              className={`btn btn-sm ${erdCompactMode ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.7rem', padding: '3px 8px', height: '24px' }}
              title="Show only table headers and foreign key links (faster for 100+ tables)"
            >
              ⚡ Compact Models
            </button>
          </div>
        </div>

        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
          {erdFocusedTable === 'ALL' 
            ? `Showing database schema (${schema?.dataTypes.length || 0} tables)`
            : `Focused on '${erdFocusedTable}' and connected tables`}
        </div>
      </div>

      <MermaidViewer 
        chart={mermaidErd} 
        title={`Entity Relationship Diagram ${erdFocusedTable !== 'ALL' ? `(Focus: ${erdFocusedTable})` : `(Full Schema • ${erdCompactMode ? 'Compact' : 'Full Detail'})`}`}
      />
    </div>
  );
};
