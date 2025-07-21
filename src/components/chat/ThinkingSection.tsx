import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface ThinkingSectionProps {
  content: string
  isComplete?: boolean
}

export function ThinkingSection({ content, isComplete = true }: ThinkingSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!content) return null

  const toggleExpanded = () => {
    if (isComplete) {
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <div className="mb-3 border border-border rounded-lg bg-muted/30">
      <button
        onClick={toggleExpanded}
        className={`flex items-center gap-2 w-full p-3 text-left transition-colors ${
          isComplete ? 'hover:bg-muted/50 cursor-pointer' : 'cursor-default'
        }`}
        disabled={!isComplete}
      >
        {isComplete && (
          <>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </>
        )}
        <span className="text-sm font-medium text-muted-foreground">
          {isComplete ? '思考过程' : '正在思考...'}
        </span>
        {!isComplete && (
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-xs text-muted-foreground">正在输出...</span>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-muted-foreground/60 rounded-full animate-pulse"></div>
              <div className="w-1 h-1 bg-muted-foreground/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1 h-1 bg-muted-foreground/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
      </button>
      
      {(isExpanded || !isComplete) && (
        <div className="px-3 pb-3">
          <div className="text-sm italic text-muted-foreground/80 whitespace-pre-wrap leading-relaxed">
            {content}
          </div>
        </div>
      )}
    </div>
  )
} 