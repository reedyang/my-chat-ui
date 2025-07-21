import React, { useState, useEffect } from 'react'
import { useAppStore } from '@/store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Bot, Thermometer, Hash, Link, Palette, Key, RefreshCw, Trash2, Copy, Eye, EyeOff, Settings, Wifi, Paintbrush, Check } from 'lucide-react'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, models, updateSettings, loadModels, generateApiKey, refreshApiKey, revokeApiKey } = useAppStore()
  
  const [formData, setFormData] = useState({
    defaultModel: '',
    temperature: 0.7,
    maxTokens: 2048,
    ollamaEndpoint: 'http://localhost:11434',
    theme: 'auto' as 'light' | 'dark' | 'auto'
  })

  const [apiKeyVisible, setApiKeyVisible] = useState(false)
  const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Initialize form data when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        defaultModel: settings.defaultModel,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        ollamaEndpoint: settings.ollamaEndpoint,
        theme: settings.theme
      })
    }
  }, [settings])

  const handleSettingChange = async (key: keyof typeof formData, value: any) => {
    // Update local form data
    setFormData(prev => ({ ...prev, [key]: value }))
    
    // Auto-save to backend
    try {
      await updateSettings({ [key]: value })
    } catch (error) {
      console.error(`Failed to update ${key}:`, error)
    }
  }

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    setFormData(prev => ({ ...prev, theme }))
    
    // Apply theme immediately
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      // Auto theme - check system preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (isDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }

  const handleGenerateApiKey = async () => {
    setIsGenerating(true)
    try {
      const result = await generateApiKey()
      if (result) {
        setGeneratedApiKey(result.apiKey)
        setApiKeyVisible(true)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRefreshApiKey = async () => {
    setIsGenerating(true)
    try {
      const result = await refreshApiKey()
      if (result) {
        setGeneratedApiKey(result.apiKey)
        setApiKeyVisible(true)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRevokeApiKey = async () => {
    if (confirm('确定要撤销API密钥吗？此操作不可逆。')) {
      await revokeApiKey()
      setGeneratedApiKey(null)
      setApiKeyVisible(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
    })
  }

  const maskApiKey = (key: string) => {
    if (key.length < 12) return '***'
    return `${key.substring(0, 8)}${'*'.repeat(key.length - 12)}${key.substring(key.length - 4)}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[600px] h-[600px] max-w-none max-h-none flex flex-col">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
          <DialogClose onClick={() => onOpenChange(false)} />
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="model" className="w-full h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="model" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              模型设置
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Paintbrush className="w-4 h-4" />
              外观设置
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              API密钥
            </TabsTrigger>
          </TabsList>

          {/* 模型设置标签页 */}
          <TabsContent value="model" className="space-y-6">
                         {/* Ollama API 端点 */}
             <div>
               <label className="flex items-center gap-2 text-sm font-medium mb-2">
                 <Link className="w-4 h-4" />
                 Ollama API 端点
               </label>
               <div className="flex items-center gap-2">
                 <input
                   type="url"
                   value={formData.ollamaEndpoint}
                   onChange={(e) => setFormData(prev => ({ ...prev, ollamaEndpoint: e.target.value }))}
                   className="flex-1 px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                   placeholder="http://localhost:11434"
                 />
                 <button
                   onClick={async () => {
                     try {
                       // Update the Ollama endpoint setting
                       await updateSettings({ ollamaEndpoint: formData.ollamaEndpoint })
                       
                       // Reload models with the new endpoint
                       await loadModels()
                       
                       console.log('Ollama endpoint updated and models reloaded')
                     } catch (error) {
                       console.error('Failed to update endpoint:', error)
                     }
                   }}
                   className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                   title="应用并重新加载模型"
                 >
                   <Check className="w-4 h-4" />
                 </button>
               </div>
               <p className="text-xs text-muted-foreground mt-1">
                 Ollama服务的API地址，修改后点击对号按钮应用设置
               </p>
             </div>
            
            {/* 默认模型 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Bot className="w-4 h-4" />
                默认模型
              </label>
                          <select
              value={formData.defaultModel}
              onChange={(e) => handleSettingChange('defaultModel', e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
                          <p className="text-xs text-muted-foreground mt-1">
              新会话默认使用的模型，修改后自动保存
            </p>
            </div>

            {/* 温度参数 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Thermometer className="w-4 h-4" />
                温度参数: {formData.temperature}
              </label>
                          <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={formData.temperature}
              onChange={(e) => handleSettingChange('temperature', parseFloat(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
            />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>保守 (0)</span>
                <span>平衡 (0.7)</span>
                <span>创意 (1)</span>
              </div>
                          <p className="text-xs text-muted-foreground mt-1">
              控制回复的随机性和创造性，修改后自动保存
            </p>
            </div>

            {/* 最大令牌数 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Hash className="w-4 h-4" />
                最大令牌数
              </label>
                          <input
              type="number"
              min="1"
              max="8192"
              value={formData.maxTokens}
              onChange={(e) => handleSettingChange('maxTokens', parseInt(e.target.value) || 2048)}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
                          <p className="text-xs text-muted-foreground mt-1">
              限制AI回复的最大长度，修改后自动保存
            </p>
            </div>

          </TabsContent>



          {/* 外观设置标签页 */}
          <TabsContent value="appearance" className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-3">
                <Palette className="w-4 h-4" />
                主题
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'light', label: '浅色模式', desc: '始终使用浅色主题' },
                  { value: 'dark', label: '深色模式', desc: '始终使用深色主题' },
                  { value: 'auto', label: '跟随系统', desc: '根据系统设置自动切换' }
                ].map((theme) => (
                  <button
                    key={theme.value}
                    onClick={() => handleThemeChange(theme.value as any)}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      formData.theme === theme.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className="font-medium text-sm">{theme.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{theme.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 主题预览 */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-medium mb-2">主题预览</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-4 h-4 bg-background border rounded"></div>
                <span>背景色</span>
                <div className="w-4 h-4 bg-foreground rounded"></div>
                <span>文字色</span>
                <div className="w-4 h-4 bg-primary rounded"></div>
                <span>主色调</span>
              </div>
            </div>
          </TabsContent>

          {/* API密钥标签页 */}
          <TabsContent value="api" className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-3">
                <Key className="w-4 h-4" />
                API 密钥管理
              </label>
              
              {settings?.apiKey || generatedApiKey ? (
                <div className="space-y-4">
                  {/* 显示当前API密钥 */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">当前API密钥</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setApiKeyVisible(!apiKeyVisible)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title={apiKeyVisible ? '隐藏' : '显示'}
                        >
                          {apiKeyVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(generatedApiKey || settings?.apiKey || '')}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="复制到剪贴板"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <code className="text-sm font-mono block bg-background p-3 rounded border break-all">
                      {apiKeyVisible 
                        ? (generatedApiKey || settings?.apiKey || '') 
                        : maskApiKey(generatedApiKey || settings?.apiKey || '')
                      }
                    </code>
                    {settings?.apiKeyCreatedAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        创建时间: {new Date(settings.apiKeyCreatedAt).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* API密钥操作按钮 */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleRefreshApiKey}
                      disabled={isGenerating}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                      刷新密钥
                    </button>
                    <button
                      onClick={handleRevokeApiKey}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      撤销密钥
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Key className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">还没有API密钥</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                    生成一个API密钥来通过HTTP请求访问OpenAI兼容的聊天接口。密钥是安全的，只有你能看到完整内容。
                  </p>
                  <button
                    onClick={handleGenerateApiKey}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
                  >
                    <Key className={`w-5 h-5 ${isGenerating ? 'animate-pulse' : ''}`} />
                    {isGenerating ? '生成中...' : '生成API密钥'}
                  </button>
                </div>
              )}

              {/* API使用说明 */}
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  <Link className="w-4 h-4 inline mr-1" />
                  API 使用说明
                </h4>
                <div className="space-y-2 text-xs text-blue-700 dark:text-blue-200">
                  <p>使用API密钥可以通过HTTP请求访问聊天接口：</p>
                  <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded font-mono">
                    <div>POST /v1/chat/completions</div>
                    <div>Authorization: Bearer YOUR_API_KEY</div>
                  </div>
                  <p>支持流式和非流式响应，兼容OpenAI API格式。</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
} 