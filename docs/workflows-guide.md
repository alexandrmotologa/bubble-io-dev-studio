# Workflow Flowchart & Logic Guide

The Workflow Flowchart module renders Bubble action chains as node graphs, showing execution order, conditional branches, and potential performance bottlenecks.

---

## 1. Flowchart Node Hierarchy

Workflows in Bubble execute in sequence. The engine classifies steps into node types:

```mermaid
flowchart TD
    T(["Button Submit is clicked"]):::triggerStyle --> C{"Only when Current User is logged in"}
    C -->|Yes| DB["Step 1: Create a new Order"]:::dbStyle
    DB --> EM["Step 2: Send confirmation email"]:::emailStyle
    EM --> NAV["Step 3: Go to page /dashboard"]:::navStyle

    classDef triggerStyle fill:#6366f1,stroke:#4f46e5,stroke-width:2px,color:#fff;
    classDef dbStyle fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff;
    classDef emailStyle fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff;
    classDef navStyle fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#fff;
```

### Supported Node Types
* **Trigger Node**: Click events, input value changes, page loads, or API endpoint invocations.
* **Database Write**: `Create a new thing`, `Make changes to thing`, `Delete thing`, or `Set list`.
* **Email Dispatch**: Standard email actions or third-party template dispatches.
* **API Call**: Bubble API Connector requests, webhooks, and HTTP calls.
* **Navigation & UI**: `Go to page`, `Show element`, `Hide element`, or `Toggle popup`.
* **Custom Event / Plugin**: Internal custom events and plugin actions.

---

## 2. Action Inspection Drawer

Clicking any node opens a side drawer to inspect:
* Target element name, action category, and execution index.
* Action parameters, dynamic expressions, and field mappings.
* `"Only when..."` conditional expressions.

---

## 3. Performance & Bottleneck Diagnostics

The workflow analyzer checks for common anti-patterns:

1. **Synchronous Frontend Emails**:
   - *Problem*: Triggering `Send email` in a page workflow pauses UI interactions until the SMTP request completes.
   - *Recommendation*: Use `Schedule API Workflow` to send emails in the background on the server.
2. **Heavy Multi-Step Workflows**:
   - *Problem*: Workflows containing many sequential operations on the client can cause laggy page responses.
   - *Recommendation*: Move multi-step data mutations into a single Backend API Workflow.
3. **Unconstrained Nested Searches**:
   - *Problem*: Using `Do a search for` inside action parameters without limits or filters increases Workload Units (WU).
   - *Recommendation*: Constrain searches to indexed fields and paginate results.

---

## 4. Mermaid Diagram Export

Click **Copy Diagram** to export the Mermaid flowchart syntax for pull requests, wikis, or project documentation.
