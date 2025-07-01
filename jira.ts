import axios, { AxiosInstance } from 'axios';
import https from 'https';

// Import version from package.json
const packageJson = require('../package.json');
const version: string = packageJson.version;

interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    description?: string;
    issuetype?: {
      name: string;
      iconUrl?: string;
    };
    status?: {
      name: string;
      statusCategory?: {
        name: string;
        colorName: string;
      };
    };
    priority?: {
      name: string;
      iconUrl?: string;
    };
    assignee?: {
      displayName: string;
      emailAddress?: string;
    };
    reporter?: {
      displayName: string;
    };
    created?: string;
    updated?: string;
    labels?: string[];
    components?: Array<{ name: string }>;
  };
}

export class JiraClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(host: string, email: string, apiToken: string) {
    // Ensure host doesn't have protocol
    const cleanHost = host.replace(/^https?:\/\//, '');
    this.baseUrl = `https://${cleanHost}/rest/api/2`;

    // Create a custom HTTPS agent with better security settings
    const httpsAgent = new https.Agent({
      rejectUnauthorized: true, // Default to secure
      timeout: 10000 // 10 second timeout
    });

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000, // 15 second timeout
      auth: {
        username: email,
        password: apiToken
      },
      httpsAgent: httpsAgent,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': `jira-to-branch-cli/${version}`
      }
    });
  }

  async getIssue(issueKey: string): Promise<JiraIssue> {
    try {
      // Request specific fields to optimize the API call
      const fields = [
        'summary',
        'description',
        'issuetype',
        'status',
        'priority',
        'assignee',
        'reporter',
        'created',
        'updated',
        'labels',
        'components'
      ].join(',');

      const response = await this.client.get(`/issue/${issueKey}`, {
        params: {
          fields: fields,
          expand: 'names'
        }
      });

      const issue = response.data as JiraIssue;

      // Validate that we got the expected data
      if (!issue.key || !issue.fields) {
        throw new Error('Invalid response from Jira API');
      }

      return issue;
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        switch (status) {
          case 401:
            throw new Error('Authentication failed. Please check your Jira credentials and API token.');
          case 403:
            throw new Error('Access denied. You may not have permission to view this issue.');
          case 404:
            throw new Error(`Issue '${issueKey}' not found. Please check the ticket ID.`);
          case 429:
            throw new Error('Rate limit exceeded. Please try again in a few minutes.');
          default:
            const errorMsg = data?.errorMessages?.join(', ') ||
                           data?.message ||
                           error.response.statusText ||
                           'Unknown API error';
            throw new Error(`Jira API error (${status}): ${errorMsg}`);
        }
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to Jira. Please check your Jira host URL.');
      } else if (error.code === 'ENOTFOUND') {
        throw new Error('Jira host not found. Please check your Jira host URL.');
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error('Request timed out. Please check your internet connection.');
      } else {
        throw new Error(`Failed to fetch Jira issue: ${error.message}`);
      }
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/myself');
      return true;
    } catch (error) {
      return false;
    }
  }
}
