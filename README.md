# My Chat UI

基于 Ollama API 和本地部署的 Ollama 模型的简单 Web 聊天应用，支持会话管理和 OpenAI 兼容 API。

## ✨ 特性

- 🤖 **本地 AI 模型支持**: 基于 Ollama 本地部署的模型
- 💬 **流式对话**: 实时显示 AI 回复，体验流畅
- 📝 **会话管理**: 创建、切换、删除和重命名会话
- 🔄 **模型切换**: 支持多种 Ollama 模型
- 🎨 **现代化 UI**: 基于 React + TypeScript + Tailwind CSS
- 📱 **响应式设计**: 完美支持桌面端和移动端
- 🔌 **OpenAI 兼容 API**: 提供标准的 OpenAI API 接口
- 🚀 **轻量级部署**: 易于安装和配置

## 🏗️ 技术栈

### 前端
- **React 18** + **TypeScript**
- **Vite** (构建工具)
- **Tailwind CSS** + **shadcn/ui** (UI 框架)
- **Zustand** (状态管理)

### 后端
- **Node.js** + **Express**
- **TypeScript**
- **JSON/SQLite** (数据存储)

### 外部服务
- **Ollama API** (AI 模型服务)

## 📋 前置要求

1. **Node.js** >= 18.0.0
2. **npm** >= 8.0.0
3. **Ollama** 本地服务运行在 `http://localhost:11434`

### 安装 Ollama

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# 从 https://ollama.ai 下载安装包
```

### 启动 Ollama 服务并下载模型

```bash
# 启动 Ollama 服务
ollama serve

# 下载模型 (例如 llama2)
ollama pull llama2
ollama pull qwen:7b
```

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd my-chat-ui
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# Ollama API 地址
OLLAMA_BASE_URL=http://localhost:11434

# 服务器端口
PORT=3001

# 前端开发端口
VITE_PORT=5173

# API 基础路径
VITE_API_BASE_URL=http://localhost:3001/api
```

### 4. 启动开发服务器

```bash
# 启动前端开发服务器 (http://localhost:5173)
npm run dev

# 启动后端服务器 (http://localhost:3001)
npm run dev:server

# 或者同时启动前后端
npm run dev:all
```

### 5. 访问应用

打开浏览器访问 [http://localhost:5173](http://localhost:5173)

## 🛠️ 开发指南

### 项目结构

```
my-chat-ui/
├── src/                 # 前端源码
├── server/              # 后端源码
├── docs/                # 文档
├── data/                # 数据存储
└── public/              # 静态资源
```

详细的项目结构请参考 [项目结构文档](./project-structure.md)

### 开发命令

```bash
# 前端开发
npm run dev              # 启动前端开发服务器
npm run build            # 构建前端

# 后端开发
npm run dev:server       # 启动后端开发服务器
npm run build:server     # 编译后端 TypeScript

# 全栈开发
npm run dev:all          # 同时启动前后端
npm run build:all        # 构建前后端

# 生产环境
npm start                # 启动生产服务器
npm run deploy           # 构建并部署
```

### API 接口

#### 会话管理
- `GET /api/sessions` - 获取会话列表
- `POST /api/sessions` - 创建新会话
- `DELETE /api/sessions/:id` - 删除会话

#### 聊天对话
- `POST /api/sessions/:id/messages` - 发送消息
- `GET /api/sessions/:id/messages` - 获取消息历史

#### 模型管理
- `GET /api/models` - 获取可用模型列表
- `GET /api/models/status` - 检查模型状态

#### OpenAI 兼容 API
- `POST /v1/chat/completions` - OpenAI 兼容聊天接口

详细的 API 文档请参考 [API 文档](./docs/api.md)

## 🔌 OpenAI API 使用

本项目提供完全兼容 OpenAI 的 API 接口，可以直接替换 OpenAI API 使用：

```bash
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" ^
  -d '{
    "model": "llama2",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "stream": true
  }'
```

### 在代码中使用

```typescript
// 使用 OpenAI 客户端库
import OpenAI from 'openai'

const openai = new OpenAI({
  baseURL: 'http://localhost:3001/v1',
  apiKey: 'not-needed'
})

const response = await openai.chat.completions.create({
  model: 'llama2',
  messages: [{ role: 'user', content: 'Hello!' }],
})
```

## 📱 使用说明

### 创建新会话
1. 点击左侧边栏的 "新建对话" 按钮
2. 选择要使用的模型
3. 开始对话

### 发送消息
1. 在底部输入框输入消息
2. 按 Enter 或点击发送按钮
3. AI 将流式回复消息

### 管理会话
- **切换会话**: 点击左侧边栏的会话项
- **删除会话**: 右键点击会话项选择删除
- **重命名会话**: 右键点击会话项选择重命名

### 切换模型
1. 点击右上角的模型选择器
2. 从下拉列表中选择新模型
3. 后续对话将使用新模型

## 🔧 配置选项

### 应用设置

可以在设置面板中配置：

- **默认模型**: 新会话的默认模型
- **温度参数**: 控制回复的随机性 (0.0-1.0)
- **最大令牌数**: 限制回复长度
- **Ollama 端点**: Ollama 服务地址
- **主题**: 浅色/深色/自动

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API 地址 |
| `PORT` | `3001` | 后端服务器端口 |
| `VITE_API_BASE_URL` | `http://localhost:3001/api` | 前端 API 基础路径 |
| `DATA_DIR` | `./data` | 数据存储目录 |

## 🚀 部署

### 本地部署

```bash
# 构建应用
npm run build:all

# 启动生产服务器
npm start
```

### Docker 部署

```bash
# 构建镜像
docker build -t my-chat-ui .

# 运行容器
docker run -p 3001:3001 -v ./data:/app/data my-chat-ui
```

### 环境要求

- 确保 Ollama 服务正在运行
- 至少下载一个模型
- 网络能访问 Ollama API

## 🔍 故障排除

### 常见问题

**Q: 应用无法连接到 Ollama**
A: 检查 Ollama 服务是否运行：`ollama list`

**Q: 模型列表为空**
A: 下载模型：`ollama pull llama2`

**Q: 消息发送失败**
A: 检查选择的模型是否已下载并可用

**Q: 前端页面空白**
A: 检查控制台错误，确认后端 API 可访问

### 日志查看

```bash
# 查看后端日志
npm run logs

# 查看 Ollama 日志
ollama logs
```

## 📚 文档

- [需求文档](./requirements.md)
- [设计方案](./design.md)
- [项目结构](./project-structure.md)
- [API 文档](./docs/api.md)
- [部署文档](./docs/deployment.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [Ollama](https://ollama.ai/) - 本地 AI 模型运行时
- [OpenAI](https://openai.com/) - API 接口设计参考
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库 