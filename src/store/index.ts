import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Session, Message, Model, AppSettings, CreateSessionData, SendMessageData } from '@/types'
import * as api from '@/services/api'

interface AppState {
  // Sessions
  sessions: Session[]
  currentSessionId: string | null
  
  // Messages
  messages: Record<string, Message[]>
  
  // Models
  models: Model[]
  
  // Settings
  settings: AppSettings | null
  
  // UI State
  sidebarOpen: boolean
  isLoading: boolean
  error: string | null
  isStreaming: boolean
  settingsOpen: boolean
  
  // Actions
  // Session actions
  loadSessions: () => Promise<void>
  createSession: (data?: CreateSessionData) => Promise<Session>
  selectSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => Promise<void>
  updateSession: (sessionId: string, updates: Partial<Session>) => Promise<void>
  updateSessionTitle: (sessionId: string, title: string) => Promise<void>
  changeSessionModel: (sessionId: string, model: string) => Promise<void>
  
  // Message actions
  loadMessages: (sessionId: string) => Promise<void>
  sendMessage: (sessionId: string, data: SendMessageData) => Promise<void>
  sendStreamMessage: (sessionId: string, data: SendMessageData) => Promise<void>
  
  // Model actions
  loadModels: () => Promise<void>
  
  // Settings actions
  loadSettings: () => Promise<void>
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>
  
  // API Key actions
  generateApiKey: () => Promise<{ apiKey: string; maskedApiKey: string; createdAt: string } | null>
  refreshApiKey: () => Promise<{ apiKey: string; maskedApiKey: string; createdAt: string } | null>
  revokeApiKey: () => Promise<boolean>
  
  // UI actions
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  setSettingsOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Initial state
      sessions: [],
      currentSessionId: null,
      messages: {},
      models: [],
      settings: null,
      sidebarOpen: true,
      isLoading: false,
      error: null,
      isStreaming: false,
      settingsOpen: false,

      // Session actions
      loadSessions: async () => {
        try {
          set({ isLoading: true, error: null })
          const response = await api.getSessions()
          set({ sessions: response.data.sessions })
        } catch (error: any) {
          set({ error: error.message || 'Failed to load sessions' })
        } finally {
          set({ isLoading: false })
        }
      },

