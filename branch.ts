import { AIService } from './ai-service';

export class BranchNameGenerator {
  private static readonly MAX_BRANCH_LENGTH = 50;
  private static readonly MAX_GENERATIVE_LENGTH = 30;

  // Common stop words to filter out
  private static readonly STOP_WORDS = new Set([
    'the', 'is', 'at', 'which', 'on', 'and', 'a', 'to', 'are', 'as', 'was',
    'will', 'be', 'have', 'has', 'had', 'by', 'for', 'of', 'with', 'from',
    'an', 'but', 'or', 'if', 'this', 'that', 'it', 'in', 'we', 'you', 'they',
    'can', 'should', 'would', 'could', 'may', 'might', 'must', 'shall'
  ]);

  // High-priority technical keywords
  private static readonly TECH_KEYWORDS = new Set([
    'api', 'endpoint', 'service', 'component', 'module', 'function', 'method',
    'database', 'db', 'migration', 'schema', 'table', 'model', 'controller', 'view',
    'auth', 'authentication', 'authorization', 'security', 'validation', 'error',
    'bug', 'fix', 'feature', 'enhancement', 'improvement', 'optimization',
    'integration', 'config', 'configuration', 'setup', 'deployment', 'testing',
    'refactor', 'cleanup', 'update', 'upgrade', 'install', 'remove', 'delete',
    'user', 'admin', 'dashboard', 'login', 'logout', 'register', 'profile',
    'notification', 'email', 'payment', 'order', 'product', 'search',
    'filter', 'sort', 'pagination', 'export', 'import', 'upload', 'download',
    'cache', 'session', 'token', 'webhook', 'response', 'request'
  ]);

  // Action verbs that indicate what the ticket is about
  private static readonly ACTION_WORDS = new Set([
    'add', 'create', 'build', 'implement', 'develop', 'generate', 'setup',
    'remove', 'delete', 'clean', 'clear', 'reset', 'purge',
    'update', 'modify', 'change', 'edit', 'adjust', 'configure', 'set',
    'fix', 'resolve', 'solve', 'handle', 'debug', 'patch',
    'improve', 'enhance', 'optimize', 'refactor', 'restructure', 'streamline',
    'integrate', 'connect', 'link', 'sync', 'merge', 'combine',
    'validate', 'verify', 'check', 'ensure', 'confirm', 'test',
    'enable', 'disable', 'toggle', 'activate', 'deactivate', 'switch'
  ]);

  static async generate(
    issueKey: string,
    summary: string,
    description?: string,
    prefix?: string,
    openaiApiKey?: string
  ): Promise<string> {
    // Try OpenAI first if API key is provided
    if (openaiApiKey) {
      try {
        const aiService = new AIService(openaiApiKey);
        const aiSummary = await aiService.generateBranchSummary(issueKey, summary, description);

        if (aiSummary) {
          const ticketId = issueKey;
          const branchName = `${ticketId}-${aiSummary}`;
          const finalBranchName = prefix ? `${prefix}/${branchName}` : branchName;
          return this.ensureValidLength(finalBranchName);
        }
      } catch (error) {
        console.warn('OpenAI generation failed, falling back to rule-based logic');
      }
    }

    // Fallback to rule-based AI-like logic
    return this.generateFallback(issueKey, summary, description, prefix);
  }



  private static generateFallback(issueKey: string, summary: string, description?: string, prefix?: string): string {
    // Extract and analyze content intelligently
    const analysisResult = this.analyzeTicketContent(summary, description);

    // Generate concise branch name using AI-like logic
    const generativeName = this.generateConciseName(analysisResult);

    // Combine with ticket ID in format: <ticket-id>-<generative-name>
    const ticketId = issueKey;
    const branchName = `${ticketId}-${generativeName}`;

    // Add prefix if provided
    const finalBranchName = prefix ? `${prefix}/${branchName}` : branchName;

    return this.ensureValidLength(finalBranchName);
  }

  private static analyzeTicketContent(summary: string, description?: string) {
    const combinedText = `${summary} ${description || ''}`;

    // Clean and tokenize text
    const tokens = this.tokenizeText(combinedText);

    // Extract different types of meaningful content
    const actions = this.extractActions(tokens);
    const entities = this.extractEntities(tokens);
    const techTerms = this.extractTechTerms(tokens);

    // Determine the primary intent/action
    const primaryAction = this.determinePrimaryAction(summary, actions);

    // Score and rank all tokens for relevance
    const rankedTokens = this.rankTokensByRelevance(tokens, actions, entities, techTerms);

    return {
      primaryAction,
      actions,
      entities,
      techTerms,
      rankedTokens,
      originalSummary: summary
    };
  }

