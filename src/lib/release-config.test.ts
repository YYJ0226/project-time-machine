import { describe, expect, it } from "vitest";
import {
  checkReleaseEnvironment,
  mayGenerateAI,
  publicOrigin,
} from "./release-config";
import { callbackOrigin, safeNextPath } from "./auth-redirect";
const ready = {
  APP_ORIGIN: "https://ptm.example.com",
  NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_testpublickey",
};
describe("release checks", () => {
  it("allows evidence-only production without requiring an AI subscription", () => {
    expect(
      checkReleaseEnvironment(ready).filter(
        (issue) => issue.severity === "error",
      ),
    ).toEqual([]);
    expect(checkReleaseEnvironment(ready).map((issue) => issue.code)).toContain(
      "ai_disabled",
    );
  });
  it.each([
    "http://example.com",
    "https://user:pass@example.com",
    "https://example.com/app",
    "https://example.com/?token=x",
    "https://example.com/#x",
    "https://localhost",
    "https://example.com:8443",
    "https://*.vercel.app",
  ])("rejects an unsafe canonical origin %s", (value) =>
    expect(publicOrigin(value)).toBeNull(),
  );
  it("detects exposed keys and unnecessary maintenance credentials without printing their values", () => {
    const secret = "sk-" + "a".repeat(32);
    const issues = checkReleaseEnvironment({
      ...ready,
      NEXT_PUBLIC_ANYTHING: secret,
      HTTPS_PROXY: "http://127.0.0.1:8000",
      SUPABASE_DB_PASSWORD: "private-password",
    });
    expect(issues.filter((issue) => issue.severity === "error")).toHaveLength(
      3,
    );
    expect(JSON.stringify(issues)).not.toMatch(/private-password|sk-aaa|8000/);
  });
  it("does not accept a Supabase server secret as a publishable key", () => {
    expect(
      checkReleaseEnvironment({
        ...ready,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_private",
      }).some((issue) => issue.code === "public_key"),
    ).toBe(true);
  });
  it("requires an exact production AI allowlist and matches usernames without case sensitivity", () => {
    const env = {
      NODE_ENV: "production",
      AI_ALLOWED_GITHUB_USERS: "student, Another-User",
    };
    expect(mayGenerateAI("STUDENT", env)).toBe(true);
    expect(mayGenerateAI("other", env)).toBe(false);
    expect(mayGenerateAI(undefined, env)).toBe(false);
    expect(mayGenerateAI("student", { NODE_ENV: "production" })).toBe(false);
    expect(
      mayGenerateAI("student", { ...env, AI_ALLOWED_GITHUB_USERS: "*" }),
    ).toBe(false);
    expect(mayGenerateAI("student", { NODE_ENV: "development" })).toBe(true);
    expect(
      checkReleaseEnvironment({
        ...ready,
        DEEPSEEK_API_KEY: "sk-" + "x".repeat(32),
      }).some((issue) => issue.code === "ai_allowlist"),
    ).toBe(true);
  });
});
describe("OAuth redirect hardening", () => {
  it.each([
    "//evil.com",
    "/\\evil.com",
    "/app\nInjected",
    "https://evil.com",
    "/auth/callback",
    "/app/../../outside",
  ])("rejects unsafe next path %s", (value) =>
    expect(safeNextPath(value)).toBe("/app"),
  );
  it("preserves a safe internal workspace target", () =>
    expect(safeNextPath("/app/projects/demo?view=1#node")).toBe(
      "/app/projects/demo?view=1#node",
    ));
  it("uses a configured production origin, not request or forwarded hosts", () => {
    expect(
      callbackOrigin("http://untrusted.invalid/auth/callback", {
        ...ready,
        NODE_ENV: "production",
      }),
    ).toBe(ready.APP_ORIGIN);
    expect(
      callbackOrigin("http://untrusted.invalid/auth/callback", {
        NODE_ENV: "production",
      }),
    ).toBeNull();
    expect(
      callbackOrigin("http://localhost:3000/auth/callback", {
        NODE_ENV: "development",
      }),
    ).toBe("http://localhost:3000");
  });
});
