import { WorkflowEdge, WorkflowGraphData, WorkflowNode, WorkflowNodeType } from '../../types';

export class WorkflowGraphEngine {
  /**
   * Extracts and normalizes all workflows from a Bubble blueprint JSON
   */
  public static extractAllWorkflows(rawBlueprintJson?: any): {
    id: string;
    name: string;
    page: string;
    eventType: string;
    actionsCount: number;
    raw: any;
  }[] {
    const list: any[] = [];
    if (!rawBlueprintJson || typeof rawBlueprintJson !== 'object') return list;

    // 1. Page Workflows
    if (rawBlueprintJson.pages && typeof rawBlueprintJson.pages === 'object') {
      for (const [pageKey, pageData] of Object.entries<any>(rawBlueprintJson.pages)) {
        const pageName = pageData.name || pageKey;
        if (pageData.workflows && typeof pageData.workflows === 'object') {
          for (const [wfKey, wf] of Object.entries<any>(pageData.workflows)) {
            const rawActions = wf.actions ? (Array.isArray(wf.actions) ? wf.actions : Object.values(wf.actions)) : [];
            list.push({
              id: `${pageKey}_${wfKey}`,
              name: wf.name || (wf.element_name ? `When ${wf.element_name} is clicked` : `Workflow ${wfKey}`),
              page: pageName,
              eventType: wf.event_type || 'button_click',
              actionsCount: rawActions.length,
              raw: wf
            });
          }
        }
      }
    }

    // 2. Backend & API Workflows
    const backendWfs = rawBlueprintJson.api_workflows || rawBlueprintJson.backend_workflows || rawBlueprintJson.workflows;
    if (backendWfs && typeof backendWfs === 'object') {
      for (const [wfKey, wf] of Object.entries<any>(backendWfs)) {
        if (wf.is_api_workflow || wf.type === 'backend' || wf.event_type === 'api_endpoint') {
          const rawActions = wf.actions ? (Array.isArray(wf.actions) ? wf.actions : Object.values(wf.actions)) : [];
          list.push({
            id: `backend_${wfKey}`,
            name: wf.name || `API Workflow /${wfKey}`,
            page: 'Backend (Server)',
            eventType: 'api_endpoint',
            actionsCount: rawActions.length,
            raw: wf
          });
        }
      }
    }

    return list;
  }

