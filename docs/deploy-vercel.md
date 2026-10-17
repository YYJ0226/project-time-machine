# Vercel 发布手册

状态：用户已选择 Vercel；本检查点仅完成代码与发布准备。还没有创建正式部署，也没有可交付的线上 URL。

## 账号与仓库

优先通过已接入的 Vercel 能力协同管理部署；也可由本人在 Vercel 控制台完成。实际账号和目标项目仍需确认。第三方账号登录、GitHub 仓库访问授权和服务商条款由本人确认，不代填新密码。

1. 等待本阶段 PR 验收合并到 `main`。
2. 登录 Vercel，导入 `YYJ0226/project-time-machine`。GitHub App 如可选权限范围，仅授权该仓库。
3. Framework Preset 选择 Next.js；Root Directory 是仓库根目录；保留 `npm ci` / `npm run build` 默认流程。使用满足项目要求的 Node.js 22 或更新兼容版本，不配置静态导出。
4. 先配置下方必要变量，部署获得正式域名后，再把 `APP_ORIGIN` 设为该确切域名并重新部署。首轮尚无正式域名时 `/api/ready` 返回 503 属于预期；不要在这一步尝试 OAuth 登录。

参考：[Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)、[函数执行时限](https://vercel.com/docs/functions/configuring-functions/duration)。实际可用时限和费用以账号当时方案为准。

## 生产环境变量白名单

| 变量 | 是否必需 | 来源与边界 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 是 | 现有 Supabase 项目 HTTPS 根地址 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 是 | Publishable Key，可进入浏览器；禁止误填 Secret／Service Role |
| `APP_ORIGIN` | 是 | 最终 `https://自己的站点.vercel.app`，不带路径、参数或通配符 |
| `DEEPSEEK_API_KEY` | AI 可选 | 建议先更换曾出现在聊天中的旧密钥，再由本人配置新密钥 |
| `DEEPSEEK_MODEL` | AI 可选 | 默认 `deepseek-flash` |
| `AI_ALLOWED_GITHUB_USERS` | 开启生产 AI 时必需 | 本课程个人站点填自己的 GitHub 用户名，如 `YYJ0226`；支持逗号分隔，不允许 `*` |
| `GITHUB_TOKEN` | 可选 | 本人创建的只读令牌；不要使用 Codex／gh 的登录令牌充当应用令牌 |

不要把整份 `.env.local` 上传到 Vercel。**不配置**本机 `HTTPS_PROXY` / `HTTP_PROXY`、数据库维护密码、GitHub OAuth Client Secret 或 Supabase Service Role Key。OAuth Client Secret 仍仅保存在 Supabase 的 GitHub Provider 中，Next.js 应用不需要它。

`NEXT_PUBLIC_` 变量会在构建时进入浏览器代码，改动后需要重新部署。服务端密钥只设置到需要的环境，避免把真实 AI 额度开放到每个 Preview。

在 Vercel 中将密钥存为 Secret、公开配置存为 Config；不要执行会覆盖现有开发配置的 `vercel env pull .env.local --yes`。需要拉取时先确认目标，并使用独立忽略文件。Production／Preview Secret 通常不能从 pull 结果中读回，不能把一次 pull 当作生产秘密的完整备份。

生产环境 AI 默认拒绝未在白名单内的账号；其他账号仍可用公开证据功能。白名单不是完整预算系统：仍应在服务商控制台设置适合自己的消费限额，并关注真实账单。

## OAuth 上线检查

1. Supabase Authentication → URL Configuration：Site URL 设置为正式站点根地址。
2. Redirect URLs 增加确切的 `https://正式域名/auth/callback`；保留本地开发需要的 localhost 回调。不要为方便配置任意域名通配符。
3. GitHub OAuth App 的 Authorization callback URL 仍为 `https://<supabase-ref>.supabase.co/auth/v1/callback`，**不是** Vercel URL。
4. 仅从已配置的正式域名发起登录。不要在未配置回调的临时 Preview 中测试，以免 PKCE Cookie 和最终站点域名不一致。
5. 平台回调不再信任 `x-forwarded-host`；生产环境缺少有效 `APP_ORIGIN` 时直接返回 503，不冒险重定向。

## 发布门禁与探针

提交前：

```bash
npm ci
npm run lint
npm run test
npm run build
npm run test:http
npm audit --omit=dev --audit-level=high
```

生产配置检查可在受控环境中执行：

```bash
node --experimental-strip-types --env-file=.env.production.local scripts/check-release-env.mjs
```

`.env.production.local` 同样被 Git 忽略；只应由本人按上述白名单填写。`npm run check:release` 默认读取 `.env.local`，本地包含代理和维护密码时会按生产规则报 FAIL，**不要为让它通过而删除正常开发配置**。检查只打印变量名及诊断，不打印值、不写文件、不发起外部请求。

- `/api/health`：200 只证明应用 HTTP 进程可响应，不访问 Supabase / GitHub / AI。
- `/api/ready`：200 只证明生产配置形状符合门禁；503 表示需要补配置。公开响应不展示具体变量、域名或密钥状态。
- 这两个探针都不证明迁移、RLS、OAuth 白名单、AI 余额或第三方服务可用。上线后必须人工走一遍真实链路。
- AI 审稿页和证据页为 Server Actions 声明 120 秒平台执行窗口；AI 上游请求仍在 75 秒主动超时。GitHub 每次请求 15 秒超时，不代表整批同步保证在 15 秒内结束。

## 线上验收与故障回退

GitHub CI 通过不等于 Vercel 已等待这些检查。当前尚未绑定 Deployment Checks。下一检查点必须按账号能力配置 Deployment Checks，或先创建不分配正式域名的 production 部署，测试后再 promote 同一份 production 构建；不要把 Preview 测试结果当作生产环境已验证。不会在此阶段写入 Vercel Token 到 GitHub Actions 或创建自动生产发布。

上线后按顺序验证：HTTPS 首页 → 健康探针 → GitHub 登录 → 已有项目 → 手动同步 → 时间线 → 草稿审阅 → 下载 → 创建短期教师快照 → 退出／无登录访问 → 撤销并刷新。真实 AI 仅在需要时调用一次，不循环测试计费。

每次发布记录 Git commit、部署 URL、部署时间和验收结论；不要记录 Cookie、能力令牌或请求正文。使用托管平台已有日志查看错误码和请求状态，不把整份日志提交仓库。

失败时保留上一份已验证部署，使用平台回滚能力恢复；本阶段没有数据库新迁移。若怀疑秘密泄露，先在服务商处更换凭据，再更新生产变量和重新部署；仅删除 Git 中的文件不能让旧凭据失效。公开分享内容有误时撤销对应链接，已下载文件无法召回。

当前尚未验证：正式 Vercel 部署、生产 OAuth、跨设备教师访问、录屏成片。以上全部需要在下一检查点逐项验收，不能用本地测试替代。
