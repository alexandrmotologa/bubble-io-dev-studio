# Developer Documentation Generator (DocGen) Guide

The DocGen Engine compiles technical documentation for Bubble applications, including data dictionaries, architectural overviews, and API references.

---

## 1. Documentation Modes

DocGen provides two modes via the top toolbar:

### Architectural Narrative Mode
- Generates contextual documentation describing the application purpose, user roles, data architecture, and security policies based on the application AST.
- **Domain Classification**: Categorizes the application (such as E-Commerce, B2B SaaS, CRM, or Community Portal) from its database entities and workflows.
- **Chapter 1, Executive Summary**: Describes platform goals, user boundaries, and system topology.
- **Chapter 2, Data Architecture**: Details database tables, mutation lifecycles, foreign key relations, and Option Sets.
- **Chapter 3, Workflows & Automations**: Groups workflows into coherent flows (authentication, data mutations, and external webhook integrations).
- **Chapter 4, Security Governance**: Documents data privacy policies, access rules, and client-side exposure risks.
- **Provider Support**: Works with Google Gemini, OpenAI, Anthropic Claude, Groq, local Ollama (`llama3:8b`), or a deterministic offline synthesizer.

### Raw Data Dictionary Mode
- A concise reference listing tables, field specifications, data types, constraints, and raw Option Set values.

---

## 2. Module Sections

The DocGen suite includes four tabs:

### 1. Document Reader
- **Formatted Preview**: HTML rendering of Markdown tables, headings, blockquotes, and code blocks.
- **Markdown Toggle**: Switch between formatted preview and raw Markdown source.
- **Per-Chapter Re-generation**: Re-generate the active chapter using updated project AST data.
- **Refinement Bar**: Enter custom focus prompts (such as "Emphasize GDPR compliance" or "Detail payment webhook retry policy").
- **Metric Cards**: Quick counts for database entities, workflows, API routes, and privacy rules.

### 2. Architecture & Diagram Studio
- **System Context Diagram**: Top-level topology diagram (browser client, CDN, Bubble engine, database, and external APIs).
- **Entity Relationship Diagram (ERD)**: Interactive diagram showing relational links and table attributes.
- **Sequence Diagram**: Execution flow from user triggers to database writes.
- **High-Resolution Graphic Export**:
  - Direct vector SVG download for lossless scaling in documentation.
  - Raster PNG export at 2x Retina (192 DPI) and 3x Ultra-DPI (288 DPI) with anti-aliasing.
  - One-click clipboard copy to paste diagrams directly into Slack, Figma, Notion, or presentations.

### 3. Custom Chapter Composer
- Add custom technical sections, such as:
  - Architecture Decision Records (ADRs)
  - Deployment and release runbooks
  - Third-party integration guides and credentials checklists
- Reorder, enable, or disable chapters in the generated document.

### 4. Export Options
- **Markdown (`.md`)**: Compatible with GitHub, GitBook, Obsidian, and Notion.
- **Standalone HTML (`.html`)**: Complete HTML file with embedded styling and Mermaid diagram rendering.
- **JSON Specification (`.json`)**: Machine-readable schema export.
- **Print to PDF**: Formatted layout for print or saving as PDF.
- **Vector & Raster Images**: SVG and 2x/3x PNG exports for ERDs, sequence diagrams, and flowcharts.

---

## 3. Standard Chapter Structure

When compiling a complete book, the generator includes:

1. **Executive Summary**: App ID, active environment, custom domains, and architecture overview.
2. **Database Schema & Data Dictionary**: Entity definitions with field names, types, nullability, and Option Sets.
3. **Entity-Relationship Diagram**: Mermaid ERD of database relations.
4. **Privacy Rules & RBAC Matrix**: Access permissions per user role (Admin, Authenticated User, Guest).
5. **API & Backend Workflows**: Data API endpoints, webhook listeners, and authentication settings.
6. **Workflows & Logic Automation**: Page workflows, backend workflows, and action sequences.
7. **AI Localization**: String volume, category breakdowns, and translation dictionary.
8. **AST Code Health Scorecard**: Health score percentage, grade, and identified unused elements.
9. **Custom Chapters**: User-authored runbooks and architecture notes.
