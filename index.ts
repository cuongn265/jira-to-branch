#!/usr/bin/env node

import { program } from 'commander';
import inquirer from 'inquirer';
import { ConfigManager } from './config';
import { JiraClient } from './jira';
import { BranchNameGenerator } from './branch';
import { execSync } from 'child_process';
import chalk from 'chalk';

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
    }
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
    const branchName = await BranchNameGenerator.generate(
      issueKey,
      issue.fields.summary,
      issue.fields.description,
      options.prefix || config.defaultBranchPrefix,
      config.openaiApiKey
    );

    console.log(`\n   🌿 AI-generated branch: ${chalk.green(branchName)}`);

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

// Define CLI program
program
  .name('jira-to-branch')
  .description('🚀 AI-powered CLI tool to create Git branches from Jira tickets')
  .version('1.0.0');

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
  .action(createBranch);

// Quick command (alias for create)
program
  .command('branch <ticketIdOrUrl>')
  .alias('b')
  .description('Quick alias for create command')
  .option('-p, --prefix <prefix>', 'Override default branch prefix')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(createBranch);

// Show config command
program
  .command('config')
  .description('Show current configuration')
  .action(async () => {
    const config = await ConfigManager.load();
    console.log('\n' + chalk.cyan('📋 Current Configuration:'));
    console.log(`   Jira Host: ${config.jiraHost || 'Not set'}`);
    console.log(`   Jira Email: ${config.jiraEmail || 'Not set'}`);
    console.log(`   Jira Token: ${config.jiraToken ? '***' + config.jiraToken.slice(-4) : 'Not set'}`);
    console.log(`   OpenAI Key: ${config.openaiApiKey ? '***' + config.openaiApiKey.slice(-4) : 'Not set'}`);
    console.log(`   Default Prefix: ${config.defaultBranchPrefix || 'Not set'}`);
    console.log('');
  });

// Parse CLI arguments
program.parse();
