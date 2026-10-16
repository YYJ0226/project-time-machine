import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { register } from "./instrumentation";

const { agent, retryAgent, setGlobalDispatcher, EnvHttpProxyAgent, RetryAgent } = vi.hoisted(() => {
  const agent = {};
  const retryAgent = {};
  return {
    agent,
    retryAgent,
    setGlobalDispatcher: vi.fn(),
    EnvHttpProxyAgent: vi.fn(function () { return agent; }),
    RetryAgent: vi.fn(function () { return retryAgent; }),
  };
});

vi.mock("undici", () => ({ EnvHttpProxyAgent, RetryAgent, setGlobalDispatcher }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_RUNTIME", "nodejs");
  for (const name of ["HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy", "NO_PROXY", "no_proxy"]) {
    vi.stubEnv(name, "");
  }
  vi.stubEnv("NO_PROXY", undefined);
  vi.stubEnv("no_proxy", undefined);
});

afterEach(() => vi.unstubAllEnvs());

describe("server proxy initialization", () => {
  it("leaves direct connections unchanged when no proxy is configured", async () => {
    await register();
    expect(setGlobalDispatcher).not.toHaveBeenCalled();
  });

  it("does not load Node networking in the Edge runtime", async () => {
    vi.stubEnv("NEXT_RUNTIME", "edge");
    vi.stubEnv("HTTPS_PROXY", "http://127.0.0.1:8000");
    await register();
    expect(EnvHttpProxyAgent).not.toHaveBeenCalled();
  });

  it("enables the configured proxy and bypasses local addresses by default", async () => {
    vi.stubEnv("HTTPS_PROXY", "http://127.0.0.1:8000");
    await register();
    expect(EnvHttpProxyAgent).toHaveBeenCalledWith({ noProxy: "localhost,127.0.0.1,::1" });
    expect(RetryAgent).toHaveBeenCalledWith(agent, {
      methods: ["GET", "HEAD"], maxRetries: 2, minTimeout: 300,
      maxTimeout: 1500, statusCodes: [429, 502, 503, 504],
    });
    expect(setGlobalDispatcher).toHaveBeenCalledWith(retryAgent);
  });

  it("preserves a custom bypass list and lowercase variable precedence", async () => {
    vi.stubEnv("http_proxy", "http://127.0.0.1:8000");
    vi.stubEnv("NO_PROXY", "example.com");
    vi.stubEnv("no_proxy", "localhost,internal.example.com");
    await register();
    expect(EnvHttpProxyAgent).toHaveBeenCalledWith({ noProxy: "localhost,internal.example.com" });
  });
});
