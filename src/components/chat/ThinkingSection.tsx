import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface ThinkingSectionProps {
  content: string
  isComplete?: boolean
}

export function ThinkingSection({ content, isComplete = true }: ThinkingSectionProps) {
  const [isExpanded, setIsExpanded] = useState(!isComplete)

  useEffect(() => {
    // When thinking becomes complete, keep it expanded if it was already showing
    if (!isComplete) {
      setIsExpanded(true)
    }
  }, [isComplete])

  if (!content) return null

  const toggleExpanded = () => {
    if (isComplete) {
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <div className="mb-3">
      <button
        onClick={toggleExpanded}
        className={`flex items-center gap-2 w-full p-1 text-left transition-colors ${
          isComplete ? 'hover:bg-muted/20 cursor-pointer' : 'cursor-default'
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
      </button>
      
      {(isExpanded || !isComplete) && (
        <div className="px-1 pb-2">
          <div 
            className="text-sm whitespace-pre-wrap leading-relaxed"
            style={{ 
              color: '#6b7280',
              fontStyle: 'italic'
            }}
          >
            {content}
          </div>
        </div>
      )}
    </div>
  )
} 