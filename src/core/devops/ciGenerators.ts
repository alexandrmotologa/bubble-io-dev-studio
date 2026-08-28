export type CiPipelinePreset = 'backup' | 'schema_drift' | 'security_gate' | 'supabase_sync';

export interface CiGeneratorOptions {
  provider: 'github' | 'gitlab';
  preset?: CiPipelinePreset;
  dataTypes: string[];
  environment: 'version-test' | 'version-live';
  cronSchedule: string;
  retentionDays: number;
  format: 'json' | 'csv';
  cliVersion: string;
}

export class CiGeneratorsEngine {
  /**
   * Generates a complete GitHub Actions YAML workflow based on chosen preset
   */
  public static generateGitHubActionsWorkflow(options: CiGeneratorOptions): string {
    const preset = options.preset || 'backup';
    const matrixTypes = options.dataTypes.map(t => `'${t}'`).join(', ');

    if (preset === 'schema_drift') {
      return `name: 🛡️ Bubble.io Schema Drift & Lockfile Verification

on:
  pull_request:
    branches:
      - main
      - staging
  workflow_dispatch:

jobs:
  verify-schema-drift:
    name: Validate Schema-as-Code & Lockfile Drift
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js runtime
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Bubble Dev Studio CLI
        run: npm install -g @bubble-studio/cli@${options.cliVersion || 'latest'}

      - name: Authenticate Bubble Dev Studio
        env:
          BUBBLE_APP_NAME: \${{ secrets.BUBBLE_APP_NAME }}
          BUBBLE_API_KEY: \${{ secrets.BUBBLE_API_KEY }}
        run: |
          bubble-studio config --app "$BUBBLE_APP_NAME" --key "$BUBBLE_API_KEY"

      - name: Fetch Live Schema & Compare against schema.lock.json
        run: |
          echo "Comparing live Bubble environment schema against schema.lock.json..."
          bubble-studio schema verify --lockfile ./schema.lock.json --env "${options.environment}" --fail-on-drift

      - name: PR Summary
        if: always()
        run: |
          echo "### 🔒 Schema Lockfile Verification Status" >> \$GITHUB_STEP_SUMMARY
          echo "Checked database models against verified lockfile in ${options.environment}." >> \$GITHUB_STEP_SUMMARY
`;
    }

    if (preset === 'security_gate') {
      return `name: 🔐 Bubble.io PII Privacy & Security Gate

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
  schedule:
    - cron: '${options.cronSchedule}'

jobs:
  pii-security-audit:
    name: Scan Data Models for Exposed PII & Missing Privacy Rules
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Bubble Audit CLI
        run: npm install -g @bubble-studio/cli@${options.cliVersion || 'latest'}

      - name: Run Privacy Rules Audit & Vulnerability Gate
        env:
          BUBBLE_APP_NAME: \${{ secrets.BUBBLE_APP_NAME }}
          BUBBLE_API_KEY: \${{ secrets.BUBBLE_API_KEY }}
        run: |
          bubble-studio audit privacy \\
            --app "$BUBBLE_APP_NAME" \\
            --key "$BUBBLE_API_KEY" \\
            --min-severity HIGH \\
            --output-report ./security-report.md

      - name: Upload Security Findings
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: bubble-security-audit-report
          path: ./security-report.md
          retention-days: ${options.retentionDays}
`;
    }

    if (preset === 'supabase_sync') {
      return `name: ⚡ Bubble.io to Supabase / PostgreSQL Continuous Sync

on:
  schedule:
    - cron: '${options.cronSchedule}'
  workflow_dispatch:

jobs:
  sync-to-postgres:
    name: Sync Bubble Tables to PostgreSQL / Supabase
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        dataType: [${matrixTypes || "'User', 'Product', 'Order'"}]

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Bubble Studio CLI
        run: npm install -g @bubble-studio/cli@${options.cliVersion || 'latest'}

      - name: Extract Bubble Records & Upsert to Supabase
        env:
          BUBBLE_APP_NAME: \${{ secrets.BUBBLE_APP_NAME }}
          BUBBLE_API_KEY: \${{ secrets.BUBBLE_API_KEY }}
          DATABASE_URL: \${{ secrets.SUPABASE_DATABASE_URL }}
        run: |
          echo "Extracting \${{ matrix.dataType }} and streaming to Supabase..."
          bubble-studio sync postgres \\
            --table "\${{ matrix.dataType }}" \\
            --pg-url "$DATABASE_URL" \\
            --env "${options.environment}" \\
            --batch-size 500
`;
    }

    // Default: Automated Nightly Backup
    return `name: 📦 Bubble.io Scheduled Automated Backup

on:
  schedule:
    - cron: '${options.cronSchedule}' # Configured backup schedule
  workflow_dispatch: # Enable manual trigger from GitHub UI
  push:
    branches:
      - main

jobs:
  bubble-backup:
    name: Backup Bubble Data (\${{ matrix.dataType }})
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        dataType: [${matrixTypes || "'User', 'Product', 'Order'"}]

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js runtime
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Bubble CLI
        run: npm install -g @bubble-studio/cli@${options.cliVersion || 'latest'}

      - name: Configure Bubble App Credentials
        env:
          BUBBLE_APP: \${{ secrets.BUBBLE_APP_NAME }}
          BUBBLE_KEY: \${{ secrets.BUBBLE_API_KEY }}
        run: |
          bubble-studio config --app "\$BUBBLE_APP" --key "\$BUBBLE_KEY"

      - name: Export Data (\${{ matrix.dataType }})
        id: backup
        run: |
          mkdir -p ./backups
          bubble-studio backup \\
            --type "\${{ matrix.dataType }}" \\
            --env "${options.environment}" \\
            --format "${options.format}" \\
            --output "./backups" \\
            --json

      - name: Upload Backup Artifact
        uses: actions/upload-artifact@v4
        with:
          name: bubble-backup-\${{ matrix.dataType }}-\${{ github.run_id }}
          path: ./backups/*
          retention-days: ${options.retentionDays}

      - name: Generate Job Summary
        run: |
          echo "### 🫧 Bubble.io Backup Completed: \${{ matrix.dataType }}" >> \$GITHUB_STEP_SUMMARY
          echo "- **Environment**: ${options.environment}" >> \$GITHUB_STEP_SUMMARY
          echo "- **Format**: ${options.format.toUpperCase()}" >> \$GITHUB_STEP_SUMMARY
          echo "- **Status**: ✅ Success" >> \$GITHUB_STEP_SUMMARY
`;
  }

