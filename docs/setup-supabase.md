# Supabase 与 GitHub 登录配置

阶段二的代码可以在没有云端凭据时正常构建，并显示配置提示。要实际完成 GitHub 登录和项目持久化，需要进行一次 Supabase 与 GitHub OAuth 配置。

## 1. 创建 Supabase 项目

在 [Supabase Dashboard](https://supabase.com/dashboard) 创建一个项目，然后从项目的 Connect 或 API 设置中取得：

- Project URL；
- Publishable key。

不要把 Secret key、Service Role key 或数据库密码提交到 Git。

## 2. 创建数据库表

打开 Supabase SQL Editor，按顺序执行以下迁移文件中的 SQL：

```text
supabase/migrations/20261016000100_create_projects.sql
supabase/migrations/20261016000200_create_evidence_graph.sql
```

迁移会创建项目、同步批次、证据和证据关系表，并配置唯一约束、索引与 Row Level Security 策略。登录用户只能读写自己的项目数据。

## 3. 创建 GitHub OAuth App

在 GitHub 的 Settings → Developer settings → OAuth Apps 中创建应用：

| 字段 | 本地开发值 |
| --- | --- |
| Application name | Project Time Machine Dev |
| Homepage URL | `http://localhost:3000` |
| Authorization callback URL | `https://<project-ref>.supabase.co/auth/v1/callback` |

回调地址必须使用 Supabase Authentication → Sign In / Providers → GitHub 页面显示的 Callback URL，而不是应用自己的 `/auth/callback`。

创建后妥善保存 Client ID 和 Client Secret。不要把它们写进本仓库。

## 4. 启用 Supabase GitHub Provider

在 Supabase Dashboard 中：

1. 打开 Authentication → Sign In / Providers → GitHub；
2. 启用 GitHub Provider；
3. 填入 GitHub OAuth App 的 Client ID 和 Client Secret；
4. 保存。

然后在 Authentication → URL Configuration 中设置：

- Site URL：`http://localhost:3000`
- Redirect URLs：添加 `http://localhost:3000/auth/callback`

部署时再补充正式域名的回调地址，不要删除本地地址。

## 5. 配置本地环境变量

复制示例文件：

```powershell
Copy-Item .env.example .env.local
```

填写两个公开配置项：

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

阶段三同步公开 GitHub 证据时，建议再配置一个只读 Token，避免未认证 API 的低请求额度：

```dotenv
GITHUB_TOKEN=<fine-grained-personal-access-token>
```

该变量只能用于服务端，不要添加 `NEXT_PUBLIC_` 前缀。Fine-grained Token 只选择需要演示的公开仓库，并将 `Actions`、`Contents`、`Issues`、`Pull requests` 设为 Read-only；不要授予写入、管理或无关私有仓库权限，也不要把真实 Token 提交到 Git。GitHub 的端点权限表是最终依据。

重启开发服务器：

```bash
npm run dev
```

访问 `http://localhost:3000/login`，点击“使用 GitHub 继续”。

## 6. 验收清单

- [ ] GitHub 授权后能返回 `/app`；
- [ ] 页面显示当前账号自己拥有的公开仓库；
- [ ] 私有仓库和协作仓库不在列表中；
- [ ] 点击“导入项目”后，右侧出现项目记录；
- [ ] 刷新页面后项目记录仍然存在；
- [ ] Supabase 中不能跨用户读取或修改项目。

## 当前权限设计

GitHub OAuth 只用来核验用户身份。仓库列表和仓库详情来自 GitHub 的公开 REST API，因此当前阶段：

- 不请求 `repo` 私有仓库权限；
- 不保存 GitHub provider token；
- 不读取或修改 GitHub 仓库内容；
- GitHub 公共 API 有未认证请求额度限制，后续同步阶段会单独设计安全的授权策略。

参考：[Supabase GitHub 登录](https://supabase.com/docs/guides/auth/social-login/auth-github)、[Supabase Next.js SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client)、[GitHub REST API](https://docs.github.com/en/rest/repos/repos)。
