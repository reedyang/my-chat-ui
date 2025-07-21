import React from 'react'
import { useAppStore } from '@/store'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Chat } from '@/components/chat/Chat'

export function Layout() {
  const { sidebarOpen, currentSessionId, error } = useAppStore()

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 border-r border-border overflow-hidden`}>
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header />
        
        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border-destructive/20 border text-destructive px-4 py-3 text-sm">
            {error}
          </div>
        )}
        
        {/* Chat Area */}
        <div className="flex-1 overflow-hidden">
          {currentSessionId ? (
            <Chat sessionId={currentSessionId} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">Welcome to My Chat UI</h2>
                <p className="text-lg mb-4">Create a new session to start chatting with AI models</p>
                <p className="text-sm">Powered by Ollama</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 