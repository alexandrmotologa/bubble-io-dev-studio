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
import { marked } from 'marked';
import { BubbleSchema, DocBookProject, DocSection, ProjectProfile, GlobalSettings } from '../types';
import { toast } from '../core/toast/toastManager';
import { DocGenEngine } from '../core/doc-gen/docGenEngine';
import { DevOpsEngine } from '../core/devops/devopsEngine';
import { AuditEngine } from '../core/audit/auditEngine';
import { SecurityEngine } from '../core/security/securityEngine';
import { MermaidViewer } from '../components/MermaidViewer';
import { getProviderForModel, getDefaultModelForProvider } from '../core/ai/aiProviders';
import { AiDocNarrativeEngine, AiEnhanceProgress } from '../core/doc-gen/aiDocNarrativeEngine';
import { WorkflowGraphEngine } from '../core/workflows/workflowGraphEngine';

interface DocGenViewProps {
  activeProject?: ProjectProfile;
  settings?: GlobalSettings;
  onLog: (module: 'system', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

type DocGenSubTab = 'book_reader' | 'custom_builder' | 'diagram_studio' | 'export_center';

export const DocGenView: React.FC<DocGenViewProps> = ({ activeProject, settings, onLog }) => {
  const [subTab, setSubTab] = useState<DocGenSubTab>('book_reader');
  const [docBook, setDocBook] = useState<DocBookProject | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('sec_overview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Reader View Mode: Formatted HTML vs Raw Markdown
  const [readerViewMode, setReaderViewMode] = useState<'rich' | 'raw'>('rich');

  // Community Feature #3: AI Narrative vs Compact Technical mode
  const [docMode, setDocMode] = useState<'narrative' | 'technical'>('narrative');
  const [aiProgress, setAiProgress] = useState<AiEnhanceProgress | null>(null);

  // Custom AI Co-Pilot State
  const [aiChapterPrompt, setAiChapterPrompt] = useState('');
  const [isGeneratingAiChapter, setIsGeneratingAiChapter] = useState(false);

  // Per-Chapter AI Regeneration State
  const [isRegeneratingChapter, setIsRegeneratingChapter] = useState(false);
  const [showRefineBar, setShowRefineBar] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState('');

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

  const getEffectiveAiConfig = () => {
    const provider = activeProject?.aiProvider || (settings?.defaultAiModel ? getProviderForModel(settings.defaultAiModel) : 'ollama');
    let apiKey = activeProject?.aiApiKey;
    if (!apiKey && settings) {
      if (provider === 'gemini') apiKey = settings.geminiApiKey;
      else if (provider === 'openai') apiKey = settings.openaiApiKey;
      else if (provider === 'anthropic') apiKey = settings.anthropicApiKey;
      else if (provider === 'groq') apiKey = settings.groqApiKey;
      else if (provider === 'xai') apiKey = settings.xaiApiKey;
      else if (provider === 'openrouter') apiKey = settings.openrouterApiKey;
      else if (provider === 'opencode') apiKey = settings.opencodeApiKey;
      else if (provider === 'deepseek') apiKey = settings.deepseekApiKey;
      else if (provider === 'ollama') apiKey = settings.ollamaUrl || 'http://localhost:11434';
    }
    const model = activeProject?.aiModel || settings?.defaultAiModel || getDefaultModelForProvider(provider);
    return {
      provider,
      apiKey,
      model,
      ollamaUrl: settings?.ollamaUrl
    };
  };

  const compileDocumentation = async (forceMode?: 'narrative' | 'technical') => {
    if (!activeProject) return;
    const mode = forceMode || docMode;
    setIsGenerating(true);
    setAiProgress(null);
    onLog('system', `Compiling ${mode === 'narrative' ? 'AI Architecture Narrative Book' : 'Technical Data Dictionary'} for ${activeProject.name}...`);
    try {
      const schema = await DevOpsEngine.fetchSchema(activeProject);
      setLoadedSchema(schema);
      const auditRep = activeProject.blueprintExportJson ? await AuditEngine.analyzeApp(activeProject.blueprintExportJson) : null;
      const secRep = await SecurityEngine.analyzeSecurity(activeProject.blueprintExportJson, schema);

      if (mode === 'narrative') {
        const aiConfig = getEffectiveAiConfig();
        const book = await DocGenEngine.generateAiDocumentationBook(
          activeProject,
          schema,
          auditRep,
          secRep,
          customSections,
          aiConfig,
          (prog) => setAiProgress(prog)
        );
        setDocBook(book);
        onLog('system', `Generated AI Narrative Architecture Book (${book.sections.length} chapters) for ${activeProject.name}.`, 'success');
        toast.success(`Generated AI Architecture Book with ${book.sections.length} chapters`);
      } else {
        const book = DocGenEngine.generateDocumentationBook(activeProject, schema, auditRep, secRep, customSections);
        setDocBook(book);
        onLog('system', `Documentation book generated with ${book.sections.length} comprehensive technical chapters.`, 'success');
        toast.success(`Generated Architecture Book with ${book.sections.length} chapters`);
      }
    } finally {
      setIsGenerating(false);
      setAiProgress(null);
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

  const handleGenerateAiCustomChapter = async () => {
    if (!aiChapterPrompt.trim() || !activeProject) return;
    setIsGeneratingAiChapter(true);
    onLog('system', `AI Co-Pilot is drafting chapter: "${aiChapterPrompt}"...`);
    try {
      const aiConfig = getEffectiveAiConfig();
      const prompt = `You are a Lead Software Architect writing a technical documentation chapter for a Bubble.io application named "${activeProject.name}".
Environment: ${activeProject.environment}.
Task / Chapter Topic: ${aiChapterPrompt.trim()}.

Requirements:
- Provide an authoritative, high-quality chapter in GitHub-Flavored Markdown.
- Use clear sections (##, ###), bullet points, and clean technical tables or checklists where applicable.
- Make it practical, production-ready, and directly applicable to Bubble.io and modern cloud web architectures.
- The first line MUST be the chapter title as a level 2 heading (e.g. ## Title).`;

      const result = await AiDocNarrativeEngine.executeLlmPrompt(prompt, aiConfig);
      if (result && result.trim().length > 50) {
        const lines = result.trim().split('\n');
        const firstLine = lines[0] || '';
        const cleanTitle = firstLine.replace(/^#+\s*/, '').trim() || aiChapterPrompt.slice(0, 40);
        
        setNewSectionTitle(cleanTitle);
        setNewSectionContent(result.trim());
        toast.success(`Generated chapter draft: "${cleanTitle}"`);
        onLog('system', `AI Co-Pilot generated chapter "${cleanTitle}" (${result.length} characters).`, 'success');
      } else {
        toast.error('AI synthesis returned empty response. Check your API key and network connection.');
      }
    } catch (err) {
      console.error('Error generating AI chapter:', err);
      toast.error('Failed to generate chapter with AI.');
    } finally {
      setIsGeneratingAiChapter(false);
    }
  };

  const handleRegenerateActiveChapter = async (customInstruction?: string) => {
    const currentSection = docBook?.sections.find(s => s.id === selectedSectionId) || docBook?.sections[0];
    if (!activeProject || !docBook || !currentSection) return;

    setIsRegeneratingChapter(true);
    onLog('system', `Re-generating chapter "${currentSection.title}" with AI...`);

    try {
      const aiConfig = getEffectiveAiConfig();
      const schema = loadedSchema || (await DevOpsEngine.fetchSchema(activeProject));
      if (!loadedSchema && schema) setLoadedSchema(schema);

      const rawBlueprint = activeProject.blueprintExportJson;
      const extractedWorkflows = WorkflowGraphEngine.extractAllWorkflows(rawBlueprint);
      const secRep = await SecurityEngine.analyzeSecurity(rawBlueprint, schema);

      let newMarkdown = '';

      if (currentSection.id === 'sec_overview') {
        if (customInstruction) {
          const domain = AiDocNarrativeEngine.detectDomain(schema, extractedWorkflows);
          const prompt = `Rewrite and refine Chapter 1 (Executive Architecture Summary) for Bubble.io app "${activeProject.name}".
Domain: ${domain.domainName}.
Additional Instructions: ${customInstruction}.
Requirements: Produce an authoritative, updated chapter in GitHub-Flavored Markdown with headings, bullet points, and an architecture baseline matrix.`;
          newMarkdown = (await AiDocNarrativeEngine.executeLlmPrompt(prompt, aiConfig)) || '';
        }
        if (!newMarkdown) {
          newMarkdown = await AiDocNarrativeEngine.generateExecutiveNarrative(activeProject, schema, extractedWorkflows, aiConfig);
        }
      } else if (currentSection.id === 'sec_database') {
        if (customInstruction) {
          const dataTypesSummary = (schema?.dataTypes || []).slice(0, 10).map(dt => dt.name).join(', ');
          const prompt = `Rewrite and refine Chapter 2 (Database Domain Architecture) for Bubble.io app "${activeProject.name}".
Tables: ${dataTypesSummary}.
Additional Instructions: ${customInstruction}.
Requirements: Output authoritative GitHub-Flavored Markdown explaining entity roles, lifecycles, and relational dependencies.`;
          newMarkdown = (await AiDocNarrativeEngine.executeLlmPrompt(prompt, aiConfig)) || '';
        }
        if (!newMarkdown) {
          newMarkdown = await AiDocNarrativeEngine.generateDataArchitectureNarrative(schema, aiConfig);
        }
      } else if (currentSection.id === 'sec_workflows') {
        if (customInstruction) {
          const prompt = `Rewrite and refine Chapter 3 (Workflows & Business Logic User Journeys) for Bubble.io app "${activeProject.name}".
Additional Instructions: ${customInstruction}.
Requirements: Organize workflows into User Journeys (Authentication, Operational Mutations, Payments & Webhooks) in Markdown tables.`;
          newMarkdown = (await AiDocNarrativeEngine.executeLlmPrompt(prompt, aiConfig)) || '';
        }
        if (!newMarkdown) {
          newMarkdown = await AiDocNarrativeEngine.generateWorkflowNarrative(extractedWorkflows, schema, aiConfig);
        }
      } else if (currentSection.id === 'sec_security') {
        if (customInstruction) {
          const prompt = `Rewrite and refine Chapter 4 (Security & Privacy Governance) for Bubble.io app "${activeProject.name}".
Additional Instructions: ${customInstruction}.
Requirements: Focus on Zero-Trust access control, Privacy Rules, field shielding, and OWASP for Bubble.io in Markdown.`;
          newMarkdown = (await AiDocNarrativeEngine.executeLlmPrompt(prompt, aiConfig)) || '';
        }
        if (!newMarkdown) {
          newMarkdown = await AiDocNarrativeEngine.generateSecurityNarrative(secRep, schema, aiConfig);
        }
      } else if (currentSection.id === 'sec_api') {
        const dataTypesSummary = (schema?.dataTypes || []).slice(0, 8).map(dt => dt.name).join(', ');
        const prompt = `Write an authoritative, complete Chapter 6: API Endpoints & Webhook Architecture for Bubble.io app "${activeProject.name}".
Entities: ${dataTypesSummary}.
Environment: ${activeProject.environment}.
${customInstruction ? `Specific Focus: ${customInstruction}.` : ''}
Include Data API endpoints (/api/1.1/obj/), Backend Webhooks (/api/1.1/wf/), payload specs, authentication headers, error codes, and rate limiting guidelines in Markdown tables.`;
        newMarkdown = (await AiDocNarrativeEngine.executeLlmPrompt(prompt, aiConfig)) || '';
      } else {
        // Custom chapters or others
        const prompt = `You are a Lead Software Architect. Re-generate and enhance the following technical documentation chapter for Bubble.io app "${activeProject.name}":
Chapter Title: ${currentSection.title}
Current Markdown:
${currentSection.markdownContent.slice(0, 1800)}

${customInstruction ? `Specific Instructions: ${customInstruction}` : 'Make the explanations clearer, more authoritative, and enhance with practical tables and checklists.'}
Provide the entire updated chapter in GitHub-Flavored Markdown.`;
        newMarkdown = (await AiDocNarrativeEngine.executeLlmPrompt(prompt, aiConfig)) || '';
      }

      if (newMarkdown && newMarkdown.trim().length > 50) {
        const updatedSections = docBook.sections.map(sec => {
          if (sec.id === currentSection.id) {
            return {
              ...sec,
              badge: 'AI Refined',
              markdownContent: newMarkdown.trim()
            };
          }
          return sec;
        });

        setDocBook({
          ...docBook,
          sections: updatedSections
        });

        setCustomSections(prev => prev.map(cs => cs.id === currentSection.id ? { ...cs, markdownContent: newMarkdown.trim() } : cs));

        toast.success(`Re-generated "${currentSection.title}" with AI!`);
        onLog('system', `Successfully re-generated chapter "${currentSection.title}" with AI.`, 'success');
        if (customInstruction) setRefineInstruction('');
      } else {
        toast.warn('AI re-generation returned empty or unchanged content.');
      }
    } catch (err) {
      console.error('Error re-generating chapter:', err);
      toast.error('Failed to re-generate chapter with AI.');
      onLog('system', `Error re-generating chapter: ${err}`, 'error');
    } finally {
      setIsRegeneratingChapter(false);
    }
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Community Feature #3: Mode Switcher (Narrative AI vs Raw Technical Dictionary) */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-input)',
              padding: '2px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              marginRight: '6px'
            }}>
              <button
                type="button"
                onClick={() => {
                  setDocMode('narrative');
                  compileDocumentation('narrative');
                }}
                className={`btn btn-xs ${docMode === 'narrative' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none', fontSize: '0.75rem', gap: '4px' }}
                title="Generates meaningful narrative text, domain roles, and user journeys"
              >
                <Sparkles size={12} color={docMode === 'narrative' ? '#fff' : 'var(--accent-cyan)'} />
                <span>AI Narrative Book</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDocMode('technical');
                  compileDocumentation('technical');
                }}
                className={`btn btn-xs ${docMode === 'technical' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none', fontSize: '0.75rem', gap: '4px' }}
                title="Standard compact technical tables and field listings"
              >
                <Database size={12} />
                <span>Raw Data Dictionary</span>
              </button>
            </div>

            {docMode === 'narrative' && (
              <span
                style={{
                  fontSize: '0.725rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  marginRight: '4px'
                }}
                title={`Configured Model: ${getEffectiveAiConfig().model || 'llama3:8b'} (${getEffectiveAiConfig().provider.toUpperCase()})`}
              >
                <Sparkles size={11} color="var(--primary)" />
                <span>Engine: <strong style={{ color: 'var(--text-primary)' }}>{getEffectiveAiConfig().provider === 'ollama' ? 'Local Ollama' : getEffectiveAiConfig().provider.toUpperCase()}</strong> ({getEffectiveAiConfig().model || 'Default'})</span>
              </span>
            )}

            <button onClick={() => compileDocumentation()} disabled={isGenerating} className="btn btn-secondary btn-sm">
              <RefreshCw size={13} className={isGenerating ? 'spin' : ''} />
              <span>{isGenerating ? 'Synthesizing...' : 'Recompile Book'}</span>
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

      {/* AI Synthesis Progress Notification Banner */}
      {isGenerating && aiProgress && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
          border: '1px solid var(--border-active)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--accent-cyan)" className="spin" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {aiProgress.step}
              </span>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {aiProgress.percent}%
            </span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              width: `${aiProgress.percent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #6366f1 0%, #06b6d4 100%)',
              borderRadius: '999px',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>
      )}

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
          <div className="responsive-split" style={{ gridTemplateColumns: '320px 1fr', alignItems: 'start' }}>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '520px', overflowY: 'auto' }}>
                {filteredSections.map(sec => {
                  const isSelected = sec.id === selectedSectionId;

                  return (
                    <button
                      key={sec.id}
                      onClick={() => setSelectedSectionId(sec.id)}
                      title={sec.title}
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
                        transition: 'all 0.15s ease',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', minWidth: 0, flex: 1 }}>
                        <span style={{ color: isSelected ? 'var(--primary)' : 'var(--text-muted)', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
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
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
                          {sec.title}
                        </span>
                      </div>

                      {sec.badge && (
                        <span className="badge badge-indigo" style={{ fontSize: '0.65rem', padding: '2px 7px', flexShrink: 0, marginLeft: '8px' }}>
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

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {/* View Mode Toggle: Formatted vs Raw */}
                      <div style={{
                        display: 'flex',
                        background: 'var(--bg-input)',
                        padding: '2px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        marginRight: '4px'
                      }}>
                        <button
                          type="button"
                          onClick={() => setReaderViewMode('rich')}
                          className={`btn btn-xs ${readerViewMode === 'rich' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ border: 'none', fontSize: '0.72rem', padding: '3px 8px', gap: '4px' }}
                          title="Formatted Reading View with tables and styling"
                        >
                          <Eye size={12} />
                          <span>Formatted</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setReaderViewMode('raw')}
                          className={`btn btn-xs ${readerViewMode === 'raw' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ border: 'none', fontSize: '0.72rem', padding: '3px 8px', gap: '4px' }}
                          title="Raw Markdown Source"
                        >
                          <FileCode size={12} />
                          <span>Raw MD</span>
                        </button>
                      </div>

                      {/* Re-generate this chapter with AI */}
                      {activeSection.id !== 'sec_erd' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <button
                            type="button"
                            onClick={() => handleRegenerateActiveChapter()}
                            disabled={isRegeneratingChapter}
                            className="btn btn-secondary btn-sm"
                            style={{ gap: '5px', fontSize: '0.775rem' }}
                            title="Re-synthesize only this specific chapter with AI"
                          >
                            <Sparkles size={13} className={isRegeneratingChapter ? 'spin' : ''} color="var(--accent-cyan)" />
                            <span>{isRegeneratingChapter ? 'Regenerating...' : 'Re-generate with AI'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowRefineBar(!showRefineBar)}
                            className={`btn btn-sm ${showRefineBar ? 'btn-primary' : 'btn-secondary'}`}
                            title="Open AI refinement prompt for this chapter"
                            style={{ padding: '6px 8px' }}
                          >
                            <Sliders size={13} />
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => handleCopy(activeSection.markdownContent, `Copied ${activeSection.title}`)}
                        className="btn btn-secondary btn-sm"
                      >
                        {copied ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
                        <span>Copy Markdown</span>
                      </button>
                    </div>
                  </div>

                  {/* Optional AI Refinement Prompt Bar */}
                  {showRefineBar && activeSection.id !== 'sec_erd' && (
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.06) 100%)',
                      border: '1px solid var(--border-active)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 14px',
                      marginBottom: '14px'
                    }}>
                      <Sparkles size={14} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
                      <input
                        type="text"
                        value={refineInstruction}
                        onChange={(e) => setRefineInstruction(e.target.value)}
                        placeholder={`Custom AI focus for "${activeSection.title}" (e.g. Expand with GDPR rules, add security checklist, simplify)...`}
                        className="input"
                        style={{ flex: 1, fontSize: '0.8rem', height: '32px' }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !isRegeneratingChapter) {
                            handleRegenerateActiveChapter(refineInstruction);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRegenerateActiveChapter(refineInstruction)}
                        disabled={isRegeneratingChapter || !refineInstruction.trim()}
                        className="btn btn-primary btn-sm"
                        style={{ whiteSpace: 'nowrap', gap: '5px', height: '32px' }}
                      >
                        <RefreshCw size={12} className={isRegeneratingChapter ? 'spin' : ''} />
                        <span>{isRegeneratingChapter ? 'Refining...' : 'Apply AI Refinement'}</span>
                      </button>
                    </div>
                  )}

                  {/* Render ERD or Markdown */}
                  {activeSection.id === 'sec_erd' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <MermaidViewer chart={erdDiagram} title="Interactive Database Entity Relationship Diagram" />
                    </div>
                  ) : readerViewMode === 'rich' ? (
                    <div
                      className="doc-markdown-content"
                      style={{
                        background: 'var(--bg-input)',
                        padding: '24px 28px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        flex: 1,
                        overflowY: 'auto',
                        maxHeight: '640px'
                      }}
                      dangerouslySetInnerHTML={{
                        __html: marked.parse(activeSection.markdownContent) as string
                      }}
                    />
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* AI Chapter Co-Pilot Box */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.06) 100%)',
                  border: '1px solid var(--border-active)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={16} color="var(--primary)" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        AI Chapter Co-Pilot
                      </span>
                    </div>
                    <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>
                      {getEffectiveAiConfig().provider.toUpperCase()} ({getEffectiveAiConfig().model || 'Default'})
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={aiChapterPrompt}
                      onChange={(e) => setAiChapterPrompt(e.target.value)}
                      placeholder="e.g. Write a Stripe Webhook & Payment Reconciliation Guide with code examples..."
                      className="input"
                      style={{ flex: 1, fontSize: '0.8rem' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isGeneratingAiChapter) {
                          handleGenerateAiCustomChapter();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleGenerateAiCustomChapter}
                      disabled={isGeneratingAiChapter || !aiChapterPrompt.trim()}
                      className="btn btn-primary btn-sm"
                      style={{ whiteSpace: 'nowrap', gap: '6px' }}
                    >
                      <Sparkles size={13} className={isGeneratingAiChapter ? 'spin' : ''} />
                      <span>{isGeneratingAiChapter ? 'Synthesizing...' : 'Draft with AI'}</span>
                    </button>
                  </div>

                  {/* Preset Quick Chips */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[
                      'Deployment & Rollback Runbook',
                      'Stripe Webhook & Idempotency Guide',
                      'Disaster Recovery & Backup Plan',
                      'User Acceptance Testing (UAT) Checklist'
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAiChapterPrompt(`Write a professional, authoritative ${preset} for ${activeProject.name}`)}
                        className="btn btn-secondary btn-xs"
                        style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px', border: '1px solid var(--border-subtle)' }}
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>
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
