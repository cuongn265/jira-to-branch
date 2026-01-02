import { AIProvider, createAIProvider, AIProviderConfig } from "./ai-providers";
import { ConfigManager, DEFAULT_PROVIDER_MODELS } from "./config";

interface TicketAnalysis {
  primaryAction: string;
  technicalContext: string[];
  businessContext: string[];
  suggestedBranchName: string;
  reasoning: string;
}

interface AIConfig {
  provider: "openai" | "anthropic" | "google" | "azure";
  apiKey?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  summaryMaxTokens: number;
  summaryTemperature: number;
  baseURL?: string;
  organizationId?: string;
}

export class AIService {
  private provider: AIProvider | null = null;
  private isEnabled: boolean = false;
  private aiConfig: AIConfig;

  static async create(
    apiKey?: string,
    customConfig?: Partial<AIConfig>
  ): Promise<AIService> {
    const instance = new AIService();
    await instance.initialize(apiKey, customConfig);
    return instance;
  }

  constructor(apiKey?: string, customConfig?: Partial<AIConfig>) {
    // Initialize with default config first
    this.aiConfig = {
      provider: "openai",
      model: DEFAULT_PROVIDER_MODELS.openai,
      temperature: 0.3,
      maxTokens: 500,
      summaryMaxTokens: 50,
      summaryTemperature: 0.2,
    };

    // Apply custom config if provided
    if (customConfig) {
      this.aiConfig = {
        ...this.aiConfig,
        ...customConfig,
      };
    }

    if (apiKey) {
      try {
        const providerConfig: AIProviderConfig = {
          provider: this.aiConfig.provider,
          apiKey: apiKey,
          model: this.aiConfig.model,
          baseURL: this.aiConfig.baseURL,
          organizationId: this.aiConfig.organizationId,
          temperature: this.aiConfig.temperature,
          maxTokens: this.aiConfig.maxTokens,
        };
        this.provider = createAIProvider(providerConfig);
        this.isEnabled = true;
      } catch (error) {
        console.warn(
          `Failed to initialize ${this.aiConfig.provider} provider:`,
          error
        );
        this.isEnabled = false;
      }
    }
  }

  private async initialize(
    apiKey?: string,
    customConfig?: Partial<AIConfig>
  ): Promise<void> {
    try {
      // Load configuration from file
      const config = await ConfigManager.load();
      const fileAIConfig = ConfigManager.getAIConfig(config);

      // Merge file config with custom config
      this.aiConfig = {
        provider: fileAIConfig.provider || this.aiConfig.provider,
        model: fileAIConfig.model || this.aiConfig.model,
        temperature: fileAIConfig.temperature ?? this.aiConfig.temperature,
        maxTokens: fileAIConfig.maxTokens ?? this.aiConfig.maxTokens,
        summaryMaxTokens:
          fileAIConfig.summaryMaxTokens ?? this.aiConfig.summaryMaxTokens,
        summaryTemperature:
          fileAIConfig.summaryTemperature ?? this.aiConfig.summaryTemperature,
        baseURL: fileAIConfig.baseURL,
        organizationId: fileAIConfig.organizationId,
        ...customConfig,
      };

      // Use apiKey from parameter or file config
      const effectiveApiKey = apiKey || fileAIConfig.apiKey;

      if (effectiveApiKey) {
        const providerConfig: AIProviderConfig = {
          provider: this.aiConfig.provider,
          apiKey: effectiveApiKey,
          model: this.aiConfig.model,
          baseURL: this.aiConfig.baseURL,
          organizationId: this.aiConfig.organizationId,
          temperature: this.aiConfig.temperature,
          maxTokens: this.aiConfig.maxTokens,
        };
        this.provider = createAIProvider(providerConfig);
        this.isEnabled = true;
      }
    } catch (error) {
      console.warn("Failed to initialize AI provider:", error);
      this.isEnabled = false;
    }
  }

  private async loadConfigFromFile(): Promise<AIConfig> {
    try {
      const config = await ConfigManager.load();
      const fileConfig = ConfigManager.getAIConfig(config);
      return {
        provider: fileConfig.provider || this.aiConfig.provider,
        model: fileConfig.model || this.aiConfig.model,
        temperature: fileConfig.temperature ?? this.aiConfig.temperature,
        maxTokens: fileConfig.maxTokens ?? this.aiConfig.maxTokens,
        summaryMaxTokens:
          fileConfig.summaryMaxTokens ?? this.aiConfig.summaryMaxTokens,
        summaryTemperature:
          fileConfig.summaryTemperature ?? this.aiConfig.summaryTemperature,
        baseURL: fileConfig.baseURL,
        organizationId: fileConfig.organizationId,
      };
    } catch (error) {
      console.warn(
        "Failed to load AI config from file, using current config:",
        error
      );
      return this.aiConfig;
    }
  }

