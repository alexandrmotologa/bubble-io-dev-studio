import React, { useState } from 'react';
import { Server } from 'lucide-react';
import { BubbleSchema } from '../../types';
import { MockServerEngine } from '../../core/devops/mockServer';

interface MockServerTabProps {
  schema: BubbleSchema | null;
  onLog?: (module: 'devops', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

export const MockServerTab: React.FC<MockServerTabProps> = ({ schema, onLog }) => {
  const [mockStatus, setMockStatus] = useState(MockServerEngine.getStatus());
  const [mockTestType, setMockTestType] = useState(
    schema?.dataTypes && schema.dataTypes.length > 0 ? schema.dataTypes[0].name.toLowerCase() : 'user'
  );
  const [mockTestId, setMockTestId] = useState('');
  const [mockTestResponse, setMockTestResponse] = useState<any>(null);

  const handleToggleMockServer = () => {
    if (mockStatus.isRunning) {
      MockServerEngine.stopServer();
      setMockStatus(MockServerEngine.getStatus());
      onLog?.('devops', 'Local Bubble mock server stopped.', 'warn');
    } else {
      MockServerEngine.startServer(3333);
      setMockStatus(MockServerEngine.getStatus());
      onLog?.('devops', 'Local Bubble mock server started on http://localhost:3333', 'success');
    }
  };

  const handleTestMockRequest = (method: 'GET' | 'POST' | 'PATCH' | 'DELETE') => {
    const res = MockServerEngine.simulateRequest(method, mockTestType, mockTestId || undefined, { title: 'Test Product', price: 99 });
    setMockTestResponse(res);
    onLog?.('devops', `Mock request ${method} /api/1.1/obj/${mockTestType} -> Status ${res.status}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Server size={18} color="var(--accent-emerald)" />
              <span>Local Mock Bubble API Server</span>
            </div>
            <div className="card-subtitle">In-memory Express-compatible mock API router for offline development and testing</div>
          </div>
          <button onClick={handleToggleMockServer} className={`btn ${mockStatus.isRunning ? 'btn-secondary' : 'btn-primary'} btn-sm`}>
            <Server size={13} />
            <span>{mockStatus.isRunning ? 'Stop Mock Server' : 'Start Mock Server (Port 3333)'}</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginTop: '6px' }}>
          <span className={`badge ${mockStatus.isRunning ? 'badge-emerald' : 'badge-rose'}`}>
            {mockStatus.isRunning ? 'RUNNING ON PORT ' + mockStatus.port : 'OFFLINE'}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Loaded Data Types: <strong>{mockStatus.loadedTypes.join(', ')}</strong> ({mockStatus.totalRecords} records in memory)
          </span>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title" style={{ marginBottom: '10px' }}>
            <span>Available Mock Endpoints</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {MockServerEngine.getEndpoints().map((ep, idx) => (
              <div key={idx} style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className={`badge ${ep.method === 'GET' ? 'badge-indigo' : ep.method === 'POST' ? 'badge-emerald' : ep.method === 'PATCH' ? 'badge-amber' : 'badge-rose'}`}>
                    {ep.method}
                  </span>
                  <code style={{ fontSize: '0.8rem', color: '#fff' }}>{ep.path}</code>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ep.description}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: '10px' }}>
            <span>Live Mock Endpoint Tester</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <select value={mockTestType} onChange={e => setMockTestType(e.target.value)} className="select" style={{ width: '120px' }}>
              {schema?.dataTypes && schema.dataTypes.length > 0 ? (
                schema.dataTypes.map(dt => (
                  <option key={dt.id || dt.name} value={dt.name.toLowerCase()}>{dt.name}</option>
                ))
              ) : (
                <>
                  <option value="user">User</option>
                  <option value="product">Product</option>
                  <option value="order">Order</option>
                </>
              )}
            </select>
            <input type="text" placeholder="Record ID (optional)" value={mockTestId} onChange={e => setMockTestId(e.target.value)} className="input" style={{ flex: 1 }} />
            <button onClick={() => handleTestMockRequest('GET')} className="btn btn-secondary btn-sm">GET</button>
            <button onClick={() => handleTestMockRequest('POST')} className="btn btn-primary btn-sm">POST</button>
          </div>

          {mockTestResponse && (
            <pre style={{
              background: 'var(--bg-input)',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: '#a5f3fc',
              maxHeight: '260px',
              overflowY: 'auto'
            }}>
              {JSON.stringify(mockTestResponse, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
