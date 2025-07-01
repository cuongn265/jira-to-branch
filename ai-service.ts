import OpenAI from 'openai';

interface TicketAnalysis {
  primaryAction: string;
  technicalContext: string[];
  businessContext: string[];
  suggestedBranchName: string;
  reasoning: string;
}

export class AIService {
  private openai: OpenAI | null = null;
  private isEnabled: boolean = false;
  private model: string = "gpt-3.5-turbo";

  constructor(apiKey?: string, model?: string) {
    if (apiKey) {
      try {
        this.openai = new OpenAI({
          apiKey: apiKey,
        });
        this.model = model || "gpt-3.5-turbo";
        this.isEnabled = true;
      } catch (error) {
        console.warn('Failed to initialize OpenAI client:', error);
        this.isEnabled = false;
      }
    }
  }

  async analyzeBranchName(issueKey: string, summary: string, description?: string): Promise<TicketAnalysis | null> {
    if (!this.isEnabled || !this.openai) {
      return null;
    }

    try {
      const prompt = this.createAnalysisPrompt(issueKey, summary, description);

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are an expert software engineer who creates concise, meaningful Git branch names from Jira tickets. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_completion_tokens: 500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(content) as TicketAnalysis;
    } catch (error: any) {
      console.warn('OpenAI analysis failed:', error.message);
      return null;
    }
  }

  private createAnalysisPrompt(issueKey: string, summary: string, description?: string): string {
    return `
Analyze this Jira ticket and create a concise Git branch name:

Ticket ID: ${issueKey}
Summary: ${summary}
Description: ${description || 'No description provided'}

Create a branch name following this format: <ticket-id-lowercase>-<2-4-meaningful-words>

Requirements:
- Max 40 characters total
- Use lowercase with hyphens
- Focus on the primary action and key technical terms
- Avoid redundant words
- Be specific but concise

Return JSON with this structure:
{
  "primaryAction": "main action verb (fix, add, update, etc.)",
  "technicalContext": ["array", "of", "technical", "terms"],
  "businessContext": ["array", "of", "business", "terms"],
  "suggestedBranchName": "the-actual-branch-name",
  "reasoning": "brief explanation of why this name was chosen"
}

Example:
For "Fix user authentication validation in login API endpoint":
{
  "primaryAction": "fix",
  "technicalContext": ["authentication", "validation", "api", "endpoint"],
  "businessContext": ["user", "login"],
  "suggestedBranchName": "eh-1234-fix-auth-validation",
  "reasoning": "Focuses on the primary action 'fix' and key technical components 'auth' and 'validation'"
}
`;
  }

  async generateBranchSummary(issueKey: string, summary: string, description?: string): Promise<string | null> {
    if (!this.isEnabled || !this.openai) {
      return null;
    }

    try {
      const prompt = `
Summarize this Jira ticket in 3-5 key words for a Git branch name:

Ticket: ${issueKey}
Summary: ${summary}
Description: ${description || ''}

Create a concise branch suffix (2-4 words max) that captures the essence.
Focus on: action + main technical component + context
Avoid: articles, prepositions, redundant words
Use: lowercase with hyphens

Examples:
- "Fix user authentication bug" → "fix-auth-bug"
- "Add payment integration API" → "add-payment-api"
- "Update database schema for users" → "update-user-schema"

Return only the branch suffix (no ticket ID):
`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are a Git branch naming expert. Generate concise, meaningful branch name suffixes."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_completion_tokens: 50,
      });

      const content = response.choices[0]?.message?.content?.trim();
      return content || null;
    } catch (error: any) {
      console.warn('OpenAI summary failed:', error.message);
      return null;
    }
  }

  isAIEnabled(): boolean {
    return this.isEnabled;
  }

  async testConnection(): Promise<boolean> {
    if (!this.isEnabled || !this.openai) {
      return false;
    }

    try {
      await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: "Hello" }],
        max_completion_tokens: 5,
      });
      return true;
    } catch {
      return false;
    }
  }
}
