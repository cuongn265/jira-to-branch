import { AIService } from './ai-service';
import { ConfigManager } from './config';
import { execSync } from 'child_process';

export class PullRequestGenerator {
  private static readonly MAX_BRANCH_LENGTH = 50;

  static async generate(
    ghToken?: string,
    openaiApiKey?: string
  ): Promise<string> {
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is required for PR generation');
    }

      if (!ghToken) {
        throw new Error('Github token is required for PR generation');
      }

    try {
      // Load configuration for AI settings
      const config = await ConfigManager.load();
      const aiConfig = ConfigManager.getAIConfig(config);

      // Create AI service with configured settings
      const aiService = await AIService.create(openaiApiKey, {
        model: aiConfig.model,
        temperature: aiConfig.temperature,
        maxTokens: aiConfig.maxTokens,
        summaryMaxTokens: aiConfig.summaryMaxTokens,
        summaryTemperature: aiConfig.summaryTemperature,
      });
        
      // Get the latest commit message
      const commitMessage = execSync('git log --no-merges --pretty=format:"%s" -1', { encoding: 'utf8' }).trim();
      
      if (!commitMessage) {
        throw new Error('No commit message found');
      }

      const prTitle = await aiService.generateGithubPrTitle(commitMessage);

      if (!prTitle) {
        throw new Error('Failed to generate PR title with AI');
      }

      return prTitle;
    } catch (error: any) {
      throw new Error(`AI branch generation failed: ${error.message}`);
    }
  }

  private static ensureValidLength(branchName: string): string {
    if (branchName.length <= this.MAX_BRANCH_LENGTH) {
      return branchName;
    }

    // Smart truncation: preserve ticket ID and truncate generative part
    const parts = branchName.split('/');
    const actualBranch = parts[parts.length - 1];
    const prefix = parts.length > 1 ? parts.slice(0, -1).join('/') + '/' : '';

    const [ticketId, ...generativeParts] = actualBranch.split('-');
    const generativePart = generativeParts.join('-');

    const maxGenerativeLength = this.MAX_BRANCH_LENGTH - prefix.length - ticketId.length - 1;
    const truncatedGenerative = generativePart.substring(0, maxGenerativeLength);

    return `${prefix}${ticketId}-${this.sanitizeBranchName(truncatedGenerative)}`;
  }

  private static sanitizeBranchName(branchName: string): string {
    return branchName
      // Replace invalid characters with hyphens
      .replace(/[^a-zA-Z0-9\-_\/]/g, '-')
      // Replace multiple consecutive hyphens with single hyphen
      .replace(/-+/g, '-')
      // Remove leading/trailing hyphens and slashes
      .replace(/^[-\/]+|[-\/]+$/g, '')
      // Ensure it doesn't start with a dot (hidden files)
      .replace(/^\./, '')
      // Ensure it doesn't end with .lock
      .replace(/\.lock$/, '')
      // Remove backticks (like `id` or `id`)
      .replace(/`/g, '');
  }
}
