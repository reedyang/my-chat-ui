# My Chat UI - 设计方案

## 系统架构

### 整体架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Frontend  │───▶│  Backend API    │───▶│   Ollama API    │
│   (React + TS)  │    │ (Node.js + TS)  │    │  (本地服务)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Data Storage   │
                       │ (JSON/SQLite)   │
                       └─────────────────┘
```

### 技术架构分层
1. **表示层**: React前端应用
2. **API层**: Express.js REST API
3. **业务逻辑层**: 会话管理、消息处理
4. **数据访问层**: 文件存储/SQLite操作
5. **外部服务层**: Ollama API集成

## 前端设计

### 组件架构
```
App
├── Layout
│   ├── Header (标题、设置)
│   ├── Sidebar (会话列表、新建会话)
│   └── Main (聊天区域)
├── Chat
│   ├── MessageList (消息列表)
│   ├── MessageItem (单条消息)
│   └── MessageInput (输入框)
├── Settings
│   ├── ModelSelector (模型选择)
│   └── ConfigPanel (配置面板)
└── Common
    ├── Loading
    ├── ErrorBoundary
    └── Modal
```

### 状态管理设计
使用Zustand进行全局状态管理：

```typescript
interface AppState {
  // 会话相关
  sessions: Session[]
  currentSessionId: string | null
  
  // 消息相关
  messages: Record<string, Message[]>
  isLoading: boolean
  
  // 设置相关
  selectedModel: string
  settings: AppSettings
  
  // 操作方法
  createSession: () => void
  deleteSession: (id: string) => void
  sendMessage: (content: string) => void
  // ...
}
```

### 关键页面设计

#### 主聊天界面
- 左侧：会话列表（可折叠）
- 中间：消息对话区域
- 底部：消息输入框
- 右上角：模型选择、设置按钮

#### 响应式设计
- 桌面端：侧边栏 + 主内容区
- 移动端：全屏聊天，抽屉式会话列表

## 后端设计

### API设计

#### 核心接口
```typescript
// 会话管理
GET    /api/sessions              // 获取会话列表
POST   /api/sessions              // 创建新会话
DELETE /api/sessions/:id          // 删除会话
PUT    /api/sessions/:id          // 更新会话

// 消息管理
GET    /api/sessions/:id/messages // 获取会话消息
POST   /api/sessions/:id/messages // 发送消息

// 模型管理
GET    /api/models                // 获取可用模型列表
GET    /api/models/status         // 检查模型状态

// OpenAI兼容API
POST   /v1/chat/completions       // OpenAI兼容聊天接口
```

#### OpenAI兼容API设计
```typescript
// 请求格式
interface ChatCompletionRequest {
  model: string
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

// 响应格式
interface ChatCompletionResponse {
  id: string
  object: 'chat.completion'
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: 'assistant'
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}
```

### 服务层设计

#### Ollama服务封装
```typescript
class OllamaService {
  async generateCompletion(model: string, messages: Message[]): Promise<string>
  async generateStream(model: string, messages: Message[]): Promise<ReadableStream>
  async getModels(): Promise<Model[]>
  async checkHealth(): Promise<boolean>
}
```

#### 会话服务
```typescript
class SessionService {
  async createSession(): Promise<Session>
  async getSession(id: string): Promise<Session>
  async deleteSession(id: string): Promise<void>
  async addMessage(sessionId: string, message: Message): Promise<void>
}
```

## 数据设计

### 数据模型

#### 会话 (Session)
```typescript
interface Session {
  id: string
  title: string
  model: string
  createdAt: Date
  updatedAt: Date
  messageCount: number
}
```

#### 消息 (Message)
```typescript
interface Message {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  tokens?: number
}
```

#### 应用设置 (Settings)
```typescript
interface AppSettings {
  defaultModel: string
  temperature: number
  maxTokens: number
  ollamaEndpoint: string
  theme: 'light' | 'dark' | 'auto'
}
```

### 存储方案

#### 方案一：JSON文件存储
```
data/
├── sessions.json      // 会话列表
├── messages/
│   ├── session1.json  // 会话1的消息
│   └── session2.json  // 会话2的消息
└── settings.json      // 应用设置
```

#### 方案二：SQLite数据库
```sql
-- 会话表
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 消息表
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  tokens INTEGER,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- 设置表
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

## 流式响应设计

### 前端流处理
```typescript
async function sendMessage(content: string) {
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: content, sessionId })
  })
  
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    
    const chunk = decoder.decode(value)
    // 处理流式数据块
    handleStreamChunk(chunk)
  }
}
```

### 后端流处理
```typescript
app.post('/api/chat/stream', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'Transfer-Encoding': 'chunked'
  })
  
  const stream = await ollamaService.generateStream(model, messages)
  
  stream.on('data', (chunk) => {
    res.write(chunk)
  })
  
  stream.on('end', () => {
    res.end()
  })
})
```

## 错误处理设计

### 错误类型定义
```typescript
enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  OLLAMA_UNAVAILABLE = 'OLLAMA_UNAVAILABLE',
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
  INVALID_REQUEST = 'INVALID_REQUEST',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

interface ApiError {
  type: ErrorType
  message: string
  code: number
  details?: any
}
```

### 错误处理策略
1. **网络错误**: 自动重试机制
2. **Ollama不可用**: 显示友好提示，提供重连按钮
3. **模型错误**: 自动切换到默认模型
4. **输入错误**: 表单验证和提示

## 部署设计

### 开发环境
```bash
# 前端开发服务器
npm run dev          # localhost:5173

# 后端开发服务器  
npm run dev:server   # localhost:3001

# Ollama服务
ollama serve         # localhost:11434
```

### 生产环境
```bash
# 构建前端
npm run build

# 启动生产服务器
npm start           # 同时提供API和静态文件服务
```

### Docker部署（可选）
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["npm", "start"]
```

## 性能优化

### 前端优化
1. **组件懒加载**: React.lazy + Suspense
2. **虚拟滚动**: 长消息列表优化
3. **防抖**: 输入框防抖处理
4. **缓存**: API响应缓存

### 后端优化
1. **连接池**: Ollama API连接复用
2. **压缩**: gzip压缩响应
3. **缓存**: 模型列表缓存
4. **限流**: API访问频率限制

## 安全考虑

### 输入验证
- 消息内容长度限制
- 特殊字符过滤
- XSS防护

### API安全
- CORS配置
- 请求大小限制
- 简单的API密钥认证（可选）

### 数据安全
- 本地存储加密（可选）
- 敏感信息不记录日志
- 定期清理过期会话

## 扩展性设计

### 插件系统（未来）
- 自定义提示词模板
- 第三方模型集成
- 消息格式扩展

### 多用户支持（未来）
- 用户认证系统
- 会话隔离
- 权限管理

### 集群部署（未来）
- 负载均衡
- 会话共享
- 分布式存储 