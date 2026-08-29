# 📚 1-Click Developer Documentation Book (DocGen) Guide (v2.8.0-beta)

The **DocGen Engine** compiles full-scale technical documentation books for clients, development agencies, and internal engineering teams with a single click.

---

## 1. Subtabs & Module Structure

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

## 2. Generated Technical Chapters

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
