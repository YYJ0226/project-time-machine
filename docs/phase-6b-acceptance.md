# 阶段六检查点 B：线上部署与验收记录

日期：2026-10-17（Asia/Shanghai）。状态：已发布基础站点，真实生产业务验收尚未完成；不等于阶段六整体完成。

## 部署身份与版本

| 项目                 | 已核对的结果                                                                           |
| -------------------- | -------------------------------------------------------------------------------------- |
| 正式公开入口         | https://project-time-machine.vercel.app                                                |
| Vercel 空间 / 项目   | `yujieyao0226-1050 / project-time-machine`，Hobby                                      |
| 项目 ID              | `prj_s7qLuvGclqnrmP1wS24GPHQwTfEn`                                                     |
| 生产部署 ID          | `dpl_FocMDCqW7RwvTaSNyV2nrc663TeS`                                                     |
| 部署详情             | https://vercel.com/yujieyao0226-1050/project-time-machine/FocMDCqW7RwvTaSNyV2nrc663TeS |
| 源码提交             | `a8808b4e36facb7fed5ee4293336fa5d62eb4a4c`，分支 `chore/vercel-release`                |
| 状态 / 框架 / 运行时 | READY / Next.js 16.4.2 / Node.js 22.x                                                  |
| 构建命令             | `npm ci` → `npm run build`                                                             |
| 构建日志耗时         | 21 秒（`Build Completed in /vercel/output [21s]`，不含全部排队与发布耗时）             |

通过部署 API 核对 `githubCommitSha`、分支、目标与 Node 版本。以已验收的阶段 6A `main` 为基础，仅新增部署配置并收紧 Node 版本范围。此处记录的是手动 CLI 源码部署，不是 Git 集成自动发布；后续文档提交不意味着该提交自动上线。

采用 `--prod --skip-domain` 创建生产构建，检查回调目标后 promote 同一部署，没有以 Preview 测试替代 Production。首次 CLI 输出的长团队别名仍需 Vercel 登录；promote 后用 alias 列表与匿名请求确认短域名可用，因此最终仅将短域名作为 `APP_ORIGIN`。未关闭 Vercel Authentication 或 Git fork protection。

## 配置与凭据边界

- 仅在 Production 添加现有 Supabase URL、Publishable Key、`APP_ORIGIN` 与 `AI_ALLOWED_GITHUB_USERS`；预览环境没有获配真实业务配置。
- 未上传 DeepSeek 密钥、本机代理、数据库维护密码、OAuth Client Secret、Service Role Key 或 gh 登录令牌。
- 线上 AI 生成暂不可用。数据库中的既有草稿保留，不能把“已保存草稿可读取”说成“生产 AI 已调用成功”。
- `.vercelignore` 显式排除 `.env*`、`.vercel`、`.git`、`node_modules`、`.next*` 与 Supabase CLI 本地缓存。上传 dry-run：105 个源码文件，禁入文件 0 个。
- CLI link 自动追加短期本地 OIDC 配置，原有 9 项业务配置名仍在；未执行覆盖开发配置的 `env pull`，未把本地环境文件上传。
- 测试中 CLI 自动创建的保护绕过凭据已撤销，未写入仓库；其验证结果不能作为匿名访问证明。正式短域名检查使用无 Cookie、无绕过凭据的请求。
- Supabase 仍为已有项目，无新数据库、无迁移、无付费资源开通。
- 本人已报告完成短域名 Site URL 与精确 `/auth/callback` 白名单设置，并确认 Edge 的生产 GitHub 登录成功。此前内置浏览器不成功的原因尚未定位，不将其推断为 Cookie、PKCE 或 OAuth 配置故障。

## 已完成的检查

本轮目标链路：正式站点 → GitHub OAuth → 现有项目 → 时间线与交付 → 教师匿名访问。目前自动检查仅覆盖下列公开入口和权限边界，不覆盖登录后操作。

| 检查                      | 结果与证据                                                                                                 |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 本地 lint                 | 通过                                                                                                       |
| 单元测试                  | 12 个文件、88 项通过                                                                                       |
| 云端构建                  | 安装、TypeScript、14 个页面生成及部署通过                                                                  |
| 正式首页                  | 匿名 200，正文包含“让一段开发历史，变成可核验的项目证据。”                                                 |
| `/login`                  | 匿名 200，正文包含 GitHub 登录入口                                                                         |
| 生产 GitHub 登录          | 本人确认 Edge 登录成功；不是本轮自动浏览器测试结果                                                         |
| `/api/health`             | 匿名 200，`status: ok`，`Cache-Control: no-store`                                                          |
| `/api/ready`              | 匿名 200，`status: configured`，不泄露配置详情                                                             |
| 无 Cookie `/app`          | Next.js 流式响应中返回 `NEXT_REDIRECT` 至 `/login?error=session`，无项目数据；不能只凭 HTTP 200 判断已登录 |
| 无 Cookie 报告下载        | 307 至 `/login?error=session`，未返回报告                                                                  |
| 无授权码 `/auth/callback` | 307 至正式短域名的 `/auth/auth-code-error`；这是空回调边界检查，不是成功 OAuth 证明                        |
| 非法教师 token            | 显示“此审阅链接不可用”，private / no-store、no-referrer、noindex                                           |
| 安全响应头                | nosniff、DENY、no-referrer 生效；受限页面禁止索引                                                          |

本机直连部署域名曾超时，经已有本地代理请求成功。代理仅用于本机验收，不在 Vercel 生产变量中；未验证无代理校园网络和手机网络可达性。

浏览器自动创建／绑定标签连续两次超时，因此没有取得本轮登录后浏览器证据或线上页面截图。不能将旧的 localhost 截图用作线上验证。保留正式登录页交由本人操作，不复制会话 Cookie 或代取验证码。

## 业务验收清单

- [x] 本人从正式短域名 GitHub 登录（Edge 成功）。
- [ ] 刷新页面后的会话保持与退出后权限回收。
- [ ] 已有项目可读取；手动同步、关联审阅和时间线回放正常。
- [ ] 已有草稿审阅及两种 Markdown 下载正常。
- [ ] 创建一个短期教师快照，在另一设备／无登录浏览器访问，再撤销并验证不可用。
- [ ] 如需线上 AI：本人轮换旧密钥、在 Production 设置新密钥，重新部署后只进行一次受控调用。
- [ ] 实际录屏、成片和正式版本发布（检查点 C，未开始）。

## 运行观察与已知限制

Hobby 的 1 小时运行日志查询被平台拒绝，提示超出当前方案保留范围。改用 10 分钟窗口（01:00:45–01:10:45 UTC），返回 2 条 error：均为 01:09:14–15 对 `/app` 和报告下载进行无 Cookie 权限检查时的 `AuthSessionMissingError`（400）。与本轮匿名探针一致，没有据此发现生产登录失败；但不能声称日志“零错误”或完整业务已验证。

尚未建立外部日志 Drain、错误追踪或持续可用性告警；一次检查不是持续监控。当前认证层会把预期的无会话访问记为 error，存在日志噪声，后续可单独调整级别，不在本次部署中修改认证行为。

安装审计仍报告 5 项开发依赖高危项，沿用[安全记录](security.md)中的未修复 `braces` 告警；没有运行 `audit fix --force` 或为隐藏告警降级框架。线上业务调用、网络稳定性及最终演示仍需单独验收。

关联需求：[Issue #14](https://github.com/YYJ0226/project-time-machine/issues/14)。下一步仅完成本检查点剩余验收，验收后暂停，不直接进入视频录制。
