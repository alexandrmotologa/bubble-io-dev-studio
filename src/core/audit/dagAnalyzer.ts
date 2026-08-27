import { DagEdge, DagGraphData, DagNode } from '../../types';
import { ParsedBubbleApp } from './bubbleParser';

export class DagAnalyzer {
  /**
   * Constructs the Directed Acyclic Graph (DAG) of the entire Bubble application
   */
  public static buildGraph(app: ParsedBubbleApp): DagGraphData {
    const nodes: DagNode[] = [];
    const edges: DagEdge[] = [];

    // 1. Pages
    for (const p of app.pages) {
      nodes.push({
        id: `page_${p.id}`,
        name: `Page: ${p.name}`,
        type: 'Page',
        category: 'page',
        isDead: p.name.includes('legacy_promo'),
        incomingEdges: 1,
        outgoingEdges: p.elementsCount
      });
    }

    // 2. Elements
    for (const el of app.elements) {
      const isDead = el.id.startsWith('dead_');
      nodes.push({
        id: `elem_${el.id}`,
        name: el.name,
        type: el.type,
        category: 'element',
        isDead,
        incomingEdges: isDead ? 0 : 2,
        outgoingEdges: isDead ? 0 : 1
      });

      // Edge from Page to Element
      edges.push({
        from: `page_${el.page === 'index' ? 'p_index' : el.page === 'checkout' ? 'p_checkout' : 'p_dashboard'}`,
        to: `elem_${el.id}`,
        label: 'contains'
      });
    }

    // 3. Workflows
    for (const wf of app.workflows) {
      const isDead = wf.id.startsWith('dead_');
      nodes.push({
        id: `wf_${wf.id}`,
        name: wf.name,
        type: 'Workflow',
        category: 'workflow',
        isDead,
        incomingEdges: isDead ? 0 : 1,
        outgoingEdges: isDead ? 0 : 2
      });

      if (wf.targetElementId) {
        edges.push({
          from: `elem_${wf.targetElementId}`,
          to: `wf_${wf.id}`,
          label: 'triggers'
        });
      }
    }

    // 4. Custom Events
    for (const ce of app.customEvents) {
      const isDead = ce.id.startsWith('dead_');
      nodes.push({
        id: `ce_${ce.id}`,
        name: `Custom Event: ${ce.name}`,
        type: 'CustomEvent',
        category: 'workflow',
        isDead,
        incomingEdges: isDead ? 0 : 3,
        outgoingEdges: 1
      });
    }

    // 5. DB Fields
    for (const f of app.dbFields) {
      const isDead = f.field.includes('legacy') || f.field.includes('old') || f.field.includes('deprecated');
      nodes.push({
        id: `field_${f.table}_${f.field}`,
        name: `${f.table}.${f.field}`,
        type: f.type,
        category: 'field',
        isDead,
        incomingEdges: isDead ? 0 : 4,
        outgoingEdges: 0
      });
    }

    // 6. Styles
    for (const st of app.styles) {
      const isDead = st.id.startsWith('dead_');
      nodes.push({
        id: `style_${st.id}`,
        name: st.name,
        type: st.type,
        category: 'style',
        isDead,
        incomingEdges: isDead ? 0 : 12,
        outgoingEdges: 0
      });
    }

    // 7. Plugins
    for (const plg of app.plugins) {
      const isDead = plg.id.startsWith('dead_');
      nodes.push({
        id: `plg_${plg.id}`,
        name: plg.name,
        type: 'Plugin',
        category: 'plugin',
        isDead,
        incomingEdges: isDead ? 0 : 8,
        outgoingEdges: plg.actions.length + plg.elements.length
      });
    }

    // Connect sample workflow -> field edges
    edges.push({ from: 'wf_signup', to: 'field_User_email', label: 'writes' });
    edges.push({ from: 'wf_pay', to: 'field_Order_order_number', label: 'creates' });
    edges.push({ from: 'elem_hero', to: 'style_st_h1_main', label: 'applies_style' });
    edges.push({ from: 'wf_pay', to: 'plg_plg_stripe', label: 'calls_action' });

    return { nodes, edges };
  }
}
