#!/bin/bash

# Jira to Branch CLI - Installation Script

echo "🚀 Installing Jira to Branch CLI..."

# Build the project
echo "📦 Building project..."
npm run build

# Make executable
chmod +x dist/index.js

# Link globally
echo "🔗 Linking globally..."
npm link

echo "✅ Installation complete!"
echo ""
echo "You can now use the CLI with:"
echo "  jira-to-branch --help"
echo "  j2b --help"
echo ""
echo "First time setup:"
echo "  jira-to-branch setup"
echo ""
echo "Example usage:"
echo "  jira-to-branch create EH-1234"
echo "  j2b create https://company.atlassian.net/browse/EH-1234"
