// OpenAI Compatible API Types
export interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OpenAIChatCompletionRequest {
  model: string
  messages: OpenAIChatMessage[]
  temperature?: number
  max_tokens?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
  stop?: string | string[]
  stream?: boolean
  user?: string
}

export interface OpenAIChatCompletionChoice {
  index: number
  message: {
    role: 'assistant'
    content: string
  }
  finish_reason: 'stop' | 'length' | 'content_filter' | null
}

export interface OpenAIChatCompletionResponse {
  id: string
  object: 'chat.completion'
  created: number
  model: string
  choices: OpenAIChatCompletionChoice[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface OpenAIChatCompletionStreamChoice {
  index: number
  delta: {
    role?: 'assistant'
    content?: string
  }
  finish_reason: 'stop' | 'length' | 'content_filter' | null
}

export interface OpenAIChatCompletionStreamResponse {
  id: string
  object: 'chat.completion.chunk'
  created: number
  model: string
  choices: OpenAIChatCompletionStreamChoice[]
}

export interface OpenAIModel {
  id: string
  object: 'model'
  created: number
  owned_by: string
}

export interface OpenAIModelsResponse {
  object: 'list'
  data: OpenAIModel[]
}

export interface OpenAIError {
  error: {
    message: string
    type: string
    param?: string
    code?: string
  }
}

// Helper function types
export type StreamCallback = (chunk: OpenAIChatCompletionStreamResponse) => void 