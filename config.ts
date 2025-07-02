import fs from 'fs';
import path from 'path';
import os from 'os';

interface Config {
  jiraHost?: string;
  jiraEmail?: string;
  jiraToken?: string;
  githubToken?: string;
  defaultBranchPrefix?: string;
  openaiApiKey?: string;
  // AI Configuration
  aiModel?: string;
  aiTemperature?: number;
  aiMaxTokens?: number;
  ghToken?: string;
}

export const DEFAULT_AI_CONFIG = {
  model: 'gpt-4o-mini',
  temperature: 0.3,
  maxTokens: 500,
  summaryMaxTokens: 50,
  summaryTemperature: 0.2,
} as const;

export class ConfigManager {
  private static configPath = path.join(os.homedir(), '.jira-to-branch.json');

  static async load(): Promise<Config> {
    try {
      if (!fs.existsSync(this.configPath)) {
        return {};
      }
      const configData = fs.readFileSync(this.configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error: any) {
      console.warn('Failed to load config:', error.message);
      return {};
    }
  }

  static async save(config: Config): Promise<void> {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    } catch (error: any) {
      throw new Error(`Failed to save config: ${error.message}`);
    }
  }

  static getAIConfig(config: Config) {
    return {
      model: config.aiModel || DEFAULT_AI_CONFIG.model,
      temperature: config.aiTemperature || DEFAULT_AI_CONFIG.temperature,
      maxTokens: config.aiMaxTokens || DEFAULT_AI_CONFIG.maxTokens,
      summaryMaxTokens: DEFAULT_AI_CONFIG.summaryMaxTokens,
      summaryTemperature: DEFAULT_AI_CONFIG.summaryTemperature,
    };
  }
}