  /**
   * Generates interactive node graph and optimization checks for a specific workflow
   */
  public static buildWorkflowGraph(workflow: {
    id: string;
    name: string;
    page: string;
    eventType: string;
    raw: any;
  }): WorkflowGraphData {
    const nodes: WorkflowNode[] = [];
    const edges: WorkflowEdge[] = [];
    const optimizationAdvice: string[] = [];

    // 1. Root Node: Event Trigger
    const rootId = `node_trigger_${workflow.id}`;
    const conditionText = workflow.raw?.condition || workflow.raw?.only_when;

    nodes.push({
      id: rootId,
      type: 'trigger',
      label: workflow.name,
      sublabel: `Event: ${workflow.eventType.replace(/_/g, ' ')}`,
      condition: conditionText || undefined,
      details: {
        page: workflow.page,
        eventType: workflow.eventType
      }
    });

    let prevNodeId = rootId;

    // 2. Parse Actions
    const rawActions = workflow.raw?.actions 
      ? (Array.isArray(workflow.raw.actions) ? workflow.raw.actions : Object.values(workflow.raw.actions))
      : [];

    let hasClientBlockingCalls = false;
    let clientEmailDetected = false;

    rawActions.forEach((action: any, idx: number) => {
      const nodeId = `node_action_${workflow.id}_${idx + 1}`;
      const actionType = this.classifyActionType(action);
      const isBlocking = ['db_write', 'api_call', 'email'].includes(actionType) && workflow.page !== 'Backend (Server)';
      const rawType = action.type || action.action_type || action.name || 'misc';
      const humanLabel = this.humanizeActionLabel(action, actionType, idx);
      const actionCondition = action.condition || action.only_when;

      if (isBlocking) hasClientBlockingCalls = true;
      if (actionType === 'email' && workflow.page !== 'Backend (Server)') clientEmailDetected = true;

      nodes.push({
        id: nodeId,
        type: actionType,
        label: `Step ${idx + 1}: ${humanLabel}`,
        sublabel: this.getActionSublabel(action, actionType),
        categoryName: this.getActionCategoryName(actionType),
        explanation: this.getActionExplanation(action, actionType, workflow.page === 'Backend (Server)'),
        rawType: String(rawType),
        condition: actionCondition || undefined,
        actionIndex: idx + 1,
        isBlockingClient: isBlocking,
        performanceImpact: this.getPerformanceImpact(actionType, isBlocking),
        executionLocation: workflow.page === 'Backend (Server)' ? 'Server (Backend)' : 'Client (Browser)',
        details: action.properties || action
      });

      edges.push({
        id: `edge_${prevNodeId}_${nodeId}`,
        from: prevNodeId,
        to: nodeId,
        label: actionCondition ? `Only when...` : undefined,
        isConditional: Boolean(actionCondition)
      });

      prevNodeId = nodeId;
    });

    // 3. Generate Optimization Advice
    if (rawActions.length > 5 && workflow.page !== 'Backend (Server)') {
      optimizationAdvice.push(
        `Heavy client workflow with ${rawActions.length} steps. Consider moving data processing to a Backend API Workflow to speed up UI responsiveness.`
      );
    }

    if (clientEmailDetected) {
      optimizationAdvice.push(
        `Email dispatch step detected on page workflow. Sending emails synchronously on the client freezes UI until SMTP delivery completes. Schedule this in Backend Workflows.`
      );
    }

    if (rawActions.some((a: any) => (a.properties?.search || a.properties?.type)?.includes('Do a search'))) {
      optimizationAdvice.push(
        `Nested search detected in action parameters. Ensure server-side constraints and sorting are applied to minimize Workload Units (WU).`
      );
    }

    return {
      workflowId: workflow.id,
      workflowName: workflow.name,
      pageName: workflow.page,
      eventType: workflow.eventType,
      nodes,
      edges,
      optimizationAdvice
    };
  }

