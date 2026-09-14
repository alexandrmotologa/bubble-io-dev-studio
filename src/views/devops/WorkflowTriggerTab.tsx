import React, { useState } from 'react';
import { Workflow, Play } from 'lucide-react';
import { ProjectProfile } from '../../types';
import { DevOpsEngine } from '../../core/devops/devopsEngine';

interface WorkflowTriggerTabProps {
  activeProject?: ProjectProfile;
  onLog: (module: 'devops', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

export const WorkflowTriggerTab: React.FC<WorkflowTriggerTabProps> = ({
  activeProject,
  onLog
}) => {
  const [wfName, setWfName] = useState('backend_workflow');
  const [wfPayload, setWfPayload] = useState('{\n  "key": "value"\n}');
  const [wfResponse, setWfResponse] = useState<any>(null);
  const [isTriggeringWf, setIsTriggeringWf] = useState(false);

  const handleTriggerWorkflow = async () => {
    if (!activeProject || isTriggeringWf) return;
    setIsTriggeringWf(true);
    onLog('devops', `Triggering backend workflow '${wfName}' on ${activeProject.appId}...`);
    try {
      const res = await DevOpsEngine.triggerWorkflow(activeProject, wfName, wfPayload);
      setWfResponse(res);
      onLog('devops', `Workflow '${wfName}' returned HTTP ${res.httpCode} in ${res.executionTimeMs}ms`, 'success');
    } catch (e: any) {
      onLog('devops', `Workflow trigger failed: ${e.message}`, 'error');
    } finally {
      setIsTriggeringWf(false);
    }
  };

  return (
    <div className="grid-2">
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Workflow size={18} color="var(--accent-cyan)" />
              <span>Backend Workflow API Trigger</span>
            </div>
            <div className="card-subtitle">Dispatch API calls to backend workflows with custom parameters</div>
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label className="input-label">Workflow API Name</label>
          <input type="text" value={wfName} onChange={e => setWfName(e.target.value)} className="input" placeholder="e.g. send-invoice" />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label className="input-label">Parameters Payload (JSON)</label>
          <textarea rows={6} value={wfPayload} onChange={e => setWfPayload(e.target.value)} className="input" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', resize: 'vertical' }} />
        </div>

        <button onClick={handleTriggerWorkflow} disabled={isTriggeringWf} className="btn btn-primary btn-sm">
          <Play size={13} />
          <span>{isTriggeringWf ? 'Triggering...' : 'Dispatch Backend Workflow'}</span>
        </button>
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: '12px' }}>
          <span>Workflow API Response</span>
        </div>
        {wfResponse ? (
          <pre style={{
            background: 'var(--bg-input)',
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: '#86efac'
          }}>
            {JSON.stringify(wfResponse, null, 2)}
          </pre>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px 0' }}>
            Trigger a workflow on the left to view the live HTTP response.
          </div>
        )}
      </div>
    </div>
  );
};
