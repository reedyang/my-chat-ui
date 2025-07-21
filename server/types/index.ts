export interface Session {
  id: string
  title: string
  model: string
  createdAt: Date
  updatedAt: Date
  messageCount: number
}

export interface Message {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  tokens?: number
}

export interface AppSettings {
  defaultModel: string
  temperature: number
  maxTokens: number
  ollamaEndpoint: string
  theme: 'light' | 'dark' | 'auto'
  apiKey?: string
  apiKeyCreatedAt?: string
}

export interface CreateSessionRequest {
  title?: string
  model?: string
}

export interface UpdateSessionRequest {
  title?: string
  model?: string
}

export interface SendMessageRequest {
  content: string
  role?: 'user' | 'system'
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    details?: any
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export interface SessionListResponse {
  sessions: Session[]
  total: number
  page?: number
  limit?: number
} 