  private static tokenizeText(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ') // Remove special chars except hyphens
      .replace(/\s+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(token =>
        token.length > 2 &&
        !this.STOP_WORDS.has(token) &&
        !token.match(/^\d+$/) // Skip pure numbers
      );
  }

  private static extractActions(tokens: string[]): string[] {
    return tokens.filter(token => this.ACTION_WORDS.has(token));
  }

  private static extractEntities(tokens: string[]): string[] {
    // Extract entities that are likely to be important nouns/objects
    const entities = tokens.filter(token => {
      // Skip if it's an action word or tech term (handled separately)
      if (this.ACTION_WORDS.has(token) || this.TECH_KEYWORDS.has(token)) {
        return false;
      }

      // Include longer words that might be specific entities
      return token.length > 4 ||
             token.endsWith('ing') ||
             token.endsWith('tion') ||
             token.endsWith('ment');
    });

    return [...new Set(entities)]; // Remove duplicates
  }

  private static extractTechTerms(tokens: string[]): string[] {
    return tokens.filter(token => this.TECH_KEYWORDS.has(token));
  }

  private static determinePrimaryAction(summary: string, actions: string[]): string | null {
    // Look for action words at the beginning of summary (common pattern)
    const summaryWords = summary.toLowerCase().split(/\s+/);
    const firstAction = summaryWords.find(word => this.ACTION_WORDS.has(word));

    if (firstAction) return firstAction;

    // If no action at start, return the first action found
    return actions.length > 0 ? actions[0] : null;
  }

  private static rankTokensByRelevance(
    tokens: string[],
    actions: string[],
    entities: string[],
    techTerms: string[]
  ): string[] {
    const tokenScores = new Map<string, number>();

    tokens.forEach(token => {
      let score = 1; // Base score

      // Prioritize action words
      if (this.ACTION_WORDS.has(token)) {
        score += 5;
      }

      // High priority for tech terms
      if (this.TECH_KEYWORDS.has(token)) {
        score += 4;
      }

      // Medium priority for entities
      if (entities.includes(token)) {
        score += 2;
      }

      // Bonus for length (more specific terms)
      if (token.length > 6) {
        score += 1;
      }

      // Penalty for very common words even if not in stop words
      const commonWords = ['user', 'system', 'page', 'form', 'button', 'field'];
      if (commonWords.includes(token)) {
        score -= 1;
      }

      tokenScores.set(token, score);
    });

    // Sort by score and remove duplicates
    return Array.from(new Set(tokens))
      .sort((a, b) => (tokenScores.get(b) || 0) - (tokenScores.get(a) || 0));
  }

  private static generateConciseName(analysis: any): string {
    const { primaryAction, rankedTokens } = analysis;

    let nameParts: string[] = [];

    // Start with primary action if available
    if (primaryAction) {
      nameParts.push(primaryAction);
    }

    // Add the most relevant terms, avoiding duplicates
    const usedWords = new Set(nameParts);

    for (const token of rankedTokens) {
      if (usedWords.has(token)) continue;

      nameParts.push(token);
      usedWords.add(token);

      // Stop when we have enough words or reach length limit
      const currentName = nameParts.join('-');
      if (nameParts.length >= 4 || currentName.length >= this.MAX_GENERATIVE_LENGTH) {
        break;
      }
    }

    // Fallback: if we don't have enough meaningful words, add from summary
    if (nameParts.length < 2) {
      const summaryWords = analysis.originalSummary
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((word: string) =>
          word.length > 3 &&
          !this.STOP_WORDS.has(word) &&
          !usedWords.has(word)
        )
        .slice(0, 3);

      nameParts.push(...summaryWords);
    }

    // Join and clean up
    let branchName = nameParts.join('-');

    // Final cleanup
    branchName = branchName
      .replace(/-+/g, '-') // Multiple hyphens to single
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .substring(0, this.MAX_GENERATIVE_LENGTH);

    return branchName || 'update'; // Ultimate fallback
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
