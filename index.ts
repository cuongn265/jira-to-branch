#!/usr/bin/env node

import { program } from "commander";
import inquirer from "inquirer";
import { ConfigManager } from "./config";
import { JiraClient } from "./jira";
import { BranchNameGenerator } from "./branch";
import { execSync } from "child_process";
import chalk from "chalk";
import { PullRequestGenerator } from "./pull_request";
import * as readline from "readline";

// Import version from package.json
const packageJson = require("../package.json");
const version: string = packageJson.version;

// Add chalk to display colored output
const success = (msg: string) => console.log(chalk.green(`✓ ${msg}`));
const error = (msg: string) => console.log(chalk.red(`✗ ${msg}`));
const info = (msg: string) => console.log(chalk.blue(`ℹ ${msg}`));
const warn = (msg: string) => console.log(chalk.yellow(`⚠ ${msg}`));

// Helper function to get editable input with default value
async function getEditableInput(
  prompt: string,
  defaultValue: string
): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Write prompt and default value
    process.stdout.write(`   🌿 ${prompt}: `);

    // Handle input
    rl.on("line", (input) => {
      rl.close();
      const result = input.trim() || defaultValue;
      resolve(result);
    });

    // Write default value to the terminal
    rl.write(defaultValue);
  });
}

async function ensureConfig(): Promise<any> {
  const config = await ConfigManager.load();
  const aiConfig = ConfigManager.getAIConfig(config);

  // Check if we have the minimum required config (now includes AI API key)
  if (
    !config.jiraHost ||
    !config.jiraEmail ||
    !config.jiraToken ||
    !aiConfig.apiKey
  ) {
    warn("Configuration incomplete. Let's set it up!");
    return await setup();
  }

  return config;
}

