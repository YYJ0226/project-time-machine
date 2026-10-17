# Project Time Machine · 项目时光机

> 把课程项目的开发过程，变成一条可以回放、可以点回原文核对的证据链。

[![CI](https://github.com/YYJ0226/project-time-machine/actions/workflows/ci.yml/badge.svg)](https://github.com/YYJ0226/project-time-machine/actions/workflows/ci.yml)

**线上地址**：<https://project-time-machine.vercel.app>（首页观测区为样例数据，真实功能需 GitHub 登录后进入工作台）

---

## 为什么做这个

课程项目验收时，老师往往只看到最后的页面和一份汇报。真正的开发过程散落在 Issue、提交、Pull Request 和 CI 里，学生常常在截止前凭记忆把过程重新拼一遍。于是：

- 老师很难低成本核对“我们先做了 A，再做了 B，测试都通过了”这类说法；
- 学生事后拼出来的过程，往往“最像过程”，却不一定等于真实发生的过程。

Project Time Machine 不替老师判断项目好坏，只做一件事：**把已经存在的原始记录收拢、连起来，让每一句讲述都能点回 GitHub 原文**。机器只提建议，确认由学生来做，判断留给老师。

## 它做了什么

| 能力 | 说明 |
| --- | --- |
| GitHub 登录与仓库导入 | 只能导入当前账号自己拥有的公开仓库，服务端重新核验所有权和可见性 |
| 证据同步 | 手动同步最近 100 条 Issue、Commit、Pull Request 和 GitHub Actions 运行记录 |
| 统一证据结构 | 四类记录统一为同一种证据卡：类型、标题、状态、时间、原文链接 |
| 关联建议 | 按 `#编号` 引用、分支名、提交 SHA 三条规则生成“需求 → 实现 → 验证”建议 |
| 人工确认 | 学生逐条确认、忽略或撤销；重复同步不会覆盖人工决定 |
| 时间线与回放 | 需求 / 代码 / 验证 / AI 四条泳道，支持缩放、筛选、关键节点、单步与自动回放 |
| AI 草稿 | DeepSeek 只读取证据元数据生成摘要、缺失提醒和讲解稿，每句结论必须引用证据，引用会被校验 |
| 版本提醒 | 若 AI 草稿生成时的证据与当前证据不一致，明确标注“历史 AI 版本”，保留原文不改写 |
| 教师只读快照 | 免登录、可选 1 / 7 / 30 天有效期、随时可撤销；只包含已确认内容 |
| 导出 | 课程过程报告与视频讲解提纲两种 Markdown |

## 工作流程

```text
GitHub 登录 → 导入公开仓库 → 手动同步证据 → 统一为证据卡
  → 规则生成关联建议 → 学生确认 / 忽略
  → 四泳道时间线与回放
  → AI 草稿（带引用）→ 学生审阅确认
  → 教师只读快照 / Markdown 导出
```

以本仓库自己的一条真实记录为例：

1. [Issue #3](https://github.com/YYJ0226/project-time-machine/issues/3)「项目证据同步与关联」提出需求。
2. [PR #4](https://github.com/YYJ0226/project-time-machine/pull/4) 正文写着 `Closes #3.`，包含两次提交，头提交为 `5458666`。
3. 同一个 SHA 上的 GitHub Actions 检查通过，PR 合并为 `b82dc81`。
4. 平台同步后自动给出三条建议：Issue #3 → PR #4（编号引用）、提交 → PR #4（SHA 一致）、PR #4 → CI（SHA 一致）。
5. 学生确认后，虚线建议才变成已确认关系，并出现在时间线、教师快照与导出报告中。

对应代码入口：

| 环节 | 代码 |
| --- | --- |
| 导入与所有权核验 | [`src/app/app/actions.ts`](src/app/app/actions.ts) |
| 同步与人工审阅 | [`src/app/app/projects/[projectId]/actions.ts`](src/app/app/projects/[projectId]/actions.ts) |
| GitHub 拉取与归一化 | [`src/lib/github-evidence.ts`](src/lib/github-evidence.ts) |
| 关联规则 | [`src/lib/evidence.ts`](src/lib/evidence.ts) |
| 时间线 | [`src/lib/timeline.ts`](src/lib/timeline.ts) |
| AI 生成与引用校验 | [`src/lib/deepseek.ts`](src/lib/deepseek.ts)、[`src/lib/delivery.ts`](src/lib/delivery.ts) |
| 草稿审阅、分享、撤销 | [`src/app/app/projects/[projectId]/delivery/actions.ts`](src/app/app/projects/[projectId]/delivery/actions.ts) |
| 教师只读页 | [`src/app/review/[token]/page.tsx`](src/app/review/[token]/page.tsx) |

## 技术架构

```text
Browser
  │
  ▼
Next.js 16 App Router（Vercel）
  ├─ 学生工作台 / 时间线 / 审稿与交付
  ├─ 教师只读快照页 /review/[token]
  └─ Server Actions / Route Handlers
        ├─→ GitHub OAuth + REST API（只读公开数据）
        ├─→ Supabase Auth + PostgreSQL（RLS 行级隔离）
        └─→ DeepSeek API（仅服务端调用）
```

| 层 | 选型 |
| --- | --- |
| 前端与服务端 | Next.js 16（App Router）、React 19、TypeScript、Tailwind CSS 4 |
| 身份与数据 | Supabase Auth（GitHub OAuth、SSR Cookie 会话）、PostgreSQL + RLS |
| 外部数据 | GitHub REST API |
| AI | DeepSeek（OpenAI 兼容接口，服务端 Fetch） |
| 部署 | Vercel（Node.js 22） |
| 质量 | ESLint、Vitest、隔离生产 HTTP 回归、GitHub Actions |

主要数据表：`projects`、`sync_runs`、`evidence_items`、`evidence_links`、`ai_runs`、`review_shares`，迁移见 [`supabase/migrations/`](supabase/migrations/)。

## 安全与隐私边界

- 只支持当前用户拥有的**公开**仓库；导入和每次同步都在服务端重新核验。
- OAuth Token、GitHub Token、DeepSeek 密钥只在服务端使用，不进入浏览器或日志。
- 所有写操作同时校验项目所有权与用户身份，并由数据库 RLS 兜底。
- AI 只接收证据元数据（标题经脱敏），证据标题被视为不可信输入；引用不存在的证据即判失败、不入库。
- 生产环境的 AI 调用仅对白名单 GitHub 账号开放，同一项目 60 秒内最多调用一次。
- 分享链接为 32 字节随机令牌，数据库只保存其哈希；快照按白名单字段生成，不包含原始数据、AI 输入或提示词。

## 本地运行

环境要求：Node.js 22、npm 10+，以及一个配置了 GitHub OAuth 的 Supabase 项目。

```bash
git clone https://github.com/YYJ0226/project-time-machine.git
cd project-time-machine
npm ci
cp .env.example .env.local   # 填写 Supabase 地址与 Key，按需填写 GITHUB_TOKEN、DEEPSEEK_API_KEY
npm run dev
```

浏览器打开 <http://localhost:3000>。Supabase、GitHub OAuth 与数据库迁移的配置步骤见 [docs/setup-supabase.md](docs/setup-supabase.md)；未配置 DeepSeek 密钥时，其余功能照常可用，页面会明确提示无法生成 AI 草稿。

常用检查：

```bash
npm run lint        # ESLint
npm run test        # Vitest 单元测试
npm run build       # 生产构建
npm run test:http   # 隔离的生产 HTTP 回归
```

## 实验：用它记录它自己

本项目全程用 Issue → 分支 → Pull Request → CI 的方式开发，并把自己导入平台作为验证案例：

- 2026-10-16 10:25 至 10-17，共 48 次提交、11 个 Issue、9 个 Pull Request、37 次 GitHub Actions 运行（其中 2 次真实失败，已修复）。
- 首次同步收回 27 条证据，并确认“需求 #3 → PR #4 → CI”这条链；线上验收时证据增长到 63 条。
- 自用过程中发现并记录了真实问题：AI 草稿基于 37 条旧证据，称 PR #9 未合并，而当前证据显示已合并（[Issue #16](https://github.com/YYJ0226/project-time-machine/issues/16)），因此加入了“历史 AI 版本”提醒；退出登录后首页缺少登录入口（[Issue #18](https://github.com/YYJ0226/project-time-machine/issues/18)），已修复上线。

各阶段的验收记录见下方文档索引。

## 演示视频

《开发的来路》：5 分钟、1080p、无旁白字幕片，按“动机 → 技术路线 → 实验 → 边界”展开，以本项目自身为案例。影片由代码逐帧绘制，工程在 [`video-vibe/`](video-vibe/README.md)，方法来自 [vibe-knowledge-film](https://github.com/HeyChengC/vibe-knowledge-film)。

成片、音轨与字体体积较大，且背景音乐的公开传播授权未核实，因此**不提交到仓库**；可按 [video-vibe/README.md](video-vibe/README.md) 在本地复现渲染。分镜与验收见 [docs/vibe-full-film-storyboard.md](docs/vibe-full-film-storyboard.md)、[docs/vibe-full-film-acceptance.md](docs/vibe-full-film-acceptance.md)。

## 局限与后续方向

- **AI 泳道只记录平台自己的 DeepSeek 调用**，看不到学生在其他工具中的 AI 使用。
- **不能证明代码由谁编写**，只整理公开仓库中已有的事实。
- 关联规则只认 `#编号`、分支名和 SHA；不写引用的提交无法自动关联。规则中的置信度是固定常量，不是实测准确率。
- 每次同步只取最近 100 条，暂不支持私有仓库。
- 时间线回放只浏览已采集证据，不恢复历史代码或运行环境。
- 尚未经过本项目以外的真实用户（同学、老师）使用验证。

仍未关闭的事项：[Issue #17](https://github.com/YYJ0226/project-time-machine/issues/17)（退出后重新登录的会话稳定性，需在无并发操作条件下复核）；手机端与其他网络环境验收按计划延期；线上环境未配置 DeepSeek 密钥。

## 项目结构

```text
src/app/            页面与 Server Actions（工作台、时间线、审稿交付、教师页、登录）
src/lib/            核心逻辑：GitHub 拉取、证据归一化、关联规则、时间线、AI、交付快照
src/components/     界面组件
supabase/migrations 数据库表与 RLS 策略
scripts/            HTTP 回归、数据库权限检查、发布配置检查、课程资料准备
docs/               产品、架构、各阶段验收记录
video-vibe/         演示影片工程（Canvas 逐帧渲染）
```

## 文档索引

- [产品简述](docs/product-brief.md) · [技术架构](docs/architecture.md) · [阶段路线图](docs/roadmap.md) · [证据模型](docs/evidence-model.md)
- [Supabase 与 GitHub 登录配置](docs/setup-supabase.md) · [Vercel 发布与回滚](docs/deploy-vercel.md) · [安全检查](docs/security.md)
- 阶段验收：[阶段三](docs/phase-3-acceptance.md) · [阶段四](docs/phase-4-acceptance.md) · [阶段五](docs/phase-5-acceptance.md) · [阶段六 A](docs/phase-6a-acceptance.md) · [阶段六 B](docs/phase-6b-acceptance.md)
- 演示：[课程演示讲稿](docs/demo-script.md) · [录屏检查表](docs/recording-checklist.md) · [五分钟影片分镜](docs/vibe-full-film-storyboard.md) · [影片验收记录](docs/vibe-full-film-acceptance.md)

## 开发约定

- 每个功能先建 Issue，再通过分支和 Pull Request 关联需求与实现；`main` 始终保持可构建。
- 提交信息使用 `feat:`、`fix:`、`docs:`、`test:`、`chore:` 等前缀，并引用对应 Issue。
- 不提交密钥、访问令牌、私有仓库内容或含真实输入的完整 AI 请求。

## License

本项目为课程学习与展示作品，暂未指定开源许可证。
