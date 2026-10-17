import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SnapshotView } from "./snapshot-view";
import { buildSnapshot } from "@/lib/delivery";

const id = "c522abbf-1dd9-48e5-bbd2-bed5fadd96d5";
const snapshot = buildSnapshot(
  {
    name: "demo",
    full_name: "student/demo",
    html_url: "https://github.com/student/demo",
  },
  [
    {
      id,
      kind: "pull_request",
      title: "PR #9",
      state: "merged",
      source_url: "https://github.com/student/demo/pull/9",
      occurred_at: "2026-10-17T01:00:00Z",
    },
  ],
  [],
  {
    reviewedAt: "2026-10-16T14:00:00Z",
    content: {
      summary: "旧样本显示 PR 未合并",
      gaps: "待核对",
      script: "历史讲解稿",
      citations: [id],
    },
    basis: {
      generatedAt: "2026-10-16T13:00:00Z",
      inputCount: 37,
      freshness: "changed",
    },
  },
);

describe("shared delivery view", () => {
  it("renders the sample warning before historical text on the teacher page and owner preview", () => {
    for (const mainHeading of [false, true]) {
      const html = renderToStaticMarkup(
        <SnapshotView snapshot={snapshot} mainHeading={mainHeading} />,
      );
      expect(html).toContain('aria-label="AI 版本与样本范围"');
      expect(html).toContain("生成输入 37 条");
      expect(html).toContain("下方原始证据为本快照的 1 条");
      expect(html.indexOf("历史 AI 版本")).toBeLessThan(
        html.indexOf("旧样本显示"),
      );
      expect(html).toContain("merged");
    }
  });
  it("keeps legacy immutable snapshots readable with an unknown-version warning", () => {
    const legacy = structuredClone(snapshot);
    delete legacy.narrative!.basis;
    expect(renderToStaticMarkup(<SnapshotView snapshot={legacy} />)).toContain(
      "缺少样本版本信息",
    );
  });
});
