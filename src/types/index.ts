// Session types
export interface Session {
  id: string
  title: string
  model: string
  createdAt: string | Date
  updatedAt: string | Date
  messageCount: number
}

// Message types
export interface Message {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string | Date
  tokens?: number
}

// Model types
export interface Model {
  id: string
  name: string
  size: number
  modified: string | Date
  available: boolean
}

// Settings types
export interface AppSettings {
  defaultModel: string
  temperature: number
  maxTokens: number
  ollamaEndpoint: string
  theme: 'light' | 'dark' | 'auto'
  apiKey?: string
  apiKeyCreatedAt?: string
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    details?: any
  }
}

export interface SessionListResponse {
  sessions: Session[]
  total: number
}

export interface MessageListResponse {
  sessionId: string
  messages: Message[]
  total: number
}

export interface ModelsResponse {
  models: Model[]
  total: number
  service: {
    baseUrl: string
    name: string
    version: string
  }
}

// UI State types
export interface UIState {
  sidebarOpen: boolean
  currentSessionId: string | null
  isLoading: boolean
  error: string | null
}

// Chat state types
export interface ChatState {
  isStreaming: boolean
  currentMessage: string
  error: string | null
}

// Form types
export interface CreateSessionData {
  title?: string
  model?: string
}

export interface SendMessageData {
  content: string
  role?: 'user' | 'system'
}

// Error types
export interface AppError {
  message: string
  code?: string
  details?: any
}

// Stream response type
export type StreamChunk = string

// Theme type
export type Theme = 'light' | 'dark' | 'auto'

// Component props types
export interface ComponentProps {
  className?: string
  children?: any
} 