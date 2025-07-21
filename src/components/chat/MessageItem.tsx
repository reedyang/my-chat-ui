import React from 'react'
import { Message } from '@/types'
import { Bot, User, Copy, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { ThinkingSection } from './ThinkingSection'

interface MessageItemProps {
  message: Message
  isStreaming?: boolean
}

export function MessageItem({ message, isStreaming }: MessageItemProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

    const parseMessageContent = (content: string) => {
    let thinkingContent = ''
    let normalContent = content
    let thinkingComplete = false
    
    // Check for various thinking tag formats
    const patterns = [
      { regex: /<think[^>]*>([\s\S]*?)(<\/think>|$)/gi, endTag: '</think>' },
      { regex: /<thinking[^>]*>([\s\S]*?)(<\/antml:thinking>|$)/gi, endTag: '</thinking>' },
      { regex: /<thinking[^>]*>([\s\S]*?)(<\/thinking>|$)/gi, endTag: '</thinking>' }
    ]
    
         for (const pattern of patterns) {
       const regex = new RegExp(pattern.regex.source, pattern.regex.flags)
       const match = regex.exec(content)
       if (match) {
         thinkingComplete = match[0].includes(pattern.endTag)
         thinkingContent = match[1] ? match[1].trim() : ''
         
         // Remove thinking section from normal content
         normalContent = content.replace(regex, '').trim()
         break
       }
     }
    
         // If no thinking tags found, but content starts with thinking-like patterns
     if (!thinkingContent) {
       // Check for incomplete thinking tags at the start
       const incompletePatterns = [
         /^<think[^>]*>([\s\S]*)$/i,
         /^<thinking[^>]*>([\s\S]*)$/i
       ]
       
       for (const pattern of incompletePatterns) {
         const incompleteMatch = content.match(pattern)
         if (incompleteMatch) {
           thinkingContent = incompleteMatch[1].trim()
           thinkingComplete = false
           normalContent = ''
           break
         }
       }
     }
    
    return {
      thinkingContent,
      normalContent,
      thinkingComplete
    }
  }

  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  return (
    <div className={`flex gap-3 group ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary-foreground" />
        </div>
      )}

      {/* Message Content */}
      <div className={`max-w-[80%] ${isUser ? 'order-first' : ''}`}>
        <div
          className={`px-4 py-3 rounded-lg ${
            isUser
              ? 'bg-primary text-primary-foreground ml-auto'
              : 'text-foreground'
          }`}
        >
          {isAssistant ? (
            <>
              {(() => {
                const { thinkingContent, normalContent, thinkingComplete } = parseMessageContent(message.content)
                
                return (
                  <>
                    {thinkingContent && (
                      <ThinkingSection 
                        content={thinkingContent} 
                        isComplete={thinkingComplete}
                      />
                    )}
                    {normalContent && normalContent.trim() && (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{normalContent}</ReactMarkdown>
                      </div>
                    )}
                    {!normalContent && !thinkingContent && message.content && (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    )}
                  </>
                )
              })()}
            </>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        {/* Message Actions */}
        <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
          
          {isAssistant && (
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
              title="复制消息"
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
          <User className="w-4 h-4 text-secondary-foreground" />
        </div>
      )}
    </div>
  )
} 