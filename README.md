# 🚀 Jira to Branch CLI

A smart CLI tool that creates meaningful Git branches from Jira tickets using AI-powered branch name generation.

## ✨ Features

- **🚀 OpenAI-Powered Generation**: Real AI analysis using OpenAI GPT models for superior branch names
- **🤖 Intelligent Fallback**: Rule-based AI logic when OpenAI is unavailable
- **📊 Multiple Input Formats**: Supports ticket IDs, browse URLs, and project URLs
- **🎯 Smart Analysis**: Deep understanding of technical context and business requirements
- **⚡ Git Integration**: Automatically creates and switches to new branches
- **🎨 Beautiful Output**: Colorful, informative terminal experience
- **⚙️ Flexible Configuration**: Easy setup with persistent configuration

## 📦 Installation

### Global Installation (Recommended)
```bash
npm install -g jira-to-branch
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

Before using the tool, you need to configure your Jira credentials:

```bash
jira-to-branch setup
```

You'll be prompted for:
- **Jira Host**: Your Jira instance (e.g., `company.atlassian.net`)
- **Jira Email**: Your Jira account email
- **Jira API Token**: Generate one at https://id.atlassian.com/manage-profile/security/api-tokens
- **Default Branch Prefix**: Optional prefix for branches (e.g., `feature`, `bugfix`)
- **Enable OpenAI**: Choose whether to use OpenAI for advanced branch generation
- **OpenAI API Key**: Get one at https://platform.openai.com/api-keys (optional but recommended)

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

The tool generates branches in the format: `<ticket-id>-<generative-branch-name>`

### Examples:
- `EH-1234` + "Fix user authentication bug" → `eh-1234-fix-user-authentication-bug`
- `PROJ-567` + "Add payment integration API" → `proj-567-add-payment-integration-api`
- `BUG-89` + "Update database schema for users" → `bug-89-update-database-schema-users`

### 🚀 OpenAI-Powered Features:
- **🧠 Deep Context Understanding**: Analyzes technical and business context
- **🎯 Intelligent Action Detection**: Identifies primary intent and priority
- **🔍 Semantic Analysis**: Understanding beyond keywords
- **📊 Smart Prioritization**: AI-driven relevance scoring
- **🎨 Natural Language Processing**: Better human-like understanding

### 🤖 Rule-Based Fallback:
- **Keyword Extraction**: Identifies important technical terms and action words
- **Stop Word Filtering**: Removes common words like "the", "is", "and"
- **Technical Term Prioritization**: Boosts scoring for API, database, component terms
- **Action Word Recognition**: Prioritizes verbs like "fix", "add", "update"
- **Length Optimization**: Keeps branches concise but meaningful

## 🎯 Workflow

1. **Input Processing**: Accepts Jira ticket ID or URL
2. **Ticket Fetching**: Retrieves comprehensive ticket information from Jira
3. **AI Analysis**:
   - 🚀 **OpenAI Mode**: Deep semantic analysis with GPT models
   - 🤖 **Fallback Mode**: Rule-based intelligent keyword extraction
4. **Branch Generation**: Creates concise, meaningful branch names
5. **Git Integration**: Creates and switches to the new branch
6. **Confirmation**: Shows ticket details and AI reasoning before creation

## 📋 Supported Input Formats

- **Ticket ID**: `EH-1234`, `PROJ-567`
- **Browse URL**: `https://company.atlassian.net/browse/EH-1234`
- **Project URL**: `https://company.atlassian.net/projects/EH/issues/EH-1234`

## 🔧 Configuration

Configuration is stored in `~/.jira-to-branch.json`:

```json
{
  "jiraHost": "company.atlassian.net",
  "jiraEmail": "your-email@company.com",
  "jiraToken": "your-api-token",
  "defaultBranchPrefix": "feature",
  "useAI": true,
  "openaiApiKey": "sk-..."
}
```

## 🛡️ Security

- API tokens are stored locally and never transmitted insecurely
- HTTPS connections with proper certificate validation
- No sensitive data is logged or displayed

## 🐛 Troubleshooting

### Common Issues:

**Authentication Failed**
- Verify your Jira email and API token
- Check if your Jira host URL is correct
- Ensure you have access to the specific ticket

**Ticket Not Found**
- Verify the ticket ID exists and is accessible
- Check your permissions for the project

**Git Repository Error**
- Run the command from within a Git repository
- Ensure Git is installed and configured

### Debug Mode:
Set `DEBUG=1` environment variable for verbose output:
```bash
DEBUG=1 jira-to-branch create EH-1234
```

### Testing OpenAI Integration:
```bash
# Set your OpenAI API key
export OPENAI_API_KEY="sk-your-api-key-here"

# Run OpenAI demo
npm run openai-demo

# Test rule-based fallback
npm run demo
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🎉 Examples

### Real-world Examples:

```bash
# OpenAI-powered generation
$ jira-to-branch create AUTH-123
🚀 Analyzing ticket content with OpenAI...
✓ OpenAI-generated branch: hotfix/auth-123-fix-oauth-token-refresh

# Rule-based fallback
$ jira-to-branch create FEAT-456
🤖 Analyzing ticket content with rule-based AI...
✓ Rule-based AI-generated branch: feature/feat-456-add-payment-integration

# Complex ticket analysis
$ jira-to-branch create PERF-789
🚀 Analyzing ticket content with OpenAI...
✓ OpenAI-generated branch: performance/perf-789-optimize-database-queries
```

---

**Happy branching! 🌿**
