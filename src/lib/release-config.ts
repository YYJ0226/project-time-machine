export type ReleaseIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
};
type Environment = Record<string, string | undefined>;

export function publicOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      url.port ||
      !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9-]+$/i.test(
        url.hostname,
      ) ||
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function checkReleaseEnvironment(env: Environment): ReleaseIssue[] {
  const issues: ReleaseIssue[] = [];
  const add = (
    severity: ReleaseIssue["severity"],
    code: string,
    message: string,
  ) => issues.push({ severity, code, message });
  if (!publicOrigin(env.APP_ORIGIN))
    add(
      "error",
      "app_origin",
      "APP_ORIGIN 必须是正式 HTTPS 站点的根地址，不带路径、参数或通配符。",
    );
  if (!publicOrigin(env.NEXT_PUBLIC_SUPABASE_URL))
    add(
      "error",
      "supabase_url",
      "NEXT_PUBLIC_SUPABASE_URL 必须是 Supabase 的 HTTPS 根地址。",
    );
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";
  if (!/^sb_publishable_[A-Za-z0-9_-]{10,}$/.test(key))
    add(
      "error",
      "public_key",
      "请使用 Supabase Publishable Key，不能使用 Secret／Service Role Key。",
    );
  for (const [name, value] of Object.entries(env)) {
    if (
      name.startsWith("NEXT_PUBLIC_") &&
      value &&
      (/(?:SECRET|PASSWORD|PRIVATE|SERVICE_ROLE)|(?:DEEPSEEK|GITHUB).*(?:KEY|TOKEN)/i.test(
        name,
      ) ||
        /\b(?:sk-|sb_secret_|gh[pousr]_|github_pat_)/.test(value))
    )
      add(
        "error",
        "public_secret",
        `浏览器公开变量 ${name} 疑似包含服务端凭据，请删除并更换已暴露凭据。`,
      );
  }
  for (const name of [
    "HTTPS_PROXY",
    "HTTP_PROXY",
    "https_proxy",
    "http_proxy",
    "SUPABASE_DB_PASSWORD",
    "GITHUB_OAUTH_CLIENT_SECRET",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]) {
    if (env[name])
      add(
        "error",
        "unneeded_secret",
        `生产网页不应配置 ${name}；本机代理及维护凭据请留在本地。`,
      );
  }
  if (!env.DEEPSEEK_API_KEY?.trim())
    add(
      "warning",
      "ai_disabled",
      "未配置 DeepSeek；证据、分享与导出仍可用，不能生成新 AI 草稿。",
    );
  else if (!/^sk-[A-Za-z0-9_-]{16,}$/.test(env.DEEPSEEK_API_KEY.trim()))
    add("error", "ai_key", "DEEPSEEK_API_KEY 格式异常，请核对服务商配置。");
  if (
    env.DEEPSEEK_API_KEY?.trim() &&
    !validAIAllowlist(env.AI_ALLOWED_GITHUB_USERS)
  )
    add(
      "error",
      "ai_allowlist",
      "生产 AI 调用必须设置 AI_ALLOWED_GITHUB_USERS 为允许使用的 GitHub 用户名，用逗号分隔，不接受通配符。",
    );
  if (
    env.DEEPSEEK_MODEL &&
    !["deepseek-flash", "deepseek-v4-pro"].includes(env.DEEPSEEK_MODEL.trim())
  )
    add("error", "ai_model", "DEEPSEEK_MODEL 不在当前支持范围。");
  if (!env.GITHUB_TOKEN?.trim())
    add(
      "warning",
      "github_quota",
      "未配置 GitHub 只读令牌，公开接口额度较低；演示前先同步证据。",
    );
  return issues;
}

export function validAIAllowlist(value: string | undefined) {
  return (
    Boolean(value?.trim()) &&
    value!
      .split(",")
      .every((name) => /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(name.trim()))
  );
}
export function mayGenerateAI(login: string | undefined, env: Environment) {
  if (!env.AI_ALLOWED_GITHUB_USERS?.trim())
    return env.NODE_ENV !== "production";
  return (
    validAIAllowlist(env.AI_ALLOWED_GITHUB_USERS) &&
    Boolean(login) &&
    env.AI_ALLOWED_GITHUB_USERS.split(",").some(
      (name) => name.trim().toLowerCase() === login!.toLowerCase(),
    )
  );
}