async function setup() {
  info("Setting up Jira to Branch CLI tool...\n");

  const config = await ConfigManager.load();

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "jiraHost",
      message: "Jira host (e.g., company.atlassian.net):",
      default: config.jiraHost,
      validate: (input: string) => input.length > 0 || "Jira host is required",
    },
    {
      type: "input",
      name: "jiraEmail",
      message: "Jira email address:",
      default: config.jiraEmail,
      validate: (input: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(input) || "Please enter a valid email address";
      },
    },
    {
      type: "password",
      name: "jiraToken",
      message: "Jira API token:",
      default: config.jiraToken,
      validate: (input: string) =>
        input.length > 0 || "Jira API token is required",
    },
    {
      type: "list",
      name: "aiProvider",
      message: "AI Provider:",
      choices: [
        { name: "OpenAI (GPT models) - Default", value: "openai" },
        { name: "Anthropic (Claude models)", value: "anthropic" },
        { name: "Google (Gemini models)", value: "google" },
        { name: "Azure OpenAI", value: "azure" },
      ],
      default: config.aiProvider || "openai",
    },
    {
      type: "password",
      name: "aiApiKey",
      message: (answers: any) => {
        const providerNames: Record<string, string> = {
          openai: "OpenAI",
          anthropic: "Anthropic",
          google: "Google",
          azure: "Azure OpenAI",
        };
        return `${
          providerNames[answers.aiProvider] || "AI"
        } API key (required for AI-powered branch naming):`;
      },
      default: (answers: any) => {
        // Try to get from existing config based on provider
        if (answers.aiProvider === config.aiProvider) {
          return config.aiApiKey || config.openaiApiKey;
        }
        return config.aiApiKey || config.openaiApiKey;
      },
      validate: (input: string) => input.length > 0 || "API key is required",
    },
    {
      type: "input",
      name: "defaultBranchPrefix",
      message: "Default branch prefix (optional):",
      default: config.defaultBranchPrefix || "",
    },
    {
      type: "list",
      name: "aiModel",
      message: (answers: any) => `AI model for ${answers.aiProvider}:`,
      choices: (answers: any) => {
        const modelChoices: Record<
          string,
          Array<{ name: string; value: string }>
        > = {
          openai: [
            {
              name: "GPT-4o Mini (recommended, fast & cost-effective)",
              value: "gpt-4o-mini",
            },
            { name: "GPT-4o (most capable)", value: "gpt-4o" },
            { name: "GPT-3.5 Turbo", value: "gpt-3.5-turbo" },
            { name: "GPT-4 Turbo", value: "gpt-4-turbo-preview" },
            { name: "GPT-4", value: "gpt-4" },
          ],
          anthropic: [
            {
              name: "Claude 3.5 Sonnet (recommended, most capable)",
              value: "claude-3-5-sonnet-20241022",
            },
            {
              name: "Claude 3.5 Haiku (faster, lower cost)",
              value: "claude-3-5-haiku-20241022",
            },
            {
              name: "Claude 3 Opus (highest capability)",
              value: "claude-3-opus-20240229",
            },
          ],
          google: [
            {
              name: "Gemini 1.5 Flash (recommended, fast & efficient)",
              value: "gemini-1.5-flash",
            },
            { name: "Gemini 1.5 Pro (more capable)", value: "gemini-1.5-pro" },
            {
              name: "Gemini 2.0 Flash (experimental)",
              value: "gemini-2.0-flash-exp",
            },
          ],
          azure: [
            { name: "GPT-4 (deployment name from Azure)", value: "gpt-4" },
            { name: "GPT-4o", value: "gpt-4o" },
            { name: "GPT-3.5 Turbo", value: "gpt-3.5-turbo" },
            { name: "Custom deployment name", value: "" },
          ],
        };
        return modelChoices[answers.aiProvider] || modelChoices.openai;
      },
      default: (answers: any) => {
        if (answers.aiProvider === config.aiProvider && config.aiModel) {
          return config.aiModel;
        }
        const defaults: Record<string, string> = {
          openai: "gpt-4o-mini",
          anthropic: "claude-3-5-sonnet-20241022",
          google: "gemini-1.5-flash",
          azure: "gpt-4",
        };
        return defaults[answers.aiProvider] || "gpt-4o-mini";
      },
    },
    {
      type: "input",
      name: "aiModel",
      message: "Enter your Azure deployment name:",
      when: (answers: any) =>
        answers.aiProvider === "azure" && !answers.aiModel,
      validate: (input: string) =>
        input.length > 0 || "Deployment name is required for Azure",
    },
    {
      type: "input",
      name: "aiBaseURL",
      message:
        "Azure OpenAI endpoint URL (e.g., https://YOUR_RESOURCE.openai.azure.com/openai/deployments/YOUR_DEPLOYMENT):",
      when: (answers: any) => answers.aiProvider === "azure",
      default: config.aiBaseURL,
      validate: (input: string) => {
        if (!input) return "Base URL is required for Azure OpenAI";
        if (!input.startsWith("http"))
          return "Please enter a valid URL starting with http:// or https://";
        return true;
      },
    },
    {
      type: "number",
      name: "aiTemperature",
      message: "AI temperature (0.0-2.0, lower = more consistent):",
      default: config.aiTemperature || 0.3,
      validate: (input: number) => {
        if (input >= 0 && input <= 2) return true;
        return "Temperature must be between 0.0 and 2.0";
      },
    },
    {
      type: "number",
      name: "aiMaxTokens",
      message: "AI max tokens for analysis:",
      default: config.aiMaxTokens || 500,
      validate: (input: number) => {
        if (input > 0 && input <= 4000) return true;
        return "Max tokens must be between 1 and 4000";
      },
    },
  ]);

  await ConfigManager.save(answers);
  success("Configuration saved successfully!\n");
  return answers;
}

