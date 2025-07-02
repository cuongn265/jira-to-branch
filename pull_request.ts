import { AIService } from './ai-service';
import { ConfigManager } from './config';
import { execSync } from 'child_process';

export class PullRequestGenerator {
  private static readonly MAX_BRANCH_LENGTH = 50;

  static async generate(
    openaiApiKey?: string
  ): Promise<string> {
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is required for PR generation');
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

      // Get recent commit messages with improved buffer handling and limits
      let commitMessages: string;
      try {
        // Limit to last 50 commits to prevent buffer overflow
        commitMessages = execSync(`git log --pretty=format:"%s" -n 50`, { 
          encoding: 'utf8', 
          stdio: 'pipe',
          maxBuffer: 10 * 1024 * 1024 // 10MB buffer for larger commit histories
        }).trim();
      } catch (gitError: any) {
        // Fallback to fewer commits if still getting buffer issues
        try {
          commitMessages = execSync(`git log --pretty=format:"%s" -n 10`, { 
            encoding: 'utf8', 
            stdio: 'pipe',
            maxBuffer: 5 * 1024 * 1024 // 5MB buffer
          }).trim();
        } catch (fallbackError: any) {
          throw new Error(`Failed to get git commit messages: ${fallbackError.message}`);
        }
      }

      // Split into array and filter out empty messages
      const commitList = commitMessages.split('\n').filter(msg => msg.trim());

      // Join all commit messages for AI processing
      const commitMessage = commitList.join('\n');
      if (!commitMessage) {
        throw new Error('No commit message found');
      }

      // Limit commit message length to prevent token overflow
      const maxCommitLength = 2000; // Reasonable limit for AI processing
      const truncatedCommitMessage = commitMessage.length > maxCommitLength 
        ? commitMessage.substring(0, maxCommitLength) + '...'
        : commitMessage;

      const prTitle = await aiService.generateGithubPrTitle(truncatedCommitMessage);

      if (!prTitle) {
        throw new Error('Failed to generate PR title with AI');
      }

      return prTitle;
    } catch (error: any) {
      throw new Error(`AI PR generation failed: ${error.message}`);
    }
  }
}