  /**
   * Generates a GitLab CI YAML configuration
   */
  public static generateGitLabCiPipeline(options: CiGeneratorOptions): string {
    const typesList = options.dataTypes.join(' ');

    return `# ==========================================================
# GitLab CI Pipeline for Bubble.io DevOps & Scheduled Backups
# ==========================================================

image: node:20

stages:
  - test
  - backup

variables:
  BUBBLE_ENV: "${options.environment}"
  BACKUP_FORMAT: "${options.format}"

before_script:
  - npm install -g @bubble-studio/cli@${options.cliVersion || 'latest'}
  - bubble-studio config --app "$BUBBLE_APP_NAME" --key "$BUBBLE_API_KEY"

pii_security_scan:
  stage: test
  script:
    - bubble-studio audit privacy --min-risk HIGH
  allow_failure: true

scheduled_bubble_backup:
  stage: backup
  script:
    - mkdir -p backups
    - |
      for type in ${typesList || 'User Product Order'}; do
        echo "Backing up Bubble data type: $type"
        bubble-studio backup --type "$type" --env "$BUBBLE_ENV" --format "$BACKUP_FORMAT" --output ./backups
      done
  artifacts:
    name: bubble-backup-\$CI_JOB_ID
    paths:
      - backups/
    expire_in: ${options.retentionDays} days
  rules:
    - if: '\$CI_PIPELINE_SOURCE == "schedule"'
    - if: '\$CI_PIPELINE_SOURCE == "web"'
`;
  }
}
