import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { aiInput, generateNarrative, inputHash } from "./deepseek";

const id = "c522abbf-1dd9-48e5-bbd2-bed5fadd96d5";
const input = [
  {
    id,
    kind: "commit" as const,
    title: "initial version",
    state: "recorded",
    occurred_at: "2026-10-16T00:00:00Z",
  },
];
const good = {
  summary: "观察到提交 [E01]",
  gaps: "样本未显示用户测试，待核对",
  script: "打开提交 [E01]",
  citations: ["E01"],
};
const reply = (content: unknown, finish = "stop") => ({
  ok: true,
  json: async () => ({
    choices: [
      { finish_reason: finish, message: { content: JSON.stringify(content) } },
    ],
    usage: { total_tokens: 120 },
  }),
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("DeepSeek boundary", () => {
  it("bounds input, excludes body and redacts credential-like titles", () => {
    const bounded = aiInput(
      Array.from({ length: 100 }, () => ({
        ...input[0],
        source_url: "https://github.com/u/r",
        summary: "must not send",
        title: "sk-" + "a".repeat(32),
      })),
    );
    expect(bounded).toHaveLength(60);
    expect(JSON.stringify(bounded)).not.toMatch(/must not send|sk-/);
    expect(inputHash(bounded)).toHaveLength(64);
    expect(inputHash(bounded)).toBe(inputHash(bounded));
  });
  it("maps validated short references to actual IDs without leaking the key into the body", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-secret");
    const fetcher = vi.fn().mockResolvedValue(reply(good));
    vi.stubGlobal("fetch", fetcher);
    const result = await generateNarrative(input, "deepseek-flash");
    expect(result.output.citations).toEqual([id]);
    expect(result.output.summary).toContain(id);
    const options = fetcher.mock.calls[0][1];
    expect(options.body).not.toContain("test-secret");
    expect(JSON.parse(options.body).messages[1].content).toContain("E01");
    expect(result.usage?.total_tokens).toBe(120);
  });
  it.each([
    [{ ...good, citations: ["E99"] }, "stop", "invalid_citations"],
    [{ ...good, summary: "来自 [E99]" }, "stop", "invalid_citations"],
    [good, "length", "incomplete_output"],
  ])(
    "rejects unsupported references or truncated text",
    async (output, finish, code) => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reply(output, finish)));
      await expect(generateNarrative(input, "deepseek-flash")).rejects.toThrow(
        code,
      );
    },
  );
  it("returns a safe status code for provider failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401 }),
    );
    await expect(generateNarrative(input, "deepseek-flash")).rejects.toThrow(
      "provider_401",
    );
  });
});
