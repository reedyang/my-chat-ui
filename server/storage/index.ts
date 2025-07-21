import { Session, Message, AppSettings } from '../types/index.js'

// Storage interface
export interface IStorage {
  // Session operations
  createSession(session: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>): Promise<Session>
  getSession(id: string): Promise<Session | null>
  getSessions(): Promise<Session[]>
  updateSession(id: string, updates: Partial<Session>): Promise<Session | null>
  deleteSession(id: string): Promise<boolean>
  
  // Message operations
  addMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<Message>
  getMessages(sessionId: string): Promise<Message[]>
  deleteMessages(sessionId: string): Promise<boolean>
  
  // Settings operations
  getSettings(): Promise<AppSettings>
  updateSettings(settings: Partial<AppSettings>): Promise<AppSettings>
  
  // Health check
  isHealthy(): Promise<boolean>
}

// Storage factory
let storageInstance: IStorage | null = null

export async function createStorage(): Promise<IStorage> {
  if (storageInstance) {
    return storageInstance
  }

  // For now, use JSON storage. Can be extended to support SQLite
  const { JsonStorage } = await import('./jsonStorage.js')
  const storage = new JsonStorage()
  storageInstance = storage
  
  return storageInstance
}

export function getStorage(): IStorage {
  if (!storageInstance) {
    throw new Error('Storage not initialized. Call createStorage() first.')
  }
  return storageInstance
} 