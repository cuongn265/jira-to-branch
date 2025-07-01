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
  useAI?: boolean;
  model?: string;
}

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
}
