import React, { useState, useEffect, useMemo } from 'react';
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
  Search,
  Plus,
  Trash2,
  Edit3,
  Eye,
  Sliders,
  Share2,
  FileJson,
  FileCode,
  CheckCircle2,
  Server,
  Activity,
  Maximize2
} from 'lucide-react';
import { BubbleSchema, DocBookProject, DocSection, ProjectProfile } from '../types';
import { toast } from '../core/toast/toastManager';
import { DocGenEngine } from '../core/doc-gen/docGenEngine';
import { DevOpsEngine } from '../core/devops/devopsEngine';
import { AuditEngine } from '../core/audit/auditEngine';
import { SecurityEngine } from '../core/security/securityEngine';
import { MermaidViewer } from '../components/MermaidViewer';

interface DocGenViewProps {
  activeProject?: ProjectProfile;
  onLog: (module: 'system', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

type DocGenSubTab = 'book_reader' | 'custom_builder' | 'diagram_studio' | 'export_center';

export const DocGenView: React.FC<DocGenViewProps> = ({ activeProject, onLog }) => {
  const [subTab, setSubTab] = useState<DocGenSubTab>('book_reader');
  const [docBook, setDocBook] = useState<DocBookProject | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('sec_overview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Custom Sections State
  const [customSections, setCustomSections] = useState<DocSection[]>([
    {
      id: 'sec_custom_adr',
      title: '9. Architecture Decision Records (ADR)',
      icon: 'Sliders',
      category: 'custom',
      badge: 'Custom',
      enabled: true,
      order: 9,
      markdownContent: `## 9. Architecture Decision Records (ADR)\n\n### ADR 001: Hybrid Client/Server Execution Model\n- **Status**: \`Accepted\`\n- **Context**: High-frequency user interactions require responsive feedback without incurring excessive Workload Units (WU).\n- **Decision**: Execute validation and transient state changes in client-side CSA plugins; execute database writes and payment mutations strictly in Server-Side Actions (SSA).\n- **Consequences**: Reduced server latency by 45% while preserving database integrity.\n\n### ADR 002: Role-Based Privacy Rules Matrix\n- **Status**: \`Accepted\`\n- **Context**: Sensitive user profiles and financial transaction records must adhere to strict zero-trust principles.\n- **Decision**: All non-public tables enforce \`Current User is Logged In\` and explicit field access policies.\n`
    }
  ]);

  // Custom Editor State
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionContent, setNewSectionContent] = useState('');
  const [activeDiagramType, setActiveDiagramType] = useState<'erd' | 'system_context' | 'sequence'>('system_context');

  // Loaded Schema reference for Mermaid ERD
  const [loadedSchema, setLoadedSchema] = useState<BubbleSchema | null>(null);

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
      setLoadedSchema(schema);
      const auditRep = activeProject.blueprintExportJson ? await AuditEngine.analyzeApp(activeProject.blueprintExportJson) : null;
      const secRep = await SecurityEngine.analyzeSecurity(activeProject.blueprintExportJson, schema);

      const book = DocGenEngine.generateDocumentationBook(activeProject, schema, auditRep, secRep, customSections);
      setDocBook(book);
      onLog('system', `Documentation book generated with ${book.sections.length} comprehensive technical chapters.`, 'success');
      toast.success(`Generated Architecture Book with ${book.sections.length} chapters`);
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
    URL.revokeObjectURL(url);
    toast.success('Exported Markdown Architecture Book');
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
    URL.revokeObjectURL(url);
    toast.success('Exported standalone HTML Developer Manual');
    onLog('system', 'Exported standalone HTML Developer Manual.', 'success');
  };

  const handleExportJson = () => {
    if (!docBook) return;
    const jsonStr = DocGenEngine.exportToJsonSpec(docBook);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docBook.appName.toLowerCase().replace(/\s+/g, '_')}_spec.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported JSON Architecture Specification');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = (text: string, label: string = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(label);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddCustomSection = () => {
    if (!newSectionTitle.trim()) {
      toast.warn('Please provide a chapter title.');
      return;
    }

    const newSec: DocSection = {
      id: `sec_custom_${Date.now()}`,
      title: `${(docBook?.sections.length || 8) + 1}. ${newSectionTitle.trim()}`,
      icon: 'Edit3',
      category: 'custom',
      badge: 'Custom',
      enabled: true,
      order: (docBook?.sections.length || 8) + 1,
      markdownContent: `## ${newSectionTitle.trim()}\n\n${newSectionContent.trim() || '*Custom documentation content*'}\n`
    };

    const updated = [...customSections, newSec];
    setCustomSections(updated);
    setNewSectionTitle('');
    setNewSectionContent('');
    toast.success(`Added chapter: ${newSec.title}`);
    compileDocumentation();
  };

