import React, { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/store'
import { Send, Loader2 } from 'lucide-react'
import { MessageList } from './MessageList'

interface ChatProps {
  sessionId: string
}

export function Chat({ sessionId }: ChatProps) {
  const { 
    messages, 
    sendStreamMessage, 
    isStreaming, 
    loadMessages 
  } = useAppStore()
  
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const sessionMessages = messages[sessionId] || []

  useEffect(() => {
    // Load messages when session changes
    loadMessages(sessionId)
  }, [sessionId, loadMessages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim() || isStreaming) return

    const messageContent = input.trim()
    setInput('')
    
    try {
      await sendStreamMessage(sessionId, { content: messageContent })
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList messages={sessionMessages} isStreaming={isStreaming} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-background p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息..."
              disabled={isStreaming}
              className="w-full px-4 py-3 pr-12 bg-background border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 min-h-[52px] max-h-32"
              rows={1}
              style={{
                height: 'auto',
                minHeight: '52px',
                maxHeight: '128px',
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isStreaming ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
        
        <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
          <span>按 Enter 发送，Shift + Enter 换行</span>
          <span>{sessionMessages.length} 条消息</span>
        </div>
      </div>
    </div>
  )
} 