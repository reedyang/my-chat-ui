import React, { useState, useEffect } from 'react'
import { Bot } from 'lucide-react'

interface TypingIndicatorProps {
  isVisible: boolean
}

export function TypingIndicator({ isVisible }: TypingIndicatorProps) {
  const [dots, setDots] = useState('')

  useEffect(() => {
    if (!isVisible) {
      setDots('')
      return
    }

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '') return '.'
        if (prev === '.') return '..'
        if (prev === '..') return '...'
        return ''
      })
    }, 500) // 每500ms更新一次

    return () => clearInterval(interval)
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="flex gap-3 justify-start">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
        <Bot className="w-4 h-4 text-primary-foreground" />
      </div>

      {/* Typing Indicator */}
      <div className="max-w-[80%]">
        <div className="px-4 py-3 rounded-lg text-foreground">
          <span className="text-muted-foreground text-xl font-mono animate-pulse">
            {dots}
          </span>
        </div>
      </div>
    </div>
  )
} 