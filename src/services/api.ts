import { 
  Session, 
  Message, 
  Model, 
  AppSettings, 
  ApiResponse, 
  SessionListResponse, 
  MessageListResponse, 
  ModelsResponse,
  CreateSessionData,
  SendMessageData
} from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// Generic API function with error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
  }
  
  const finalOptions = { ...defaultOptions, ...options }
  
  try {
    const response = await fetch(url, finalOptions)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data
  } catch (error: any) {
    console.error('API request failed:', error)
    throw error
  }
}

// Session API
export async function getSessions(): Promise<ApiResponse<SessionListResponse>> {
  return apiRequest<SessionListResponse>('/sessions')
}

export async function createSession(data: CreateSessionData = {}): Promise<ApiResponse<Session>> {
  return apiRequest<Session>('/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getSession(sessionId: string): Promise<ApiResponse<Session>> {
  return apiRequest<Session>(`/sessions/${sessionId}`)
}

export async function updateSession(sessionId: string, updates: Partial<Session>): Promise<ApiResponse<Session>> {
  return apiRequest<Session>(`/sessions/${sessionId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}

export async function deleteSession(sessionId: string): Promise<ApiResponse<{ id: string; deleted: boolean }>> {
  return apiRequest(`/sessions/${sessionId}`, {
    method: 'DELETE',
  })
}

export async function updateSessionTitle(sessionId: string, title: string): Promise<ApiResponse<Session>> {
  return apiRequest(`/sessions/${sessionId}/title`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  })
}

// Message API
export async function getMessages(sessionId: string): Promise<ApiResponse<MessageListResponse>> {
  return apiRequest<MessageListResponse>(`/sessions/${sessionId}/messages`)
}

export async function sendMessage(sessionId: string, data: SendMessageData): Promise<ApiResponse<{ userMessage: Message; aiMessage: Message; sessionId: string }>> {
  return apiRequest(`/chat/${sessionId}/messages`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Stream message API
export async function sendStreamMessage(
  sessionId: string, 
  data: SendMessageData, 
  onChunk: (chunk: string) => void
): Promise<void> {
  const url = `${API_BASE_URL}/chat/${sessionId}/stream`
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`)
    }
    
    const reader = response.body?.getReader()
    
    if (!reader) {
      throw new Error('Response body is not readable')
    }
    
    const decoder = new TextDecoder()
    
    try {
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          break
        }
        
        const chunk = decoder.decode(value, { stream: true })
        
        if (chunk) {
          onChunk(chunk)
        }
      }
    } finally {
      reader.releaseLock()
    }
  } catch (error: any) {
    console.error('Stream error:', error)
    throw error
  }
}

// Model API
export async function getModels(): Promise<ApiResponse<ModelsResponse>> {
  return apiRequest<ModelsResponse>('/models')
}

export async function getModelStatus(): Promise<ApiResponse<{ status: string; modelCount: number; timestamp: string }>> {
  return apiRequest('/models/status')
}

export async function checkModelAvailability(modelName: string): Promise<ApiResponse<{ model: string; available: boolean; timestamp: string }>> {
  return apiRequest(`/models/${modelName}/availability`)
}

// Settings API
export async function getSettings(): Promise<ApiResponse<AppSettings>> {
  return apiRequest('/settings')
}

export async function updateSettings(updates: Partial<AppSettings>): Promise<ApiResponse<AppSettings>> {
  return apiRequest('/settings', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

// API Key Management
export async function generateApiKey(): Promise<ApiResponse<{ apiKey: string; maskedApiKey: string; createdAt: string; settings: AppSettings }>> {
  return apiRequest('/settings/api-key/generate', {
    method: 'POST',
  })
}

export async function refreshApiKey(): Promise<ApiResponse<{ apiKey: string; maskedApiKey: string; createdAt: string; settings: AppSettings }>> {
  return apiRequest('/settings/api-key/refresh', {
    method: 'POST',
  })
}

export async function revokeApiKey(): Promise<ApiResponse<{ message: string; settings: AppSettings }>> {
  return apiRequest('/settings/api-key', {
    method: 'DELETE',
  })
}

// Health check
export async function checkHealth(): Promise<ApiResponse<{ status: string; timestamp: string; version: string }>> {
  return apiRequest('/health')
}

// Error handling utility
export function isApiError(error: any): error is { message: string; code?: string; details?: any } {
  return error && typeof error.message === 'string'
}

// Request retry utility
export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error
      
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
      }
    }
  }
  
  throw lastError
} 