      createSession: async (data = {}) => {
        try {
          set({ isLoading: true, error: null })
          
          const state = get()
          
          // Determine the model to use
          let modelToUse = data.model
          
          if (!modelToUse) {
            // Use default model from settings
            modelToUse = state.settings?.defaultModel
            
            // If no default model in settings, use first available model
            if (!modelToUse && state.models.length > 0) {
              modelToUse = state.models[0].id
            }
            
            // Last resort fallback (should not happen in normal cases)
            if (!modelToUse) {
              modelToUse = 'llama3.2'
            }
          }
          
          const sessionData = {
            ...data,
            model: modelToUse
          }
          
          const response = await api.createSession(sessionData)
          const newSession = response.data!
          
          set(state => ({
            sessions: [newSession, ...state.sessions],
            currentSessionId: newSession.id,
            messages: { ...state.messages, [newSession.id]: [] }
          }))
          
          return newSession
        } catch (error: any) {
          set({ error: error.message || 'Failed to create session' })
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      selectSession: (sessionId: string) => {
        set({ currentSessionId: sessionId })
        // Load messages for the selected session
        get().loadMessages(sessionId)
      },

      deleteSession: async (sessionId: string) => {
        try {
          set({ isLoading: true, error: null })
          await api.deleteSession(sessionId)
          
          set(state => {
            const newMessages = { ...state.messages }
            delete newMessages[sessionId]
            
            return {
              sessions: state.sessions.filter(s => s.id !== sessionId),
              messages: newMessages,
              currentSessionId: state.currentSessionId === sessionId ? null : state.currentSessionId
            }
          })
        } catch (error: any) {
          set({ error: error.message || 'Failed to delete session' })
        } finally {
          set({ isLoading: false })
        }
      },

      updateSession: async (sessionId: string, updates: Partial<Session>) => {
        try {
          set({ isLoading: true, error: null })
          const response = await api.updateSession(sessionId, updates)
          
          set(state => ({
            sessions: state.sessions.map(s => 
              s.id === sessionId ? response.data! : s
            )
          }))
        } catch (error: any) {
          set({ error: error.message || 'Failed to update session' })
        } finally {
          set({ isLoading: false })
        }
      },

      updateSessionTitle: async (sessionId: string, title: string) => {
        try {
          const response = await api.updateSessionTitle(sessionId, title)
          
          set(state => ({
            sessions: state.sessions.map(s => 
              s.id === sessionId ? response.data! : s
            )
          }))
        } catch (error: any) {
          set({ error: error.message || 'Failed to update session title' })
        }
      },

      changeSessionModel: async (sessionId: string, model: string) => {
        try {
          await get().updateSession(sessionId, { model })
        } catch (error: any) {
          set({ error: error.message || 'Failed to change model' })
        }
      },

      // Message actions
      loadMessages: async (sessionId: string) => {
        try {
          const response = await api.getMessages(sessionId)
          set(state => ({
            messages: {
              ...state.messages,
              [sessionId]: response.data.messages
            }
          }))
        } catch (error: any) {
          set({ error: error.message || 'Failed to load messages' })
        }
      },

      sendMessage: async (sessionId: string, data: SendMessageData) => {
        try {
          set({ isLoading: true, error: null })
          
          // Check if this might be the first message (for title generation)
          const state = get()
          const currentMessages = state.messages[sessionId] || []
          const isFirstMessage = currentMessages.filter(m => m.role === 'user').length === 0
          
          // Add user message immediately to UI
          const userMessage: Message = {
            id: Date.now().toString(),
            sessionId,
            role: data.role || 'user',
            content: data.content,
            timestamp: new Date(),
          }
          
          set(state => ({
            messages: {
              ...state.messages,
              [sessionId]: [...(state.messages[sessionId] || []), userMessage]
            }
          }))
          
          // Send to API
          const response = await api.sendMessage(sessionId, data)
          
          // Update with actual messages from server
          set(state => ({
            messages: {
              ...state.messages,
              [sessionId]: [...(state.messages[sessionId] || []).slice(0, -1), response.data.userMessage, response.data.aiMessage]
            }
          }))
          
          // If this was the first message, reload sessions to get updated title
          if (isFirstMessage) {
            console.log('First message sent, reloading sessions to get updated title')
            await get().loadSessions()
          }
          
        } catch (error: any) {
          set({ error: error.message || 'Failed to send message' })
        } finally {
          set({ isLoading: false })
        }
      },

      sendStreamMessage: async (sessionId: string, data: SendMessageData) => {
        try {
          set({ isStreaming: true, error: null })
          
          // Check if this might be the first message (for title generation)
          const state = get()
          const currentMessages = state.messages[sessionId] || []
          const isFirstMessage = currentMessages.filter(m => m.role === 'user').length === 0
          
          // Add user message immediately
          const userMessage: Message = {
            id: Date.now().toString(),
            sessionId,
            role: data.role || 'user',
            content: data.content,
            timestamp: new Date(),
          }
          
          // Add placeholder AI message
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            sessionId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
          }
          
          set(state => ({
            messages: {
              ...state.messages,
              [sessionId]: [...(state.messages[sessionId] || []), userMessage, aiMessage]
            }
          }))
          
          // Stream response
          await api.sendStreamMessage(sessionId, data, (chunk: string) => {
            set(state => {
              const sessionMessages = state.messages[sessionId] || []
              const lastMessage = sessionMessages[sessionMessages.length - 1]
              
              if (lastMessage && lastMessage.role === 'assistant') {
                const updatedMessage = {
                  ...lastMessage,
                  content: lastMessage.content + chunk
                }
                
                return {
                  messages: {
                    ...state.messages,
                    [sessionId]: [...sessionMessages.slice(0, -1), updatedMessage]
                  }
                }
              }
              
              return state
            })
          })
          
          // If this was the first message, reload sessions to get updated title
          if (isFirstMessage) {
            console.log('First stream message sent, reloading sessions to get updated title')
            setTimeout(() => {
              get().loadSessions()
            }, 1000) // Delay to ensure title generation is complete
          }
          
          console.log(`Stream completed for session ${sessionId}`)
          
        } catch (error: any) {
          set({ error: error.message || 'Failed to send message' })
        } finally {
          set({ isStreaming: false })
        }
      },

      // Model actions
      loadModels: async () => {
        try {
          const response = await api.getModels()
          set({ models: response.data.models })
        } catch (error: any) {
          console.warn('Failed to load models:', error)
          // Don't set error state for models as it's not critical
        }
      },

      // Settings actions
      loadSettings: async () => {
        try {
          const response = await api.getSettings()
          if (response.success && response.data) {
            set({ settings: response.data })
          } else {
            throw new Error('Invalid settings response')
          }
        } catch (error: any) {
          console.warn('Failed to load settings from server:', error)
          // Use fallback default settings that match backend defaults
          const state = get()
          const fallbackModel = state.models.length > 0 ? state.models[0].id : 'llama3.2'
          
          set({
            settings: {
              defaultModel: fallbackModel,
              temperature: 0.7,
              maxTokens: 2048,
              ollamaEndpoint: 'http://localhost:11434',
              theme: 'auto'
            }
          })
        }
      },

      updateSettings: async (updates: Partial<AppSettings>) => {
        try {
          const response = await api.updateSettings(updates)
          set({ settings: response.data })
        } catch (error: any) {
          set({ error: error.message || 'Failed to update settings' })
        }
      },

      // UI actions
      toggleSidebar: () => {
        set(state => ({ sidebarOpen: !state.sidebarOpen }))
      },

      setSidebarOpen: (open: boolean) => {
        set({ sidebarOpen: open })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      setError: (error: string | null) => {
        set({ error })
      },

      clearError: () => {
        set({ error: null })
      },

      setSettingsOpen: (open: boolean) => {
        set({ settingsOpen: open })
      },

      // API Key actions
      generateApiKey: async () => {
        try {
          const response = await api.generateApiKey()
          if (response.success && response.data) {
            // Update settings with the new API key info
            set({ settings: response.data.settings })
            return {
              apiKey: response.data.apiKey,
              maskedApiKey: response.data.maskedApiKey,
              createdAt: response.data.createdAt
            }
          }
          return null
        } catch (error: any) {
          set({ error: error.message || 'Failed to generate API key' })
          return null
        }
      },

      refreshApiKey: async () => {
        try {
          const response = await api.refreshApiKey()
          if (response.success && response.data) {
            // Update settings with the new API key info
            set({ settings: response.data.settings })
            return {
              apiKey: response.data.apiKey,
              maskedApiKey: response.data.maskedApiKey,
              createdAt: response.data.createdAt
            }
          }
          return null
        } catch (error: any) {
          set({ error: error.message || 'Failed to refresh API key' })
          return null
        }
      },

      revokeApiKey: async () => {
        try {
          const response = await api.revokeApiKey()
          if (response.success && response.data) {
            // Update settings to remove API key
            set({ settings: response.data.settings })
            return true
          }
          return false
        } catch (error: any) {
          set({ error: error.message || 'Failed to revoke API key' })
          return false
        }
      },
    }),
    {
      name: 'chat-app-store',
    }
  )
) 