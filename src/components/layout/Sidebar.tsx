import React, { useState } from 'react'
import { useAppStore } from '@/store'
import { Plus, MessageSquare, Settings, Trash2, Edit2, Check, X } from 'lucide-react'
import { SettingsDialog } from '@/components/settings/SettingsDialog'

export function Sidebar() {
  const { 
    sessions, 
    currentSessionId, 
    createSession, 
    selectSession, 
    deleteSession,
    updateSessionTitle,
    isLoading,
    settingsOpen,
    setSettingsOpen
  } = useAppStore()

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const handleCreateSession = async () => {
    try {
      await createSession()
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    if (confirm('确定要删除这个会话吗？')) {
      await deleteSession(sessionId)
    }
  }

  const handleStartEdit = (e: React.MouseEvent, session: any) => {
    e.stopPropagation()
    setEditingSessionId(session.id)
    setEditingTitle(session.title)
  }

  const handleSaveEdit = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (editingSessionId && editingTitle.trim()) {
      try {
        await updateSessionTitle(editingSessionId, editingTitle.trim())
        setEditingSessionId(null)
        setEditingTitle('')
      } catch (error) {
        console.error('Failed to update title:', error)
      }
    }
  }

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingSessionId(null)
    setEditingTitle('')
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit(e as any)
    } else if (e.key === 'Escape') {
      handleCancelEdit(e as any)
    }
  }

  return (
    <div className="h-full bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <button
          onClick={handleCreateSession}
          disabled={isLoading}
          className="w-full flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          新建对话
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => selectSession(session.id)}
              className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
                currentSessionId === session.id
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                {editingSessionId === session.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      className="flex-1 text-sm bg-transparent border-b border-primary focus:outline-none"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="p-1 hover:bg-muted rounded text-green-600"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 hover:bg-muted rounded text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm font-medium truncate">{session.title}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {session.messageCount} 条消息
                </p>
              </div>
              {editingSessionId !== session.id && (
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                  <button
                    onClick={(e) => handleStartEdit(e, session)}
                    className="p-1 hover:bg-muted rounded transition-all"
                    title="编辑标题"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteSession(e, session.id)}
                    className="p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-all"
                    title="删除会话"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
          
          {sessions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无对话</p>
              <p className="text-xs">点击上方按钮创建新对话</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <button 
          onClick={() => setSettingsOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4" />
          设置
        </button>
      </div>
      
      {/* Settings Dialog */}
      <SettingsDialog 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
      />
    </div>
  )
} 