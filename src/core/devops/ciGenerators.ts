export interface CiGeneratorOptions {
  provider: 'github' | 'gitlab';
  dataTypes: string[];
  environment: 'version-test' | 'version-live';
  cronSchedule: string;
  retentionDays: number;
  format: 'json' | 'csv';
  cliVersion: string;
}

export class CiGeneratorsEngine {
  /**
   * Generates a complete GitHub Actions YAML workflow for automated backups
   */
  public static generateGitHubActionsWorkflow(options: CiGeneratorOptions): string {
    const matrixTypes = options.dataTypes.map(t => `'${t}'`).join(', ');

    return `name: Bubble.io Scheduled Automated Backup & CI Audit

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
        run: npm install -g bubble-io-cli@${options.cliVersion || 'latest'}

      - name: Configure Bubble App Credentials
        env:
          BUBBLE_APP: \${{ secrets.BUBBLE_APP_NAME }}
          BUBBLE_KEY: \${{ secrets.BUBBLE_API_KEY }}
        run: |
          bubble-io-cli config --app "\$BUBBLE_APP" --key "\$BUBBLE_KEY"

      - name: Run PII Privacy & Security Gate
        run: |
          bubble-io-cli audit privacy --type "\${{ matrix.dataType }}" --min-risk HIGH || true

      - name: Export Data (\${{ matrix.dataType }})
        id: backup
        run: |
          mkdir -p ./backups
          bubble-io-cli backup \\
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
  - npm install -g bubble-io-cli@${options.cliVersion || 'latest'}
  - bubble-io-cli config --app "$BUBBLE_APP_NAME" --key "$BUBBLE_API_KEY"

pii_security_scan:
  stage: test
  script:
    - bubble-io-cli audit privacy --min-risk HIGH
  allow_failure: true

scheduled_bubble_backup:
  stage: backup
  script:
    - mkdir -p backups
    - |
      for type in ${typesList || 'User Product Order'}; do
        echo "Backing up Bubble data type: $type"
        bubble-io-cli backup --type "$type" --env "$BUBBLE_ENV" --format "$BACKUP_FORMAT" --output ./backups
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
