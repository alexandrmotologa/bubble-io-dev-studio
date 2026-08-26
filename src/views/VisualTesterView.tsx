import React, { useState, useEffect, useRef } from 'react';
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
  Plus, 
  Layers 
} from 'lucide-react';
import { VisualSuiteResult, VisualTestCase, ProjectProfile } from '../types';
import { VisualEngine } from '../core/visual-tester/visualEngine';
import { DiffSlider } from '../components/DiffSlider';
import { GuideBanner } from '../components/GuideBanner';

interface VisualTesterViewProps {
  activeProject?: ProjectProfile;
  onLog: (module: 'visual-tester', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

export const VisualTesterView: React.FC<VisualTesterViewProps> = ({ activeProject, onLog }) => {
  const isDemo = Boolean(activeProject?.isDemo || activeProject?.appId === 'demo-sandbox' || activeProject?.appId === 'marketplace-prod');

  const getInitialTestCases = (): VisualTestCase[] => {
    if (isDemo) {
      return VisualEngine.getDefaultTestCases();
    }
    const domain = activeProject?.customDomain || (activeProject?.appId ? `${activeProject.appId}.bubbleapps.io` : 'your-app.bubbleapps.io');
    const path = activeProject?.environment === 'live' ? '' : '/version-test';
    const baseUrl = `https://${domain}${path}`;

    return [
      {
        id: 'tc_index_desktop',
        name: 'Home / Landing Page',
        pageUrl: baseUrl,
        viewport: { name: 'Desktop (1920x1080)', width: 1920, height: 1080 },
        status: 'untested',
        diffPercentage: 0,
        baselineImage: VisualEngine.getDefaultTestCases()[0].baselineImage,
        currentImage: VisualEngine.getDefaultTestCases()[0].baselineImage
      },
      {
        id: 'tc_index_mobile',
        name: 'Mobile View',
        pageUrl: `${baseUrl}/login`,
        viewport: { name: 'Mobile (375x812)', width: 375, height: 812 },
        status: 'untested',
        diffPercentage: 0,
        baselineImage: VisualEngine.getDefaultTestCases()[2].baselineImage,
        currentImage: VisualEngine.getDefaultTestCases()[2].baselineImage
      }
    ];
  };

  const [testCases, setTestCases] = useState<VisualTestCase[]>(getInitialTestCases());
  const [selectedCase, setSelectedCase] = useState<VisualTestCase>(testCases[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; name: string }>({
    current: 0,
    total: 0,
    name: ''
  });

  const [newPageName, setNewPageName] = useState('');
  const [newPageUrl, setNewPageUrl] = useState('');
  const [newViewport, setNewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => {
    const freshCases = getInitialTestCases();
    setTestCases(freshCases);
    setSelectedCase(freshCases[0]);
  }, [activeProject?.id]);

  const handleRunSuite = async () => {
    if (isRunning) return;
    setIsRunning(true);
    onLog('visual-tester', `Starting visual regression suite for ${activeProject?.name || 'app'}...`);

    try {
      const result = await VisualEngine.runSuite(testCases, 1.0, (cur, tot, name) => {
        setProgress({ current: cur, total: tot, name });
        onLog('visual-tester', `Testing (${cur}/${tot}): ${name}...`);
      });

      setTestCases(result.cases);
      const updatedSelected = result.cases.find(c => c.id === selectedCase.id) || result.cases[0];
      setSelectedCase(updatedSelected);

      onLog('visual-tester', `Suite completed: ${result.passed} passed, ${result.failed} failed out of ${result.totalTests} tests.`, result.failed > 0 ? 'warn' : 'success');
    } catch (e: any) {
      onLog('visual-tester', `Test suite failed: ${e.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleAddTestCase = () => {
    if (!newPageName.trim() || !newPageUrl.trim()) return;

    const vpConfig = 
      newViewport === 'desktop' ? { name: 'Desktop (1920x1080)', width: 1920, height: 1080 } :
      newViewport === 'tablet' ? { name: 'Tablet (768x1024)', width: 768, height: 1024 } :
      { name: 'Mobile (375x812)', width: 375, height: 812 };

    const newCase: VisualTestCase = {
      id: `tc_${Date.now()}`,
      name: newPageName.trim(),
      pageUrl: newPageUrl.trim(),
      viewport: vpConfig,
      status: 'untested',
      diffPercentage: 0,
      baselineImage: selectedCase.baselineImage,
      currentImage: selectedCase.baselineImage
    };

    setTestCases(prev => [...prev, newCase]);
    setSelectedCase(newCase);
    setNewPageName('');
    setNewPageUrl('');
    onLog('visual-tester', `Added test target: '${newCase.name}' (${newCase.viewport.name})`, 'info');
  };

  const handleExportReport = () => {
    const result: VisualSuiteResult = {
      suiteId: `suite_${Date.now()}`,
      totalTests: testCases.length,
      passed: testCases.filter(c => c.status === 'passed').length,
      failed: testCases.filter(c => c.status === 'failed').length,
      executedAt: new Date().toISOString(),
      cases: testCases
    };

    const html = VisualEngine.generateHtmlReport(result);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bubble_visual_qa_report_${activeProject?.appId || 'app'}_${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onLog('visual-tester', 'Exported standalone Visual QA HTML report.', 'success');
  };

  const guideSteps = [
    {
      title: 'Define Viewports & URLs',
      desc: 'Add pages or key Bubble UI components across Desktop, Tablet, and Mobile screen sizes.',
      bubbleLocation: 'Visual QA > Add Page Target'
    },
    {
      title: 'Capture Baseline & Build',
      desc: 'Take production snapshots (Baseline) before deploying changes from development to live.',
      bubbleLocation: 'Studio > Run All Tests'
    },
    {
      title: 'Inspect Pixel Deviations',
      desc: 'Drag the interactive split slider to verify padding, colors, fonts, or unintended layout shifts.',
      bubbleLocation: 'Visual Diff Inspector > Drag Slider'
    }
  ];

  return (
    <div className="view-container">
      {/* Interactive In-App Guide Banner */}
      <GuideBanner
        moduleName="Visual QA & Regression Suite"
        summary="Automate screenshot comparison across viewports to detect unintended UI shifts, broken elements, and layout bugs before deploying to live users."
        steps={guideSteps}
        bubbleDocUrl="https://manual.bubble.io/help-guides/testing/testing-strategies"
      />

      {/* Top Header Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Camera size={20} color="var(--accent-amber)" />
              <span>Visual QA & Pixel Diff Regression Suite</span>
            </div>
            <div className="card-subtitle">
              Automated screenshot comparisons against production baseline for {activeProject?.name}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleExportReport} className="btn btn-secondary btn-sm">
              <Download size={14} />
              <span>Export HTML Report</span>
            </button>
            <button onClick={handleRunSuite} disabled={isRunning} className="btn btn-primary btn-sm">
              <Play size={14} />
              <span>{isRunning ? `Running (${progress.current}/${progress.total})...` : 'Run All Tests'}</span>
            </button>
          </div>
        </div>

        {/* Progress bar when running */}
        {isRunning && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span>{progress.name}</span>
              <span>{progress.current} / {progress.total} viewports</span>
            </div>
            <div style={{ height: '6px', background: 'var(--bg-input)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ width: `${(progress.current / progress.total) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #06b6d4)', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        )}
      </div>

      <div className="grid-2">
        {/* Left Column: Test Cases List & Add Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title" style={{ fontSize: '0.95rem' }}>
                <Layers size={16} color="var(--primary)" />
                <span>Test Targets & Viewports ({testCases.length})</span>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {testCases.map(tc => {
                const isSelected = tc.id === selectedCase.id;
                const isPassed = tc.status === 'passed';
                const isFailed = tc.status === 'failed';

                return (
                  <div
                    key={tc.id}
                    onClick={() => setSelectedCase(tc)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-input)',
                      border: isSelected ? '1px solid var(--border-active)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {tc.viewport.width > 1200 ? <Monitor size={16} color="var(--primary)" /> :
                       tc.viewport.width > 500 ? <Tablet size={16} color="var(--accent-cyan)" /> :
                       <Smartphone size={16} color="var(--accent-amber)" />}

                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {tc.name}
                        </div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                          {tc.viewport.name} • <code style={{ color: 'var(--accent-cyan)' }}>{tc.pageUrl}</code>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isPassed && (
                        <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                          <CheckCircle2 size={12} /> {tc.diffPercentage}% diff
                        </span>
                      )}
                      {isFailed && (
                        <span className="badge badge-rose" style={{ fontSize: '0.7rem' }}>
                          <XCircle size={12} /> {tc.diffPercentage}% diff
                        </span>
                      )}
                      {tc.status === 'untested' && (
                        <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
                          Untested
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Target Page Form */}
          <div className="card">
            <div className="card-header">
              <span className="card-title" style={{ fontSize: '0.95rem' }}>
                <Plus size={16} color="var(--accent-emerald)" />
                <span>Add Target Page / Component</span>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label className="input-label">Target Name</label>
                <input
                  type="text"
                  placeholder="e.g. Checkout Modal or Dashboard Header"
                  value={newPageName}
                  onChange={(e) => setNewPageName(e.target.value)}
                  className="input"
                />
              </div>

              <div className="grid-2">
                <div>
                  <label className="input-label">Page URL or Path</label>
                  <input
                    type="text"
                    placeholder="e.g. /dashboard or https://..."
                    value={newPageUrl}
                    onChange={(e) => setNewPageUrl(e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label className="input-label">Target Viewport</label>
                  <select
                    value={newViewport}
                    onChange={(e) => setNewViewport(e.target.value as any)}
                    className="select"
                  >
                    <option value="desktop">Desktop (1920x1080)</option>
                    <option value="tablet">Tablet (768x1024)</option>
                    <option value="mobile">Mobile (375x812)</option>
                  </select>
                </div>
              </div>

              <button onClick={handleAddTestCase} className="btn btn-secondary" style={{ marginTop: '4px' }}>
                <Plus size={14} />
                <span>Add Viewport Target</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Visual Diff Inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <SlidersHorizontal size={16} color="var(--primary)" />
                  <span>Visual Diff Inspector: {selectedCase.name}</span>
                </div>
                <div className="card-subtitle">
                  Drag the center slider to inspect live visual differences against production baseline
                </div>
              </div>

              <span className={`badge ${selectedCase.status === 'passed' ? 'badge-emerald' : selectedCase.status === 'failed' ? 'badge-rose' : 'badge-indigo'}`}>
                {selectedCase.status.toUpperCase()} ({selectedCase.diffPercentage}% diff)
              </span>
            </div>

            <DiffSlider
              baselineImage={selectedCase.baselineImage || ''}
              currentImage={selectedCase.currentImage || ''}
              baselineLabel="Baseline (Production)"
              currentLabel="Current (Development)"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
