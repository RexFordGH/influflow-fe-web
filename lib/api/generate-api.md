## POST接口 /api/twitter/draft/generate

生成Twitter推文内容（支持三种模式）

#### 功能说明：

支持三种生成模式：draft（草案模式）、lite（轻量模式）、analysis（分析模式）
自动应用用户个性化设置和写作风格
支持推文串(thread)和长文(longform)两种输出格式

#### 三种生成模式：

##### 1. Draft 模式（默认）

基于已确认的内容草案生成推文
需要先调用 /api/twitter/draft/generate 生成草案
使用 session_id 恢复并继续推文生成流程

##### 2. Lite 模式

直接根据用户输入生成推文，无需草案
简洁快速的生成模式，适合简单需求
需要提供 user_input 描述生成需求

##### 3. Analysis 模式

直接根据用户输入生成深度分析内容
使用深度写作指导原则，提供更详细的分析
需要提供 user_input 描述分析主题

#### 请求参数：

- mode: 生成模式，可选值：
  - draft: 草案模式（默认）- 需要 session_id
  - lite: 轻量模式 - 需要 user_input
  - analysis: 分析模式 - 需要 user_input
- session_id: 草案会话ID（draft模式必填）
- user_input: 用户输入内容（lite/analysis模式必填）
- content_format: 内容格式，可选值：
  - thread: 推文串格式（默认）
  - longform: 长文格式

### 使用流程：

#### Draft模式：

调用 /api/twitter/draft/generate 生成并确认内容草案

使用获得的 session_id 调用此接口生成最终推文内容

#### Lite/Analysis模式：

直接调用此接口，提供 user_input 和对应的 mode
系统自动生成推文内容

### 认证要求：

需要JWT认证，系统会自动获取当前用户ID
个性化设置会从数据库中自动加载应用
