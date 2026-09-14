import React, { useState } from 'react';
import { Sparkles, Share2, FileSpreadsheet, Copy, Play, Upload } from 'lucide-react';
import { BubbleSchema, ProjectProfile, SeedExecutionPlan } from '../../types';
import { RelationalSeederEngine } from '../../core/devops/relationalSeeder';
import { toast } from '../../core/toast/toastManager';

interface RelationalSeederTabProps {
  schema: BubbleSchema | null;
  activeProject?: ProjectProfile;
  onLog: (module: 'devops', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

export const RelationalSeederTab: React.FC<RelationalSeederTabProps> = ({
  schema,
  activeProject,
  onLog
}) => {
  const [seedDataJson, setSeedDataJson] = useState<string>(() => {
    if (schema && schema.dataTypes.length > 0) {
      return JSON.stringify(RelationalSeederEngine.generateSeedTemplateForSchema(schema), null, 2);
    }
    return '';
  });
  const [seedPlan, setSeedPlan] = useState<SeedExecutionPlan | null>(null);
  const [seedValidation, setSeedValidation] = useState<{ valid: boolean; errors: string[]; warnings: string[] } | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
    onLog('devops', `Copied ${label} to clipboard.`, 'info');
  };

  const handleLoadRelationalExample = () => {
    const example = {
      User: [
        {
          _ref: "@user_admin",
          email: "john.doe@example.com",
          first_name: "John",
          last_name: "Doe",
          role: "Admin",
          is_active: true
        },
        {
          _ref: "@user_member",
          email: "jane.smith@example.com",
          first_name: "Jane",
          last_name: "Smith",
          role: "Member",
          is_active: true
        }
      ],
      Company: [
        {
          _ref: "@company_main",
          name: "DevStudio Labs",
          owner: "@user_admin",
          tier: "Enterprise"
        }
      ],
      Project: [
        {
          _ref: "@project_alpha",
          title: "Bubble AI Toolchain",
          company: "@company_main",
          lead_user: "@user_admin",
          members: ["@user_admin", "@user_member"],
          budget: 15000,
          is_active: true
        }
      ]
    };
    setSeedDataJson(JSON.stringify(example, null, 2));
    onLog('devops', 'Loaded multi-table relational seed example with @ref aliases.', 'info');
  };

  const handleGenerateSchemaTemplate = () => {
    if (!schema || schema.dataTypes.length === 0) {
      onLog('devops', 'No schema data types found to generate template.', 'warn');
      return;
    }
    const generated = RelationalSeederEngine.generateSeedTemplateForSchema(schema);
    setSeedDataJson(JSON.stringify(generated, null, 2));
    onLog('devops', `Generated relational template for ${schema.dataTypes.length} schema types.`, 'success');
  };

  const handleParseSeedPlan = () => {
    try {
      const parsed = JSON.parse(seedDataJson);
      const plan = RelationalSeederEngine.parseAndPlan(parsed);
      setSeedPlan(plan);

      if (schema) {
        const check = RelationalSeederEngine.preflightCheck(parsed, schema);
        setSeedValidation(check);
      }
      onLog('devops', `Compiled relational execution plan: ${plan.totalRecords} records across ${plan.types.length} types in ${plan.steps.length} steps.`, 'success');
    } catch (e: any) {
      onLog('devops', `Invalid JSON in relational seeder: ${e.message}`, 'error');
    }
  };

  const handleExecuteSeed = async () => {
    if (!seedPlan || isSeeding) return;
    setIsSeeding(true);
    onLog('devops', 'Starting relational graph import with automatic DAG resolution...');
    try {
      const result = await RelationalSeederEngine.executePlan(seedPlan, activeProject, (step, total, msg) => {
        onLog('devops', `[Step ${step}/${total}] ${msg}`);
      });
      if (result.errors && result.errors.length > 0) {
        onLog('devops', `Relational seeding completed with ${result.errors.length} error(s): ${result.errors.join(', ')}`, 'warn');
      } else {
        onLog('devops', `Relational seeding completed! Created ${result.createdCount} linked records.`, 'success');
      }
    } catch (e: any) {
      onLog('devops', `Seeding error: ${e.message}`, 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Relational Syntax & Rules Guide Card */}
      <div className="card" style={{ background: 'rgba(99, 102, 241, 0.04)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="var(--primary)" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              How Relational Seeding Works (3 Simple Steps)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.725rem', color: 'var(--accent-cyan)' }}>
            <span style={{ background: 'rgba(6, 182, 212, 0.08)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
              1. Load/Write ➔ 2. Validate DAG ➔ 3. Execute
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
          <div style={{ background: 'var(--bg-input)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <strong style={{ color: 'var(--accent-cyan)', display: 'block', marginBottom: '3px' }}>Step 1. Define Aliases (<code>_ref</code>)</strong>
            Give parent records a temporary alias (e.g. <code>"_ref": "@user_admin"</code>) instead of real Bubble IDs.
          </div>
          <div style={{ background: 'var(--bg-input)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <strong style={{ color: 'var(--accent-emerald)', display: 'block', marginBottom: '3px' }}>Step 2. Link Child Records</strong>
            Use the <code>@alias</code> in any related field (e.g. <code>"owner": "@user_admin"</code> or <code>"company": "@comp_acme"</code>).
          </div>
          <div style={{ background: 'var(--bg-input)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <strong style={{ color: 'var(--accent-indigo)', display: 'block', marginBottom: '3px' }}>Step 3. Auto DAG Resolution</strong>
            The engine sorts tables topologically, inserts parents first, captures real Bubble IDs, and injects them into children.
          </div>
          <div style={{ background: 'var(--bg-input)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <strong style={{ color: 'var(--accent-amber)', display: 'block', marginBottom: '3px' }}>Circular References (2-Pass)</strong>
            Circular relations are automatically created and resolved in a 2nd-pass <code>PATCH</code> request.
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div className="card-title">
              <Share2 size={18} color="var(--accent-cyan)" />
              <span>Relational Seed JSON Editor</span>
            </div>
            <div className="card-subtitle">Write relational JSON, load pre-built templates, or generate from your schema</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={handleGenerateSchemaTemplate} className="btn btn-secondary btn-sm" title="Step 1: Generate seed structure from active project schema">
              <Sparkles size={12} />
              <span>Schema Template</span>
            </button>
            <button onClick={handleLoadRelationalExample} className="btn btn-secondary btn-sm" title="Step 1: Load sample multi-table example with linked users, companies and projects">
              <FileSpreadsheet size={12} />
              <span>Sample Example</span>
            </button>
            <button onClick={() => handleCopy(seedDataJson, 'Relational Seed JSON')} className="btn btn-secondary btn-sm" title="Copy JSON">
              <Copy size={12} />
            </button>
            <button onClick={handleParseSeedPlan} className="btn btn-secondary btn-sm" title="Step 2: Validate syntax and calculate DAG insertion order" style={{ border: '1px solid var(--primary)' }}>
              <Play size={13} color="var(--primary)" />
              <span style={{ fontWeight: 700 }}>Validate & Plan DAG</span>
            </button>
            <button onClick={handleExecuteSeed} disabled={!seedPlan || isSeeding} className="btn btn-primary btn-sm" title={!seedPlan ? 'Click "Validate & Plan DAG" first to enable execution' : 'Step 3: Insert all records into Bubble Data API'}>
              <Upload size={13} className={isSeeding ? 'spin' : ''} />
              <span>{isSeeding ? 'Seeding...' : 'Execute Live Seed'}</span>
            </button>
          </div>
        </div>

        {/* Validation Feedback Banner */}
        {seedValidation && (
          <div style={{
            marginBottom: '12px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            background: seedValidation.valid ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
            border: `1px solid ${seedValidation.valid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            fontSize: '0.775rem'
          }}>
            <div style={{ fontWeight: 700, color: seedValidation.valid ? 'var(--accent-emerald)' : 'var(--accent-rose)', marginBottom: '4px' }}>
              {seedValidation.valid ? '✓ Preflight Schema Check Passed' : '⚠ Schema Validation Issues Detected'}
            </div>
            {seedValidation.errors.map((err, i) => (
              <div key={i} style={{ color: 'var(--accent-rose)', marginLeft: '8px' }}>• {err}</div>
            ))}
            {seedValidation.warnings.map((warn, i) => (
              <div key={i} style={{ color: 'var(--accent-amber)', marginLeft: '8px' }}>• {warn}</div>
            ))}
          </div>
        )}

        <textarea
          rows={14}
          value={seedDataJson}
          onChange={e => setSeedDataJson(e.target.value)}
          className="input"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', width: '100%', resize: 'vertical' }}
        />
      </div>

      {seedPlan && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: '12px' }}>
            <span>Execution Plan ({seedPlan.totalRecords} Records • {seedPlan.steps.length} Stages)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {seedPlan.steps.map((st) => (
              <div key={st.step} style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge badge-indigo">Stage {st.step}</span>
                <span style={{ fontSize: '0.85rem' }}>{st.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