  async analyzeBranchName(
    issueKey: string,
    summary: string,
    description?: string
  ): Promise<TicketAnalysis | null> {
    if (!this.isEnabled || !this.provider) {
      return null;
    }

    try {
      const prompt = this.createAnalysisPrompt(issueKey, summary, description);

      const response = await this.provider.createChatCompletion({
        messages: [
          {
            role: "system",
            content:
              "You are an expert software engineer who creates concise, meaningful Git branch names from Jira tickets. Always respond with valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: this.aiConfig.temperature,
        maxTokens: this.aiConfig.maxTokens,
      });

      if (!response.content) {
        throw new Error(`No response from ${this.aiConfig.provider}`);
      }

      return JSON.parse(response.content) as TicketAnalysis;
    } catch (error: any) {
      console.warn(
        `AI analysis failed (${this.aiConfig.provider}):`,
        error.message
      );
      return null;
    }
  }

  private createAnalysisPrompt(
    issueKey: string,
    summary: string,
    description?: string
  ): string {
    return `
Analyze this Jira ticket and create a concise Git branch name:

Ticket ID: ${issueKey}
Summary: ${summary}
Description: ${description || "No description provided"}

Create a branch name following this format: <ticket-id>-<2-4-meaningful-words>

Requirements:
- Max 40 characters total
- Preserve original ticket ID case, use lowercase with hyphens for the rest
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
  "suggestedBranchName": "EH-1234-fix-auth-validation",
  "reasoning": "Focuses on the primary action 'fix' and key technical components 'auth' and 'validation'"
}
`;
  }

  async generateBranchSummary(
    issueKey: string,
    summary: string,
    description?: string
  ): Promise<string | null> {
    if (!this.isEnabled || !this.provider) {
      return null;
    }

    try {
      const prompt = `
Summarize this Jira ticket in 3-5 key words for a Git branch name:

Ticket: ${issueKey}
Summary: ${summary}
Description: ${description || ""}

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

      const response = await this.provider.createChatCompletion({
        messages: [
          {
            role: "system",
            content:
              "You are a Git branch naming expert. Generate concise, meaningful branch name suffixes.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: this.aiConfig.summaryTemperature,
        maxTokens: this.aiConfig.summaryMaxTokens,
      });

      return response.content?.trim() || null;
    } catch (error: any) {
      console.warn(
        `AI summary failed (${this.aiConfig.provider}):`,
        error.message
      );
      return null;
    }
  }

  async generateGithubPrTitle(commitMessage: string): Promise<string | null> {
    if (!this.isEnabled || !this.provider) {
      return null;
    }

    try {
      const prompt = `
Generate a clear, meaningful, and concise title for a Github Pull Request based on the following git commit message:

Commit Message: ${commitMessage}

Examples:
- "Fix user authentication bug" → "Fix user authentication bug"
- "Add payment integration API" → "Add payment integration API"
- "Update database schema for users" → "Update database schema for users"
- "Add payment integration API" → "Add payment integration API"
- "Update database schema for users" → "Update database schema for users"

Requirements:
- The title must be short, specific, and meaningful.
- Do not include any special characters (e.g., ! @ # $ % ^ & * ( ) [ ] { } : ; , . / \\ | ~ etc.).
- Only use letters, numbers, and spaces.
- Use proper English and keep the title relevant to the commit message.
- Do not add extra details, prefixes, symbols, or formatting.
- Return only the PR title as plain text. No explanations or additional output.

Return only the PR title:
`;

      const response = await this.provider.createChatCompletion({
        messages: [
          {
            role: "system",
            content:
              "You are a Git Pull Request naming expert. Generate concise, meaningful PR titles.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: this.aiConfig.summaryTemperature,
        maxTokens: this.aiConfig.summaryMaxTokens,
      });

      return response.content?.trim() || null;
    } catch (error: any) {
      console.warn(
        `AI summary failed (${this.aiConfig.provider}):`,
        error.message
      );
      return null;
    }
  }

  isAIEnabled(): boolean {
    return this.isEnabled;
  }

  async testConnection(): Promise<boolean> {
    if (!this.isEnabled || !this.provider) {
      return false;
    }

    try {
      return await this.provider.testConnection();
    } catch {
      return false;
    }
  }

  // Getter methods for configuration access
  getAIConfig(): AIConfig {
    return { ...this.aiConfig };
  }

  updateConfig(newConfig: Partial<AIConfig>): void {
    this.aiConfig = {
      ...this.aiConfig,
      ...newConfig,
    };
  }

  getProvider(): string {
    return this.aiConfig.provider;
  }
}
