import { describe, expect, it } from "vitest";
import { buildSnapshot, exportMarkdown, parseNarrative, readableNarrative, restoreReferences, redact, safeGitHubUrl, type DeliveryEvidence } from "./delivery";

const id = "c522abbf-1dd9-48e5-bbd2-bed5fadd96d5";
const otherId = "011049e7-08e8-4b44-a9d8-c1a09a7bc079";
const project = { name: "demo", full_name: "student/demo", html_url: "https://github.com/student/demo" };
const item: DeliveryEvidence = { id, kind: "commit", title: "build project", state: "recorded", source_url: "https://github.com/student/demo/commit/abc?token=private#secret", occurred_at: "2026-10-16T10:00:00Z" };
const content = { summary: `观察到提交 [${id}]`, gaps: "样本未显示需求，待核对", script: `展示提交 [${id}]`, citations: [id] };
describe("delivery projection", () => {
  it("round-trips readable reference labels and rejects invented labels", () => {
    const readable = readableNarrative(content);
    expect(readable.summary).toContain("证据1");
    expect(restoreReferences(readable)).toEqual(content);
    expect(() => restoreReferences({ ...readable, summary: "证据99" })).toThrow("invalid_citations");
  });
  it("allowlists fields and omits drafts, source body, owner and credentials", () => {
    const raw = { ...item, summary: "private body", source_data: { token: "secret" }, owner_id: "owner" };
    const snapshot = buildSnapshot(project, [raw], [], null);
    expect(Object.keys(snapshot.evidence[0])).toEqual(["id", "kind", "title", "state", "source_url", "occurred_at"]);
    expect(snapshot.narrative).toBeNull();
    expect(JSON.stringify(snapshot)).not.toMatch(/private|secret|owner/);
  });
  it("includes only approved narrative and linked evidence in this snapshot", () => {
    const snapshot = buildSnapshot(project, [item], [{ source_id: id, target_id: otherId, relation: "contains" }], { reviewedAt: "2026-10-16T11:00:00Z", content });
    expect(snapshot.links).toEqual([]);
    expect(snapshot.narrative?.label).toContain("AI 生成");
    expect(snapshot.narrative?.content).toEqual(content);
  });
  it("rejects malformed output, fabricated citations and embedded foreign UUIDs", () => {
    expect(() => parseNarrative({ ...content, summary: "" }, [id])).toThrow("invalid_output");
    expect(() => parseNarrative({ ...content, citations: [otherId] }, [id])).toThrow("invalid_citations");
    expect(() => parseNarrative({ ...content, summary: otherId }, [id])).toThrow("invalid_citations");
    expect(() => parseNarrative({ ...content, citations: [] }, [id])).toThrow("invalid_citations");
    expect(() => parseNarrative({ ...content, script: "x".repeat(12001) }, [id])).toThrow("invalid_output");
  });
  it("accepts only GitHub HTTPS source URLs and removes query/hash", () => {
    for (const url of ["javascript:alert(1)", "https://github.com.evil.org/x", "https://user:pass@github.com/x", "http://github.com/x"]) expect(safeGitHubUrl(url)).toBe("");
    expect(safeGitHubUrl(item.source_url)).toBe("https://github.com/student/demo/commit/abc");
  });
  it("redacts common credential formats without exposing them in reports", () => {
    const snapshot = buildSnapshot(project, [{ ...item, title: "key sk-" + "a".repeat(32) }], [], null);
    expect(exportMarkdown(snapshot, "report")).toContain("已隐藏疑似密钥");
    expect(redact("ghp_" + "x".repeat(36))).not.toContain("xxx");
  });
  it("exports factual report and explicitly non-AI script when no approved text exists", () => {
    const snapshot = buildSnapshot(project, [item], [], null);
    expect(exportMarkdown(snapshot, "report")).toContain("本报告仅整理原始证据");
    expect(exportMarkdown(snapshot, "script")).toContain("固定录屏结构，不是 AI 生成稿");
    expect(exportMarkdown(snapshot, "report")).toContain(id);
  });
  it("renders approved text as literal escaped content rather than Markdown/HTML instructions", () => {
    const snapshot = buildSnapshot(project, [item], [], { reviewedAt: "2026-10-16T11:00:00Z", content: { ...content, summary: "<script>alert(1)</script>\n[点击](javascript:alert(1))" } });
    const output = exportMarkdown(snapshot, "report");
    expect(output).not.toContain("<script>"); expect(output).not.toContain("[点击](");
    expect(output).toContain("AI 生成，经学生编辑并确认");
  });
});
