# 阶段六检查点 B：线上部署与验收记录

日期：2026-10-17（Asia/Shanghai）。状态：生产项目主链路及教师匿名分享／撤销已验证，仍有专项验收待完成；不等于阶段六整体完成。检查点 C 尚未开始。

## 部署身份与版本

| 项目                 | 已核对的结果                                                                           |
| -------------------- | -------------------------------------------------------------------------------------- |
| 正式公开入口         | https://project-time-machine.vercel.app                                                |
| Vercel 空间 / 项目   | `yujieyao0226-1050 / project-time-machine`，Hobby                                      |
| 项目 ID              | `prj_s7qLuvGclqnrmP1wS24GPHQwTfEn`                                                     |
| 生产部署 ID          | `dpl_7zMVYYAyAgPKcFzgbhaJeiBDCkup`                                                     |
| 部署详情             | https://vercel.com/yujieyao0226-1050/project-time-machine/7zMVYYAyAgPKcFzgbhaJeiBDCkup |
| 源码提交             | `7077317f8a76d0cd5dcff9551c94706859363f42`，分支 `chore/vercel-release`                |
| 状态 / 框架 / 运行时 | READY / Next.js 16.4.2 / Node.js 22.x                                                  |
| 构建命令             | `npm ci` → `npm run build`                                                             |
| 构建日志耗时         | 27 秒（`Build Completed in /vercel/output [27s]`，不含全部排队与发布耗时）             |

通过部署 API 核对 `githubCommitSha`、分支、目标与 Node 版本。以已验收的阶段 6A `main` 为基础，新增部署配置、收紧 Node 版本，并修复业务验收发现的历史 AI 版本混淆。此处记录的是手动 CLI 源码部署，不是 Git 集成自动发布；后续文档提交不意味着该提交自动上线。

前一生产基线为 `a8808b4` / `dpl_FocMDCqW7RwvTaSNyV2nrc663TeS`，构建日志 21 秒。当前表格为修复后的实际生产版本，不把文档提交冒充部署提交。

采用 `--prod --skip-domain` 创建生产构建，检查回调目标后 promote 同一部署，没有以 Preview 测试替代 Production。首次 CLI 输出的长团队别名仍需 Vercel 登录；promote 后用 alias 列表与匿名请求确认短域名可用，因此最终仅将短域名作为 `APP_ORIGIN`。未关闭 Vercel Authentication 或 Git fork protection。

## 配置与凭据边界

- 仅在 Production 添加现有 Supabase URL、Publishable Key、`APP_ORIGIN` 与 `AI_ALLOWED_GITHUB_USERS`；预览环境没有获配真实业务配置。
- 未上传 DeepSeek 密钥、本机代理、数据库维护密码、OAuth Client Secret、Service Role Key 或 gh 登录令牌。
- 线上 AI 生成暂不可用。数据库中的既有草稿保留，不能把“已保存草稿可读取”说成“生产 AI 已调用成功”。
- `.vercelignore` 显式排除 `.env*`、`.vercel`、`.git`、`node_modules`、`.next*` 与 Supabase CLI 本地缓存。首轮上传 dry-run：105 个源码文件，禁入文件 0 个；不是当前修复版重新 dry-run 的结果。
- CLI link 自动追加短期本地 OIDC 配置，原有 9 项业务配置名仍在；未执行覆盖开发配置的 `env pull`，未把本地环境文件上传。
- 测试中 CLI 自动创建的保护绕过凭据已撤销，未写入仓库；其验证结果不能作为匿名访问证明。正式短域名检查使用无 Cookie、无绕过凭据的请求。
- Supabase 仍为已有项目，无新数据库、无迁移、无付费资源开通。
- 本人已报告完成短域名 Site URL 与精确 `/auth/callback` 白名单设置，并确认 Edge 的生产 GitHub 登录成功。此前内置浏览器不成功的原因尚未定位，不将其推断为 Cookie、PKCE 或 OAuth 配置故障。

## 已完成的检查

本轮目标链路：正式站点 → GitHub OAuth → 现有项目 → 时间线与交付 → 教师匿名访问 → 撤销。公开 HTTP 权限检查、已登录 Edge 浏览器操作和本人手动验收分别注明，不混为同一种证明。

| 检查                      | 结果与证据                                                                                                 |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 本地 lint                 | 通过                                                                                                       |
| 单元测试                  | 13 个文件、99 项通过（新增 11 项历史版本、兼容性、导出与渲染测试）                                         |
| 隔离生产 HTTP 回归        | 8 项通过；独立构建与端口，不写真实业务数据                                                                 |
| GitHub CI                 | 修复提交 `7077317` 通过，运行 38990897624，54 秒；含生产依赖审计                                           |
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

首轮浏览器绑定超时，之后改为在 Edge 新建独立标签，使用本人已有登录会话成功读取真实项目；未复制 Cookie 或代取验证码。新标签读取证明了独立页面请求可用，但不等于已经完成退出／重新登录或物理跨设备验证。

## 真实项目业务验收与修复

