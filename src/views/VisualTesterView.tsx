import React, { useState } from 'react';
import { 
  Camera, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Download, 
  SlidersHorizontal, 
  Monitor, 
  Tablet, 
  Smartphone, 
  Eye, 
  ShieldCheck, 
  Layers, 
  Plus, 
  Settings2,
  Trash2,
  Sparkles
} from 'lucide-react';
import { ProjectProfile, VisualAuthSettings, VisualSuiteResult, VisualTestCase } from '../types';
import { VisualEngine } from '../core/visual-tester/visualEngine';
import { DiffSlider } from '../components/DiffSlider';

interface VisualTesterViewProps {
  onLog: (module: 'visual-tester', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
  activeProject?: ProjectProfile;
}

type VisualSubTab = 'suite' | 'inspector' | 'viewports' | 'auth' | 'settings';

export const VisualTesterView: React.FC<VisualTesterViewProps> = ({ onLog, activeProject }) => {
  const [subTab, setSubTab] = useState<VisualSubTab>('suite');
  const [testCases, setTestCases] = useState<VisualTestCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<VisualTestCase | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [diffThreshold, setDiffThreshold] = useState(1.0); // 1.0% diff threshold
  const [diffViewMode, setDiffViewMode] = useState<'slider' | 'side-by-side' | 'onion' | 'heatmap'>('slider');
  const [onionAlpha, setOnionAlpha] = useState(0.5);

  // New Test Case
  const [newPageName, setNewPageName] = useState('');
  const [newPageUrl, setNewPageUrl] = useState('');
  const [newViewportType, setNewViewportType] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Auth Settings
  const [authSettings, setAuthSettings] = useState<VisualAuthSettings>({
    enabled: false,
    loginUrl: activeProject ? `https://${activeProject.appId}.bubbleapps.io/login` : 'https://myapp.bubbleapps.io/login',
    usernameField: 'input_email',
    passwordField: 'input_password',
    submitButtonSelector: 'btn_login'
  });

  // Masking Settings
  const [globalMaskSelectors, setGlobalMaskSelectors] = useState<string[]>([
    '.timestamp',
    '.user-avatar',
    '.realtime-ticker'
  ]);
  const [newMaskSelector, setNewMaskSelector] = useState('');

  const [progress, setProgress] = useState<{ current: number; total: number; name: string }>({
    current: 0,
    total: 0,
    name: ''
  });

  const handleRunSuite = async () => {
    if (isRunning || testCases.length === 0) return;
    setIsRunning(true);
    onLog('visual-tester', `Starting visual regression suite for ${testCases.length} viewports (Threshold: ${diffThreshold}%)...`);

    try {
      const result = await VisualEngine.runSuite(testCases, diffThreshold, authSettings, (cur, tot, name) => {
        setProgress({ current: cur, total: tot, name });
        onLog('visual-tester', `Testing (${cur}/${tot}): ${name}...`);
      });

      setTestCases(result.cases);
      const updatedSelected = (selectedCase ? result.cases.find(c => c.id === selectedCase.id) : null) || result.cases[0];
      setSelectedCase(updatedSelected);

      onLog(
        'visual-tester',
        `Suite completed: ${result.passed} passed, ${result.failed} failed out of ${result.totalTests} tests.`,
        result.failed > 0 ? 'warn' : 'success'
      );
    } catch (e: any) {
      onLog('visual-tester', `Test suite failed: ${e.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleLoadDefaultTargets = () => {
    const defaults = VisualEngine.getDefaultTestCases();
    setTestCases(defaults);
    setSelectedCase(defaults[0]);
    onLog('visual-tester', `Loaded ${defaults.length} standard viewport targets (Desktop, Tablet, Mobile).`, 'info');
  };

  const handleExportReport = () => {
    if (testCases.length === 0) return;
    const result: VisualSuiteResult = {
      suiteId: `suite_${Date.now()}`,
      totalTests: testCases.length,
      passed: testCases.filter(t => t.status === 'passed').length,
      failed: testCases.filter(t => t.status === 'failed').length,
      executedAt: new Date().toISOString(),
      cases: testCases
    };

    const html = VisualEngine.generateHtmlReport(result);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bubble_visual_qa_report_${Date.now()}.html`;
    a.click();
    onLog('visual-tester', 'Exported standalone Visual QA HTML report.', 'success');
  };

  const handleAddTestCase = () => {
    if (!newPageName.trim() || !newPageUrl.trim()) return;
    const vpMap = {
      desktop: { name: 'Desktop (1920x1080)', width: 1920, height: 1080 },
      tablet: { name: 'Tablet (768x1024)', width: 768, height: 1024 },
      mobile: { name: 'Mobile (375x812)', width: 375, height: 812 }
    };

    const newCase: VisualTestCase = {
      id: `tc_${Date.now()}`,
      name: newPageName.trim(),
      pageUrl: newPageUrl.trim(),
      viewport: vpMap[newViewportType],
      status: 'untested'
    };

    const updated = [...testCases, newCase];
    setTestCases(updated);
    if (!selectedCase) setSelectedCase(newCase);
    setNewPageName('');
    setNewPageUrl('');
    onLog('visual-tester', `Added test target: '${newCase.name}' (${newCase.viewport.name})`);
  };

  const handleAddMaskSelector = () => {
    if (!newMaskSelector.trim()) return;
    setGlobalMaskSelectors([...globalMaskSelectors, newMaskSelector.trim()]);
    setNewMaskSelector('');
    onLog('visual-tester', `Added CSS mask selector: "${newMaskSelector}"`);
  };

  return (
    <div className="view-container">
      {/* Sub Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
          <button onClick={() => setSubTab('suite')} className={`btn btn-sm ${subTab === 'suite' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
            <Camera size={13} />
            <span>Test Suite ({testCases.length})</span>
          </button>
          <button onClick={() => setSubTab('viewports')} className={`btn btn-sm ${subTab === 'viewports' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
            <SlidersHorizontal size={13} />
            <span>Target Viewports</span>
          </button>
          <button onClick={() => setSubTab('auth')} className={`btn btn-sm ${subTab === 'auth' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
            <ShieldCheck size={13} />
            <span>Protected Page Auth</span>
          </button>
          <button onClick={() => setSubTab('settings')} className={`btn btn-sm ${subTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
            <Settings2 size={13} />
            <span>Masking & Thresholds</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleExportReport} disabled={testCases.length === 0} className="btn btn-secondary btn-sm">
            <Download size={13} />
            <span>Export HTML Report</span>
          </button>
          <button onClick={handleRunSuite} disabled={isRunning || testCases.length === 0} className="btn btn-primary btn-sm">
            <Play size={13} />
            <span>{isRunning ? `Running (${progress.current}/${progress.total})...` : 'Run All Visual Tests'}</span>
          </button>
        </div>
      </div>

      {/* EMPTY STATE: No test targets */}
      {testCases.length === 0 && subTab === 'suite' ? (
        <div className="card" style={{
          textAlign: 'center',
          padding: '60px 24px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(99, 102, 241, 0.08) 100%)',
          border: '1px solid var(--border-active)'
        }}>
          <Camera size={44} color="var(--accent-amber)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            No Visual QA Targets Configured
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            Set up responsive viewports and routes for {activeProject?.name || 'your Bubble app'} to catch unintended visual CSS regressions, broken elements, and overflow issues before releasing to production.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button onClick={() => setSubTab('viewports')} className="btn btn-primary" style={{ padding: '10px 20px' }}>
              <Plus size={16} />
              <span>Add Custom Page Target</span>
            </button>
            <button onClick={handleLoadDefaultTargets} className="btn btn-secondary" style={{ padding: '10px 20px' }}>
              <Sparkles size={16} />
              <span>Load Responsive Preset Viewports</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* SUBTAB 1: TEST SUITE & DIFF INSPECTOR */}
      {subTab === 'suite' && testCases.length > 0 && (
        <div className="grid-2" style={{ gridTemplateColumns: '380px 1fr' }}>
          {/* Left: Test Case List */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              PAGE TARGETS & VIEWPORTS
            </div>

            {testCases.map(tc => {
              const isSelected = selectedCase?.id === tc.id;
              return (
                <div
                  key={tc.id}
                  onClick={() => setSelectedCase(tc)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-input)',
                    border: isSelected ? '1px solid var(--border-active)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                      {tc.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {tc.viewport.name.includes('Desktop') && <Monitor size={12} />}
                      {tc.viewport.name.includes('Tablet') && <Tablet size={12} />}
                      {tc.viewport.name.includes('Mobile') && <Smartphone size={12} />}
                      <span>{tc.viewport.name}</span>
                    </div>
                  </div>

                  <div>
                    {tc.status === 'passed' && (
                      <span className="badge badge-emerald">
                        <CheckCircle2 size={11} /> {tc.diffPercentage}%
                      </span>
                    )}
                    {tc.status === 'failed' && (
                      <span className="badge badge-rose">
                        <XCircle size={11} /> Diff {tc.diffPercentage}%
                      </span>
                    )}
                    {tc.status === 'untested' && (
                      <span className="badge badge-indigo">Untested</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Visual Diff Inspector */}
          {selectedCase && (
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    <SlidersHorizontal size={18} color="var(--primary)" />
                    <span>Pixel Diff Inspector: {selectedCase.name}</span>
                  </div>
                  <div className="card-subtitle">
                    Viewport: <strong>{selectedCase.viewport.name}</strong> • Route: <code>{selectedCase.pageUrl}</code>
                  </div>
                </div>

                {/* View Mode Buttons */}
                <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-input)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
                  <button onClick={() => setDiffViewMode('slider')} className={`btn btn-sm ${diffViewMode === 'slider' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', padding: '4px 8px', fontSize: '0.75rem' }}>
                    Slider
                  </button>
                  <button onClick={() => setDiffViewMode('side-by-side')} className={`btn btn-sm ${diffViewMode === 'side-by-side' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', padding: '4px 8px', fontSize: '0.75rem' }}>
                    Side-by-Side
                  </button>
                  <button onClick={() => setDiffViewMode('onion')} className={`btn btn-sm ${diffViewMode === 'onion' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', padding: '4px 8px', fontSize: '0.75rem' }}>
                    Onion Skin
                  </button>
                </div>
              </div>

              {selectedCase.baselineImage && selectedCase.currentImage ? (
                <div>
                  {diffViewMode === 'slider' && (
                    <DiffSlider
                      baselineImage={selectedCase.baselineImage}
                      currentImage={selectedCase.currentImage}
                      baselineLabel="Production Baseline"
                      currentLabel="Current Release Build"
                    />
                  )}

                  {diffViewMode === 'side-by-side' && (
                    <div className="grid-2" style={{ gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>BASELINE (LIVE)</div>
                        <img src={selectedCase.baselineImage} alt="Baseline" style={{ width: '100%', borderRadius: '6px', border: '1px solid var(--border-subtle)' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>CURRENT (TEST BUILD)</div>
                        <img src={selectedCase.currentImage} alt="Current" style={{ width: '100%', borderRadius: '6px', border: '1px solid var(--border-subtle)' }} />
                      </div>
                    </div>
                  )}

                  {diffViewMode === 'onion' && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Baseline 0%</span>
                        <input type="range" min={0} max={1} step={0.05} value={onionAlpha} onChange={e => setOnionAlpha(parseFloat(e.target.value))} style={{ flex: 1 }} />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Current 100%</span>
                      </div>
                      <div style={{ position: 'relative', width: '100%', height: '380px', overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                        <img src={selectedCase.baselineImage} alt="Baseline" style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} />
                        <img src={selectedCase.currentImage} alt="Current" style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: onionAlpha }} />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '12px' }}>
                  <Eye size={32} style={{ opacity: 0.5 }} />
                  <div>Click "Run All Visual Tests" above to capture screenshots and compare diffs.</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: TARGET VIEWPORTS & ADD TARGET */}
      {subTab === 'viewports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <Plus size={18} color="var(--primary)" />
                  <span>Add New Test Target & Viewport</span>
                </div>
                <div className="card-subtitle">Configure Bubble pages, responsive container breakpoints, and wait selectors</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '180px' }}>
                <label className="input-label">Page / Component Name</label>
                <input type="text" placeholder="e.g. Pricing Table" value={newPageName} onChange={e => setNewPageName(e.target.value)} className="input" />
              </div>
              <div style={{ flex: 1, minWidth: '180px' }}>
                <label className="input-label">Route Path / URL</label>
                <input type="text" placeholder="e.g. /pricing or https://app.bubbleapps.io/pricing" value={newPageUrl} onChange={e => setNewPageUrl(e.target.value)} className="input" />
              </div>
              <div style={{ width: '160px' }}>
                <label className="input-label">Viewport Preset</label>
                <select value={newViewportType} onChange={e => setNewViewportType(e.target.value as any)} className="select">
                  <option value="desktop">Desktop (1920x1080)</option>
                  <option value="tablet">Tablet (768x1024)</option>
                  <option value="mobile">Mobile (375x812)</option>
                </select>
              </div>
              <button onClick={handleAddTestCase} className="btn btn-primary btn-sm" style={{ height: '38px' }}>
                <Plus size={14} />
                <span>Add Target</span>
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <span>Configured Test Targets ({testCases.length})</span>
                </div>
              </div>
              {testCases.length === 0 && (
                <button onClick={handleLoadDefaultTargets} className="btn btn-secondary btn-sm">
                  <Sparkles size={13} />
                  <span>Load Preset Viewports</span>
                </button>
              )}
            </div>

            {testCases.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No targets configured. Add a target above or load the responsive presets.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {testCases.map(tc => (
                  <div key={tc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div>
                      <strong>{tc.name}</strong> • <code>{tc.pageUrl}</code> • <span style={{ color: 'var(--accent-cyan)' }}>{tc.viewport.name}</span>
                    </div>
                    <button onClick={() => setTestCases(testCases.filter(t => t.id !== tc.id))} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: AUTH SETTINGS */}
      {subTab === 'auth' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <ShieldCheck size={18} color="var(--accent-cyan)" />
                <span>Authentication for Protected Bubble Pages</span>
              </div>
              <div className="card-subtitle">Automate login flows before capturing screenshots for admin dashboards and user portals</div>
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
              <input type="checkbox" checked={authSettings.enabled} onChange={e => setAuthSettings({ ...authSettings, enabled: e.target.checked })} />
              <span>Enable Automated Login Authentication Session</span>
            </label>
          </div>

          <div className="grid-2">
            <div>
              <label className="input-label">Login Page URL</label>
              <input type="text" value={authSettings.loginUrl} onChange={e => setAuthSettings({ ...authSettings, loginUrl: e.target.value })} className="input" />
            </div>
            <div>
              <label className="input-label">Email / Username Input Selector</label>
              <input type="text" value={authSettings.usernameField} onChange={e => setAuthSettings({ ...authSettings, usernameField: e.target.value })} className="input" />
            </div>
            <div>
              <label className="input-label">Password Input Selector</label>
              <input type="text" value={authSettings.passwordField} onChange={e => setAuthSettings({ ...authSettings, passwordField: e.target.value })} className="input" />
            </div>
            <div>
              <label className="input-label">Submit Button Selector</label>
              <input type="text" value={authSettings.submitButtonSelector} onChange={e => setAuthSettings({ ...authSettings, submitButtonSelector: e.target.value })} className="input" />
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: MASKING & THRESHOLDS */}
      {subTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <Settings2 size={18} color="var(--accent-amber)" />
                  <span>Pixel Diff Tolerance & Thresholds</span>
                </div>
                <div className="card-subtitle">Configure sensitivity for reporting regression failures</div>
              </div>
            </div>

            <div style={{ maxWidth: '400px' }}>
              <label className="input-label">Mismatch Tolerance Threshold: {diffThreshold}%</label>
              <input type="range" min={0.01} max={5.0} step={0.05} value={diffThreshold} onChange={e => setDiffThreshold(parseFloat(e.target.value))} style={{ width: '100%' }} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Any visual difference exceeding {diffThreshold}% of total viewport pixels will fail CI/CD.
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <Layers size={18} color="var(--accent-cyan)" />
                  <span>Dynamic Element Masking Selectors</span>
                </div>
                <div className="card-subtitle">Ignore dynamic areas (live timestamps, user avatars, real-time counters) during comparison</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label className="input-label">CSS Mask Selector</label>
                <input type="text" placeholder="e.g. .live-clock, #user-avatar" value={newMaskSelector} onChange={e => setNewMaskSelector(e.target.value)} className="input" />
              </div>
              <button onClick={handleAddMaskSelector} className="btn btn-primary btn-sm" style={{ height: '38px' }}>
                <Plus size={13} />
                <span>Add Mask</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {globalMaskSelectors.map((sel, idx) => (
                <span key={idx} className="badge badge-indigo" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', fontSize: '0.8rem' }}>
                  <code>{sel}</code>
                  <button onClick={() => setGlobalMaskSelectors(globalMaskSelectors.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' }}>✕</button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
