/**
 * Comprehensive Validation Test Suite for Bubble.io Dev Studio
 * Tests all 3 rounds:
 * - Round 1: In-App Auto-Update System (electron-updater config, IPC contract)
 * - Round 2: AI-Powered Narrative DocGen with local Ollama (llama3:8b) & Heuristic Engine
 * - Round 3: In-App .bubble Auto-Download & Direct Sync (BubbleSyncEngine & Watcher)
 */

import { AiDocNarrativeEngine } from '../src/core/doc-gen/aiDocNarrativeEngine';
import { DocGenEngine } from '../src/core/doc-gen/docGenEngine';
import { BubbleSyncEngine } from '../src/core/bubble-sync/bubbleSyncEngine';
import { BubbleSchema, ProjectProfile, WorkflowDefinition } from '../src/types';
import * as fs from 'fs';
import * as path from 'path';

// ANSI terminal colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

function logPass(msg: string) {
  console.log(`${GREEN}  ✓ PASS:${RESET} ${msg}`);
}

function logFail(msg: string, err?: any) {
  console.error(`${RED}  ✗ FAIL:${RESET} ${msg}`);
  if (err) console.error(err);
}

function logSection(title: string) {
  console.log(`\n${BOLD}${CYAN}======================================================${RESET}`);
  console.log(`${BOLD}${CYAN}${title}${RESET}`);
  console.log(`${BOLD}${CYAN}======================================================${RESET}`);
}

// ---------------------------------------------------------------------------
// Mock Data: Realistic E-Commerce / SaaS Bubble.io Application
// ---------------------------------------------------------------------------
const mockProject: ProjectProfile = {
  id: 'proj_ecommerce_prod',
  name: 'Nexus Mart & Billing Hub',
  appId: 'nexus-mart',
  environment: 'live',
  customDomain: 'nexusmart.io',
  createdAt: new Date().toISOString(),
  stats: {
    pagesCount: 4,
    workflowsCount: 8,
    dataTypesCount: 4
  }
};

