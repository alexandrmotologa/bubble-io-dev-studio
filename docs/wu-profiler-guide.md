# ⚡ Workload Units (WU) & Query Profiler Guide

The **Workload Units (WU) & Query Profiler** helps you monitor, optimize, and reduce hosting costs on Bubble.io by pinpointing unindexed searches, nested loops, and memory-heavy workflows.

---

## 1. How Bubble Workload Units (WU) Are Estimated

Workload Units reflect the CPU, database, and bandwidth resources consumed by an application:

$$\text{Estimated Monthly WU} = \sum (\text{Search Volume} \times \text{Row Weight}) + \text{Workflow Multipliers}$$

| Operation Type | WU Weight | Optimization Strategy |
| :--- | :--- | :--- |
| **Unconstrained Search** | Very High | Add server-side constraints (e.g. `Created By = Current User`) |
| **Client-Side Filtering** | High | Use `:filtered` sparingly; prefer server-side search constraints |
| **Bulk Unbatched Updates** | High | Use `Schedule API Workflow on a list` with delay intervals |
| **N+1 Nested Repeating Groups** | Critical | Flatten nested repeating groups into single aggregated searches |

---

## 2. Query Bottlenecks & Fix Recommendations

The profiler identifies performance bottlenecks across your app:

1. **Unconstrained Repeating Group Searches**:
   - *Detection*: Repeating groups searching all records without pagination limits.
   - *Fix*: Set a fixed `Items per page` limit and add a search constraint.
2. **Heavy Backend API Workflows**:
   - *Detection*: Workflows executing multiple consecutive database updates per event.
   - *Fix*: Combine multiple `Make changes to thing` actions into a single atomic change step.

---

## 3. Client vs. Server Processing Ratio

The dashboard illustrates the balance between browser-rendered queries and server-executed jobs. Maintaining a 20% Client / 80% Server ratio ensures optimal mobile performance and minimal client memory consumption.
