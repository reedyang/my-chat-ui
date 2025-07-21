// Ollama API Types
export interface OllamaModel {
  name: string
  modified_at: string
  size: number
  digest: string
  details?: {
    format: string
    family: string
    families?: string[]
    parameter_size: string
    quantization_level: string
  }
}

export interface OllamaModelsResponse {
  models: OllamaModel[]
}

export interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OllamaChatRequest {
  model: string
  messages: OllamaChatMessage[]
  stream?: boolean
  options?: {
    temperature?: number
    top_p?: number
    top_k?: number
    repeat_penalty?: number
    seed?: number
    num_ctx?: number
    num_predict?: number
  }
}

export interface OllamaChatResponse {
  model: string
  created_at: string
  message: {
    role: 'assistant'
    content: string
  }
  done: boolean
  total_duration?: number
  load_duration?: number
  prompt_eval_count?: number
  prompt_eval_duration?: number
  eval_count?: number
  eval_duration?: number
}

export interface OllamaStreamResponse {
  model: string
  created_at: string
  message: {
    role: 'assistant'
    content: string
  }
  done: boolean
}

export interface OllamaError {
  error: string
}

// Helper types for our service layer
export interface ModelInfo {
  id: string
  name: string
  size: number
  modified: Date
  available: boolean
}

export interface ChatOptions {
  temperature?: number
  maxTokens?: number
  topP?: number
  topK?: number
  repeatPenalty?: number
  seed?: number
} 