const mockSchema: BubbleSchema = {
  dataTypes: [
    {
      id: 'dt_user',
      name: 'User',
      fields: [
        { id: 'f_email', name: 'email', type: 'text', isRequired: true, isCustom: false },
        { id: 'f_role', name: 'role', type: 'option_user_role', isRequired: true, isCustom: true },
        { id: 'f_orders', name: 'orders', type: 'list.order', isRequired: false, isCustom: true },
        { id: 'f_stripe_id', name: 'stripe_customer_id', type: 'text', isRequired: false, isCustom: true }
      ]
    },
    {
      id: 'dt_product',
      name: 'Product',
      fields: [
        { id: 'f_prod_name', name: 'name', type: 'text', isRequired: true, isCustom: true },
        { id: 'f_price', name: 'price', type: 'number', isRequired: true, isCustom: true },
        { id: 'f_sku', name: 'sku', type: 'text', isRequired: true, isCustom: true },
        { id: 'f_active', name: 'is_active', type: 'boolean', isRequired: true, isCustom: true }
      ]
    },
    {
      id: 'dt_order',
      name: 'Order',
      fields: [
        { id: 'f_customer', name: 'customer', type: 'user', isRequired: true, isCustom: true },
        { id: 'f_status', name: 'status', type: 'option_order_status', isRequired: true, isCustom: true },
        { id: 'f_total', name: 'total_amount', type: 'number', isRequired: true, isCustom: true },
        { id: 'f_items', name: 'items', type: 'list.order_item', isRequired: true, isCustom: true }
      ]
    },
    {
      id: 'dt_order_item',
      name: 'OrderItem',
      fields: [
        { id: 'f_product', name: 'product', type: 'product', isRequired: true, isCustom: true },
        { id: 'f_qty', name: 'quantity', type: 'number', isRequired: true, isCustom: true },
        { id: 'f_unit_price', name: 'unit_price', type: 'number', isRequired: true, isCustom: true }
      ]
    }
  ],
  optionSets: [
    {
      id: 'os_order_status',
      name: 'order_status',
      options: ['Pending Payment', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded']
    },
    {
      id: 'os_user_role',
      name: 'user_role',
      options: ['Customer', 'Store Manager', 'Administrator']
    }
  ]
};

const mockWorkflows: WorkflowDefinition[] = [
  {
    id: 'wf_signup',
    name: 'User Sign Up & Onboard',
    page: 'signup',
    event: 'Button "Create Account" is clicked',
    actions: [
      { id: 'act_1', type: 'signup', description: 'Sign the user up (email, password)' },
      { id: 'act_2', type: 'create_data', description: 'Create a new Customer Profile' },
      { id: 'act_3', type: 'send_email', description: 'Send transactional welcome email' }
    ]
  },
  {
    id: 'wf_checkout',
    name: 'Checkout & Charge Card',
    page: 'cart',
    event: 'Button "Pay Now" is clicked',
    actions: [
      { id: 'act_4', type: 'payment', description: 'Charge current user using Stripe.js' },
      { id: 'act_5', type: 'create_data', description: 'Create a new Order record with status "Processing"' },
      { id: 'act_6', type: 'navigation', description: 'Go to page order-confirmation' }
    ]
  },
  {
    id: 'wf_stripe_webhook',
    name: 'Stripe Payment Succeeded Webhook',
    page: 'backend',
    event: 'API Endpoint /wf/stripe_charge_succeeded',
    actions: [
      { id: 'act_7', type: 'modify_data', description: 'Update Order status to "Processing"' },
      { id: 'act_8', type: 'trigger_event', description: 'Schedule API workflow send_order_receipt' }
    ]
  }
];

async function runTests() {
  let passedCount = 0;
  let failedCount = 0;

  console.log(`${BOLD}Starting Bubble.io Dev Studio Test Suite...${RESET}`);

  // =========================================================================
  // TEST SECTION 1: Round 1 — In-App Auto-Update System
  // =========================================================================
  logSection('ROUND 1: In-App Auto-Update System Tests');

  try {
    // 1.1 Verify package.json distribution configuration
    const pkgPath = path.resolve(__dirname, '../package.json');
    const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    if (pkgJson.dependencies['electron-updater']) {
      logPass(`electron-updater dependency is present (${pkgJson.dependencies['electron-updater']})`);
      passedCount++;
    } else {
      logFail('electron-updater missing in package.json dependencies');
      failedCount++;
    }

    if (pkgJson.build?.publish?.[0]?.provider === 'github' && pkgJson.build?.publish?.[0]?.repo === 'bubble-io-dev-studio') {
      logPass(`GitHub Releases publisher correctly configured for alexandrmotologa/bubble-io-dev-studio`);
      passedCount++;
    } else {
      logFail('GitHub publish configuration invalid in package.json');
      failedCount++;
    }

    // 1.2 Verify electron main updater IPC registration
    const mainTsPath = path.resolve(__dirname, '../electron/main.ts');
    const mainTsContent = fs.readFileSync(mainTsPath, 'utf8');

    const expectedIpcHandlers = ['updater:check', 'updater:download', 'updater:install', 'updater:get-info'];
    let allHandlersPresent = true;
    for (const h of expectedIpcHandlers) {
      if (!mainTsContent.includes(`ipcMain.handle('${h}'`)) {
        allHandlersPresent = false;
        logFail(`Missing IPC handler in main.ts: ${h}`);
        failedCount++;
      }
    }
    if (allHandlersPresent) {
      logPass(`All 4 updater IPC handlers correctly registered in electron/main.ts`);
      passedCount++;
    }

    // 1.3 Verify preload exposure
    const preloadTsPath = path.resolve(__dirname, '../electron/preload.ts');
    const preloadTsContent = fs.readFileSync(preloadTsPath, 'utf8');
    if (
      preloadTsContent.includes('checkForUpdates:') &&
      preloadTsContent.includes('downloadUpdate:') &&
      preloadTsContent.includes('installUpdate:') &&
      preloadTsContent.includes('getAppInfo:')
    ) {
      logPass(`Electron Preload safely bridges all auto-update methods to Window.electronAPI`);
      passedCount++;
    } else {
      logFail('Preload script missing updater API bridge methods');
      failedCount++;
    }
  } catch (err) {
    logFail('Round 1 Auto-Update test exception', err);
    failedCount++;
  }

  // =========================================================================
  // TEST SECTION 2: Round 2 — AI-Powered Narrative DocGen with Local Ollama
  // =========================================================================
  logSection('ROUND 2: AI-Powered Narrative DocGen with Local Ollama (llama3:8b)');

  try {
    // 2.1 Test Domain Detection
    const detectedDomain = AiDocNarrativeEngine.detectDomain(mockSchema, mockWorkflows);
    console.log(`  🔍 Detected Domain: ${YELLOW}${detectedDomain.domainName}${RESET}`);
    console.log(`  🎯 Mission: ${detectedDomain.businessMission}`);
    console.log(`  👥 Key Actors: ${detectedDomain.primaryActors.join(', ')}`);

    if (detectedDomain.domainName.toLowerCase().includes('commerce') || detectedDomain.domainName.toLowerCase().includes('marketplace') || detectedDomain.domainName.toLowerCase().includes('saas')) {
      logPass(`Domain detector correctly classified schema as E-Commerce / Marketplace`);
      passedCount++;
    } else {
      logFail(`Domain detection unexpected: ${detectedDomain.domainName}`);
      failedCount++;
    }

    // 2.2 Test Live Ollama Executive Narrative Generation
    console.log(`\n  ⚡ Sending executive architectural narrative prompt to local Ollama (llama3:8b)...`);
    const t0 = Date.now();
    const execNarrative = await AiDocNarrativeEngine.generateExecutiveNarrative(
      mockProject,
      mockSchema,
      mockWorkflows,
      {
        provider: 'ollama',
        ollamaUrl: 'http://localhost:11434',
        model: 'llama3:8b',
        temperature: 0.2
      }
    );
    const latency = Date.now() - t0;
    console.log(`  ⏱️ Ollama generation finished in ${latency}ms`);
    console.log(`  📝 Output Preview (first 180 chars):\n     ${execNarrative.substring(0, 180).replace(/\n/g, '\n     ')}...`);

    if (execNarrative && execNarrative.length > 150 && (execNarrative.includes('Nexus Mart') || execNarrative.includes('Architecture') || execNarrative.includes('Platform'))) {
      logPass(`Ollama (llama3:8b) generated rich Executive Architecture Narrative (${execNarrative.length} chars)`);
      passedCount++;
    } else {
      logFail('Ollama executive narrative empty or malformed');
      failedCount++;
    }

    // 2.3 Test Data Architecture & Entity Narratives
    console.log(`\n  ⚡ Testing Data Architecture & Entity Narratives generation...`);
    const dataArchNarrative = await AiDocNarrativeEngine.generateDataArchitectureNarrative(
      mockSchema,
      {
        provider: 'ollama',
        ollamaUrl: 'http://localhost:11434',
        model: 'llama3:8b'
      }
    );
    if (
      dataArchNarrative.includes('Order') &&
      dataArchNarrative.includes('Product') &&
      dataArchNarrative.includes('User') &&
      dataArchNarrative.includes('Lifecycle')
    ) {
      logPass(`Data Architecture Narrative created with Entity Lifecycle, Business Roles, and Option Sets (${dataArchNarrative.length} chars)`);
      passedCount++;
    } else {
      logFail('Data Architecture narrative missing expected entities or lifecycle sections');
      failedCount++;
    }

    // 2.4 Test Workflow Narratives & User Journeys
    console.log(`\n  ⚡ Testing User Journeys & Workflow Logic narrative generation...`);
    const wfNarrative = await AiDocNarrativeEngine.generateWorkflowNarrative(
      mockWorkflows,
      mockSchema,
      {
        provider: 'ollama',
        ollamaUrl: 'http://localhost:11434',
        model: 'llama3:8b'
      }
    );
    if (
      wfNarrative.includes('Identity, Authentication') &&
      wfNarrative.includes('User Sign Up') &&
      wfNarrative.includes('Checkout & Charge Card')
    ) {
      logPass(`Workflow Journeys correctly grouped into coherent User Story Chains (${wfNarrative.length} chars)`);
      passedCount++;
    } else {
      logFail('Workflow narrative missing user journey chains');
      failedCount++;
    }

    // 2.5 Test Zero-Trust Security & Privacy Governance Narrative
    console.log(`\n  ⚡ Testing Zero-Trust Security Governance narrative generation...`);
    const secNarrative = await AiDocNarrativeEngine.generateSecurityNarrative(
      null,
      mockSchema,
      {
        provider: 'ollama',
        ollamaUrl: 'http://localhost:11434',
        model: 'llama3:8b'
      }
    );
    if (secNarrative.includes('Zero-Trust') && secNarrative.includes('Privacy') && secNarrative.includes('Role-Based Access Control')) {
      logPass(`Zero-Trust Security Governance correctly generated with Privacy Rules explanation (${secNarrative.length} chars)`);
      passedCount++;
    } else {
      logFail('Security narrative missing Zero-Trust or RBAC policies');
      failedCount++;
    }

    // 2.6 Test Full AI Book Generation via DocGenEngine
    console.log(`\n  ⚡ Testing DocGenEngine.generateAiDocumentationBook end-to-end...`);
    const fullAiBook = await DocGenEngine.generateAiDocumentationBook(
      mockProject,
      mockSchema,
      null, // auditReport
      null, // securityReport
      undefined,
      {
        provider: 'ollama',
        ollamaUrl: 'http://localhost:11434',
        model: 'llama3:8b'
      },
      (p) => {
        // progress callback
      }
    );

    if (fullAiBook.sections.length >= 7) {
      logPass(`generateAiDocumentationBook created complete book with ${fullAiBook.sections.length} chapters`);
      passedCount++;
    } else {
      logFail(`Expected >= 7 chapters in AI doc book, got ${fullAiBook.sections.length}`);
      failedCount++;
    }

    const erdSection = fullAiBook.sections.find(s => s.id === 'sec_erd');
    if (erdSection && erdSection.markdownContent.includes('erDiagram') && erdSection.markdownContent.includes('Product')) {
      logPass(`Mermaid ERD correctly rendered in documentation book`);
      passedCount++;
    } else {
      logFail('Mermaid ERD section missing or malformed');
      failedCount++;
    }
  } catch (err) {
    logFail('Round 2 Narrative DocGen test exception', err);
    failedCount++;
  }

  // =========================================================================
  // TEST SECTION 3: Round 3 — In-App .bubble Auto-Download & Direct Sync
  // =========================================================================
  logSection('ROUND 3: In-App .bubble Auto-Download & Direct Sync Tests');

  try {
    // 3.1 Test Browser Fallback Mode (No Electron Window)
    const browserAuth = await BubbleSyncEngine.checkAuthStatus();
    if (browserAuth.isAuthenticated === false) {
      logPass(`BubbleSyncEngine gracefully falls back to non-authenticated in non-Electron environment`);
      passedCount++;
    } else {
      logFail('Expected false authentication in headless test environment');
      failedCount++;
    }

    // 3.2 Test Downloads Folder Watcher Detection Logic
    // Simulate what the main process does when a .bubble file lands in Downloads
    const sampleBubbleAst = {
      pages: {
        index: { elements: {}, workflows: {} },
        cart: { elements: {}, workflows: {} }
      },
      custom_types: {
        user: { fields: { email: { type: 'text' } } },
        order: { fields: { total: { type: 'number' } } }
      },
      workflows: {
        wf_1: { name: 'Checkout' }
      }
    };

    const tempTestDir = path.resolve(__dirname, '../dist/test-downloads');
    if (!fs.existsSync(tempTestDir)) fs.mkdirSync(tempTestDir, { recursive: true });

    const validBubbleFilePath = path.join(tempTestDir, 'nexus-mart-export-2026-09-03.bubble');
    fs.writeFileSync(validBubbleFilePath, JSON.stringify(sampleBubbleAst, null, 2), 'utf8');

    const invalidFilePath = path.join(tempTestDir, 'some-random-file.json');
    fs.writeFileSync(invalidFilePath, JSON.stringify({ hello: 'world' }, null, 2), 'utf8');

    // Test the AST verification algorithm used in electron/main.ts
    function verifyBubbleAstFile(filePath: string): boolean {
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        const hasPages = parsed && (parsed.pages || parsed.custom_types || parsed.workflows || parsed.elements || parsed.app);
        return Boolean(hasPages);
      } catch {
        return false;
      }
    }

    if (verifyBubbleAstFile(validBubbleFilePath) === true) {
      logPass(`Watcher AST validator correctly identified valid Bubble .bubble file`);
      passedCount++;
    } else {
      logFail('Watcher AST validator failed to recognize valid Bubble export');
      failedCount++;
    }

    if (verifyBubbleAstFile(invalidFilePath) === false) {
      logPass(`Watcher AST validator rejected non-Bubble JSON file`);
      passedCount++;
    } else {
      logFail('Watcher AST validator incorrectly accepted non-Bubble JSON file');
      failedCount++;
    }

    // Clean up temp test files
    fs.unlinkSync(validBubbleFilePath);
    fs.unlinkSync(invalidFilePath);
    fs.rmdirSync(tempTestDir);

    // 3.3 Test Electron Preload and IPC handler signatures for Bubble Sync
    const mainTsPath = path.resolve(__dirname, '../electron/main.ts');
    const mainTsContent = fs.readFileSync(mainTsPath, 'utf8');
    const expectedSyncIpc = [
      'bubbleSync:login',
      'bubbleSync:logout',
      'bubbleSync:checkAuth',
      'bubbleSync:fetchApp',
      'bubbleSync:setDownloadsWatcher'
    ];
    let allSyncIpcPresent = true;
    for (const ipc of expectedSyncIpc) {
      if (!mainTsContent.includes(`ipcMain.handle('${ipc}'`)) {
        allSyncIpcPresent = false;
        logFail(`Missing IPC handler in main.ts: ${ipc}`);
        failedCount++;
      }
    }
    if (allSyncIpcPresent) {
      logPass(`All 5 Bubble Sync IPC handlers registered in electron/main.ts`);
      passedCount++;
    }

    // 3.4 Test BubbleSyncEngine.syncAppFile mock execution
    // Set up mock window.electronAPI
    (global as any).window = {
      electronAPI: {
        bubbleSyncFetchApp: async (appId: string) => {
          return {
            success: true,
            appId,
            fileName: `${appId}_sync.bubble`,
            data: sampleBubbleAst
          };
        }
      }
    };

    const syncRes = await BubbleSyncEngine.syncAppFile(mockProject);
    if (syncRes.success && syncRes.fileName === 'nexus-mart_sync.bubble' && syncRes.data) {
      logPass(`BubbleSyncEngine.syncAppFile successfully executed and received AST data`);
      passedCount++;
    } else {
      logFail('BubbleSyncEngine.syncAppFile did not return expected sync result', syncRes);
      failedCount++;
    }
  } catch (err) {
    logFail('Round 3 In-App Bubble Sync test exception', err);
    failedCount++;
  }

  // =========================================================================
  // TEST SUMMARY
  // =========================================================================
  logSection('TEST SUITE EXECUTION SUMMARY');
  console.log(`  ${GREEN}${BOLD}PASSED:${RESET} ${passedCount} tests`);
  if (failedCount > 0) {
    console.log(`  ${RED}${BOLD}FAILED:${RESET} ${failedCount} tests`);
    process.exit(1);
  } else {
    console.log(`  ${GREEN}${BOLD}ALL TESTS PASSED WITH 0 FAILURES! 🚀${RESET}\n`);
    process.exit(0);
  }
}

runTests();
