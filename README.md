# Project Time Machine

> 面向 AI 辅助课程项目的全过程留痕、证据关联与可视化审阅平台。

[![CI](https://github.com/YYJ0226/project-time-machine/actions/workflows/ci.yml/badge.svg)](https://github.com/YYJ0226/project-time-machine/actions/workflows/ci.yml)

Project Time Machine 不只是“项目做完后的展示页”。它希望把一个课程项目从需求提出、开发决策、代码提交、测试验证到最终交付的过程，组织成一条可回看、可核验、可讲述的证据时间线。

学生可以用它整理自己的开发过程，老师则可以通过只读链接快速理解“做了什么、为什么这样做、证据在哪里”。未来的 AI 能力只负责归纳和建议，不替用户篡改原始记录；AI 生成内容也会单独留痕。

## 当前进度

项目采用分阶段开发，每个阶段结束后先验收，再进入下一阶段。

- [x] 阶段一：工程与产品基线
  - Next.js + TypeScript + Tailwind CSS 工程
  - 产品定位、架构边界、阶段路线图
  - “软件项目观测站”风格的响应式首页骨架
  - Issue / Pull Request 模板
  - GitHub Actions 持续集成
- [x] 阶段二：GitHub 登录与公开仓库导入（云端联调通过，等待用户验收）
  - Supabase SSR Cookie 会话与 GitHub OAuth 回调
  - 当前用户公开仓库浏览与服务端所有权核验
  - 项目导入、RLS 数据隔离与持久化
- [ ] 阶段三：需求、提交、测试证据同步与关联（代码已完成，等待云端配置联调）
  - Issue、Commit、Pull Request 与 GitHub Actions 手动同步
  - 统一证据模型、同步批次和 RLS 数据隔离
  - 基于编号引用、分支名和 SHA 的关联建议
  - 人工确认或拒绝关联建议
- [ ] 阶段四：可交互时间线与项目回放
- [ ] 阶段五：AI 辅助归纳、教师审阅与导出
- [ ] 阶段六：质量加固、部署与演示视频

当前首页中的项目数据均为界面示例，不代表功能已经接入。

2026-10-16 联调记录：GitHub 登录已进入真实工作台，当前用户公开仓库可读取；
课程仓库 `YYJ0226/project-time-machine` 已导入，服务重启及页面刷新后仍然保留。
本地网络需要代理时，请按[配置说明](docs/setup-supabase.md#本地网络需要代理时)设置服务端代理。
阶段三证据同步与关联仍需单独联调验收。

## 核心角色

### 学生

- 使用 GitHub 登录并导入自己的公开仓库。
- 将需求、Issue、Commit、Pull Request、测试结果和 AI 使用记录串联起来。
- 确认 AI 建议后再写入项目叙事。
- 导出 Markdown 课程报告和视频讲解脚本。

### 老师

- 无需注册，通过只读分享链接查看项目。
- 沿时间线浏览关键决策、实现与验证结果。
- 点击事件回到真实 GitHub 证据。
- 区分原始事实、学生说明和 AI 生成摘要。

## 技术基线

- Next.js 16（App Router）
- React 19
- TypeScript
- Tailwind CSS 4
- ESLint
- Node.js 22
- GitHub Actions

当前已接入 Supabase、GitHub OAuth / REST API，服务端可选代理使用 Undici。
后续阶段计划引入 DeepSeek 的 OpenAI 兼容 API，具体依赖在对应阶段确认后加入。

## 本地运行

环境要求：Node.js 22、npm 10 或更高版本。

```bash
git clone https://github.com/YYJ0226/project-time-machine.git
cd project-time-machine
npm ci
npm run dev
```

浏览器访问 [http://localhost:3000](http://localhost:3000)。

提交前建议执行：

```bash
npm run lint
npm run test
npm run build
```

## 文档索引

- [产品简述](docs/product-brief.md)
- [技术架构](docs/architecture.md)
- [阶段路线图](docs/roadmap.md)
- [视觉方向](docs/visual-direction.md)
- [Supabase 与 GitHub 登录配置](docs/setup-supabase.md)
- [项目证据模型](docs/evidence-model.md)

## Git 协作约定

- `main` 始终保持可构建。
- 一次提交只表达一个清晰意图，使用 `feat:`、`fix:`、`docs:`、`chore:`、`test:` 等前缀。
- 功能开发先建 Issue，再通过分支和 Pull Request 关联需求与实现。
- Pull Request 合并前至少通过 lint 和 build。
- 不提交密钥、访问令牌、私有仓库内容或完整 AI 提示词。

## 隐私边界

首个可用版本仅支持导入当前用户拥有的公开 GitHub 仓库。教师分享页不展示 GitHub Token、环境变量、完整 AI 提示词或其他私密内容。

## License

本项目当前用于课程学习与展示，许可证将在发布前确定。
