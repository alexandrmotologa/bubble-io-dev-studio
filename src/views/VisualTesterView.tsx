import React, { useState, useRef } from 'react';
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
  Plus,
  Upload,
  Layers
} from 'lucide-react';
import { VisualSuiteResult, VisualTestCase } from '../types';
import { VisualEngine } from '../core/visual-tester/visualEngine';
import { DiffSlider } from '../components/DiffSlider';
import { GuideBanner } from '../components/GuideBanner';

interface VisualTesterViewProps {
  onLog: (module: 'visual-tester', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

export const VisualTesterView: React.FC<VisualTesterViewProps> = ({ onLog }) => {
  const [testCases, setTestCases] = useState<VisualTestCase[]>(VisualEngine.getDefaultTestCases());
  const [selectedCase, setSelectedCase] = useState<VisualTestCase>(testCases[1]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; name: string }>({
    current: 0,
    total: 0,
    name: ''
  });

  const [newPageName, setNewPageName] = useState('');
  const [newPageUrl, setNewPageUrl] = useState('');
  const [newViewport, setNewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const baselineInputRef = useRef<HTMLInputElement>(null);
  const currentInputRef = useRef<HTMLInputElement>(null);

  const handleRunSuite = async () => {
    if (isRunning) return;
    setIsRunning(true);
    onLog('visual-tester', 'Starting visual regression suite for all configured viewports...');

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
      baselineImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
      currentImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80'
    };

    setTestCases([...testCases, newCase]);
    setSelectedCase(newCase);
    setNewPageName('');
    setNewPageUrl('');
    onLog('visual-tester', `Added new visual QA test target: '${newCase.name}'`);
  };

  const handleExportReport = () => {
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
              Automated screenshot comparisons against production baseline across Desktop, Tablet, and Mobile
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
      </div>

      {/* Add New Target Bar */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 180px 140px', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label className="input-label">Target Page / Flow Name</label>
            <input
              type="text"
              placeholder="e.g. User Profile Settings"
              value={newPageName}
              onChange={(e) => setNewPageName(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="input-label">Page Relative URL</label>
            <input
              type="text"
              placeholder="e.g. /profile or /checkout"
              value={newPageUrl}
              onChange={(e) => setNewPageUrl(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="input-label">Screen Viewport</label>
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

          <button onClick={handleAddTestCase} className="btn btn-secondary btn-sm" style={{ height: '38px' }}>
            <Plus size={15} />
            <span>Add Target</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Test Cases List + Diff Inspector */}
      <div className="grid-2" style={{ gridTemplateColumns: '400px 1fr' }}>
        {/* Left Column: Test Cases */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
            PAGE VIEWPORTS & TEST TARGETS ({testCases.length})
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
                      <CheckCircle2 size={11} /> Passed ({tc.diffPercentage}%)
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

        {/* Right Column: Visual Diff Inspector Slider */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <SlidersHorizontal size={18} color="var(--primary)" />
                <span>Side-by-Side Visual Diff Inspector</span>
              </div>
              <div className="card-subtitle">
                Target: <strong>{selectedCase.name}</strong> • Drag the slider divider to inspect pixel deviations
              </div>
            </div>
            {selectedCase.status === 'failed' ? (
              <span className="badge badge-rose">Visual Mismatch ({selectedCase.diffPercentage}%)</span>
            ) : (
              <span className="badge badge-emerald">Within Tolerance</span>
            )}
          </div>

          {selectedCase.baselineImage && selectedCase.currentImage ? (
            <DiffSlider
              baselineImage={selectedCase.baselineImage}
              currentImage={selectedCase.currentImage}
              baselineLabel="Production Baseline"
              currentLabel="Current Release Build"
            />
          ) : (
            <div style={{ height: '340px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Run visual test to capture snapshots.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
