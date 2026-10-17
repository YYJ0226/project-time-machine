# 发布安全检查

核对日期：2026-10-17。这里只记录实际检查及局限，不作“无漏洞”保证。

## 本阶段加固

- 授权用户名仅来自 `getUser` 返回的 GitHub OAuth identity，不再使用可自行修改的 `user_metadata`。否则用户可能伪造用户名绕过仓库所有权检查或 AI 白名单。已只读确认当前账号具备所需 identity 字段，未修改身份数据。[Supabase 对 user metadata 的授权警告](https://supabase.com/docs/guides/database/postgres/row-level-security#authjwt)。

- 生产 OAuth 最终地址来自明确配置的 `APP_ORIGIN`，不再直接信任 `x-forwarded-host`；下一跳限制到 `/app` 内部路径，拒绝协议相对地址、反斜线和控制字符。缺少生产根地址时失败关闭。
- GitHub 单次 Fetch 15 秒超时；身份服务异常转回可恢复的登录提示。公开探针和教师页不依赖 Cookie 刷新，跳过刷新不等于获得私人项目权限，私人操作仍用 `getUser` 和 RLS 验证。
- 生产 AI 使用者必须在精确的 GitHub 用户名白名单中。无白名单时拒绝新调用；原有证据、已确认文字、分享和导出仍可用。项目级调用间隔与并发约束继续有效。
- 全局禁用框架标识响应头，设置 `nosniff`、禁止被嵌套、Referrer 与摄像头／麦克风／位置权限策略；CSP 仅限制 frame、object 与 base，不声称已实现完整的脚本 nonce 策略。
- 私人路由与认证路由禁止索引；教师页继续使用 no-store、no-referrer、随机能力令牌与可撤销快照。索引控制不是访问控制，任何持有能力链接的人仍能读取其内容。
- 配置门禁拒绝浏览器公开变量中的常见服务密钥形态、本机代理及不需要的维护凭据；不打印变量值。它不是全面秘密扫描器或在线连通性检测。

## 依赖审计

本次 `npm audit --omit=dev` 运行依赖树为 0 项告警。全依赖审计仍有 5 个 high 节点，来自同一开发工具依赖链：

```text
eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces@3.0.3
```

对应 [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)：递归处理深层嵌套模式可耗尽调用栈。本次核对的官方公告将 `<=3.0.3` 列为受影响，尚无已发布修复版本。

风险处理：只对可信的本项目配置运行 lint，不把用户输入送给构建工具的 glob 解析器；保留已验证的 Next 16 工具链，等待上游兼容修复。审计建议的 `eslint-config-next@14.2.35` 是跨大版本降级，不能直接执行 `npm audit fix --force`。这不是消除了该开发依赖风险，也不是申请忽略所有未来告警。

CI 对运行依赖 high／critical 设置失败门禁；开发依赖告警在此单独记录，下次正式发布前重新核对。依赖审计只是风险筛查，不能替代代码审阅、权限测试和线上验证。

## 本地测试的边界

`npm run test:http` 使用 `.next-smoke`、临时端口和本进程合成服务；清空继承的应用凭据，覆盖本地 dotenv 变量，不对真实 Supabase / GitHub / DeepSeek 发起业务请求。构建阶段字体下载可能使用正常网络和本机代理。测试结束会停止它创建的服务，不停止 3000 端口的开发服务。

HTTP 回归验证真实 Next 生产响应和页面输出，不是浏览器端到端测试，不验证 hydration、键盘、屏幕阅读器或真实数据库 RLS。前阶段手工界面验收与 `supabase/tests/delivery-security.sql` 分别负责这些不同层次，不能互相替代。

尚需在正式部署时核对 OAuth 白名单、托管环境、HTTPS、域名、云端数据库策略及跨设备无登录读取。曾在聊天中出现的密钥应在服务商处更换；不要仅因密钥未进入 Git 就视为没有暴露。
