# Workload Units (WU) & Query Profiler Guide

The Workload Units (WU) & Query Profiler estimates capacity consumption and highlights unindexed searches, nested loops, and heavy workflows in your Bubble application.

---

## 1. How Workload Units (WU) Are Estimated

Workload Units measure the server CPU, database operations, and bandwidth consumed by your application:

$$\text{Estimated Monthly WU} = \sum (\text{Search Volume} \times \text{Row Weight}) + \text{Workflow Multipliers}$$

| Operation Type | Resource Usage | Recommendation |
| :--- | :--- | :--- |
| **Unconstrained Search** | Very High | Add server-side constraints (e.g., `Created By = Current User`) |
| **Client-Side Filtering** | High | Minimize `:filtered`; use server-side search constraints where possible |
| **Bulk Unbatched Updates** | High | Use `Schedule API Workflow on a list` with reasonable spacing |
| **Nested Repeating Groups** | High | Flatten nested repeating groups into single aggregated queries |

---

## 2. Query Bottlenecks & Remediation

The profiler checks for common performance issues across your blueprint:

1. **Unconstrained Searches**:
   - *Issue*: Searches without constraints fetch all matching rows from the server to the browser.
   - *Fix*: Add indexed constraints or limit row count with `:items until #`.
2. **Heavy Repeating Groups**:
   - *Issue*: Repeating groups rendering media or complex nested records without pagination.
   - *Fix*: Enable "Show items as they load" or use infinite scroll pagination.
3. **Repeated Workflow Triggers**:
   - *Issue*: Workflows firing multiple times during rapid user inputs.
   - *Fix*: Debounce input change events and add condition guards (`Only when...`).

---

## 3. Cost Projections

* Estimates monthly WU consumption based on active user volume and data operations.
* Suggests appropriate Bubble plan tiers (Starter, Growth, Team, Enterprise) for your expected load.
* Lists prioritized optimization steps ranked by potential WU savings.
