#!/usr/bin/env node

import { program } from 'commander';
import inquirer from 'inquirer';
import { ConfigManager } from './config';
import { JiraClient } from './jira';
import { BranchNameGenerator } from './branch';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { PullRequestGenerator } from './pull_request';

// Import version from package.json
const packageJson = require('../package.json');
const version: string = packageJson.version;

// Add chalk to display colored output
const success = (msg: string) => console.log(chalk.green(`✓ ${msg}`));
const error = (msg: string) => console.log(chalk.red(`✗ ${msg}`));
const info = (msg: string) => console.log(chalk.blue(`ℹ ${msg}`));
const warn = (msg: string) => console.log(chalk.yellow(`⚠ ${msg}`));

async function ensureConfig(): Promise<any> {
  const config = await ConfigManager.load();

  // Check if we have the minimum required config (now includes OpenAI API key)
  if (!config.jiraHost || !config.jiraEmail || !config.jiraToken || !config.openaiApiKey) {
    warn('Configuration incomplete. Let\'s set it up!');
    return await setup();
  }

  return config;
}

async function setup() {
  info('Setting up Jira to Branch CLI tool...\n');

  const config = await ConfigManager.load();

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'jiraHost',
      message: 'Jira host (e.g., company.atlassian.net):',
      default: config.jiraHost,
      validate: (input: string) => input.length > 0 || 'Jira host is required'
    },
    {
      type: 'input',
      name: 'jiraEmail',
      message: 'Jira email address:',
      default: config.jiraEmail,
      validate: (input: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(input) || 'Please enter a valid email address';
      }
    },
    {
      type: 'password',
      name: 'jiraToken',
      message: 'Jira API token:',
      default: config.jiraToken,
      validate: (input: string) => input.length > 0 || 'Jira API token is required'
    },
    {
      type: 'password',
      name: 'openaiApiKey',
      message: 'OpenAI API key (required for AI-powered branch naming):',
      default: config.openaiApiKey,
      validate: (input: string) => input.length > 0 || 'OpenAI API key is required'
    },
    {
      type: 'input',
      name: 'defaultBranchPrefix',
      message: 'Default branch prefix (optional):',
      default: config.defaultBranchPrefix || ''
    },
    {
      type: 'list',
      name: 'aiModel',
      message: 'AI model to use:',
      choices: [
        { name: 'GPT-3.5 Turbo (recommended)', value: 'gpt-3.5-turbo' },
        { name: 'GPT-4', value: 'gpt-4' },
        { name: 'GPT-4 Turbo', value: 'gpt-4-turbo-preview' },
        { name: 'GPT-4o', value: 'gpt-4o' },
        { name: 'GPT-4o Mini', value: 'gpt-4o-mini' }
      ],
      default: config.aiModel || 'gpt-3.5-turbo'
    },
    {
      type: 'number',
      name: 'aiTemperature',
      message: 'AI temperature (0.0-1.0, lower = more consistent):',
      default: config.aiTemperature || 0.3,
      validate: (input: number) => {
        if (input >= 0 && input <= 1) return true;
        return 'Temperature must be between 0.0 and 1.0';
      }
    },
    {
      type: 'number',
      name: 'aiMaxTokens',
      message: 'AI max tokens for analysis:',
      default: config.aiMaxTokens || 500,
      validate: (input: number) => {
        if (input > 0 && input <= 4000) return true;
        return 'Max tokens must be between 1 and 4000';
      }
    },
  ]);

  await ConfigManager.save(answers);
  success('Configuration saved successfully!\n');
  return answers;
}

function extractJiraKey(input: string): string {
  // Remove any whitespace
  input = input.trim();

  // Handle full Jira URLs (multiple formats)
  const urlPatterns = [
    /\/browse\/([A-Z]+-\d+)/,           // Standard browse URL
    /\/projects\/[^\/]+\/issues\/([A-Z]+-\d+)/, // Project issues URL
    /([A-Z]+-\d+)(?=\?|$|#)/           // Ticket ID in URL params
  ];

  for (const pattern of urlPatterns) {
    const match = input.match(pattern);
    if (match) {
      return match[1];
    }
  }

  // Handle direct ticket IDs
  const ticketMatch = input.match(/^([A-Z]+-\d+)$/i);
  if (ticketMatch) {
    return ticketMatch[1].toUpperCase();
  }

  throw new Error('Invalid Jira ticket format. Supported formats:\n' +
    '  • Ticket ID: EH-1234\n' +
    '  • Browse URL: https://company.atlassian.net/browse/EH-1234\n' +
    '  • Project URL: https://company.atlassian.net/projects/EH/issues/EH-1234');
}

function checkGitRepository(): void {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
  } catch {
    throw new Error('Not in a Git repository. Please run this command from within a Git repository.');
  }
}

