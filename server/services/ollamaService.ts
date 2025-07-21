import axios, { AxiosInstance } from 'axios'
import { logger } from '../utils/logger.js'
import { 
  OllamaModelsResponse, 
  OllamaChatRequest, 
  OllamaChatResponse,
  OllamaStreamResponse,
  ModelInfo,
  ChatOptions 
} from '../types/ollama.js'
import { Message } from '../types/index.js'

export class OllamaService {
  private client: AxiosInstance
  private baseUrl: string

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
    this.initializeClient()
  }

  private initializeClient(): void {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      },
    })
    this.initializeInterceptors()
  }

  // Method to update the base URL dynamically
  updateBaseUrl(newBaseUrl: string): void {
    this.baseUrl = newBaseUrl
    this.initializeClient()
    logger.info(`Updated Ollama service base URL to: ${this.baseUrl}`)
  }

  // Get current base URL
  getBaseUrl(): string {
    return this.baseUrl
  }

  private initializeInterceptors(): void {

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`Ollama request: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        logger.error('Ollama request error:', error)
        return Promise.reject(error)
      }
    )

    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`Ollama response: ${response.status} ${response.config.url}`)
        return response
      },
      (error) => {
        logger.error('Ollama response error:', error?.response?.data || error.message)
        return Promise.reject(error)
      }
    )
  }

  /**
   * Check if Ollama service is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/tags')
      return response.status === 200
    } catch (error) {
      logger.warn('Ollama health check failed:', error)
      return false
    }
  }

  /**
   * Get available models from Ollama
   */
  async getModels(): Promise<ModelInfo[]> {
    try {
      const response = await this.client.get<OllamaModelsResponse>('/api/tags')
      
      return response.data.models.map(model => ({
        id: model.name,
        name: model.name,
        size: model.size,
        modified: new Date(model.modified_at),
        available: true,
      }))
    } catch (error) {
      logger.error('Failed to fetch models:', error)
      throw new Error('Failed to fetch available models from Ollama')
    }
  }

  /**
   * Check if a specific model is available
   */
  async isModelAvailable(modelName: string): Promise<boolean> {
    try {
      const models = await this.getModels()
      return models.some(model => model.id === modelName)
    } catch (error) {
      logger.error(`Failed to check model availability for ${modelName}:`, error)
      return false
    }
  }

  /**
   * Convert our Message format to Ollama format
   */
  private messagesToOllamaFormat(messages: Message[]) {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }))
  }

  /**
   * Generate chat completion (non-streaming)
   */
  async generateCompletion(
    model: string, 
    messages: Message[], 
    options: ChatOptions = {}
  ): Promise<string> {
    try {
      const ollamaMessages = this.messagesToOllamaFormat(messages)
      
      const request: OllamaChatRequest = {
        model,
        messages: ollamaMessages,
        stream: false,
        options: {
          temperature: options.temperature,
          top_p: options.topP,
          top_k: options.topK,
          repeat_penalty: options.repeatPenalty,
          seed: options.seed,
          num_predict: options.maxTokens,
        },
      }

      const response = await this.client.post<OllamaChatResponse>('/api/chat', request)
      
      if (!response.data.message?.content) {
        throw new Error('Empty response from Ollama')
      }

      return response.data.message.content
    } catch (error: any) {
      logger.error('Failed to generate completion:', error)
      
      if (error.response?.status === 404) {
        throw new Error(`Model "${model}" not found. Please ensure it's downloaded.`)
      } else if (error.response?.status === 400) {
        throw new Error('Invalid request to Ollama API')
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to Ollama service. Please ensure it\'s running.')
      }
      
      throw new Error(`Failed to generate completion: ${error.message}`)
    }
  }

  /**
   * Generate streaming chat completion
   */
  async generateStream(
    model: string,
    messages: Message[],
    options: ChatOptions = {}
  ): Promise<AsyncGenerator<string, void, unknown>> {
    const ollamaMessages = this.messagesToOllamaFormat(messages)
    
    const request: OllamaChatRequest = {
      model,
      messages: ollamaMessages,
      stream: true,
      options: {
        temperature: options.temperature,
        top_p: options.topP,
        top_k: options.topK,
        repeat_penalty: options.repeatPenalty,
        seed: options.seed,
        num_predict: options.maxTokens,
      },
    }

    try {
      const response = await this.client.post('/api/chat', request, {
        responseType: 'stream',
      })

      return this.parseStreamResponse(response.data)
    } catch (error: any) {
      logger.error('Failed to generate stream:', error)
      
      if (error.response?.status === 404) {
        throw new Error(`Model "${model}" not found. Please ensure it's downloaded.`)
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to Ollama service. Please ensure it\'s running.')
      }
      
      throw new Error(`Failed to generate stream: ${error.message}`)
    }
  }

  /**
   * Parse streaming response from Ollama
   */
  private async *parseStreamResponse(stream: any): AsyncGenerator<string, void, unknown> {
    let buffer = ''
    
    for await (const chunk of stream) {
      buffer += chunk.toString()
      
      // Split by newlines and process complete JSON objects
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // Keep the incomplete line in buffer
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const data: OllamaStreamResponse = JSON.parse(line)
            
            if (data.message?.content) {
              yield data.message.content
            }
            
            if (data.done) {
              return
            }
          } catch (error) {
            logger.warn('Failed to parse stream chunk:', line)
          }
        }
      }
    }
  }

  /**
   * Estimate token count (simple approximation)
   */
  estimateTokens(text: string): number {
    // Simple approximation: ~4 characters per token
    return Math.ceil(text.length / 4)
  }

  /**
   * Get service information
   */
  getServiceInfo() {
    return {
      baseUrl: this.baseUrl,
      name: 'Ollama',
      version: 'unknown', // Ollama doesn't provide version info in API
    }
  }
}

// Singleton instance
let ollamaServiceInstance: OllamaService | null = null

export function getOllamaService(baseUrl?: string): OllamaService {
  if (!ollamaServiceInstance) {
    ollamaServiceInstance = new OllamaService(baseUrl)
  } else if (baseUrl && baseUrl !== ollamaServiceInstance.getBaseUrl()) {
    // Update base URL if it has changed
    ollamaServiceInstance.updateBaseUrl(baseUrl)
  }
  return ollamaServiceInstance
}

export function createOllamaService(baseUrl?: string): OllamaService {
  ollamaServiceInstance = new OllamaService(baseUrl)
  return ollamaServiceInstance
}

// Helper function to get Ollama service with settings
export async function getOllamaServiceWithSettings(): Promise<OllamaService> {
  try {
    const { getStorage } = await import('../storage/index.js')
    const storage = getStorage()
    const settings = await storage.getSettings()
    return getOllamaService(settings.ollamaEndpoint)
  } catch (error) {
    // Fallback to default if settings loading fails
    return getOllamaService()
  }
} 