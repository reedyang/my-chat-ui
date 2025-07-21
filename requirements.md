# My Chat UI - 项目需求文档

## 项目概述
基于Ollama API和本地部署的Ollama模型创建一个简单的web chat项目，提供用户友好的聊天界面和兼容OpenAI的API接口。

## 功能需求

### 核心功能
1. **聊天界面**
   - 用户可以发送消息并接收AI回复
   - 支持流式响应（实时显示AI回复）
   - 消息历史记录显示
   - 支持Markdown格式渲染

2. **会话管理**
   - 新建会话功能
   - 会话列表展示
   - 切换不同会话
   - 删除会话
   - 重命名会话（可选）

3. **模型管理**
   - 显示可用的Ollama模型列表
   - 支持切换不同模型
   - 模型状态检查

### API功能
4. **OpenAI兼容API**
   - 提供`/v1/chat/completions`端点
   - 支持流式和非流式响应
   - 兼容OpenAI的请求/响应格式
   - 支持temperature、max_tokens等参数

## 技术需求

### 前端技术栈
- **框架**: React + TypeScript
- **UI库**: Tailwind CSS + shadcn/ui
- **状态管理**: Zustand 或 React Context
- **HTTP客户端**: fetch API
- **构建工具**: Vite

### 后端技术栈
- **框架**: Node.js + Express
- **语言**: TypeScript
- **数据存储**: 本地文件存储（JSON）或SQLite
- **API客户端**: axios 用于调用Ollama API

### 外部依赖
- **Ollama**: 本地部署的Ollama服务
- **Ollama API**: 用于模型推理

## 非功能需求

### 性能要求
- 界面响应时间 < 200ms
- 支持流式响应，实时显示AI回复
- 支持并发用户（至少10个）

### 可用性要求
- 简洁直观的用户界面
- 移动端响应式设计
- 良好的错误处理和用户反馈

### 可靠性要求
- 优雅处理网络错误
- Ollama服务离线时的降级处理
- 数据持久化保存

## 约束条件

### 技术约束
- 必须与Ollama API兼容
- 需要提供OpenAI兼容的API接口
- 前后端分离架构

### 部署约束
- 支持本地部署
- 依赖本地Ollama服务
- 轻量级，易于安装和配置

## 用户角色

### 普通用户
- 使用web界面进行AI对话
- 管理自己的会话

### API用户  
- 通过OpenAI兼容API进行集成
- 开发第三方应用

## 验收标准

### 基本功能验收
1. 用户可以成功发送消息并收到AI回复
2. 可以创建、切换、删除会话
3. OpenAI API端点正常工作
4. 界面响应式，支持移动端

### 性能验收
1. 消息发送响应时间 < 500ms
2. 流式响应延迟 < 100ms
3. 界面操作流畅无卡顿

### 兼容性验收
1. 支持主流浏览器（Chrome、Firefox、Safari、Edge）
2. API兼容OpenAI格式
3. 与不同Ollama模型兼容 