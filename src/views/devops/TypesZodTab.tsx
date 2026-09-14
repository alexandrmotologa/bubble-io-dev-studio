import React, { useState, useEffect } from 'react';
import { Code, Copy, Check, Download } from 'lucide-react';
import { BubbleSchema } from '../../types';
import { DevOpsEngine } from '../../core/devops/devopsEngine';
import { toast } from '../../core/toast/toastManager';

interface TypesZodTabProps {
  schema: BubbleSchema | null;
  appName?: string;
  onLog?: (module: 'devops', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

export const TypesZodTab: React.FC<TypesZodTabProps> = ({ schema, appName, onLog }) => {
  const [tsMode, setTsMode] = useState<'interfaces' | 'zod' | 'client'>('interfaces');
  const [tsIncludeJsDoc, setTsIncludeJsDoc] = useState(true);
  const [tsIncludeCrudDtos, setTsIncludeCrudDtos] = useState(true);
  const [tsIncludeEnvelopes, setTsIncludeEnvelopes] = useState(true);
  const [tsGeneratedCode, setTsGeneratedCode] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!schema) {
      setTsGeneratedCode('');
      return;
    }
    if (tsMode === 'interfaces') {
      setTsGeneratedCode(DevOpsEngine.generateTypeScriptDefinitions(schema, {
        includeJsDoc: tsIncludeJsDoc,
        includeCrudDtos: tsIncludeCrudDtos,
        includeEnvelopes: tsIncludeEnvelopes,
        includeSchemaMap: true
      }));
    } else if (tsMode === 'zod') {
      setTsGeneratedCode(DevOpsEngine.generateZodValidationSchemas(schema));
    } else if (tsMode === 'client') {
      setTsGeneratedCode(DevOpsEngine.generateTypedApiClient(schema));
    }
  }, [schema, tsMode, tsIncludeJsDoc, tsIncludeCrudDtos, tsIncludeEnvelopes]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
    onLog?.('devops', `Copied ${label} to clipboard.`, 'info');
  };

  const handleDownloadCode = (code: string, defaultFilename: string) => {
    const blob = new Blob([code], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${defaultFilename}!`);
    onLog?.('devops', `Downloaded ${defaultFilename} to disk.`, 'success');
  };

  const resolvedAppName = schema?.appName || appName || 'bubble';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="card" style={{ padding: '20px' }}>
        {/* Header with Title and Mode Switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
          <div>
            <div className="card-title" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Code size={20} color="var(--accent-emerald)" />
              <span>TypeScript Studio & Type-Safe CodeGen</span>
            </div>
            <div className="card-subtitle" style={{ fontSize: '0.775rem', marginTop: '4px' }}>
              Generate TypeScript interfaces, runtime Zod validation schemas, and a type-safe Bubble API client
            </div>
          </div>

          {/* Mode Selector Segmented Tabs */}
          <div style={{ display: 'flex', background: 'var(--bg-input)', padding: '3px', borderRadius: 'var(--radius-md)', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setTsMode('interfaces')}
              className={`btn btn-sm ${tsMode === 'interfaces' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', padding: '5px 12px', fontSize: '0.75rem', fontWeight: 600 }}
            >
              TypeScript (.d.ts)
            </button>
            <button
              type="button"
              onClick={() => setTsMode('zod')}
              className={`btn btn-sm ${tsMode === 'zod' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', padding: '5px 12px', fontSize: '0.75rem', fontWeight: 600 }}
            >
              Zod Validation (.ts)
            </button>
            <button
              type="button"
              onClick={() => setTsMode('client')}
              className={`btn btn-sm ${tsMode === 'client' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', padding: '5px 12px', fontSize: '0.75rem', fontWeight: 600 }}
            >
              Type-Safe API Client SDK
            </button>
          </div>
        </div>

        {/* Options Toolbar & Export Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
          {/* Options Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {tsMode === 'interfaces' && (
              <>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.775rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={tsIncludeJsDoc}
                    onChange={(e) => setTsIncludeJsDoc(e.target.checked)}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span>JSDoc Annotations</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.775rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={tsIncludeCrudDtos}
                    onChange={(e) => setTsIncludeCrudDtos(e.target.checked)}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span>CRUD DTOs (Create / Update)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.775rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={tsIncludeEnvelopes}
                    onChange={(e) => setTsIncludeEnvelopes(e.target.checked)}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span>API Pagination Envelopes</span>
                </label>
              </>
            )}

            {tsMode === 'zod' && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Generates runtime validation schemas for Webhooks, Serverless endpoints, and API payload safety (requires <code>zod</code>).
              </span>
            )}

            {tsMode === 'client' && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Zero-dependency client library using native <code>fetch</code> with full autocompletion and error handling.
              </span>
            )}
          </div>

          {/* Action Buttons: Copy & Download */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                const filename = tsMode === 'interfaces' 
                  ? `${resolvedAppName}-schema.d.ts` 
                  : tsMode === 'zod' 
                    ? `${resolvedAppName}-schemas.zod.ts` 
                    : `${resolvedAppName}-client.ts`;
                handleDownloadCode(tsGeneratedCode, filename);
              }}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={13} color="var(--primary)" />
              <span>
                Download {tsMode === 'interfaces' ? '.d.ts' : tsMode === 'zod' ? 'Zod (.ts)' : 'Client (.ts)'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleCopy(tsGeneratedCode, `${tsMode} code`)}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '0.75rem', padding: '5px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        {/* Code Output Viewer */}
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.675rem',
            color: 'var(--text-muted)',
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '3px 8px',
            borderRadius: '4px',
            backdropFilter: 'blur(4px)',
            zIndex: 2
          }}>
            <span>{schema ? `${schema.dataTypes.length} Models • ${schema.optionSets.length} Option Sets` : 'No schema loaded'}</span>
            <span>•</span>
            <span>{tsGeneratedCode.split('\n').length} lines</span>
          </div>

          <pre style={{
            background: 'var(--bg-input)',
            padding: '18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: '#86efac',
            overflowX: 'auto',
            maxHeight: '520px',
            lineHeight: 1.5,
            margin: 0
          }}>
            {tsGeneratedCode || '// No schema available to generate TypeScript definitions.'}
          </pre>
        </div>
      </div>
    </div>
  );
};
