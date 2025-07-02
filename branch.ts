import { AIService } from './ai-service';
import { ConfigManager } from './config';

export class BranchNameGenerator {
  private static readonly MAX_BRANCH_LENGTH = 50;

  static async generate(
    issueKey: string,
    summary: string,
    description?: string,
    prefix?: string,
    openaiApiKey?: string
  ): Promise<string> {
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is required for branch generation');
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

      const aiSummary = await aiService.generateBranchSummary(issueKey, summary, description);

      if (!aiSummary) {
        throw new Error('Failed to generate branch name with AI');
      }

      const ticketId = issueKey
      const branchName = `${ticketId}-${aiSummary}`;
      const finalBranchName = prefix ? `${prefix}/${branchName}` : branchName;

      return this.ensureValidLength(finalBranchName);
    } catch (error: any) {
      throw new Error(`AI branch generation failed: ${error.message}`);
    }
  }

  static async generateWithAnalysis(
    issueKey: string,
    summary: string,
    description?: string,
    prefix?: string,
    openaiApiKey?: string
  ): Promise<{ branchName: string; analysis: any }> {
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is required for branch generation');
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

      const analysis = await aiService.analyzeBranchName(issueKey, summary, description);

      if (!analysis) {
        throw new Error('Failed to analyze branch name with AI');
      }

      const finalBranchName = prefix ? `${prefix}/${analysis.suggestedBranchName}` : analysis.suggestedBranchName;

      return {
        branchName: this.ensureValidLength(finalBranchName),
        analysis
      };
    } catch (error: any) {
      throw new Error(`AI branch analysis failed: ${error.message}`);
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
