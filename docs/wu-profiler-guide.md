# ⚡ Workload Units (WU) & Query Profiler Guide (v3.3.8)

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

1. **Unconstrained Searches**:
   - *Detection*: Searches without constraints that pull an unbounded number of rows to the client.
   - *Fix*: Add strict indexed constraints or limit results with `:items until #`.
2. **Heavy Repeating Groups**:
   - *Detection*: Repeating groups displaying large media or nested data types without pagination.
   - *Fix*: Enable "Show items as they load" or implement infinite scroll pagination.
3. **Redundant Workflow Triggers**:
   - *Detection*: Workflows firing multiple times per user action.
   - *Fix*: Debounce input events and add condition boundaries (`Only when...`).

---

## 3. Cost Projection & WU Estimator

* Projected monthly consumption tier based on active users and data volume.
* Recommended Bubble hosting plan (Starter, Growth, Team, Enterprise).
* Actionable optimization checklist ranked by potential WU dollar savings.
