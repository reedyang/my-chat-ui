# My Chat UI - 项目结构规划

## 项目目录结构

```
my-chat-ui/
├── README.md                    # 项目说明文档
├── package.json                 # 项目依赖和脚本
├── package-lock.json            # 依赖锁定文件
├── tsconfig.json                # TypeScript配置
├── vite.config.ts               # Vite构建配置
├── tailwind.config.js           # Tailwind CSS配置
├── .env.example                 # 环境变量示例
├── .gitignore                   # Git忽略文件
│
├── src/                         # 前端源代码
│   ├── main.tsx                 # 前端入口文件
│   ├── App.tsx                  # 主应用组件
│   ├── index.css                # 全局样式
│   │
│   ├── components/              # React组件
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   ├── chat/
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageItem.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── Chat.tsx
│   │   ├── session/
│   │   │   ├── SessionList.tsx
│   │   │   ├── SessionItem.tsx
│   │   │   └── SessionDialog.tsx
│   │   ├── settings/
│   │   │   ├── ModelSelector.tsx
│   │   │   ├── SettingsPanel.tsx
│   │   │   └── Settings.tsx
│   │   └── ui/                  # 基础UI组件 (shadcn/ui)
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       └── ...
│   │
│   ├── hooks/                   # 自定义React Hooks
│   │   ├── useChat.ts
│   │   ├── useSession.ts
│   │   ├── useModels.ts
│   │   └── useStream.ts
│   │
│   ├── store/                   # 状态管理 (Zustand)
│   │   ├── index.ts
│   │   ├── sessionStore.ts
│   │   ├── chatStore.ts
│   │   └── settingsStore.ts
│   │
│   ├── services/                # API服务层
│   │   ├── api.ts               # 基础API配置
│   │   ├── sessionService.ts    # 会话相关API
│   │   ├── chatService.ts       # 聊天相关API
│   │   └── modelService.ts      # 模型相关API
│   │
│   ├── types/                   # TypeScript类型定义
│   │   ├── index.ts
│   │   ├── session.ts
│   │   ├── message.ts
│   │   ├── model.ts
│   │   └── api.ts
│   │
│   ├── utils/                   # 工具函数
│   │   ├── format.ts            # 格式化工具
│   │   ├── date.ts              # 日期处理
│   │   ├── storage.ts           # 本地存储
│   │   └── stream.ts            # 流处理工具
│   │
│   └── lib/                     # 第三方库配置
│       ├── utils.ts             # 通用工具
│       └── validations.ts       # 表单验证
│
├── server/                      # 后端服务器代码
│   ├── index.ts                 # 服务器入口文件
│   ├── app.ts                   # Express应用配置
│   │
│   ├── routes/                  # 路由定义
│   │   ├── index.ts             # 路由汇总
│   │   ├── sessions.ts          # 会话路由
│   │   ├── chat.ts              # 聊天路由
│   │   ├── models.ts            # 模型路由
│   │   └── openai.ts            # OpenAI兼容API路由
│   │
│   ├── services/                # 业务服务层
│   │   ├── ollamaService.ts     # Ollama API服务
│   │   ├── sessionService.ts    # 会话服务
│   │   ├── messageService.ts    # 消息服务
│   │   └── modelService.ts      # 模型服务
│   │
│   ├── models/                  # 数据模型
│   │   ├── Session.ts
│   │   ├── Message.ts
│   │   └── Settings.ts
│   │
│   ├── storage/                 # 数据存储
│   │   ├── index.ts             # 存储接口
│   │   ├── jsonStorage.ts       # JSON文件存储
│   │   └── sqliteStorage.ts     # SQLite存储 (可选)
│   │
│   ├── middleware/              # 中间件
│   │   ├── cors.ts              # CORS配置
│   │   ├── errorHandler.ts      # 错误处理
│   │   ├── validation.ts        # 请求验证
│   │   └── auth.ts              # 认证中间件 (可选)
│   │
│   ├── utils/                   # 后端工具函数
│   │   ├── logger.ts            # 日志工具
│   │   ├── response.ts          # 响应格式化
│   │   └── validation.ts        # 数据验证
│   │
│   └── types/                   # 后端类型定义
│       ├── index.ts
│       ├── ollama.ts            # Ollama API类型
│       └── openai.ts            # OpenAI API类型
│
├── data/                        # 数据存储目录
│   ├── sessions.json            # 会话数据
│   ├── settings.json            # 应用设置
│   └── messages/                # 消息数据目录
│       ├── session-1.json
│       └── session-2.json
│
├── public/                      # 静态资源
│   ├── index.html               # HTML模板
│   ├── favicon.ico              # 网站图标
│   └── assets/                  # 静态资源
│       ├── images/
│       └── icons/
│
├── docs/                        # 文档目录
│   ├── requirements.md          # 需求文档
│   ├── design.md               # 设计方案
│   ├── api.md                  # API文档
│   └── deployment.md           # 部署文档
│
└── scripts/                     # 脚本文件
    ├── build.js                # 构建脚本
    ├── dev.js                  # 开发脚本
    └── setup.js                # 初始化脚本
```

## 核心文件说明

### 配置文件

#### package.json
项目的核心配置文件，包含：
- 项目元信息
- 依赖管理
- 脚本命令
- 前后端统一配置

#### tsconfig.json
TypeScript编译配置：
- 前后端共享类型
- 编译选项
- 路径映射

#### vite.config.ts
前端构建配置：
- 开发服务器代理
- 构建优化
- 插件配置

### 前端核心文件

#### src/main.tsx
前端应用入口，负责：
- React应用挂载
- 全局样式导入
- 根组件渲染

#### src/App.tsx
主应用组件：
- 路由配置
- 全局状态初始化
- 错误边界

#### src/store/index.ts
状态管理中心：
- 全局状态定义
- 状态操作方法
- 数据持久化

### 后端核心文件

#### server/index.ts
服务器入口文件：
- Express服务器启动
- 中间件配置
- 错误处理

#### server/app.ts
Express应用配置：
- 路由注册
- 中间件链
- 静态文件服务

#### server/services/ollamaService.ts
Ollama API封装：
- 模型调用
- 流式响应
- 错误处理

## 开发工作流

### 前端开发
1. 在 `src/` 目录下开发React组件
2. 使用 `npm run dev` 启动开发服务器
3. 热重载自动更新
4. TypeScript类型检查

### 后端开发
1. 在 `server/` 目录下开发API
2. 使用 `npm run dev:server` 启动后端服务
3. 自动重启服务
4. API测试和调试

### 全栈开发
1. 同时运行前后端开发服务器
2. 前端代理到后端API
3. 统一的类型定义
4. 端到端测试

## 构建和部署

### 开发构建
```bash
npm run dev          # 前端开发服务器
npm run dev:server   # 后端开发服务器
```

### 生产构建
```bash
npm run build        # 构建前端
npm run build:server # 编译后端TypeScript
npm start           # 启动生产服务器
```

### 一键部署
```bash
npm run deploy       # 构建并启动完整应用
```

## 扩展点

### 新增功能模块
1. 在对应目录创建新组件/服务
2. 更新类型定义
3. 注册路由和状态
4. 编写测试

### 集成新的AI模型
1. 扩展 `modelService`
2. 更新模型类型定义
3. 添加配置选项
4. 测试兼容性

### 数据库切换
1. 实现新的存储接口
2. 更新服务层调用
3. 数据迁移脚本
4. 配置切换 