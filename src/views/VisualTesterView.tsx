import React, { useState, useEffect, useMemo } from 'react';
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
  Sparkles,
  ExternalLink,
  Flame,
  Check,
  Search,
  RotateCcw,
  Maximize2
} from 'lucide-react';
import { ProjectProfile, VisualAuthSettings, VisualSuiteResult, VisualTestCase } from '../types';
import { VisualEngine } from '../core/visual-tester/visualEngine';
import { SplitScreenSlider } from '../components/SplitScreenSlider';
import { MultiDeviceViewport } from '../components/MultiDeviceViewport';
import { ProjectStore } from '../core/storage/projectStore';
import { toast } from '../core/toast/toastManager';

interface VisualTesterViewProps {
  onLog: (module: 'visual-tester', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
  activeProject?: ProjectProfile;
}

type VisualSubTab = 'suite' | 'responsive_matrix' | 'viewports' | 'auth' | 'settings';

export const VisualTesterView: React.FC<VisualTesterViewProps> = ({ onLog, activeProject }) => {
  const [subTab, setSubTab] = useState<VisualSubTab>('suite');
  const [testCases, setTestCases] = useState<VisualTestCase[]>(() => VisualEngine.getTestCasesForProject(activeProject));
  const [selectedCase, setSelectedCase] = useState<VisualTestCase | null>(() => {
    const init = VisualEngine.getTestCasesForProject(activeProject);
    return init[0] || null;
  });
  const [isRunning, setIsRunning] = useState(false);
  const [diffThreshold, setDiffThreshold] = useState(1.0); // 1.0% diff threshold
  const [diffViewMode, setDiffViewMode] = useState<'slider' | 'side-by-side' | 'onion' | 'heatmap'>('slider');
  const [onionAlpha, setOnionAlpha] = useState(0.5);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed' | 'untested'>('all');

  // Sync test cases when active project or blueprint changes
  useEffect(() => {
    if (activeProject) {
      const cases = VisualEngine.getTestCasesForProject(activeProject);
      setTestCases(cases);
      if (cases.length > 0) {
        setSelectedCase(cases[0]);
      }
    }
  }, [activeProject?.id, activeProject?.blueprintFileName, activeProject?.httpBasicUser, activeProject?.httpBasicPassword]);

  // New Test Case Form
  const [newPageName, setNewPageName] = useState('');
  const [newPageUrl, setNewPageUrl] = useState('');
  const [newViewportType, setNewViewportType] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Auth Settings
  const [basicAuthUser, setBasicAuthUser] = useState(activeProject?.httpBasicUser || '');
  const [basicAuthPass, setBasicAuthPass] = useState(activeProject?.httpBasicPassword || '');
  const [savedAuthSuccess, setSavedAuthSuccess] = useState(false);

  useEffect(() => {
    if (activeProject) {
      setBasicAuthUser(activeProject.httpBasicUser || '');
      setBasicAuthPass(activeProject.httpBasicPassword || '');
    }
  }, [activeProject?.id, activeProject?.httpBasicUser, activeProject?.httpBasicPassword]);

  const handleApplyAgencyAuth = () => {
    if (!activeProject) return;
    const ps = ProjectStore.getInstance();
    ps.updateProject(activeProject.id, {
      httpBasicUser: basicAuthUser.trim() || undefined,
      httpBasicPassword: basicAuthPass.trim() || undefined
    });
    const updatedProj = {
      ...activeProject,
      httpBasicUser: basicAuthUser.trim() || undefined,
      httpBasicPassword: basicAuthPass.trim() || undefined
    };
    const cases = VisualEngine.getTestCasesForProject(updatedProj);
    setTestCases(cases);
    if (cases.length > 0) setSelectedCase(cases[0]);
    setSavedAuthSuccess(true);
    toast.success('Agency HTTP Basic Auth credentials saved and applied');
    setTimeout(() => setSavedAuthSuccess(false), 3000);
    onLog('visual-tester', `Applied Agency HTTP Basic Auth (${basicAuthUser.trim() ? `User: ${basicAuthUser}` : 'Disabled'}) to all Visual QA targets.`, 'success');
  };

  const [authSettings, setAuthSettings] = useState<VisualAuthSettings>({
    enabled: false,
    loginUrl: activeProject ? `https://${activeProject.customDomain || `${activeProject.appId}.bubbleapps.io`}/login` : 'https://myapp.bubbleapps.io/login',
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

  const handleRunSingleTest = async (tc: VisualTestCase) => {
    if (isRunning) return;
    setIsRunning(true);
    onLog('visual-tester', `Running visual regression test for '${tc.name}' (${tc.viewport.name})...`);
    toast.info(`Running visual regression on ${tc.name}...`);

    try {
      const result = await VisualEngine.runSuite([tc], diffThreshold, authSettings);
      if (result.cases.length > 0) {
        const updated = result.cases[0];
        setTestCases(prev => prev.map(c => c.id === updated.id ? updated : c));
        setSelectedCase(updated);
        toast.success(`Test for '${tc.name}': ${updated.status.toUpperCase()} (${updated.diffPercentage}% diff)`);
        onLog('visual-tester', `Visual test for '${tc.name}': ${updated.status.toUpperCase()} (${updated.diffPercentage}% diff).`, updated.status === 'passed' ? 'success' : 'warn');
      }
    } catch (e: any) {
      toast.error(`Test failed: ${e.message}`);
      onLog('visual-tester', `Test failed: ${e.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunSuite = async () => {
    if (isRunning || testCases.length === 0) return;
    setIsRunning(true);
    onLog('visual-tester', `Starting visual regression suite for ${testCases.length} viewports (Threshold: ${diffThreshold}%)...`);
    toast.info(`Starting suite of ${testCases.length} visual test targets...`);

    try {
      const result = await VisualEngine.runSuite(testCases, diffThreshold, authSettings, (cur, tot, name) => {
        setProgress({ current: cur, total: tot, name });
      });

      setTestCases(result.cases);
      const updatedSelected = (selectedCase ? result.cases.find(c => c.id === selectedCase.id) : null) || result.cases[0];
      setSelectedCase(updatedSelected);

      toast.success(`Suite completed: ${result.passed} passed, ${result.failed} failed out of ${result.totalTests} tests`);
      onLog(
        'visual-tester',
        `Suite completed: ${result.passed} passed, ${result.failed} failed out of ${result.totalTests} tests.`,
        result.failed > 0 ? 'warn' : 'success'
      );
    } catch (e: any) {
      toast.error(`Test suite failed: ${e.message}`);
      onLog('visual-tester', `Test suite failed: ${e.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleApproveBaseline = (tc: VisualTestCase) => {
    const updated = {
      ...tc,
      baselineImage: tc.currentImage || tc.baselineImage,
      status: 'passed' as const,
      diffPercentage: 0
    };
    setTestCases(prev => prev.map(c => c.id === tc.id ? updated : c));
    setSelectedCase(updated);
    toast.success(`Approved new baseline for '${tc.name}'`);
    onLog('visual-tester', `Approved new baseline snapshot for '${tc.name}'.`, 'success');
  };

  const handleLoadDefaultTargets = () => {
    const defaults = VisualEngine.getTestCasesForProject(activeProject);
    setTestCases(defaults);
    if (defaults.length > 0) setSelectedCase(defaults[0]);
    toast.info(`Loaded ${defaults.length} responsive test targets`);
    onLog('visual-tester', `Loaded ${defaults.length} viewport targets for ${activeProject?.name || 'app'}.`, 'info');
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
    URL.revokeObjectURL(url);
    toast.success('Exported standalone Visual QA HTML Report');
    onLog('visual-tester', 'Exported standalone Visual QA HTML report.', 'success');
  };

  const handleAddTestCase = () => {
    if (!newPageName.trim() || !newPageUrl.trim()) {
      toast.warn('Please fill in page name and route URL');
      return;
    }
    const vpMap = {
      desktop: { name: 'Desktop (1920x1080)', width: 1920, height: 1080 },
      tablet: { name: 'Tablet (768x1024)', width: 768, height: 1024 },
      mobile: { name: 'Mobile (375x812)', width: 375, height: 812 }
    };
    const vp = vpMap[newViewportType];

    const newCase: VisualTestCase = {
      id: `tc_${Date.now()}`,
      name: newPageName.trim(),
      pageUrl: newPageUrl.trim(),
      viewport: vp,
      status: 'untested',
      diffPercentage: 0,
      baselineImage: VisualEngine.generateMockUiSvg(newPageName.trim(), vp.width, vp.height, false),
      currentImage: VisualEngine.generateMockUiSvg(newPageName.trim(), vp.width, vp.height, false)
    };

    const updated = [...testCases, newCase];
    setTestCases(updated);
    if (!selectedCase) setSelectedCase(newCase);
    setNewPageName('');
    setNewPageUrl('');
    toast.success(`Added test target: ${newCase.name}`);
    onLog('visual-tester', `Added test target: '${newCase.name}' (${newCase.viewport.name})`);
  };

  const handleAddMaskSelector = () => {
    if (!newMaskSelector.trim()) return;
    setGlobalMaskSelectors([...globalMaskSelectors, newMaskSelector.trim()]);
    setNewMaskSelector('');
    toast.success(`Added mask selector: ${newMaskSelector}`);
    onLog('visual-tester', `Added CSS mask selector: "${newMaskSelector}"`);
  };

  // Filtered Test Cases
  const filteredCases = useMemo(() => {
    return testCases.filter(tc => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || tc.name.toLowerCase().includes(q) || tc.pageUrl.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || tc.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [testCases, searchTerm, statusFilter]);

  // Statistics Summary
  const stats = useMemo(() => {
    const passed = testCases.filter(t => t.status === 'passed').length;
    const failed = testCases.filter(t => t.status === 'failed').length;
    const untested = testCases.filter(t => t.status === 'untested').length;
    return { passed, failed, untested, total: testCases.length };
  }, [testCases]);

  return (
    <div className="view-container">
      {/* Header Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)', border: '1px solid var(--border-active)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 8px 20px -4px rgba(245, 158, 11, 0.4)'
            }}>
              <Camera size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Visual QA & Pixel Regression Suite
                </h1>
                <span className="badge badge-amber">v2.7.0-beta</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Multi-device pixel diff testing, interactive slider inspection, 4-up responsive matrix & Agency Basic Auth for <strong>{activeProject?.name || 'Workspace'}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={handleExportReport} disabled={testCases.length === 0} className="btn btn-secondary btn-sm">
              <Download size={13} />
              <span>Export HTML Report</span>
            </button>
            <button onClick={handleRunSuite} disabled={isRunning || testCases.length === 0} className="btn btn-primary btn-sm">
              <Play size={13} className={isRunning ? 'spin' : ''} />
              <span>{isRunning ? `Running (${progress.current}/${progress.total})...` : 'Run All Visual Tests'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subtab Navigation */}
      <div style={{
        display: 'flex',
        gap: '6px',
        background: 'var(--bg-input)',
        padding: '4px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        overflowX: 'auto'
      }}>
        <button onClick={() => setSubTab('suite')} className={`btn btn-sm ${subTab === 'suite' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', whiteSpace: 'nowrap' }}>
          <Camera size={13} />
          <span>Regression Suite ({testCases.length})</span>
        </button>
        <button onClick={() => setSubTab('responsive_matrix')} className={`btn btn-sm ${subTab === 'responsive_matrix' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', whiteSpace: 'nowrap' }}>
          <Smartphone size={13} />
          <span>4-Up Live Device Matrix</span>
        </button>
        <button onClick={() => setSubTab('viewports')} className={`btn btn-sm ${subTab === 'viewports' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', whiteSpace: 'nowrap' }}>
          <SlidersHorizontal size={13} />
          <span>Target Viewports</span>
        </button>
        <button onClick={() => setSubTab('auth')} className={`btn btn-sm ${subTab === 'auth' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', whiteSpace: 'nowrap' }}>
          <ShieldCheck size={13} />
          <span>Protected Page Auth</span>
        </button>
        <button onClick={() => setSubTab('settings')} className={`btn btn-sm ${subTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', whiteSpace: 'nowrap' }}>
          <Settings2 size={13} />
          <span>Tolerance & Masking</span>
        </button>
      </div>

      {/* =====================================================================
          SUBTAB 1: TEST SUITE & DIFF INSPECTOR
          ===================================================================== */}
      {subTab === 'suite' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick Metrics Bar */}
          <div className="grid-4" style={{ gap: '10px' }}>
            <div className="card" style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TOTAL TARGETS</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>{stats.total} Viewports</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Across all pages</div>
            </div>
            <div className="card" style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PASSED TESTS</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{stats.passed} Passed</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Diff &lt; {diffThreshold}%</div>
            </div>
            <div className="card" style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>REGRESSIONS / FAILED</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: stats.failed > 0 ? '#f43f5e' : 'var(--text-secondary)' }}>{stats.failed} Failed</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Pixel shift detected</div>
            </div>
            <div className="card" style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>UNTESTED TARGETS</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{stats.untested} Pending</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Ready for execution</div>
            </div>
          </div>

          {/* Main Two-Column Layout */}
          <div className="responsive-split" style={{ gridTemplateColumns: '360px 1fr', alignItems: 'start' }}>
            {/* Left: Test Target List */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  TARGET ROUTES ({filteredCases.length})
                </span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="select select-premium"
                  style={{ width: 'auto', height: '28px', fontSize: '0.725rem', padding: '0 6px' }}
                >
                  <option value="all">All</option>
                  <option value="passed">Passed</option>
                  <option value="failed">Failed</option>
                  <option value="untested">Untested</option>
                </select>
              </div>

              <div className="search-wrapper-premium">
                <Search size={13} className="search-icon-premium" />
                <input
                  type="text"
                  placeholder="Filter targets..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="search-input-premium"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '520px', overflowY: 'auto' }}>
                {filteredCases.map(tc => {
                  const isSelected = selectedCase?.id === tc.id;
                  return (
                    <div
                      key={tc.id}
                      onClick={() => setSelectedCase(tc)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-input)',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: isSelected ? 'var(--primary)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {tc.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {tc.viewport.name.includes('Desktop') && <Monitor size={11} />}
                          {tc.viewport.name.includes('Tablet') && <Tablet size={11} />}
                          {tc.viewport.name.includes('Mobile') && <Smartphone size={11} />}
                          <span>{tc.viewport.name}</span>
                        </div>
                      </div>

                      <div style={{ flexShrink: 0, marginLeft: '6px' }}>
                        {tc.status === 'passed' && (
                          <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                            <CheckCircle2 size={10} /> {tc.diffPercentage}%
                          </span>
                        )}
                        {tc.status === 'failed' && (
                          <span className="badge badge-rose" style={{ fontSize: '0.65rem' }}>
                            <XCircle size={10} /> Diff {tc.diffPercentage}%
                          </span>
                        )}
                        {tc.status === 'untested' && (
                          <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>Untested</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Visual Diff Inspector */}
            {selectedCase ? (
              <div className="card" style={{ minHeight: '560px', display: 'flex', flexDirection: 'column' }}>
                <div className="card-header" style={{ marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div className="card-title" style={{ fontSize: '1.05rem' }}>
                      <SlidersHorizontal size={17} color="var(--primary)" />
                      <span>{selectedCase.name}</span>
                    </div>
                    <div className="card-subtitle">
                      Viewport: <strong>{selectedCase.viewport.name}</strong> • Route: <code>{selectedCase.pageUrl}</code>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleRunSingleTest(selectedCase)}
                      disabled={isRunning}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                      <Play size={12} />
                      <span>Run Test</span>
                    </button>

                    <button
                      onClick={() => handleApproveBaseline(selectedCase)}
                      className="btn btn-secondary btn-sm"
                      title="Set current test capture as the new production baseline"
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                      <Check size={12} color="var(--accent-emerald)" />
                      <span>Approve Baseline</span>
                    </button>

                    {/* View Mode Buttons */}
                    <div style={{ display: 'flex', gap: '2px', background: 'var(--bg-input)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
                      <button onClick={() => setDiffViewMode('slider')} className={`btn btn-sm ${diffViewMode === 'slider' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', padding: '3px 7px', fontSize: '0.725rem' }}>
                        Slider
                      </button>
                      <button onClick={() => setDiffViewMode('side-by-side')} className={`btn btn-sm ${diffViewMode === 'side-by-side' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', padding: '3px 7px', fontSize: '0.725rem' }}>
                        Side-by-Side
                      </button>
                      <button onClick={() => setDiffViewMode('onion')} className={`btn btn-sm ${diffViewMode === 'onion' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', padding: '3px 7px', fontSize: '0.725rem' }}>
                        Onion Skin
                      </button>
                      <button onClick={() => setDiffViewMode('heatmap')} className={`btn btn-sm ${diffViewMode === 'heatmap' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', padding: '3px 7px', fontSize: '0.725rem' }}>
                        <Flame size={11} />
                        <span>Heatmap</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Diff Viewer Modes */}
                {selectedCase.baselineImage && selectedCase.currentImage ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {diffViewMode === 'slider' && (
                      <SplitScreenSlider
                        baselineUrl={selectedCase.baselineImage}
                        currentUrl={selectedCase.currentImage}
                        baselineLabel="Production Baseline"
                        currentLabel="Release Build Snapshot"
                        diffPercentage={selectedCase.diffPercentage || 0.42}
                      />
                    )}

                    {diffViewMode === 'side-by-side' && (
                      <div className="grid-2" style={{ gap: '14px' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '6px' }}>
                            PRODUCTION BASELINE
                          </div>
                          <img src={selectedCase.baselineImage} alt="Baseline" style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border-subtle)' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '6px' }}>
                            CURRENT TEST BUILD
                          </div>
                          <img src={selectedCase.currentImage} alt="Current" style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border-subtle)' }} />
                        </div>
                      </div>
                    )}

                    {diffViewMode === 'onion' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Baseline 0%</span>
                          <input type="range" min={0} max={1} step={0.05} value={onionAlpha} onChange={e => setOnionAlpha(parseFloat(e.target.value))} style={{ flex: 1 }} />
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Test 100% ({Math.round(onionAlpha * 100)}%)</span>
                        </div>
                        <div style={{ position: 'relative', width: '100%', height: '420px', overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                          <img src={selectedCase.baselineImage} alt="Baseline" style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'contain' }} />
                          <img src={selectedCase.currentImage} alt="Current" style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'contain', opacity: onionAlpha }} />
                        </div>
                      </div>
                    )}

                    {diffViewMode === 'heatmap' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Highlighting pixel variance: <strong>{selectedCase.diffPercentage}% discrepancy</strong>
                          </div>
                          <span className="badge badge-rose">Heatmap Active</span>
                        </div>
                        <div style={{ position: 'relative', width: '100%', height: '420px', overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                          <img src={selectedCase.currentImage} alt="Current" style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'contain' }} />
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'radial-gradient(circle at 40% 45%, rgba(244, 63, 94, 0.45) 0%, transparent 60%)',
                            pointerEvents: 'none',
                            mixBlendMode: 'screen'
                          }} />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No visual capture generated yet. Click "Run Test" above to execute regression comparison.
                  </div>
                )}
              </div>
            ) : (
              <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Select a target route to view the diff inspector.
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBTAB 2: 4-UP MULTI-DEVICE LIVE MATRIX
          ===================================================================== */}
      {subTab === 'responsive_matrix' && (
        <MultiDeviceViewport
          initialUrl={activeProject ? `https://${activeProject.customDomain || `${activeProject.appId}.bubbleapps.io`}/${activeProject.environment || 'version-test'}` : 'https://app.bubbleapps.io/version-test'}
        />
      )}

      {/* =====================================================================
          SUBTAB 3: TARGET VIEWPORTS & ADD TARGET
          ===================================================================== */}
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
                <select value={newViewportType} onChange={e => setNewViewportType(e.target.value as any)} className="select select-premium">
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
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBTAB 4: PROTECTED PAGE AUTH
          ===================================================================== */}
      {subTab === 'auth' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Card 1: Agency Plan & App Password Protection (HTTP Basic Auth) */}
          <div className="card" style={{ border: '1px solid var(--border-active)', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, rgba(6, 182, 212, 0.04) 100%)' }}>
            <div className="card-header">
              <div>
                <div className="card-title">
                  <ShieldCheck size={18} color="var(--primary)" />
                  <span>Agency Plan / App Password Protection (HTTP Basic Auth)</span>
                </div>
                <div className="card-subtitle">
                  Authenticate Bubble apps that have <em>Settings &gt; General &gt; Limit access to this app to people with a specific username/password</em>
                </div>
              </div>

              <button
                onClick={handleApplyAgencyAuth}
                className="btn btn-primary btn-sm"
                style={{ padding: '6px 14px' }}
              >
                {savedAuthSuccess ? <CheckCircle2 size={13} /> : <ShieldCheck size={13} />}
                <span>{savedAuthSuccess ? 'Credentials Applied!' : 'Apply Credentials to Targets'}</span>
              </button>
            </div>

            <div className="grid-2" style={{ gap: '14px' }}>
              <div>
                <label className="input-label">HTTP Basic Username</label>
                <input
                  type="text"
                  placeholder="username"
                  value={basicAuthUser}
                  onChange={e => setBasicAuthUser(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="input-label">HTTP Basic Password</label>
                <input
                  type="password"
                  placeholder="password"
                  value={basicAuthPass}
                  onChange={e => setBasicAuthPass(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <div style={{ marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--accent-emerald)' }}>✓</span>
              <span>Automatically injects authentication credentials into live iframes and multi-viewport regression tests.</span>
            </div>
          </div>

          {/* Card 2: In-App User Session Login Flow */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <ShieldCheck size={18} color="var(--accent-cyan)" />
                  <span>In-App User Authentication (User Login Flow)</span>
                </div>
                <div className="card-subtitle">Automate login forms before capturing screenshots for protected user portals</div>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                <input type="checkbox" checked={authSettings.enabled} onChange={e => setAuthSettings({ ...authSettings, enabled: e.target.checked })} />
                <span>Enable Automated Login Authentication Session</span>
              </label>
            </div>

            <div className="grid-2" style={{ gap: '14px' }}>
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
        </div>
      )}

      {/* =====================================================================
          SUBTAB 5: MASKING & THRESHOLDS
          ===================================================================== */}
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

            <div style={{ maxWidth: '440px' }}>
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
