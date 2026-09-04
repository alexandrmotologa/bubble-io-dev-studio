# 📚 1-Click Developer Documentation Book (DocGen) Guide (v3.3.9)

The **DocGen Engine** compiles full-scale technical documentation books for clients, development agencies, and internal engineering teams with a single click.

---

## 1. Dual-Mode Documentation: AI Narrative vs Raw Data Dictionary

In v3.3.9, DocGen offers a top toolbar mode switcher:

1. **✨ AI Narrative Book (Recommended)**:
   - Transforms dry schema columns into an engaging, cohesive architectural book.
   - **Semantic Domain Classification**: Automatically classifies the application (*E-Commerce*, *B2B Multi-Tenant SaaS*, *CRM & Operations*, *Social Communities*) based on AST entities and workflows, determining business missions and key actor personas.
   - **Chapter 1 — Executive Summary & Architectural Vision**: Explains the platform purpose, client/server hybrid boundaries, and reliability baselines.
   - **Chapter 2 — Data Architecture & Entity Lifecycles**: Details each database entity's business role, mutation lifecycles, foreign key graphs, and global Option Set state machines.
   - **Chapter 3 — User Journeys & Workflow Automation Chains**: Groups isolated workflows into coherent user stories (*Identity & Authentication Journey*, *Operational Domain Mutations*, *External Integrations & Webhooks*).
   - **Chapter 4 — Zero-Trust Security & Privacy Governance**: Clarifies Bubble's client-pull data risks and documents the server-side Privacy Rules policy.
   - **Multi-Provider AI & Offline Engine**: Supports **Google Gemini**, **OpenAI**, **Anthropic Claude**, **Groq**, local **Ollama** (`llama3:8b`), plus an intelligent heuristic synthesizer for 100% offline generation.

2. **📋 Raw Data Dictionary**:
   - The classic, compact mechanical reference listing tables, field matrices, types, constraints, and raw Option Set values.

---

## 2. Subtabs & Module Structure

The **DocGen Book** suite provides 4 specialized subtabs:

1. **📖 Interactive Book Reader**:
   - Multi-chapter technical specification reader with markdown preview, rendered Mermaid diagrams, code formatting, and search filter.
   - Comprehensive summary metrics: Total Database Entities, Mapped Workflows, API Endpoints, and Security RBAC Rules.

2. **📊 Architecture & Diagram Studio**:
   - **System Architecture Context Diagram**: High-level topology (Browser Client ➔ Cloud CDN ➔ Bubble App Engine ➔ PostgreSQL Database & External APIs).
   - **Database Entity Relationship Diagram (ERD)**: Interactive relational foreign keys, linked records, and table attributes.
   - **Backend Workflow Sequence Diagram**: Multi-actor event execution flow from client trigger to DB mutation.

3. **✏️ Custom Chapter Composer**:
   - Enable, disable, or reorder chapters in the generated documentation book.
   - Add custom technical sections:
     - *Architecture Decision Records (ADR)*
     - *Deployment & Release Runbooks*
     - *Third-Party Integration Keys & Setup Guides*

4. **🚀 Export & Client Handover Center**:
   - Export to **Markdown (`.md`)** for GitHub, GitBook, Obsidian, and Notion wikis.
   - Export to **Standalone HTML Manual (`.html`)** with embedded dark/light styling, marked.js, and Mermaid auto-rendering.
   - Export to **JSON Architecture Spec (`.json`)** for machine-readable AST schemas.
   - **Print Document / Save as PDF** formatted for formal client sign-offs and project handovers.

---

## 3. Generated Technical Chapters

The engine aggregates data across all studio modules into comprehensive chapters:

1. **Executive Summary & Overview**: App ID, active environment, custom domains, and architecture status summary.
2. **Database Schema & Data Dictionary**: Full entity specifications with field names, types, nullability, list flags, and global Option Sets.
3. **Entity-Relationship Diagram (ERD)**: Auto-generated Mermaid ERD diagram showing database relational structures.
4. **Privacy Rules & RBAC Matrix**: Security permissions per role (*Admin*, *Authenticated User*, *Guest*), search visibility, and field restrictions.
5. **API & Backend Workflows Catalog**: Standard Data API routes, Webhook listeners, and authentication policies.
6. **Workflows & Logic Automation**: Indexed page workflows, backend API workflows, and action chains.
7. **AI Localization & Language Matrix**: UI string volume, category breakdown, and sample translation dictionary.
8. **AST Code Health & Quality Scorecard**: Health grade, score %, and identified dead code items.
9. **Custom Chapters**: User-added Architecture Decision Records (ADR), runbooks, and guidelines.
