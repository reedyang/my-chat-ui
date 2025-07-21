import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { fileURLToPath } from 'url'
import { IStorage } from './index.js'
import { Session, Message, AppSettings } from '../types/index.js'
import { logger } from '../utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export class JsonStorage implements IStorage {
  private dataDir: string
  private sessionsFile: string
  private settingsFile: string
  private messagesDir: string

  constructor(dataDir?: string) {
    this.dataDir = dataDir || process.env.DATA_DIR || join(__dirname, '../../data')
    this.sessionsFile = join(this.dataDir, 'sessions.json')
    this.settingsFile = join(this.dataDir, 'settings.json')
    this.messagesDir = join(this.dataDir, 'messages')
    
    this.ensureDirectories()
  }

  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true })
      await fs.mkdir(this.messagesDir, { recursive: true })
    } catch (error) {
      logger.error('Failed to create data directories:', error)
    }
  }

  private async readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
    try {
      const data = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      // File doesn't exist or is invalid, return default
      await this.writeJsonFile(filePath, defaultValue)
      return defaultValue
    }
  }

  private async writeJsonFile<T>(filePath: string, data: T): Promise<void> {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
    } catch (error) {
      logger.error(`Failed to write file ${filePath}:`, error)
      throw error
    }
  }

  // Session operations
  async createSession(sessionData: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>): Promise<Session> {
    const sessions = await this.getSessions()
    const now = new Date()
    
    const session: Session = {
      ...sessionData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
    }

    sessions.push(session)
    await this.writeJsonFile(this.sessionsFile, sessions)
    
    logger.info(`Created session: ${session.id}`)
    return session
  }

  async getSession(id: string): Promise<Session | null> {
    const sessions = await this.getSessions()
    return sessions.find(s => s.id === id) || null
  }

  async getSessions(): Promise<Session[]> {
    return await this.readJsonFile<Session[]>(this.sessionsFile, [])
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session | null> {
    const sessions = await this.getSessions()
    const index = sessions.findIndex(s => s.id === id)
    
    if (index === -1) {
      return null
    }

    sessions[index] = {
      ...sessions[index],
      ...updates,
      updatedAt: new Date(),
    }

    await this.writeJsonFile(this.sessionsFile, sessions)
    logger.info(`Updated session: ${id}`)
    
    return sessions[index]
  }

  async deleteSession(id: string): Promise<boolean> {
    const sessions = await this.getSessions()
    const index = sessions.findIndex(s => s.id === id)
    
    if (index === -1) {
      return false
    }

    sessions.splice(index, 1)
    await this.writeJsonFile(this.sessionsFile, sessions)
    
    // Also delete messages
    await this.deleteMessages(id)
    
    logger.info(`Deleted session: ${id}`)
    return true
  }

  // Message operations
  async addMessage(messageData: Omit<Message, 'id' | 'timestamp'>): Promise<Message> {
    const message: Message = {
      id: uuidv4(),
      timestamp: new Date(),
      ...messageData,
    }

    const messages = await this.getMessages(message.sessionId)
    messages.push(message)
    
    const messageFile = join(this.messagesDir, `${message.sessionId}.json`)
    await this.writeJsonFile(messageFile, messages)
    
    // Update session message count
    await this.updateSession(message.sessionId, { 
      messageCount: messages.length,
      updatedAt: new Date()
    })
    
    return message
  }

  async getMessages(sessionId: string): Promise<Message[]> {
    const messageFile = join(this.messagesDir, `${sessionId}.json`)
    return await this.readJsonFile<Message[]>(messageFile, [])
  }

  async deleteMessages(sessionId: string): Promise<boolean> {
    try {
      const messageFile = join(this.messagesDir, `${sessionId}.json`)
      await fs.unlink(messageFile)
      return true
    } catch (error) {
      // File might not exist, which is fine
      return true
    }
  }

  // Settings operations
  async getSettings(): Promise<AppSettings> {
    const defaultSettings: AppSettings = {
      defaultModel: process.env.DEFAULT_MODEL || 'llama3.2', // Use a more common default
      temperature: parseFloat(process.env.DEFAULT_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.DEFAULT_MAX_TOKENS || '2048'),
      ollamaEndpoint: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      theme: 'auto' as const,
    }
    
    return await this.readJsonFile<AppSettings>(this.settingsFile, defaultSettings)
  }

  async updateSettings(settingsUpdate: Partial<AppSettings>): Promise<AppSettings> {
    const currentSettings = await this.getSettings()
    const newSettings = { ...currentSettings, ...settingsUpdate }
    
    await this.writeJsonFile(this.settingsFile, newSettings)
    logger.info('Updated settings')
    
    return newSettings
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.ensureDirectories()
      await this.getSessions()
      await this.getSettings()
      return true
    } catch (error) {
      logger.error('Storage health check failed:', error)
      return false
    }
  }
} 