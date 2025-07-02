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
        
      // Get the base branch (usually main/master) to find commits unique to this branch
      let baseBranch = 'main';
      try {
        const upstreamBranch = execSync('git rev-parse --abbrev-ref --symbolic-full-name @{u}', { encoding: 'utf8', stdio: 'pipe' }).trim();
        baseBranch = upstreamBranch.split('/')[1] || 'main';
      } catch {
        // Fallback: try to determine the default branch
        try {
          const defaultBranch = execSync('git symbolic-ref refs/remotes/origin/HEAD', { encoding: 'utf8', stdio: 'pipe' }).trim();
          baseBranch = defaultBranch.split('/').pop() || 'main';
        } catch {
          // Final fallback: assume main
          baseBranch = 'main';
        }
      }
      
      // Get all commit messages from this branch only (excluding base branch commits)
      const commitMessages = execSync(`git log --no-merges --pretty=format:"%s" ${baseBranch}..HEAD`, { encoding: 'utf8', stdio: 'pipe' }).trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      
      // Split into array and reverse to get chronological order
      const commitList = commitMessages.split('\n').filter(msg => msg.trim()).reverse();
      
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
