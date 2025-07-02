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


      // Get all commit messages from the current branch
      const commitMessages = execSync(`git log --pretty=format:"%s"`, { encoding: 'utf8', stdio: 'pipe' }).trim();

      // Split into array and filter out empty messages
      const commitList = commitMessages.split('\n').filter(msg => msg.trim());

      // Join all commit messages for AI processing
      const commitMessage = commitList.join('\n');
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
}
