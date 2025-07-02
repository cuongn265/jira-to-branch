#!/bin/bash

# Script to publish jira-to-branch to GitHub Packages

echo "🚀 Publishing jira-to-branch to GitHub Packages"

# Check if GITHUB_TOKEN is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Error: GITHUB_TOKEN environment variable is not set"
    echo "Please create a GitHub Personal Access Token with 'write:packages' permission at:"
    echo "https://github.com/settings/tokens"
    echo ""
    echo "Then run: export GITHUB_TOKEN=your_token_here"
    exit 1
fi

# Build the project
echo "🔨 Building project..."
yarn build

# Create a temporary package.json with scoped name for GitHub Packages
echo "📦 Creating scoped package for GitHub Packages..."
cp package.json package.json.backup
sed -i.tmp 's/"name": "jira-to-branch"/"name": "@cuongn265\/jira-to-branch"/' package.json

# Set up npm registry for GitHub Packages
echo "⚙️ Configuring npm registry..."
npm config set registry https://npm.pkg.github.com/
npm config set //npm.pkg.github.com/:_authToken $GITHUB_TOKEN

# Publish to GitHub Packages
echo "📤 Publishing to GitHub Packages..."
npm publish

# Restore original package.json
echo "🔄 Restoring original package.json..."
mv package.json.backup package.json
rm -f package.json.tmp

# Reset npm registry to default
echo "🔧 Resetting npm registry..."
npm config set registry https://registry.npmjs.org/
npm config delete //npm.pkg.github.com/:_authToken

echo "✅ Successfully published to GitHub Packages!"
echo "Your package is now available at: https://github.com/cuongn265/jira-to-branch/packages"