function getCurrentBranch(): string {
  try {
    return execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

async function createBranch(input: string, options: any = {}) {
  try {
    info('🚀 Starting AI-powered branch creation...\n');

    // Validate Git repository
    checkGitRepository();

    // Extract Jira ticket key
    const issueKey = extractJiraKey(input);
    info(`Detected Jira ticket: ${issueKey}`);

    // Ensure configuration
    const config = await ensureConfig();

    // Initialize Jira client
    info('Connecting to Jira...');
    const jiraClient = new JiraClient(config.jiraHost, config.jiraEmail, config.jiraToken);

    // Fetch issue details
    info('Fetching ticket information...');
    const issue = await jiraClient.getIssue(issueKey);

    // Display ticket information
    console.log('\n' + chalk.cyan('📋 Ticket Information:'));
    console.log(`   Title: ${chalk.white(issue.fields.summary)}`);
    console.log(`   Type: ${chalk.white(issue.fields.issuetype?.name || 'Unknown')}`);
    console.log(`   Status: ${chalk.white(issue.fields.status?.name || 'Unknown')}`);
    console.log(`   Priority: ${chalk.white(issue.fields.priority?.name || 'Unknown')}`);
    console.log(`   Assignee: ${chalk.white(issue.fields.assignee?.displayName || 'Unassigned')}`);

    // Generate branch name with AI
    info('🤖 Generating branch name with OpenAI...');

    let branchName: string;
    let analysis: any = null;

    if (options.analysis) {
      const result = await BranchNameGenerator.generateWithAnalysis(
        issueKey,
        issue.fields.summary,
        issue.fields.description,
        options.prefix || config.defaultBranchPrefix,
        config.openaiApiKey
      );
      branchName = result.branchName;
      analysis = result.analysis;
    } else {
      branchName = await BranchNameGenerator.generate(
        issueKey,
        issue.fields.summary,
        issue.fields.description,
        options.prefix || config.defaultBranchPrefix,
        config.openaiApiKey
      );
    }

    console.log(`\n   🌿 AI-generated branch: ${chalk.green(branchName)}`);

    if (analysis) {
      console.log(`\n${chalk.cyan('🔍 AI Analysis:')}`);
      console.log(`   Primary Action: ${chalk.white(analysis.primaryAction)}`);
      console.log(`   Technical Context: ${chalk.white(analysis.technicalContext.join(', '))}`);
      console.log(`   Business Context: ${chalk.white(analysis.businessContext.join(', '))}`);
      console.log(`   Reasoning: ${chalk.white(analysis.reasoning)}`);
    }

    // Confirm branch creation unless --yes flag is provided
    if (!options.yes) {
      const currentBranch = getCurrentBranch();
      console.log(`   📍 Current branch: ${chalk.yellow(currentBranch)}`);

      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: 'Create and switch to this branch?',
        default: true
      }]);

      if (!confirm) {
        info('Branch creation cancelled.');
        return;
      }
    }

    // Create and checkout new branch
    info('Creating new branch...');
    execSync(`git checkout -b "${branchName}"`);

    success(`Successfully created and switched to branch: ${branchName}`);
    info(`You can now start working on ticket ${issueKey}!`);

  } catch (error: any) {
    error(`Failed to create branch: ${error.message}`);
    process.exit(1);
  }
}

async function createPr() {
    if (!checkGitHubCLI()) {
        error('GitHub CLI is not installed. Please install it from https://cli.github.com/');
        return;
    }

    const config = await ensureConfig();
    info('Connecting to github...');
    await checkGitRepository();
    const currentBranch = getCurrentBranch();

  const prTitle = await PullRequestGenerator.generate(config.openaiApiKey);
  info(prTitle);

    execSync(`gh pr create --title ${prTitle} --head ${currentBranch}`, { stdio: 'inherit' });
}

