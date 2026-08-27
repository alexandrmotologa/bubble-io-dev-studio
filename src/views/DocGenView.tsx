import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Download, 
  Printer, 
  FileText, 
  Sparkles, 
  Database, 
  ShieldCheck, 
  Radio, 
  Languages, 
  Stethoscope, 
  GitBranch, 
  Layers, 
  RefreshCw, 
  Copy, 
  Check,
  Search
} from 'lucide-react';
import { BubbleSchema, DocBookProject, ProjectProfile } from '../types';
import { toast } from '../core/toast/toastManager';
import { DocGenEngine } from '../core/doc-gen/docGenEngine';
import { DevOpsEngine } from '../core/devops/devopsEngine';
import { AuditEngine } from '../core/audit/auditEngine';
import { SecurityEngine } from '../core/security/securityEngine';

interface DocGenViewProps {
  activeProject?: ProjectProfile;
  onLog: (module: 'system', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

export const DocGenView: React.FC<DocGenViewProps> = ({ activeProject, onLog }) => {
  const [docBook, setDocBook] = useState<DocBookProject | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('sec_overview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (activeProject) {
      compileDocumentation();
    }
  }, [activeProject?.id, activeProject?.blueprintFileName]);

  const compileDocumentation = async () => {
    if (!activeProject) return;
    setIsGenerating(true);
    onLog('system', `Compiling Developer Documentation Book for ${activeProject.name}...`);
    try {
      const schema = await DevOpsEngine.fetchSchema(activeProject);
      const auditRep = activeProject.blueprintExportJson ? await AuditEngine.analyzeApp(activeProject.blueprintExportJson) : null;
      const secRep = await SecurityEngine.analyzeSecurity(activeProject.blueprintExportJson, schema);

      const book = DocGenEngine.generateDocumentationBook(activeProject, schema, auditRep, secRep);
      setDocBook(book);
      onLog('system', `Documentation book generated with ${book.sections.length} comprehensive technical chapters.`, 'success');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!docBook) return;
    const md = DocGenEngine.exportToMarkdown(docBook);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docBook.appName.toLowerCase().replace(/\s+/g, '_')}_architecture_book.md`;
    a.click();
    onLog('system', 'Exported Architecture Documentation Book as Markdown.', 'success');
  };

  const handleExportHtml = () => {
    if (!docBook) return;
    const html = DocGenEngine.exportToSinglePageHtml(docBook);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docBook.appName.toLowerCase().replace(/\s+/g, '_')}_developer_manual.html`;
    a.click();
    onLog('system', 'Exported standalone HTML Developer Manual.', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySection = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Section copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!activeProject) {
    return (
      <div className="view-container">
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <BookOpen size={36} color="var(--primary)" style={{ margin: '0 auto 16px', opacity: 0.6 }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>No Project Selected</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '8px auto 0' }}>
            Connect a Bubble application in the Workspace Selector to generate full architectural documentation books.
          </p>
        </div>
      </div>
    );
  }

  const activeSection = docBook?.sections.find(s => s.id === selectedSectionId) || docBook?.sections[0];

  const filteredSections = (docBook?.sections || []).filter(s => 
    !searchTerm || s.title.toLowerCase().includes(searchTerm.toLowerCase()) || s.markdownContent.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="view-container">
      {/* Header Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)', border: '1px solid var(--border-active)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 8px 20px -4px rgba(99, 102, 241, 0.4)'
            }}>
              <BookOpen size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                1-Click Developer Documentation Book
              </h1>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Auto-generated technical specifications: Data Dictionary, ERD, Privacy Rules, API Reference & Localization
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={compileDocumentation} disabled={isGenerating} className="btn btn-secondary btn-sm">
              <RefreshCw size={13} className={isGenerating ? 'spin' : ''} />
              <span>{isGenerating ? 'Generating...' : 'Recompile Book'}</span>
            </button>

            <button onClick={handleExportMarkdown} className="btn btn-secondary btn-sm">
              <Download size={13} />
              <span>Export Markdown</span>
            </button>

            <button onClick={handleExportHtml} className="btn btn-primary btn-sm">
              <FileText size={13} />
              <span>Export HTML Manual</span>
            </button>

            <button onClick={handlePrint} className="btn btn-secondary btn-sm" title="Print to PDF">
              <Printer size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="responsive-split" style={{ gridTemplateColumns: '280px 1fr', alignItems: 'start' }}>
        {/* Left Column: Table of Contents */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search chapters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input"
                style={{ paddingLeft: '30px', height: '32px', fontSize: '0.75rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {filteredSections.map(sec => {
              const isSelected = sec.id === selectedSectionId;

              return (
                <button
                  key={sec.id}
                  onClick={() => setSelectedSectionId(sec.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                    border: `1px solid ${isSelected ? 'var(--primary)' : 'transparent'}`,
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '0.75rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }}>
                      {sec.id === 'sec_overview' && <Layers size={13} />}
                      {sec.id === 'sec_database' && <Database size={13} />}
                      {sec.id === 'sec_erd' && <GitBranch size={13} />}
                      {sec.id === 'sec_security' && <ShieldCheck size={13} />}
                      {sec.id === 'sec_api' && <Radio size={13} />}
                      {sec.id === 'sec_localization' && <Languages size={13} />}
                      {sec.id === 'sec_audit' && <Stethoscope size={13} />}
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sec.title}
                    </span>
                  </div>

                  {sec.badge && (
                    <span className="badge badge-indigo" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                      {sec.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Chapter Markdown & Content Viewer */}
        <div className="card" style={{ minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
          {activeSection ? (
            <>
              <div className="card-header" style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <div className="card-title" style={{ fontSize: '1.1rem' }}>
                    {activeSection.title}
                  </div>
                  <div className="card-subtitle">
                    Chapter Category: <strong>{activeSection.category.toUpperCase()}</strong>
                  </div>
                </div>

                <button
                  onClick={() => handleCopySection(activeSection.markdownContent)}
                  className="btn btn-secondary btn-sm"
                >
                  {copied ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
                  <span>{copied ? 'Copied' : 'Copy Chapter'}</span>
                </button>
              </div>

              <div style={{
                background: 'var(--bg-input)',
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                fontFamily: 'inherit',
                fontSize: '0.85rem',
                lineHeight: 1.6,
                color: 'var(--text-primary)',
                flex: 1,
                overflowY: 'auto'
              }}>
                <pre style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'inherit',
                  margin: 0
                }}>
                  {activeSection.markdownContent}
                </pre>
              </div>
            </>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a chapter from the table of contents to view.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
