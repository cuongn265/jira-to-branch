# 🚀 Jira to Branch CLI

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

# Quick branch command (alias)
jira-to-branch branch EH-1234
# or
jira-to-branch b EH-1234
```

### Other Commands
```bash
# View current configuration
jira-to-branch config

# Reconfigure settings
jira-to-branch setup

# Get help
jira-to-branch --help
```

## 🌿 Branch Name Format

The tool generates branches in the format: `<ticket-id-lowercase>-<ai-generated-summary>`

### Examples:
- `EH-1234` + "Fix user authentication bug" → `eh-1234-fix-auth-bug`
- `PROJ-567` + "Add payment integration API" → `proj-567-add-payment-api`
- `BUG-89` + "Update database schema for users" → `bug-89-update-user-schema`

### 🚀 AI-Powered Features:
- **🧠 Deep Context Understanding**: Analyzes technical and business context using GPT-3.5-turbo
- **🎯 Intelligent Action Detection**: Identifies primary intent and priority
- **🔍 Semantic Analysis**: Understanding beyond keywords with natural language processing
- **📊 Smart Prioritization**: AI-driven relevance scoring for optimal branch names
- **🎨 Structured Analysis**: Clear reasoning and context categorization

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
  "defaultBranchPrefix": "feature"
}
```

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
- Lowercase with hyphens
- Ticket ID prefix preserved
- Meaningful technical terms prioritized
- Action words emphasized

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

   🌿 AI-generated branch: auth-123-fix-oauth-token-refresh

   📍 Current branch: main
? Create and switch to this branch? Yes
ℹ Creating new branch...
✓ Successfully created and switched to branch: auth-123-fix-oauth-token-refresh

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

   🌿 AI-generated branch: feat-456-implement-payment-gateway

ℹ Creating new branch...
✓ Successfully created and switched to branch: feat-456-implement-payment-gateway

# With custom prefix
$ jira-to-branch create PERF-789 --prefix hotfix
🚀 Starting AI-powered branch creation...

📋 Ticket Information:
   Title: Optimize database query performance for user dashboard
   Type: Improvement
   Status: Selected for Development
   Priority: High
   Assignee: Bob Wilson

   🌿 AI-generated branch: hotfix/perf-789-optimize-db-query-performance
```

---

**Happy branching! 🌿**