  const handleRemoveCustomSection = (id: string) => {
    setCustomSections(prev => prev.filter(s => s.id !== id));
    toast.info('Removed custom chapter');
    compileDocumentation();
  };

  const handleToggleSectionEnabled = (secId: string) => {
    if (!docBook) return;
    const updated = docBook.sections.map(s => s.id === secId ? { ...s, enabled: s.enabled === false ? true : false } : s);
    setDocBook({ ...docBook, sections: updated });
  };

  if (!activeProject) {
    return (
      <div className="view-container">
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <BookOpen size={36} color="var(--primary)" style={{ margin: '0 auto 16px', opacity: 0.6 }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>No Workspace Selected</h2>
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

  // Mermaid diagrams
  const erdDiagram = useMemo(() => {
    if (loadedSchema && loadedSchema.dataTypes.length > 0) {
      return DevOpsEngine.generateMermaidERD(loadedSchema);
    }
    return `erDiagram\n    USER ||--o{ ORDER : places\n    USER {\n        string email\n        string name\n    }\n    ORDER {\n        string order_id\n        number amount\n    }`;
  }, [loadedSchema]);

  const systemContextDiagram = useMemo(() => {
    return DocGenEngine.generateSystemArchitectureDiagram(activeProject, loadedSchema);
  }, [activeProject, loadedSchema]);

  const sequenceDiagram = useMemo(() => {
    return DocGenEngine.generateSequenceDiagram(activeProject);
  }, [activeProject]);

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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  1-Click Developer Documentation Book
                </h1>
                <span className="badge badge-indigo">DocGen Studio</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Full-scale technical specifications: Data Dictionary, ERD, Security RBAC Matrix, API Catalogs & Handover Manuals for <strong>{activeProject.name}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={compileDocumentation} disabled={isGenerating} className="btn btn-secondary btn-sm">
              <RefreshCw size={13} className={isGenerating ? 'spin' : ''} />
              <span>{isGenerating ? 'Compiling...' : 'Recompile Book'}</span>
            </button>
            <button onClick={handleExportMarkdown} className="btn btn-secondary btn-sm">
              <Download size={13} />
              <span>Export MD</span>
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
        <button
          onClick={() => setSubTab('book_reader')}
          className={`btn btn-sm ${subTab === 'book_reader' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ border: 'none', whiteSpace: 'nowrap' }}
        >
          <BookOpen size={13} />
          <span>Interactive Book Reader ({docBook?.sections.length || 8})</span>
        </button>
        <button
          onClick={() => setSubTab('diagram_studio')}
          className={`btn btn-sm ${subTab === 'diagram_studio' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ border: 'none', whiteSpace: 'nowrap' }}
        >
          <GitBranch size={13} />
          <span>Architecture & Diagram Studio</span>
        </button>
        <button
          onClick={() => setSubTab('custom_builder')}
          className={`btn btn-sm ${subTab === 'custom_builder' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ border: 'none', whiteSpace: 'nowrap' }}
        >
          <Edit3 size={13} />
          <span>Custom Chapter Composer</span>
        </button>
        <button
          onClick={() => setSubTab('export_center')}
          className={`btn btn-sm ${subTab === 'export_center' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ border: 'none', whiteSpace: 'nowrap' }}
        >
          <Share2 size={13} />
          <span>Export & Client Handover Center</span>
        </button>
      </div>

      {/* =====================================================================
          SUBTAB 1: INTERACTIVE BOOK READER
          ===================================================================== */}
      {subTab === 'book_reader' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick Metrics Bar */}
          {docBook && (
            <div className="grid-4" style={{ gap: '10px' }}>
              <div className="card" style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DATABASE ENTITIES</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                  {docBook.stats.dataTypesCount} Tables
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{docBook.stats.fieldsCount} total fields</div>
              </div>
              <div className="card" style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>MAPPED WORKFLOWS</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {docBook.stats.workflowsCount} Events
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Hybrid client/server logic</div>
              </div>
              <div className="card" style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>API ENDPOINTS</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                  {docBook.stats.endpointsCount} Endpoints
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Data API + Webhooks</div>
              </div>
              <div className="card" style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SECURITY MATRIX</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                  {docBook.stats.privacyRulesCount} Rules
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Role-based privacy controls</div>
              </div>
            </div>
          )}

          {/* Main Two-Column Layout */}
          <div className="responsive-split" style={{ gridTemplateColumns: '300px 1fr', alignItems: 'start' }}>
            {/* Left Column: Table of Contents */}
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ marginBottom: '12px' }}>
                <div className="search-wrapper-premium">
                  <Search size={13} className="search-icon-premium" />
                  <input
                    type="text"
                    placeholder="Search chapters & terms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input-premium"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '500px', overflowY: 'auto' }}>
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
                        padding: '9px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                        border: `1px solid ${isSelected ? 'var(--primary)' : 'transparent'}`,
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '0.775rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }}>
                          {sec.id === 'sec_overview' && <Layers size={14} />}
                          {sec.id === 'sec_database' && <Database size={14} />}
                          {sec.id === 'sec_erd' && <GitBranch size={14} />}
                          {sec.id === 'sec_security' && <ShieldCheck size={14} />}
                          {sec.id === 'sec_api' && <Radio size={14} />}
                          {sec.id === 'sec_workflows' && <Sliders size={14} />}
                          {sec.id === 'sec_localization' && <Languages size={14} />}
                          {sec.id === 'sec_audit' && <Stethoscope size={14} />}
                          {sec.category === 'custom' && <Edit3 size={14} />}
                        </span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {sec.title}
                        </span>
                      </div>

                      {sec.badge && (
                        <span className="badge badge-indigo" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                          {sec.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Chapter Markdown & Content Viewer */}
            <div className="card" style={{ minHeight: '560px', display: 'flex', flexDirection: 'column' }}>
              {activeSection ? (
                <>
                  <div className="card-header" style={{ marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>
                      <div className="card-title" style={{ fontSize: '1.1rem' }}>
                        {activeSection.title}
                      </div>
                      <div className="card-subtitle">
                        Category: <strong>{activeSection.category.toUpperCase()}</strong> • Scope: <strong>{activeProject.name}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleCopy(activeSection.markdownContent, `Copied ${activeSection.title}`)}
                        className="btn btn-secondary btn-sm"
                      >
                        {copied ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
                        <span>Copy Markdown</span>
                      </button>
                    </div>
                  </div>

                  {/* Render ERD or Markdown */}
                  {activeSection.id === 'sec_erd' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <MermaidViewer chart={erdDiagram} title="Interactive Database Entity Relationship Diagram" />
                    </div>
                  ) : (
                    <div style={{
                      background: 'var(--bg-input)',
                      padding: '22px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.85rem',
                      lineHeight: 1.65,
                      color: 'var(--text-primary)',
                      flex: 1,
                      overflowY: 'auto',
                      maxHeight: '620px'
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
                  )}
                </>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Select a chapter from the table of contents to view.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBTAB 2: ARCHITECTURE & DIAGRAM STUDIO
          ===================================================================== */}
      {subTab === 'diagram_studio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Diagram Selector Card */}
          <div className="card" style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, var(--primary) 0%, #06b6d4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}>
                  <GitBranch size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Architecture & Visual Flow Studio
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Interactive Mermaid diagrams: System Topology, ERD Relational Models, and Backend Event Sequences
                  </div>
                </div>
              </div>

              {/* Diagram Switcher Tabs */}
              <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-input)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
                <button
                  onClick={() => setActiveDiagramType('system_context')}
                  className={`btn btn-sm ${activeDiagramType === 'system_context' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '4px 10px', border: 'none' }}
                >
                  System Architecture Context
                </button>
                <button
                  onClick={() => setActiveDiagramType('erd')}
                  className={`btn btn-sm ${activeDiagramType === 'erd' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '4px 10px', border: 'none' }}
                >
                  Database ERD
                </button>
                <button
                  onClick={() => setActiveDiagramType('sequence')}
                  className={`btn btn-sm ${activeDiagramType === 'sequence' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '4px 10px', border: 'none' }}
                >
                  Event Sequence Flow
                </button>
              </div>
            </div>
          </div>

          {/* Render Active Diagram */}
          <div className="card">
            {activeDiagramType === 'system_context' && (
              <MermaidViewer 
                chart={systemContextDiagram} 
                title={`System Architecture Context — ${activeProject.name}`} 
              />
            )}
            {activeDiagramType === 'erd' && (
              <MermaidViewer 
                chart={erdDiagram} 
                title={`Database Entity Relationship Diagram — ${activeProject.name}`} 
              />
            )}
            {activeDiagramType === 'sequence' && (
              <MermaidViewer 
                chart={sequenceDiagram} 
                title={`Backend Workflow & Security Sequence Flow — ${activeProject.name}`} 
              />
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBTAB 3: CUSTOM CHAPTER COMPOSER
          ===================================================================== */}
      {subTab === 'custom_builder' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="responsive-split" style={{ alignItems: 'start' }}>
            {/* Left Column: Manage & Toggle Chapters */}
            <div className="card">
              <div className="card-header" style={{ marginBottom: '12px' }}>
                <div>
                  <div className="card-title">
                    <Sliders size={16} color="var(--primary)" />
                    <span>Manage Book Chapters</span>
                  </div>
                  <div className="card-subtitle">Enable, disable, or compose customized technical sections</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '420px', overflowY: 'auto' }}>
                {docBook?.sections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-primary)', cursor: 'pointer', flex: 1, overflow: 'hidden' }}>
                      <input
                        type="checkbox"
                        checked={sec.enabled !== false}
                        onChange={() => handleToggleSectionEnabled(sec.id)}
                      />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                        {sec.title}
                      </span>
                    </label>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                        {sec.category}
                      </span>
                      {sec.isCustom && (
                        <button
                          onClick={() => handleRemoveCustomSection(sec.id)}
                          style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' }}
                          title="Delete custom section"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Add Custom Chapter Editor */}
            <div className="card">
              <div className="card-header" style={{ marginBottom: '12px' }}>
                <div>
                  <div className="card-title">
                    <Plus size={16} color="var(--accent-emerald)" />
                    <span>Create Custom Technical Chapter</span>
                  </div>
                  <div className="card-subtitle">Add custom runbooks, ADRs, or deployment guidelines</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="input-label">Chapter Title</label>
                  <input
                    type="text"
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    placeholder="e.g. Deployment & Release Runbook"
                    className="input"
                  />
                </div>

                <div>
                  <label className="input-label">Markdown Content</label>
                  <textarea
                    value={newSectionContent}
                    onChange={(e) => setNewSectionContent(e.target.value)}
                    placeholder="### 1. Pre-deployment Checklist&#10;- Ensure environment secrets are set&#10;- Run database backup&#10;&#10;### 2. Verification Steps&#10;..."
                    className="input"
                    style={{ height: '220px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', resize: 'vertical' }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddCustomSection}
                  className="btn btn-primary btn-sm"
                  style={{ alignSelf: 'flex-start' }}
                >
                  <Plus size={13} />
                  <span>Insert into Documentation Book</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBTAB 4: EXPORT & CLIENT HANDOVER CENTER
          ===================================================================== */}
      {subTab === 'export_center' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="grid-3" style={{ gap: '16px' }}>
            {/* Format 1: Markdown */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                    <FileCode size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Markdown Architecture Book</h3>
                    <span className="badge badge-indigo">.md file</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Ideal for GitHub repositories, GitBook, Obsidian, Notion wikis, or internal engineering repos.
                </p>
              </div>
              <button onClick={handleExportMarkdown} className="btn btn-primary btn-sm" style={{ marginTop: '14px' }}>
                <Download size={13} />
                <span>Export Markdown (.md)</span>
              </button>
            </div>

            {/* Format 2: Standalone HTML */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Standalone HTML Manual</h3>
                    <span className="badge badge-cyan">.html bundle</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Zero-dependency offline developer manual with embedded styles, marked.js parser, and Mermaid diagrams.
                </p>
              </div>
              <button onClick={handleExportHtml} className="btn btn-primary btn-sm" style={{ marginTop: '14px' }}>
                <Download size={13} />
                <span>Export HTML Manual (.html)</span>
              </button>
            </div>

            {/* Format 3: JSON Specification */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-emerald)' }}>
                    <FileJson size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>JSON Architecture Spec</h3>
                    <span className="badge badge-emerald">.json spec</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Machine-readable AST data dictionary and architecture metadata for CI/CD pipelines and tools.
                </p>
              </div>
              <button onClick={handleExportJson} className="btn btn-primary btn-sm" style={{ marginTop: '14px' }}>
                <Download size={13} />
                <span>Export JSON Spec (.json)</span>
              </button>
            </div>
          </div>

          {/* Print & PDF Handover Card */}
          <div className="card" style={{ background: 'var(--bg-card)' }}>
            <div className="card-header" style={{ marginBottom: '10px' }}>
              <div>
                <div className="card-title">
                  <Printer size={16} color="var(--primary)" />
                  <span>Formal Client Handover & Print to PDF</span>
                </div>
                <div className="card-subtitle">Generate formatted architectural deliverables for stakeholders and clients</div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => handleCopy(docBook ? DocGenEngine.exportToMarkdown(docBook) : '', 'Copied Complete Architecture Book')}
                  className="btn btn-secondary btn-sm"
                >
                  {copied ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
                  <span>Copy Whole Book</span>
                </button>
                <button onClick={handlePrint} className="btn btn-primary btn-sm">
                  <Printer size={13} />
                  <span>Print Document / Save as PDF</span>
                </button>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Use the <strong>Print Document</strong> action to output a styled PDF with clean page breaks, data dictionary tables, and security matrices formatted for client sign-offs.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
