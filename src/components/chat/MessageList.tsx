import React, { useEffect, useRef } from 'react'
import { Message } from '@/types'
import { MessageItem } from './MessageItem'
import { TypingIndicator } from './TypingIndicator'

interface MessageListProps {
  messages: Message[]
  isStreaming: boolean
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-lg font-medium mb-2">开始对话</h3>
          <p className="text-sm">发送消息开始与AI助手对话</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {messages.map((message) => {
          // 如果是空的AI消息且正在流式输出，则不显示该消息（由TypingIndicator替代）
          if (message.role === 'assistant' && 
              !message.content.trim() && 
              isStreaming && 
              message === messages[messages.length - 1]) {
            return null
          }
          
          return (
            <MessageItem
              key={message.id}
              message={message}
              isStreaming={isStreaming && message.role === 'assistant' && message === messages[messages.length - 1]}
            />
          )
        })}
        
        {/* Typing Indicator - 显示在AI开始回答但还没有内容时 */}
        <TypingIndicator 
          isVisible={isStreaming && 
            messages.length > 0 && 
            messages[messages.length - 1].role === 'assistant' && 
            !messages[messages.length - 1].content.trim()
          } 
        />
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
} 