function checkGitHubCLI(): boolean {
  try {
    execSync('gh --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Define CLI program
program
  .name('jira-to-branch')
  .description('🚀 AI-powered CLI tool to create Git branches from Jira tickets')
  .version(version);

// Setup command
program
  .command('setup')
  .description('Configure Jira credentials and OpenAI API key')
  .action(setup);

// Main create command
program
  .command('create <ticketIdOrUrl>')
  .description('Create a new branch from Jira ticket ID or URL using AI')
  .option('-p, --prefix <prefix>', 'Override default branch prefix')
  .option('-y, --yes', 'Skip confirmation prompt')
  .option('-a, --analysis', 'Show detailed AI analysis of the branch name')
  .action(createBranch);

// Quick command (alias for create)
program
  .command('branch <ticketIdOrUrl>')
  .alias('b')
  .description('Quick alias for create command')
  .option('-p, --prefix <prefix>', 'Override default branch prefix')
  .option('-y, --yes', 'Skip confirmation prompt')
  .option('-a, --analysis', 'Show detailed AI analysis of the branch name')
  .action(createBranch);

// Show config command
program
  .command('config')
  .description('Show current configuration')
  .action(async () => {
    const config = await ConfigManager.load();
    const aiConfig = ConfigManager.getAIConfig(config);

    console.log('\n' + chalk.cyan('📋 Current Configuration:'));
    console.log(chalk.yellow('  Jira Settings:'));
    console.log(`   Jira Host: ${config.jiraHost || 'Not set'}`);
    console.log(`   Jira Email: ${config.jiraEmail || 'Not set'}`);
    console.log(`   Jira Token: ${config.jiraToken ? '***' + config.jiraToken.slice(-4) : 'Not set'}`);

    console.log(chalk.yellow('  AI Settings:'));
    console.log(`   OpenAI Key: ${config.openaiApiKey ? '***' + config.openaiApiKey.slice(-4) : 'Not set'}`);
    console.log(`   Model: ${aiConfig.model}`);
    console.log(`   Temperature: ${aiConfig.temperature}`);
    console.log(`   Max Tokens: ${aiConfig.maxTokens}`);

    console.log(chalk.yellow('  Branch Settings:'));
    console.log(`   Default Prefix: ${config.defaultBranchPrefix || 'Not set'}`);
    console.log('');
  });

// AI config command
program
  .command('ai-config')
  .description('Configure AI model settings')
  .action(async () => {
    const config = await ConfigManager.load();

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'aiModel',
        message: 'AI model to use:',
        choices: [
          { name: 'GPT-3.5 Turbo (recommended)', value: 'gpt-3.5-turbo' },
          { name: 'GPT-4', value: 'gpt-4' },
          { name: 'GPT-4 Turbo', value: 'gpt-4-turbo-preview' },
          { name: 'GPT-4o', value: 'gpt-4o' },
          { name: 'GPT-4o Mini', value: 'gpt-4o-mini' }
        ],
        default: config.aiModel || 'gpt-3.5-turbo'
      },
      {
        type: 'number',
        name: 'aiTemperature',
        message: 'AI temperature (0.0-1.0, lower = more consistent):',
        default: config.aiTemperature || 0.3,
        validate: (input: number) => {
          if (input >= 0 && input <= 1) return true;
          return 'Temperature must be between 0.0 and 1.0';
        }
      },
      {
        type: 'number',
        name: 'aiMaxTokens',
        message: 'AI max tokens for analysis:',
        default: config.aiMaxTokens || 500,
        validate: (input: number) => {
          if (input > 0 && input <= 4000) return true;
          return 'Max tokens must be between 1 and 4000';
        }
      }
    ]);

    const updatedConfig = { ...config, ...answers };
    await ConfigManager.save(updatedConfig);
    success('AI configuration updated successfully!\n');

    // Show updated config
    const aiConfig = ConfigManager.getAIConfig(updatedConfig);
    console.log(chalk.cyan('🤖 Updated AI Configuration:'));
    console.log(`   Model: ${aiConfig.model}`);
    console.log(`   Temperature: ${aiConfig.temperature}`);
    console.log(`   Max Tokens: ${aiConfig.maxTokens}`);
    console.log('');
  });
program
  .command('pr')
  .alias('c')
  .description('Create a new PR')
  .action(createPr);

// Parse CLI arguments
program.parse();