function extractJiraKey(input: string): string {
  // Remove any whitespace
  input = input.trim();

  // Handle full Jira URLs (multiple formats)
  const urlPatterns = [
    /\/browse\/([A-Z]+-\d+)/, // Standard browse URL
    /\/projects\/[^\/]+\/issues\/([A-Z]+-\d+)/, // Project issues URL
    /([A-Z]+-\d+)(?=\?|$|#)/, // Ticket ID in URL params
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

  throw new Error(
    "Invalid Jira ticket format. Supported formats:\n" +
      "  • Ticket ID: EH-1234\n" +
      "  • Browse URL: https://company.atlassian.net/browse/EH-1234\n" +
      "  • Project URL: https://company.atlassian.net/projects/EH/issues/EH-1234"
  );
}

function checkGitRepository(): void {
  try {
    execSync("git rev-parse --git-dir", { stdio: "ignore" });
  } catch {
    throw new Error(
      "Not in a Git repository. Please run this command from within a Git repository."
    );
  }
}

function getCurrentBranch(): string {
  try {
    return execSync("git branch --show-current", { encoding: "utf-8" }).trim();
  } catch {
    return "unknown";
  }
}

function branchExists(branchName: string): boolean {
  try {
    execSync(`git rev-parse --verify "${branchName}" 2>/dev/null`, {
      stdio: "pipe",
    });
    return true;
  } catch {
    return false;
  }
}

async function createBranch(input: string, options: any = {}) {
  try {
    info("🚀 Starting AI-powered branch creation...\n");

    // Validate Git repository
    checkGitRepository();

    // Extract Jira ticket key
    const issueKey = extractJiraKey(input);
    info(`Detected Jira ticket: ${issueKey}`);

    // Ensure configuration
    const config = await ensureConfig();

    // Initialize Jira client
    info("Connecting to Jira...");
    const jiraClient = new JiraClient(
      config.jiraHost,
      config.jiraEmail,
      config.jiraToken
    );

    // Fetch issue details
    info("Fetching ticket information...");
    const issue = await jiraClient.getIssue(issueKey);

    // Display ticket information
    console.log("\n" + chalk.cyan("📋 Ticket Information:"));
    console.log(`   Title: ${chalk.white(issue.fields.summary)}`);
    console.log(
      `   Type: ${chalk.white(issue.fields.issuetype?.name || "Unknown")}`
    );
    console.log(
      `   Status: ${chalk.white(issue.fields.status?.name || "Unknown")}`
    );
    console.log(
      `   Priority: ${chalk.white(issue.fields.priority?.name || "Unknown")}`
    );
    console.log(
      `   Assignee: ${chalk.white(
        issue.fields.assignee?.displayName || "Unassigned"
      )}`
    );

    // Generate branch name with AI
    info("🤖 Generating branch name with AI...");

    const aiConfig = ConfigManager.getAIConfig(config);
    let branchName: string;
    let analysis: any = null;

    if (options.analysis) {
      const result = await BranchNameGenerator.generateWithAnalysis(
        issueKey,
        issue.fields.summary,
        issue.fields.description,
        options.prefix || config.defaultBranchPrefix,
        aiConfig.apiKey
      );
      branchName = result.branchName;
      analysis = result.analysis;
    } else {
      branchName = await BranchNameGenerator.generate(
        issueKey,
        issue.fields.summary,
        issue.fields.description,
        options.prefix || config.defaultBranchPrefix,
        aiConfig.apiKey
      );
    }

    console.log(`\n   🌿 AI-generated branch: ${chalk.green(branchName)}`);

    if (analysis) {
      console.log(`\n${chalk.cyan("🔍 AI Analysis:")}`);
      console.log(`   Primary Action: ${chalk.white(analysis.primaryAction)}`);
      console.log(
        `   Technical Context: ${chalk.white(
          analysis.technicalContext.join(", ")
        )}`
      );
      console.log(
        `   Business Context: ${chalk.white(
          analysis.businessContext.join(", ")
        )}`
      );
      console.log(`   Reasoning: ${chalk.white(analysis.reasoning)}`);
    }

    // Confirm branch creation unless --yes flag is provided
    if (!options.yes) {
      const currentBranch = getCurrentBranch();
      console.log(`   📍 Current branch: ${chalk.yellow(currentBranch)}\n`);

      const finalBranchName = await getEditableInput("Branch name", branchName);

      // Validate branch name
      if (finalBranchName.length === 0) {
        error("Branch name cannot be empty");
        return;
      }

      if (!/^[a-zA-Z0-9\-_\/]+$/.test(finalBranchName)) {
        error(
          "Branch name can only contain alphanumeric characters, hyphens, underscores, and slashes"
        );
        return;
      }

      branchName = finalBranchName;

      if (finalBranchName !== branchName) {
        console.log(`   🌿 Updated branch: ${chalk.green(branchName)}`);
      }
    }

    // Create and checkout new branch
    info("Creating new branch...");

    // Check if branch already exists
    if (branchExists(branchName)) {
      warn(`Branch '${branchName}' already exists`);

      const { action } = await inquirer.prompt([
        {
          type: "list",
          name: "action",
          message: "What would you like to do?",
          choices: [
            { name: "Checkout existing branch", value: "checkout" },
            { name: "Create new branch with different name", value: "rename" },
            { name: "Cancel", value: "cancel" },
          ],
        },
      ]);

      if (action === "cancel") {
        info("Operation cancelled.");
        return;
      }

      if (action === "checkout") {
        execSync(`git checkout "${branchName}"`);
        success(`Switched to existing branch: ${branchName}`);
        return;
      }

      if (action === "rename") {
        console.log("");
        const newBranchName = await getEditableInput(
          "New branch name",
          branchName
        );

        if (newBranchName.length === 0) {
          error("Branch name cannot be empty");
          return;
        }

        if (!/^[a-zA-Z0-9\-_\/]+$/.test(newBranchName)) {
          error(
            "Branch name can only contain alphanumeric characters, hyphens, underscores, and slashes"
          );
          return;
        }

        if (branchExists(newBranchName)) {
          error(`Branch '${newBranchName}' also already exists`);
          return;
        }

        branchName = newBranchName;
        info("Creating new branch...");
      }
    }

    execSync(`git checkout -b "${branchName}"`);

    success(`Successfully created and switched to branch: ${branchName}`);
    info(`You can now start working on ticket ${issueKey}!`);
  } catch (e: any) {
    console.log(e);
    error(`Failed to create branch: ${e.message}`);
    process.exit(1);
  }
}

async function createPr() {
  if (!checkGitHubCLI()) {
    error(
      "GitHub CLI is not installed. Please install it from https://cli.github.com/"
    );
    return;
  }

  const config = await ensureConfig();
  const aiConfig = ConfigManager.getAIConfig(config);
  info("Connecting to github...");
  await checkGitRepository();
  const currentBranch = getCurrentBranch();

  const prTitle = await PullRequestGenerator.generate(aiConfig.apiKey);
  execSync(`gh pr create --title "${prTitle}" --head ${currentBranch}`, {
    stdio: "inherit",
  });
  success(`Successfully created PR with title: ${prTitle}`);
  info("Opening PR in browser...");
  execSync(`gh pr view --web`, { stdio: "inherit" });
}

function checkGitHubCLI(): boolean {
  try {
    execSync("gh --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// Define CLI program
program
  .name("jira-to-branch")
  .description(
    "🚀 AI-powered CLI tool to create Git branches from Jira tickets"
  )
  .version(version);

// Setup command
program
  .command("setup")
  .description("Configure Jira credentials and AI provider settings")
  .action(setup);

// Main create command
program
  .command("create <ticketIdOrUrl>")
  .description("Create a new branch from Jira ticket ID or URL using AI")
  .option("-p, --prefix <prefix>", "Override default branch prefix")
  .option("-y, --yes", "Skip confirmation prompt")
  .option("-a, --analysis", "Show detailed AI analysis of the branch name")
  .action(createBranch);

// Quick command (alias for create)
program
  .command("branch <ticketIdOrUrl>")
  .alias("b")
  .description("Quick alias for create command")
  .option("-p, --prefix <prefix>", "Override default branch prefix")
  .option("-y, --yes", "Skip confirmation prompt")
  .option("-a, --analysis", "Show detailed AI analysis of the branch name")
  .action(createBranch);

// Show config command
program
  .command("config")
  .description("Show current configuration")
  .action(async () => {
    const config = await ConfigManager.load();
    const aiConfig = ConfigManager.getAIConfig(config);

    console.log("\n" + chalk.cyan("📋 Current Configuration:"));
    console.log(chalk.yellow("  Jira Settings:"));
    console.log(`   Jira Host: ${config.jiraHost || "Not set"}`);
    console.log(`   Jira Email: ${config.jiraEmail || "Not set"}`);
    console.log(
      `   Jira Token: ${
        config.jiraToken ? "***" + config.jiraToken.slice(-4) : "Not set"
      }`
    );

    console.log(chalk.yellow("  AI Settings:"));
    console.log(`   Provider: ${aiConfig.provider}`);
    console.log(
      `   API Key: ${
        aiConfig.apiKey ? "***" + aiConfig.apiKey.slice(-4) : "Not set"
      }`
    );
    console.log(`   Model: ${aiConfig.model}`);
    console.log(`   Temperature: ${aiConfig.temperature}`);
    console.log(`   Max Tokens: ${aiConfig.maxTokens}`);
    if (config.aiBaseURL) {
      console.log(`   Base URL: ${config.aiBaseURL}`);
    }
    if (config.aiOrganizationId) {
      console.log(`   Organization ID: ${config.aiOrganizationId}`);
    }

    console.log(chalk.yellow("  Branch Settings:"));
    console.log(
      `   Default Prefix: ${config.defaultBranchPrefix || "Not set"}`
    );
    console.log("");
  });

// AI config command
program
  .command("ai-config")
  .description("Configure AI provider and model settings")
  .action(async () => {
    const config = await ConfigManager.load();
    const currentAiConfig = ConfigManager.getAIConfig(config);

    const answers = await inquirer.prompt([
      {
        type: "list",
        name: "aiProvider",
        message: "AI Provider:",
        choices: [
          { name: "OpenAI (GPT models)", value: "openai" },
          { name: "Anthropic (Claude models)", value: "anthropic" },
          { name: "Google (Gemini models)", value: "google" },
          { name: "Azure OpenAI", value: "azure" },
        ],
        default: currentAiConfig.provider,
      },
      {
        type: "list",
        name: "aiModel",
        message: (answers: any) => `AI model for ${answers.aiProvider}:`,
        choices: (answers: any) => {
          const modelChoices: Record<
            string,
            Array<{ name: string; value: string }>
          > = {
            openai: [
              {
                name: "GPT-4o Mini (recommended, fast & cost-effective)",
                value: "gpt-4o-mini",
              },
              { name: "GPT-4o (most capable)", value: "gpt-4o" },
              { name: "GPT-3.5 Turbo", value: "gpt-3.5-turbo" },
              { name: "GPT-4 Turbo", value: "gpt-4-turbo-preview" },
              { name: "GPT-4", value: "gpt-4" },
            ],
            anthropic: [
              {
                name: "Claude 3.5 Sonnet (recommended)",
                value: "claude-3-5-sonnet-20241022",
              },
              { name: "Claude 3.5 Haiku", value: "claude-3-5-haiku-20241022" },
              { name: "Claude 3 Opus", value: "claude-3-opus-20240229" },
            ],
            google: [
              {
                name: "Gemini 1.5 Flash (recommended)",
                value: "gemini-1.5-flash",
              },
              { name: "Gemini 1.5 Pro", value: "gemini-1.5-pro" },
              { name: "Gemini 2.0 Flash", value: "gemini-2.0-flash-exp" },
            ],
            azure: [
              { name: "GPT-4", value: "gpt-4" },
              { name: "GPT-4o", value: "gpt-4o" },
              { name: "GPT-3.5 Turbo", value: "gpt-3.5-turbo" },
              { name: "Custom", value: "" },
            ],
          };
          return modelChoices[answers.aiProvider] || modelChoices.openai;
        },
        default: (answers: any) => {
          if (answers.aiProvider === currentAiConfig.provider) {
            return config.aiModel || currentAiConfig.model;
          }
          const defaults: Record<string, string> = {
            openai: "gpt-4o-mini",
            anthropic: "claude-3-5-sonnet-20241022",
            google: "gemini-1.5-flash",
            azure: "gpt-4",
          };
          return defaults[answers.aiProvider];
        },
      },
      {
        type: "input",
        name: "aiModel",
        message: "Enter custom model name:",
        when: (answers: any) => !answers.aiModel,
        validate: (input: string) =>
          input.length > 0 || "Model name is required",
      },
      {
        type: "number",
        name: "aiTemperature",
        message: "AI temperature (0.0-2.0, lower = more consistent):",
        default: config.aiTemperature || 0.3,
        validate: (input: number) => {
          if (input >= 0 && input <= 2) return true;
          return "Temperature must be between 0.0 and 2.0";
        },
      },
      {
        type: "number",
        name: "aiMaxTokens",
        message: "AI max tokens for analysis:",
        default: config.aiMaxTokens || 500,
        validate: (input: number) => {
          if (input > 0 && input <= 4000) return true;
          return "Max tokens must be between 1 and 4000";
        },
      },
    ]);

    const updatedConfig = { ...config, ...answers };
    await ConfigManager.save(updatedConfig);
    success("AI configuration updated successfully!\n");

    // Show updated config
    const aiConfig = ConfigManager.getAIConfig(updatedConfig);
    console.log(chalk.cyan("🤖 Updated AI Configuration:"));
    console.log(`   Provider: ${aiConfig.provider}`);
    console.log(`   Model: ${aiConfig.model}`);
    console.log(`   Temperature: ${aiConfig.temperature}`);
    console.log(`   Max Tokens: ${aiConfig.maxTokens}`);
    console.log("");
  });
program
  .command("pr")
  .alias("c")
  .description("Create a new PR")
  .action(createPr);

// Parse CLI arguments
program.parse();