- 项目 `YYJ0226/project-time-machine` 可读；手动同步从 37 条增加至 63 条：7 Issue、31 Commit、8 PR、17 CI。3 条已确认关系保留；未改动学生已有审阅决定。
- 时间线共 65 个事件，包含 63 条 GitHub 证据和 2 次既有 AI 调用；搜索 `deepseek-flash` 得到 2/65，回放推进到 2/2 后停止，重置恢复 65/65，2× 缩放已在实际 UI 核对。
- 真实线上截图已保存并人工查看，显示 65 个事件及 2× 缩放；没有使用 localhost 旧图冒充。截图保存在本次本地工作输出目录，未将含账户工作区画面的图片提交到公开仓库。
- 发现旧 AI 确认文字仍描述 PR #9 未合并，但其输入只有 37 条，当前事实已有 63 条。问题登记为 [Issue #16](https://github.com/YYJ0226/project-time-machine/issues/16)。
- 修复保留已确认原文，按原输入哈希与当前生成输入比对，展示生成时间、输入条数与历史／无法确认版本提示。比对只用于判断输入版本，不证明 AI 正确、事实完备或全量覆盖。输入受既有最近 60 条采样限制；哈希不公开。
- 提示同时覆盖交付预览、教师页和两种 Markdown；旧快照缺少元数据时仍可读取并提示版本无法确认。没有数据库迁移，也不重写旧快照。
- 线上交付页已显示历史版本、生成输入 37 条与当前 63 条的区分。本人在 Edge 手动下载报告和视频讲解提纲，确认两份均正常且有版本提示；浏览器下载自动化超时，未将其声称为自动下载通过。
- 本人创建 1 天有效的临时教师快照，提供链接供匿名验收。无 Cookie、无保护绕过凭据请求返回 200，显示教师只读身份、63 条证据、历史 AI 提示和生成输入 37 条，未发现同步、确认或编辑控件。
- 本人随后撤销该条链接；再次以无 Cookie 请求访问同一地址，显示“此审阅链接不可用”，不再返回时间线或摘要。该不可用页 HTTP 状态为 200，因此判断依据包含正文，不能仅看状态码。
- 教师页有效与撤销后均有 `private, no-store, max-age=0`、`no-referrer` 和 `noindex, nofollow, noarchive`。能力链接、完整响应及登录 Cookie 不入库；撤销无法召回此前下载的文件。
- 本轮无新增 AI 调用、无新增计费生成、无再次确认／忽略草稿、无关联审阅写入；仅同步公开证据，并由本人创建／撤销指定测试分享。

## 业务验收清单

- [x] 本人从正式短域名 GitHub 登录（Edge 成功）。
- [x] Edge 独立新标签读取已有项目与会话。
- [x] 手动同步、已确认关系保留、时间线筛选／回放／缩放。
- [x] 既有已确认文字预览、历史版本提示与两种 Markdown 下载（下载由本人确认）。
- [x] 本人创建短期教师快照；匿名 HTTP 读取，再由本人撤销并验证不可用。
- [ ] 退出后权限回收；未主动退出本人正在使用的会话。
- [ ] 线上关联及 AI 审阅写入；本轮未为测试擅自改动已有决定。
- [ ] 手机／另一物理设备与其他网络访问；本机匿名请求不代替此项。
- [ ] 如需线上 AI：本人轮换旧密钥、在 Production 设置新密钥，重新部署后只进行一次受控调用。
- [ ] 实际录屏、成片和正式版本发布（检查点 C，未开始）。

## 运行观察与已知限制

首轮部署的 Hobby 1 小时运行日志查询被平台拒绝，提示超出当前方案保留范围。改用 10 分钟窗口（01:00:45–01:10:45 UTC），返回 2 条 error：均为 01:09:14–15 对 `/app` 和报告下载进行无 Cookie 权限检查时的 `AuthSessionMissingError`（400）。与当时匿名探针一致，没有据此发现生产登录失败。

修复版部署另查 01:24:30–01:34:30 UTC 的 10 分钟窗口，error 查询返回 0 条。该结果仅对应此部署、此查询窗口，不覆盖后续请求，也不能声称整个站点历史零错误。用于分配域名前测试的临时 Vercel 保护绕过凭据已撤销，核对剩余数量为 0；正式短域名和教师页的匿名验收均不使用它。

尚未建立外部日志 Drain、错误追踪或持续可用性告警；一次检查不是持续监控。当前认证层会把预期的无会话访问记为 error，存在日志噪声，后续可单独调整级别，不在本次部署中修改认证行为。

安装审计仍报告 5 项开发依赖高危项，沿用[安全记录](security.md)中的未修复 `braces` 告警；没有运行 `audit fix --force` 或为隐藏告警降级框架。线上业务调用、网络稳定性及最终演示仍需单独验收。

关联需求：[Issue #14](https://github.com/YYJ0226/project-time-machine/issues/14)；修复：[Issue #16](https://github.com/YYJ0226/project-time-machine/issues/16)；本检查点工作：[PR #15](https://github.com/YYJ0226/project-time-machine/pull/15)。

本轮完成后暂停，保留未勾选事项，不直接进入视频录制，不自动合并 PR。
