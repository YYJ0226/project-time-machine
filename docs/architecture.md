# 技术架构

## 架构目标

第一版采用单仓库、模块化单体架构，优先保证个人开发效率、部署简单和证据链的一致性。只有在真实瓶颈出现后再拆分服务。

## 计划中的系统边界

```text
Browser
  |
  v
Next.js App Router
  |-- 学生工作台
  |-- 教师只读分享页
  |-- Route Handlers / Server Actions
  |
  +--> GitHub OAuth + REST API
  +--> Supabase Auth / PostgreSQL
  +--> DeepSeek API
```

## 模块划分

| 模块 | 职责 | 计划阶段 |
| --- | --- | --- |
| Web Shell | 导航、页面框架、设计令牌、响应式布局 | 阶段一 |
| Identity | Supabase SSR Cookie 会话、GitHub OAuth、用户边界 | 阶段二 |
| Project Import | 读取公开 GitHub API，选择并导入用户拥有的公开仓库 | 阶段二 |
| Evidence Sync | 同步 Issue、Commit、PR、测试状态 | 阶段三 |
| Evidence Graph | 关联需求、实现、验证及人工说明 | 阶段三 |
| Timeline | 时间线筛选、聚焦、证据详情 | 阶段四 |
| AI Ledger | 记录 AI 任务、摘要、人工确认状态 | 阶段五 |
| Review & Export | 教师只读页、Markdown 和视频脚本 | 阶段五 |

## 数据可信度分层

公开页面中的内容必须带有来源类型：

- **Source fact**：来自 GitHub 的不可变或可重新同步事实；
- **Student note**：学生手工补充的背景和解释；
- **AI draft**：模型生成但尚未确认的内容，不对老师公开；
- **Verified narrative**：学生确认后的 AI 内容，保留生成与确认记录。

## 初步数据实体

- `users`：平台用户与 GitHub 身份映射；
- `projects`：导入的仓库及分享设置；
- `sync_runs`：每次同步的状态、范围和结果；
- `evidence_items`：Issue、Commit、PR、Check 等原始证据；
- `evidence_links`：证据之间的关系及置信度；
- `student_notes`：用户补充说明；
- `ai_runs`：AI 任务、模型、输入摘要和输出状态；
- `narratives`：经确认、可用于公开展示和导出的叙事；
- `share_links`：教师只读访问令牌与有效状态。

具体字段将在相应功能阶段以迁移文件和数据字典固化，避免当前阶段过早锁死模型。

## 安全与隐私边界

- OAuth Token 只在服务端读取，禁止进入浏览器包或日志。
- 首版仅允许导入登录用户拥有的公开仓库。
- 教师分享采用不可猜测令牌，可由学生随时撤销。
- AI 调用使用最少必要上下文，不发送密钥、完整环境变量或无关文件。
- AI 原始输入默认不向教师展示；公开内容需要学生确认。
- 所有服务端写操作都要验证项目所有权，不能只依赖前端隐藏按钮。

阶段二暂不保存 GitHub provider token。OAuth 仅用于核验 GitHub 身份，公开仓库列表通过 GitHub 公共 REST API 获取；导入时服务端重新检查仓库可见性与 owner。此设计避免在 MVP 初期持久化高敏感 Token，代价是受到 GitHub 未认证 API 请求额度限制。后续证据同步阶段再单独评估安全的授权与 Token 存储方案。

阶段三继续只读取公开 API，通过手动同步采集最近 100 条 Issue、Commit、Pull Request 与 GitHub Actions workflow run。为避免 GitHub 未认证请求的低额度，部署环境可以配置仅服务端可见的只读 `GITHUB_TOKEN`；平台仍不保存用户的 provider token。原始证据与人工审阅状态分表保存，确定性规则只提出关联建议，不自动替用户确认项目叙事。字段与规则见 [项目证据模型](evidence-model.md)。

阶段四新增 `/app/projects/[projectId]/timeline`：服务端验证用户与项目所有权后，从 Supabase
读取最多 1000 条证据与 1000 条已确认关系；超过加载上限时显示范围提示。
交给客户端的数据仅含标题、正文、类型、时间、状态、公开原文链接和已确认关系，不含 Token 或原始授权对象。

时间排序、北京时间日期筛选、关键节点、共用坐标和碰撞错层逻辑放在纯函数模块 `src/lib/timeline.ts`，
交互部分由独立 Client Component 管理。缩放、筛选、回放和关系跳转均在已加载快照中进行，
不额外请求 GitHub、不写数据库；更新证据仍返回阶段三工作台手动同步。
AI 泳道保留空状态，尚未引入 AI 模型服务。回放不是历史代码快照恢复。

## 工程约束

- Node.js 22 作为本地和 CI 的统一运行时。
- `main` 分支必须通过 lint 和 production build。
- 环境变量只进入 `.env.local`，仓库仅提供无密钥示例。
- 对外部 API 的访问封装在服务端模块中，页面组件不直接持有 Token。
- 优先使用可测试的纯函数完成事件归一化和证据匹配。

## 部署设想

- Web：Vercel；
- 数据库与认证：Supabase；
- 源码与 CI：GitHub；
- AI：DeepSeek OpenAI 兼容 API。

部署方案会在功能闭环稳定后验证，不在阶段一创建无用的云资源。
