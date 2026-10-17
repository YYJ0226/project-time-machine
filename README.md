# Project Time Machine

> 面向 AI 辅助课程项目的全过程留痕、证据关联与可视化审阅平台。

[![CI](https://github.com/YYJ0226/project-time-machine/actions/workflows/ci.yml/badge.svg)](https://github.com/YYJ0226/project-time-machine/actions/workflows/ci.yml)

Project Time Machine 不只是“项目做完后的展示页”。它希望把一个课程项目从需求提出、开发决策、代码提交、测试验证到最终交付的过程，组织成一条可回看、可核验、可讲述的证据时间线。

学生可以用它整理自己的开发过程，老师则可以通过只读链接快速理解“做了什么、为什么这样做、证据在哪里”。AI 只负责归纳和建议，不替用户篡改原始记录；AI 生成内容单独留痕，需人工确认后才能交付。

## 当前进度

项目采用分阶段开发，每个阶段结束后先验收，再进入下一阶段。

- [x] 阶段一：工程与产品基线
  - Next.js + TypeScript + Tailwind CSS 工程
  - 产品定位、架构边界、阶段路线图
  - “软件项目观测站”风格的响应式首页骨架
  - Issue / Pull Request 模板
  - GitHub Actions 持续集成
- [x] 阶段二：GitHub 登录与公开仓库导入（云端联调通过）
  - Supabase SSR Cookie 会话与 GitHub OAuth 回调
  - 当前用户公开仓库浏览与服务端所有权核验
  - 项目导入、RLS 数据隔离与持久化
- [x] 阶段三：需求、提交、测试证据同步与关联（真实仓库联调通过）
  - Issue、Commit、Pull Request 与 GitHub Actions 手动同步
  - 统一证据模型、同步批次和 RLS 数据隔离
  - 基于编号引用、分支名和 SHA 的关联建议
  - 人工确认或拒绝关联建议
  - 已确认/已忽略关系浏览与撤销审阅
  - 证据正文展开、完整采集列表与同步失败提示
- [x] 阶段四：可交互时间线与项目回放（已验收并合并）
  - 同一时间坐标下的需求、代码、验证、AI 四条泳道
  - 1×/2×/4× 缩放，类型、正文/SHA、日期与关键节点筛选
  - 事件详情、原文、已确认关系导航与事件定位链接
  - 单步/自动回放、速度和进度控制、录屏聚焦模式
  - 响应式布局、键盘首尾/前后导航及减少动态效果支持
- [x] 阶段五：AI 辅助归纳、教师审阅与导出（已验收并合并）
  - DeepSeek 真实生成摘要、缺失证据提醒与视频草稿
  - 调用账本、引用校验、人工编辑／确认／忽略
  - 有期限、可撤销、无需教师登录的固定分享快照
  - Markdown 报告与视频讲解提纲下载
  - 真实 AI 调用记录接入时间线泳道
- [ ] 阶段六：质量加固、部署与演示视频
  - [x] 检查点 A：生产回调、安全响应头、AI 额度白名单、健康探针与隔离 HTTP 回归
  - [x] 检查点 A：Vercel 发布手册、配置门禁及录屏讲稿（已验收合并）
  - [x] 检查点 B：Vercel 账号授权、生产部署和匿名 HTTP 检查
  - [x] 检查点 B：真实生产 GitHub 登录（本人在 Edge 确认成功）
  - [x] 检查点 B：线上项目读取、同步、时间线与两种下载验收
  - [x] 检查点 B：教师快照匿名访问与撤销、历史 AI 版本提醒
  - [ ] 检查点 B：手机／其他网络访问、退出后权限回收与线上审阅写入验收
  - [ ] 检查点 C：实际录屏、成片验收与正式版本发布

线上入口：[https://project-time-machine.vercel.app](https://project-time-machine.vercel.app)。
2026-10-17 已部署到个人 Vercel Hobby 项目，公开首页、登录页与健康探针可访问；
未登录工作台和下载权限限制已验证，本人已确认 Edge 生产 GitHub 登录成功。
线上已核对真实项目同步至 63 条证据、3 条已确认关系保留、65 个时间线事件（含 2 次既有 AI 调用）。
已验证筛选、回放、2× 缩放；本人确认两种 Markdown 均可下载并包含历史版本提示。
临时教师快照已用无 Cookie、无保护绕过凭据请求访问，再由本人撤销并验证不可用；测试链接不入库。
手机／其他网络访问、退出后权限回收与线上审阅写入仍待验收，不能将现有结果当作全部业务或跨设备已通过。
本次为 CLI 手动发布，尚未接通 Git 推送自动部署。线上暂未配置 DeepSeek 密钥，不能生成新 AI 草稿；本地配置不受影响。
部署版本、检查结果与剩余事项见[阶段六检查点 B 记录](docs/phase-6b-acceptance.md)。

当前首页中的项目数据均为界面示例，不代表功能已经接入。

2026-10-16 联调记录：GitHub 登录已进入真实工作台，当前用户公开仓库可读取；
课程仓库 `YYJ0226/project-time-machine` 已导入，服务重启及页面刷新后仍然保留。
本地网络需要代理时，请按[配置说明](docs/setup-supabase.md#本地网络需要代理时)设置服务端代理。
阶段三已同步 27 条真实证据（3 条需求、13 条提交、3 个 PR、8 条 CI），
确认了“需求 #3 → PR #4 → CI”及对应提交关系；重复同步保留人工决定，撤销审阅已验证。
具体操作与边界见[阶段三验收记录](docs/phase-3-acceptance.md)。数量会随仓库后续开发增加。

阶段四使用同一批真实证据，无需再次请求 GitHub 即可进入时间线。详情见[阶段四验收与演示](docs/phase-4-acceptance.md)。
AI 泳道展示真实调用元数据，回放只浏览已采集证据，不还原完整历史状态或历史代码文件。

阶段五从项目页或时间线进入“审稿与交付”。2026-10-16 已用 37 条缓存证据完成真实 DeepSeek 调用；
草稿保留为待确认，供用户核对。未确认文字不会出现在教师快照和导出中。
以上为阶段五当时记录；2026-10-17 线上已观察到本人此前确认的文字。本轮未再次确认、忽略或生成 AI 内容。
教师页已用无 Cookie 请求验证，临时测试链接已撤销；两种 Markdown 下载均已验证。
详见[阶段五配置与验收](docs/phase-5-acceptance.md)。**本地 localhost 分享链接仅当前电脑可用，公网部署属于阶段六。**

阶段六线上验收发现：旧 AI 文字使用 37 条输入，不能代表同步后的 63 条事实。
已增加生成时间、输入条数与“历史 AI 版本”提示，覆盖交付页、教师页和两种 Markdown；
保留学生已确认原文，不重新计费生成，不向公开页面暴露输入哈希。详见 [Issue #16](https://github.com/YYJ0226/project-time-machine/issues/16)。

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
DeepSeek 使用服务端 Fetch 调用；`pg` 仅用于开发时的数据库权限回归，不进入网页运行链路。

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
npm run test:http
npm audit --omit=dev --audit-level=high
```

## 文档索引

- [产品简述](docs/product-brief.md)
- [技术架构](docs/architecture.md)
- [阶段路线图](docs/roadmap.md)
- [视觉方向](docs/visual-direction.md)
- [Supabase 与 GitHub 登录配置](docs/setup-supabase.md)
- [项目证据模型](docs/evidence-model.md)
- [阶段三验收记录与演示步骤](docs/phase-3-acceptance.md)
- [阶段四时间线验收与演示步骤](docs/phase-4-acceptance.md)
- [阶段五配置、分享边界与验收步骤](docs/phase-5-acceptance.md)
- [阶段六检查点 A 验收与剩余事项](docs/phase-6a-acceptance.md)
- [阶段六检查点 B 线上部署与验收记录](docs/phase-6b-acceptance.md)
- [Vercel 发布与回滚手册](docs/deploy-vercel.md)
- [课程演示与录屏讲稿](docs/demo-script.md)
- [安全检查与已知开发依赖告警](docs/security.md)

## Git 协作约定

- `main` 始终保持可构建。
- 一次提交只表达一个清晰意图，使用 `feat:`、`fix:`、`docs:`、`chore:`、`test:` 等前缀。
- 功能开发先建 Issue，再通过分支和 Pull Request 关联需求与实现。
- Pull Request 合并前至少通过 lint 和 build。
- 不提交密钥、访问令牌、私有仓库内容或含真实输入数据的完整 AI 请求。

## 隐私边界

首个可用版本仅支持导入当前用户拥有的公开 GitHub 仓库。教师分享页不展示 GitHub Token、环境变量、完整 AI 提示词或其他私密内容。

## License

本项目当前用于课程学习与展示，许可证将在发布前确定。
