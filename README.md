# 🚀 Jira to Branch CLI

[![npm version](https://img.shields.io/npm/v/jira-to-branch)](https://www.npmjs.com/package/jira-to-branch)
[![GitHub release](https://img.shields.io/github/v/release/cuongn265/jira-to-branch)](https://github.com/cuongn265/jira-to-branch/releases)
[![License](https://img.shields.io/npm/l/jira-to-branch)](https://github.com/cuongn265/jira-to-branch/blob/main/LICENSE)
[![Node.js](https://img.shields.io/node/v/jira-to-branch)](https://nodejs.org)

An AI-powered CLI tool that creates meaningful Git branches from Jira tickets using OpenAI's advanced language models.

## ✨ Features

- **🚀 OpenAI-Powered Generation**: Advanced AI analysis using OpenAI GPT-3.5-turbo for superior branch names
- **📊 Multiple Input Formats**: Supports ticket IDs, browse URLs, and project URLs
- **🎯 Smart Analysis**: Deep understanding of technical context and business requirements
- **⚡ Git Integration**: Automatically creates and switches to new branches
- **🎨 Beautiful Output**: Colorful, informative terminal experience with detailed ticket information
- **⚙️ Flexible Configuration**: Easy setup with persistent configuration
- **🔒 Secure**: Proper HTTPS validation and secure credential storage

## 📦 Installation

### Global Installation (Recommended)
```bash
npm install -g jira-to-branch
```

### From Source
```bash
git clone <repository>
cd jira-to-branch
npm install
./install.sh
```

### Local Development
```bash
git clone <repository>
cd jira-to-branch
npm install
npm run build
npm link
```

## 🛠️ Setup

Before using the tool, configure your credentials:

```bash
jira-to-branch setup
```

You'll be prompted for:
- **Jira Host**: Your Jira instance (e.g., `company.atlassian.net`)
- **Jira Email**: Your Jira account email
- **Jira API Token**: Generate one at https://id.atlassian.com/manage-profile/security/api-tokens
- **OpenAI API Key**: Get one at https://platform.openai.com/api-keys (required)
- **Default Branch Prefix**: Optional prefix for branches (e.g., `feature`, `bugfix`)
- **AI Model**: Choose from GPT-3.5-turbo, GPT-4, GPT-4o, etc.
- **AI Temperature**: Controls randomness (0.0-1.0, lower = more consistent)
- **AI Max Tokens**: Maximum tokens for AI analysis (1-4000)

## 🚀 Usage

### Basic Usage
```bash
# Using ticket ID
jira-to-branch create EH-1234

# Using full Jira URL
jira-to-branch create "https://company.atlassian.net/browse/EH-1234"

# Quick alias
j2b create EH-1234
```

### Advanced Options
```bash
# Skip confirmation prompt
jira-to-branch create EH-1234 --yes

# Override branch prefix
jira-to-branch create EH-1234 --prefix bugfix

# Show detailed AI analysis
jira-to-branch create EH-1234 --analysis

# Combine options
jira-to-branch create EH-1234 --analysis --prefix feature --yes

# Quick branch command (alias)
jira-to-branch branch EH-1234
# or
jira-to-branch b EH-1234
```

### Configuration Commands
```bash
# View current configuration
jira-to-branch config

# Configure AI model settings
jira-to-branch ai-config

# Reconfigure all settings
jira-to-branch setup

# Get help
jira-to-branch --help

# Create pull request
j2b pr create
jira-to-branch pr create
```

## 🌿 Branch Name Format

The tool generates branches in the format: `<ticket-id>-<ai-generated-summary>`

### Examples:
- `EH-1234` + "Fix user authentication bug" → `EH-1234-fix-auth-bug`
- `PROJ-567` + "Add payment integration API" → `PROJ-567-add-payment-api`
- `BUG-89` + "Update database schema for users" → `BUG-89-update-user-schema`

### 🚀 AI-Powered Features:
- **🧠 Deep Context Understanding**: Analyzes technical and business context using configurable AI models
- **🎯 Intelligent Action Detection**: Identifies primary intent and priority
- **🔍 Semantic Analysis**: Understanding beyond keywords with natural language processing
- **📊 Smart Prioritization**: AI-driven relevance scoring for optimal branch names
- **🎨 Structured Analysis**: Clear reasoning and context categorization
- **⚙️ Configurable Models**: Support for GPT-3.5-turbo, GPT-4, GPT-4o, and more
- **🔧 Fine-tuning**: Adjustable temperature and token limits for optimal results

### 🔍 Detailed AI Analysis

Use the `--analysis` flag to see detailed AI reasoning:

```bash
jira-to-branch create EH-1234 --analysis
```

This provides:
- **Primary Action**: Main action verb (fix, add, update, etc.)
- **Technical Context**: Relevant technical terms and components
- **Business Context**: Business-related terms and implications
- **Reasoning**: AI's explanation for the chosen branch name

## 🎯 Workflow

1. **Input Processing**: Accepts Jira ticket ID or URL with format validation
2. **Repository Validation**: Ensures command is run within a Git repository
3. **Configuration Check**: Loads or prompts for required credentials (Jira + OpenAI)
4. **Ticket Fetching**: Retrieves comprehensive ticket information from Jira API
5. **Rich Display**: Shows detailed ticket information (title, type, status, priority, assignee)
6. **AI Analysis**: GPT-3.5-turbo semantic analysis for intelligent branch naming
7. **Branch Generation**: Creates concise, meaningful branch names with AI reasoning
8. **User Confirmation**: Shows current branch and prompts for confirmation (unless `--yes`)
9. **Git Integration**: Creates and switches to the new branch
10. **Success Feedback**: Confirms successful branch creation

## 📋 Supported Input Formats

- **Ticket ID**: `EH-1234`, `PROJ-567`
- **Browse URL**: `https://company.atlassian.net/browse/EH-1234`
- **Project URL**: `https://company.atlassian.net/projects/EH/issues/EH-1234`
- **URL with Parameters**: URLs with query parameters and fragments

## 🔧 Configuration

Configuration is stored in `~/.jira-to-branch.json`:

```json
{
  "jiraHost": "company.atlassian.net",
  "jiraEmail": "your-email@company.com",
  "jiraToken": "your-api-token",
  "openaiApiKey": "sk-...",
  "defaultBranchPrefix": "feature",
  "aiModel": "gpt-3.5-turbo",
  "aiTemperature": 0.3,
  "aiMaxTokens": 500
}
```

### AI Model Configuration

Use the dedicated AI configuration command for fine-tuning:

```bash
jira-to-branch ai-config
```

**Available Models:**
- `gpt-3.5-turbo` (recommended) - Fast and cost-effective
- `gpt-4` - More accurate but slower and more expensive
- `gpt-4-turbo-preview` - Latest GPT-4 with improved performance
- `gpt-4o` - Optimized version of GPT-4
- `gpt-4o-mini` - Smaller, faster version of GPT-4o

**Configuration Options:**
- **Temperature**: Controls creativity vs consistency (0.0 = deterministic, 1.0 = creative)
- **Max Tokens**: Limits response length (higher = more detailed analysis)

## 🛡️ Security & Reliability

- **Secure HTTPS**: Proper certificate validation with custom HTTPS agent
- **Credential Protection**: API tokens stored locally and masked in output
- **Error Handling**: Comprehensive error handling with specific error messages
- **Rate Limiting**: Handles Jira API rate limits gracefully
- **Timeout Management**: 15-second timeout for API requests
- **Connection Testing**: Built-in connection validation for both Jira and OpenAI

## 🐛 Troubleshooting

### Common Issues:

**Authentication Failed (401)**
- Verify your Jira email and API token
- Check if your Jira host URL is correct (without https://)
- Ensure your API token is valid and not expired

**Access Denied (403)**
- Check your permissions for the specific project/ticket
- Verify you have access to the Jira instance

**Ticket Not Found (404)**
- Verify the ticket ID exists and is accessible
- Check the project key format (e.g., EH-1234)

**Rate Limit Exceeded (429)**
- Wait a few minutes before retrying
- Consider reducing API call frequency

**Git Repository Error**
- Run the command from within a Git repository
- Ensure Git is installed and configured

**OpenAI API Issues**
- Verify your OpenAI API key is valid
- Check your OpenAI account has sufficient credits
- Ensure network connectivity to OpenAI API

### Debug Information:
The tool provides detailed error messages and status updates for troubleshooting.

## 🔍 Technical Details

### Dependencies
- **axios**: HTTP client for Jira API calls
- **chalk**: Terminal color output
- **commander**: CLI framework
- **inquirer**: Interactive prompts
- **openai**: OpenAI API integration
- **TypeScript**: Type-safe development

### AI Analysis Process
Uses OpenAI GPT-3.5-turbo with structured prompts for semantic analysis:
- Analyzes ticket summary and description
- Identifies primary actions and technical context
- Generates concise, meaningful branch names
- Ensures proper formatting and length constraints

### Branch Name Constraints
- Maximum 50 characters total
- Ticket ID case preserved, suffix in lowercase with hyphens
- Ticket ID prefix always preserved
- Meaningful technical terms prioritized
- Action words emphasized

## 📦 Version Management & Publishing

### Bumping Version and Triggering Automated Publishing

To release a new version that automatically triggers the GitHub Actions publish workflow:

1. **Update package version** in `package.json`:
   ```bash
   # Manually edit package.json or use npm version command
   npm version patch    # 1.0.2 → 1.0.3
   npm version minor    # 1.0.3 → 1.1.0
   npm version major    # 1.1.0 → 2.0.0
   ```

2. **Push changes to GitHub**:
   ```bash
   git push origin main --tags
   ```

3. **Create a GitHub Release** (⚡ This triggers the automated publish workflow):
   - Go to [GitHub Releases](https://github.com/cuongn265/jira-to-branch/releases)
   - Click "Create a new release"
   - Choose the tag version (e.g., `v1.0.3`)
   - Add release notes describing changes
   - Click "Publish release"
   - 🚀 **GitHub Actions will automatically publish to GitHub Packages**

### Alternative Publishing Methods

#### Manual Local Publishing:
```bash
# Publish to GitHub Packages locally (requires GITHUB_TOKEN)
./publish-github.sh

# Publish to NPM (optional)
npm run publish:npm
```

#### Manual GitHub Actions Trigger:
- Go to [Actions tab](https://github.com/cuongn265/jira-to-branch/actions)
- Select "Publish to GitHub Packages" workflow
- Click "Run workflow" button

### Publishing Workflow Triggers

The GitHub Actions publish workflow (`.github/workflows/publish.yml`) runs when:
- ✅ **GitHub Release is published** (recommended - fully automated)
- ✅ **Manual workflow dispatch** from GitHub Actions UI
- ❌ **NOT triggered by** just creating Git tags or running local scripts

### Important Notes:
- **Creating a GitHub Release** is the recommended way to publish
- Ensure the Git tag version matches the package.json version
- The `npm version` command automatically creates a Git tag and commit
- Always test the build before publishing: `npm run build`
- GitHub Actions uses `GITHUB_TOKEN` automatically (no manual setup needed)
- Local publishing with `./publish-github.sh` requires setting `GITHUB_TOKEN`

### Version Synchronization:
If Git tag and package versions get out of sync:
1. Check current versions: `git tag --list` and check `package.json`
2. Update `package.json` to match the latest Git tag
3. Or create a new Git tag to match the package version
4. Create a new GitHub Release to trigger automated publishing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with proper TypeScript types
4. Build and test: `npm run build && npm run dev`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🎉 Examples

### Real-world Usage:

```bash
# AI-powered generation
$ jira-to-branch create AUTH-123
🚀 Starting AI-powered branch creation...

ℹ Detected Jira ticket: AUTH-123
ℹ Connecting to Jira...
ℹ Fetching ticket information...

📋 Ticket Information:
   Title: Fix OAuth token refresh mechanism
   Type: Bug
   Status: In Progress
   Priority: High
   Assignee: John Doe

ℹ 🤖 Generating branch name with OpenAI...

   🌿 AI-generated branch: AUTH-123-fix-oauth-token-refresh

   📍 Current branch: main
? Create and switch to this branch? Yes
ℹ Creating new branch...
✓ Successfully created and switched to branch: AUTH-123-fix-oauth-token-refresh

# Skip confirmation with --yes
$ jira-to-branch create FEAT-456 --yes
🚀 Starting AI-powered branch creation...

ℹ Detected Jira ticket: FEAT-456
ℹ Connecting to Jira...
ℹ Fetching ticket information...

📋 Ticket Information:
   Title: Implement payment gateway integration with Stripe API
   Type: Story
   Status: To Do
   Priority: Medium
   Assignee: Jane Smith

ℹ 🤖 Generating branch name with OpenAI...

   🌿 AI-generated branch: FEAT-456-implement-payment-gateway

ℹ Creating new branch...
✓ Successfully created and switched to branch: FEAT-456-implement-payment-gateway

# With detailed AI analysis
$ jira-to-branch create API-321 --analysis
🚀 Starting AI-powered branch creation...

📋 Ticket Information:
   Title: Implement user authentication API with JWT tokens
   Type: Story
   Status: To Do
   Priority: High
   Assignee: Alice Johnson

ℹ 🤖 Generating branch name with OpenAI...

   🌿 AI-generated branch: API-321-implement-user-auth-jwt

🔍 AI Analysis:
   Primary Action: implement
   Technical Context: authentication, api, jwt, tokens
   Business Context: user, security
   Reasoning: Focuses on the primary action 'implement' and key technical components 'auth' and 'jwt' for a concise yet descriptive branch name

? Create and switch to this branch? Yes
✓ Successfully created and switched to branch: API-321-implement-user-auth-jwt

# With custom prefix
$ jira-to-branch create PERF-789 --prefix hotfix
🚀 Starting AI-powered branch creation...

📋 Ticket Information:
   Title: Optimize database query performance for user dashboard
   Type: Improvement
   Status: Selected for Development
   Priority: High
   Assignee: Bob Wilson

   🌿 AI-generated branch: hotfix/PERF-789-optimize-db-query-performance
```

---

**Happy branching! 🌿**
