# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.4] 2026-01-02

### Added
- **Multiple AI Provider Support**: Tool now supports multiple AI providers beyond OpenAI
  - OpenAI (GPT-3.5, GPT-4, GPT-4o) - Default provider
  - Anthropic (Claude 3.5 Sonnet, Haiku, Opus)
  - Google (Gemini 1.5 Flash, Pro, 2.0)
  - Azure OpenAI (Enterprise deployments)
- **Generic AI Provider Architecture**: New abstraction layer for AI providers
  - `AIProvider` base class for consistent interface
  - Provider-specific implementations with dynamic loading
  - Factory pattern for provider instantiation
- **Provider Configuration**: New configuration options
  - `aiProvider`: Select which AI service to use
  - `aiApiKey`: Generic API key field (replaces provider-specific keys)
  - `aiBaseURL`: Custom endpoint support (required for Azure)
  - `aiOrganizationId`: Support for OpenAI organization accounts
- **Comprehensive Documentation**:
  - `AI_PROVIDERS.md`: Detailed guide for each provider
  - `MIGRATION.md`: Migration guide for existing users
  - `REFACTORING_SUMMARY.md`: Technical overview of changes
  - `.jira-to-branch.example.json`: Example configuration file
- **LangChain Integration**: Unified AI provider interface
  - `@langchain/core` for core abstractions
  - `@langchain/openai` for OpenAI provider
  - `@langchain/anthropic` for Anthropic Claude
  - `@langchain/google-genai` for Google Gemini
  - All providers included in base installation

### Changed
- **AI Service Refactoring**: Completely refactored `ai-service.ts`
  - Removed direct OpenAI client usage
  - Implemented generic provider interface
  - Updated all AI methods to use provider abstraction
- **Configuration Structure**: Enhanced configuration management
  - Added `DEFAULT_PROVIDER_MODELS` for default models per provider
  - Updated `getAIConfig()` to handle provider-specific settings
- **Error Messages**: Now include provider name for better debugging

### Maintained
- **Backward Compatibility**: Full backward compatibility maintained
  - Legacy `openaiApiKey` still supported
  - Automatically maps to new `aiProvider: "openai"` format
  - No breaking changes for existing users
- **All Existing Features**: All previous functionality preserved
  - Branch creation workflow unchanged
  - Git integration unchanged
  - CLI commands unchanged

### Technical Details
- New file: `ai-providers.ts` - Provider abstraction layer using LangChain
- LangChain provides unified interface for all AI providers
- All provider SDKs included in base installation
- TypeScript compilation successful with no errors

### Benefits
- **Simplicity**: Single installation includes all providers
- **Flexibility**: Choose preferred AI provider based on needs
- **Cost Optimization**: Different providers have different pricing models
- **Reliability**: Fallback options if one provider has issues
- **Future-Proof**: Easy to add new providers via LangChain
- **Enterprise-Ready**: Support for Azure OpenAI deployments

## [1.0.8] - 2025-11-17

### Added
- **Interactive Branch Name Editing**: Users can now directly edit the AI-suggested branch name during branch creation
  - Uses native Node.js `readline` API for a true editable input experience
  - Pre-filled input shows the AI-generated suggestion with full cursor control
  - Arrow keys, backspace, and delete operations work seamlessly
  - More intuitive than previous menu-based approach

- **Branch Existence Detection**: Graceful handling when a branch with the same name already exists
  - Displays warning message when attempting to create a branch that already exists
  - Offers three options:
    - Checkout existing branch: Switch to the already-created branch
    - Create new branch with different name: Edit the branch name and create a new one
    - Cancel: Exit without making changes
  - Prevents git errors and improves user experience

### Changed
- **Branch Creation Flow**: Replaced simple yes/no confirmation with editable input field
  - Direct editing of suggested branch name instead of menu selection
  - Pre-populated input field with the AI-generated branch name
  - Users can press Enter to accept or edit inline before creating

### Technical Changes
- Added `getEditableInput()` helper function for custom input prompts
- Added `branchExists()` function to check if a branch is already present in the repository
- Integrated Node.js `readline` module for better terminal **interaction**
- Enhanced error handling for branch creation scenarios

### Improved User Experience
- ✅ Streamlined branch creation workflow
- ✅ No more confusing menu options for simple editing tasks
- ✅ Direct, intuitive text editing like any terminal application
- ✅ Better feedback when branch names conflict
- ✅ Clear options for handling existing branches

### Dependencies
- No new external dependencies added (uses built-in Node.js `readline` module)

### Fixes
- Prevented git errors when attempting to create branches with names that already exist
- Improved terminal interaction stability

---

## [1.0.7] - 2025-11-10

### Added
- AI-powered branch generation with OpenAI integration
- Multiple input format support (ticket IDs, browse URLs, project URLs)
- Detailed AI analysis with `--analysis` flag
- Configuration management for Jira and OpenAI credentials
- AI model selection and temperature configuration
- Comprehensive ticket information display

### Features
- Smart branch name generation based on ticket content
- Support for custom branch prefixes
- Confirmation prompts before branch creation
- Beautiful colored terminal output
- GitHub CLI integration for pull request creation

---

## Upgrade Guide

### From 1.0.7 to 1.0.8

The upgrade is backward compatible. No breaking changes.

**What's New:**
1. When you run `jira-to-branch create TICKET-ID`, you'll now see an editable input field instead of a confirmation prompt
2. You can edit the branch name directly in the input (use arrow keys, backspace, etc.)
3. If the branch already exists, you'll get options to checkout the existing branch or create a new one with a different name

**Example workflow:**
```bash
$ jira-to-branch create EH-1234
🚀 Starting AI-powered branch creation...

ℹ Detected Jira ticket: EH-1234
ℹ Connecting to Jira...
ℹ Fetching ticket information...

📋 Ticket Information:
   Title: Fix authentication bug
   Type: Bug
   Status: In Progress
   Priority: High
   Assignee: John Doe

ℹ 🤖 Generating branch name with OpenAI...

   🌿 AI-generated branch: EH-1234-fix-auth-bug
   📍 Current branch: main

   🌿 Branch name: EH-1234-fix-auth-bug
   # You can now edit the branch name directly
   # Press Enter to accept or modify it
```

If the branch already exists:
```bash
⚠ Branch 'EH-1234-fix-auth-bug' already exists
? What would you like to do? (Use arrow keys)
❯ Checkout existing branch
  Create new branch with different name
  Cancel
```

---

## Known Issues
None at this time.

## Future Improvements
- [ ] Batch branch creation from multiple tickets
- [ ] Branch naming templates/presets
- [ ] Integration with more issue tracking systems
- [ ] Shell completion for common commands