  /**
   * Generates a Mermaid Flowchart diagram string from workflow graph data
   */
  public static generateMermaidFlowchart(graph: WorkflowGraphData): string {
    const lines: string[] = ['flowchart TD'];

    for (const node of graph.nodes) {
      const cleanLabel = node.label.replace(/"/g, "'");
      const sub = node.sublabel ? `\\n<small>${node.sublabel.replace(/"/g, "'")}</small>` : '';

      if (node.type === 'trigger') {
        lines.push(`    ${node.id}(["⚡ ${cleanLabel}${sub}"])`);
      } else if (node.type === 'db_write') {
        lines.push(`    ${node.id}["💾 ${cleanLabel}${sub}"]`);
      } else if (node.type === 'email') {
        lines.push(`    ${node.id}["✉️ ${cleanLabel}${sub}"]`);
      } else if (node.type === 'api_call') {
        lines.push(`    ${node.id}["🌐 ${cleanLabel}${sub}"]`);
      } else if (node.type === 'navigation') {
        lines.push(`    ${node.id}["🚀 ${cleanLabel}${sub}"]`);
      } else {
        lines.push(`    ${node.id}["⚙️ ${cleanLabel}${sub}"]`);
      }
    }

    for (const edge of graph.edges) {
      if (edge.label) {
        lines.push(`    ${edge.from} -->|"${edge.label}"| ${edge.to}`);
      } else {
        lines.push(`    ${edge.from} --> ${edge.to}`);
      }
    }

    // Mermaid styles
    lines.push('    classDef triggerStyle fill:#6366f1,stroke:#4f46e5,stroke-width:2px,color:#fff;');
    lines.push('    classDef dbStyle fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff;');
    lines.push('    classDef apiStyle fill:#06b6d4,stroke:#0891b2,stroke-width:2px,color:#fff;');
    lines.push('    classDef emailStyle fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff;');
    lines.push('    classDef navStyle fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#fff;');

    return lines.join('\n');
  }

  private static classifyActionType(action: any): WorkflowNodeType {
    const rawType = (action.type || action.name || action.action_type || '').toLowerCase();

    if (rawType.includes('create') || rawType.includes('modify') || rawType.includes('delete') || rawType.includes('set_thing') || rawType.includes('change')) {
      return 'db_write';
    }
    if (rawType.includes('email') || rawType.includes('send_mail')) {
      return 'email';
    }
    if (rawType.includes('api') || rawType.includes('webhook') || rawType.includes('http') || rawType.includes('connector') || rawType.includes('schedule')) {
      return 'api_call';
    }
    if (rawType.includes('custom_event') || rawType.includes('trigger_event')) {
      return 'custom_event';
    }
    if (rawType.includes('navigate') || rawType.includes('go_to_page') || rawType.includes('redirect')) {
      return 'navigation';
    }
    if (rawType.includes('plugin')) {
      return 'plugin_action';
    }
    return 'misc';
  }

  public static humanizeActionLabel(action: any, type: WorkflowNodeType, idx: number): string {
    const raw = (action.type || action.action_type || action.name || '').toLowerCase();
    const props = action.properties || action;

    if (raw.includes('create')) {
      return `Create a New ${props.type || props.data_type || 'Thing'}`;
    }
    if (raw.includes('changeuser') || (raw.includes('change') && raw.includes('user'))) {
      return 'Make Changes to Current User';
    }
    if (raw.includes('change') || raw.includes('modify')) {
      return `Make Changes to ${props.type || props.data_type || 'Record'}`;
    }
    if (raw.includes('delete')) {
      return `Delete ${props.type || props.data_type || 'Record'}`;
    }
    if (raw.includes('email') || raw.includes('send_mail')) {
      return `Send Email (${props.to || props.recipient || 'User'})`;
    }
    if (raw.includes('customstate') || raw.includes('custom_state') || raw.includes('set_state')) {
      return `Set Custom State (${props.custom_state || props.state || 'State'})`;
    }
    if (raw.includes('show') || raw.includes('display')) {
      return `Show Element (${props.element || props.element_name || 'Popup/Group'})`;
    }
    if (raw.includes('hide')) {
      return `Hide Element (${props.element || props.element_name || 'Popup/Group'})`;
    }
    if (raw.includes('reset') || raw.includes('clear')) {
      return `Reset Group / Form Inputs`;
    }
    if (raw.includes('schedule')) {
      return `Schedule API Workflow (${props.workflow || props.endpoint || 'Backend'})`;
    }
    if (raw.includes('navigate') || raw.includes('go_to_page') || raw.includes('redirect')) {
      return `Navigate to Page '${props.destination_page || props.page || 'Page'}'`;
    }
    if (raw.includes('api') || raw.includes('webhook') || raw.includes('connector')) {
      return `Call API Endpoint (${props.service || props.endpoint || 'Service'})`;
    }
    if (raw.includes('custom_event') || raw.includes('trigger_event')) {
      return `Trigger Custom Event '${props.event || props.name || 'Event'}'`;
    }
    if (raw.includes('animate')) {
      return `Animate Element (${props.animation || 'Animation'})`;
    }
    if (raw.includes('scroll')) {
      return `Scroll to Element (${props.element || 'Section'})`;
    }

    if (action.name && typeof action.name === 'string' && action.name.trim().length > 0) {
      return action.name;
    }
    if (action.action_name && typeof action.action_name === 'string' && action.action_name.trim().length > 0) {
      return action.action_name;
    }

    return `Action Step ${idx + 1}`;
  }

  public static getActionCategoryName(type: WorkflowNodeType): string {
    switch (type) {
      case 'trigger': return '⚡ Event Trigger';
      case 'db_write': return '💾 Database Write (CRUD)';
      case 'email': return '✉️ Email Delivery';
      case 'api_call': return '🌐 External API / Webhook';
      case 'navigation': return '🚀 Page Navigation';
      case 'custom_event': return '🔀 Custom Event';
      case 'plugin_action': return '🔌 Plugin Action';
      case 'misc': return '⚙️ UI & Local State Action (Miscellaneous)';
      default: return 'Action Step';
    }
  }

  public static getActionExplanation(action: any, type: WorkflowNodeType, isBackend: boolean): string {
    const raw = (action.type || action.action_type || action.name || '').toLowerCase();
    const props = action.properties || action;

    if (type === 'trigger') {
      return 'Fires whenever the user interacts with this page element or when the system event is triggered.';
    }
    if (type === 'db_write') {
      return `Modifies Bubble database records for type '${props.type || props.data_type || 'Thing'}'. Consumes database Workload Units (WU) and updates live database storage.`;
    }
    if (type === 'email') {
      return 'Dispatches an SMTP email through SendGrid or configured mail server. On client-side workflows, this may cause UI freeze while waiting for server delivery confirmation.';
    }
    if (type === 'api_call') {
      return 'Executes an HTTP REST or GraphQL call to an external service or schedules a background backend workflow.';
    }
    if (type === 'navigation') {
      return `Redirects the user's browser session to '${props.destination_page || props.page || 'another page'}', passing configured URL parameters.`;
    }
    if (type === 'custom_event') {
      return 'Triggers a modular Custom Event defined in the workflow tab for clean separation of concerns.';
    }
    if (type === 'plugin_action') {
      return 'Executes custom JavaScript logic provided by an installed Bubble plugin.';
    }
    if (raw.includes('state')) {
      return 'Updates a temporary Custom State in browser memory (0 WU cost, instantaneous execution, lost on page refresh).';
    }
    if (raw.includes('show') || raw.includes('hide') || raw.includes('reset') || raw.includes('animate')) {
      return 'Controls visual interface elements (popups, groups, inputs) in the DOM without database requests.';
    }
    return 'Executes an in-memory or interface utility step in the client browser session.';
  }

  public static getPerformanceImpact(type: WorkflowNodeType, isBlocking: boolean): string {
    if (isBlocking && type === 'db_write') {
      return '⚠️ High Latency: Client blocks and waits for Bubble database write confirmation over network.';
    }
    if (isBlocking && type === 'email') {
      return '⚠️ Critical Latency: Synchronous SMTP delivery halts browser UI thread for 1-3 seconds.';
    }
    if (type === 'api_call') {
      return '🌐 Network Dependent: Dependent on external API response latency and payload size.';
    }
    if (type === 'misc') {
      return '⚡ Instantaneous: In-memory browser operation (0ms network delay, 0 WU cost).';
    }
    if (type === 'navigation') {
      return '🚀 Page Route: Unloads current page DOM and navigates to target route.';
    }
    return 'Normal execution speed.';
  }

  private static getActionSublabel(action: any, type: WorkflowNodeType): string {
    const props = action.properties || action;
    if (type === 'db_write') {
      return `Target Type: ${props.type || props.data_type || 'Thing'}`;
    }
    if (type === 'email') {
      return `Recipient: ${props.to || props.recipient || 'User Email'}`;
    }
    if (type === 'api_call') {
      return `Endpoint: ${props.service || props.endpoint || 'External Service'}`;
    }
    if (type === 'navigation') {
      return `Destination: ${props.destination_page || props.page || 'Page'}`;
    }
    if (type === 'misc') {
      return 'UI & Local State';
    }
    return type.replace(/_/g, ' ').toUpperCase();
  }
}
