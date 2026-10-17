import { publicOrigin } from "./release-config";

export function safeNextPath(value: string | null) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020\u007f]/.test(value)
  )
    return "/app";
  // The return target is deliberately restricted to this application's workspace.
  try {
    const url = new URL(value, "https://local.invalid");
    return url.origin === "https://local.invalid" &&
      (url.pathname === "/app" || url.pathname.startsWith("/app/"))
      ? `${url.pathname}${url.search}${url.hash}`
      : "/app";
  } catch {
    return "/app";
  }
}
export function callbackOrigin(
  requestUrl: string,
  env: { APP_ORIGIN?: string; NODE_ENV?: string },
) {
  if (env.NODE_ENV === "production") return publicOrigin(env.APP_ORIGIN);
  return publicOrigin(env.APP_ORIGIN) ?? new URL(requestUrl).origin;
}
