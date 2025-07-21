import React from 'react'
import { useAppStore } from '@/store'
import { Menu, Bot, ChevronDown } from 'lucide-react'
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu'

export function Header() {
  const { 
    toggleSidebar, 
    models, 
    settings,
    currentSessionId,
    sessions,
    changeSessionModel
  } = useAppStore()

  const currentSession = sessions.find(s => s.id === currentSessionId)
  const currentModel = currentSession?.model || settings?.defaultModel || 'llama2'

  const handleModelChange = async (modelId: string) => {
    if (currentSessionId) {
      try {
        await changeSessionModel(currentSessionId, modelId)
      } catch (error) {
        console.error('Failed to change model:', error)
      }
    }
  }

  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-semibold">My Chat UI</h1>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Current Model */}
          {currentSessionId && models.length > 0 && (
            <DropdownMenu
              align="right"
              trigger={
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">{currentModel}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </div>
              }
            >
              {models.map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => handleModelChange(model.id)}
                  className={model.id === currentModel ? 'bg-accent' : ''}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${model.available ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>{model.name}</span>
                    {model.id === currentModel && (
                      <span className="ml-auto text-xs text-muted-foreground">当前</span>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenu>
          )}

          {/* Model Status */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className={`w-2 h-2 rounded-full ${models.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{models.length} 个模型可用</span>
          </div>
        </div>
      </div>
    </header>
  )
} 