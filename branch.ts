import { AIService } from './ai-service';

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
      const aiService = new AIService(openaiApiKey);
      const aiSummary = await aiService.generateBranchSummary(issueKey, summary, description);

      if (!aiSummary) {
        throw new Error('Failed to generate branch name with AI');
      }

      const ticketId = issueKey.toLowerCase();
      const branchName = `${ticketId}-${aiSummary}`;
      const finalBranchName = prefix ? `${prefix}/${branchName}` : branchName;

      return this.ensureValidLength(finalBranchName);
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

    return `${prefix}${ticketId}-${truncatedGenerative}`;
  }
}
