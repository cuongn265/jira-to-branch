/**
 * Generic AI Provider interfaces and implementations using LangChain
 * Supports multiple AI providers through a unified LangChain interface
 */

import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
  BaseMessage,
} from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface ChatCompletionResponse {
  content: string;
}

export interface AIProviderConfig {
  provider: "openai" | "anthropic" | "google" | "azure";
  apiKey: string;
  model: string;
  baseURL?: string;
  organizationId?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Abstract base class for AI providers using LangChain
 */
export abstract class AIProvider {
  protected config: AIProviderConfig;
  protected chatModel: BaseChatModel;

  constructor(config: AIProviderConfig) {
    this.config = {
      ...config,
      temperature: config.temperature ?? 0.3,
      maxTokens: config.maxTokens ?? 500,
    };
    this.chatModel = this.initializeChatModel();
  }

  abstract initializeChatModel(): BaseChatModel;

  /**
   * Convert generic messages to LangChain message format
   */
  protected convertMessages(messages: ChatMessage[]): BaseMessage[] {
    return messages.map((msg) => {
      switch (msg.role) {
        case "system":
          return new SystemMessage(msg.content);
        case "user":
          return new HumanMessage(msg.content);
        case "assistant":
          return new AIMessage(msg.content);
        default:
          return new HumanMessage(msg.content);
      }
    });
  }

  async createChatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    try {
      const messages = this.convertMessages(request.messages);

      // LangChain invoke - the model is already configured with temperature and maxTokens
      const response = await this.chatModel.invoke(messages);

      if (!response.content) {
        throw new Error(`No response content from ${this.config.provider}`);
      }

      return { content: response.content.toString() };
    } catch (error: any) {
      throw new Error(`${this.config.provider} API error: ${error.message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const messages = [new HumanMessage("Hello")];
      await this.chatModel.invoke(messages);
      return true;
    } catch {
      return false;
    }
  }

  getProvider(): string {
    return this.config.provider;
  }

  getModel(): string {
    return this.config.model;
  }
}

/**
 * OpenAI Provider Implementation using LangChain
 */
export class OpenAIProvider extends AIProvider {
  initializeChatModel(): BaseChatModel {
    try {
      const chatModel: any = new ChatOpenAI({
        openAIApiKey: this.config.apiKey,
        modelName: this.config.model,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      });
      return chatModel;
    } catch (error: any) {
      throw new Error(`Failed to initialize OpenAI provider: ${error.message}`);
    }
  }
}

/**
 * Anthropic Provider Implementation using LangChain
 */
export class AnthropicProvider extends AIProvider {
  initializeChatModel(): BaseChatModel {
    try {
      const chatModel: any = new ChatAnthropic({
        anthropicApiKey: this.config.apiKey,
        modelName: this.config.model,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      });
      return chatModel;
    } catch (error: any) {
      throw new Error(
        `Failed to initialize Anthropic provider: ${error.message}`
      );
    }
  }
}

/**
 * Google AI Provider Implementation using LangChain
 */
export class GoogleProvider extends AIProvider {
  initializeChatModel(): BaseChatModel {
    try {
      const chatModel: any = new ChatGoogleGenerativeAI({
        apiKey: this.config.apiKey,
        modelName: this.config.model,
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxTokens,
      });
      return chatModel;
    } catch (error: any) {
      throw new Error(
        `Failed to initialize Google AI provider: ${error.message}`
      );
    }
  }
}

/**
 * Azure OpenAI Provider Implementation using LangChain
 */
export class AzureProvider extends AIProvider {
  initializeChatModel(): BaseChatModel {
    try {
      if (!this.config.baseURL) {
        throw new Error("Azure OpenAI requires baseURL to be configured");
      }

      const chatModel: any = new ChatOpenAI({
        openAIApiKey: this.config.apiKey,
        modelName: this.config.model,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        configuration: {
          baseURL: this.config.baseURL,
        },
      });
      return chatModel;
    } catch (error: any) {
      throw new Error(
        `Failed to initialize Azure OpenAI provider: ${error.message}`
      );
    }
  }
}

/**
 * Factory function to create AI provider instances
 */
export function createAIProvider(config: AIProviderConfig): AIProvider {
  switch (config.provider) {
    case "openai":
      return new OpenAIProvider(config);
    case "anthropic":
      return new AnthropicProvider(config);
    case "google":
      return new GoogleProvider(config);
    case "azure":
      return new AzureProvider(config);
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}
