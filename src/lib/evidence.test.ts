import { describe, expect, it } from "vitest";

import {
  extractIssueReferences,
  suggestEvidenceLinks,
  type StoredEvidence,
} from "./evidence";

function item(
  id: string,
  kind: StoredEvidence["kind"],
  sourceData: Record<string, unknown>,
  overrides: Partial<StoredEvidence> = {},
): StoredEvidence {
  return {
    id,
    kind,
    external_id: id,
    title: `${kind} title`,
    summary: null,
    source_data: sourceData,
    ...overrides,
  };
}

describe("extractIssueReferences", () => {
  it("finds unique GitHub issue references", () => {
    expect([...extractIssueReferences("fix #12, refs #12 and closes #98")]).toEqual([
      12, 98,
    ]);
  });

  it("ignores text without repository-local references", () => {
    expect(extractIssueReferences("ticket ABC-12").size).toBe(0);
    expect(extractIssueReferences(null).size).toBe(0);
  });
});

describe("suggestEvidenceLinks", () => {
  it("connects an issue to a commit that references it", () => {
    const result = suggestEvidenceLinks([
      item("issue", "issue", { number: 3 }),
      item("commit", "commit", {
        sha: "abc",
        message: "feat: build evidence sync for #3",
      }),
    ]);

    expect(result).toEqual([
      expect.objectContaining({
        sourceId: "issue",
        targetId: "commit",
        relation: "implements",
        confidence: 0.94,
      }),
    ]);
  });

  it("connects issue, pull request, commit and CI by explicit evidence", () => {
    const result = suggestEvidenceLinks([
      item("issue", "issue", { number: 3 }),
      item("commit", "commit", { sha: "abc", message: "implement #3" }),
      item(
        "pr",
        "pull_request",
        { head_ref: "feat/3-sync", head_sha: "abc", merge_commit_sha: "def" },
        { title: "Complete #3", summary: "Closes #3" },
      ),
      item("check", "check", { head_sha: "abc" }),
    ]);

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceId: "issue",
          targetId: "pr",
          relation: "implements",
        }),
        expect.objectContaining({
          sourceId: "commit",
          targetId: "pr",
          relation: "contains",
        }),
        expect.objectContaining({
          sourceId: "pr",
          targetId: "check",
          relation: "verifies",
        }),
      ]),
    );
  });

  it("does not guess relationships without an explicit reference or SHA", () => {
    const result = suggestEvidenceLinks([
      item("issue", "issue", { number: 3 }),
      item("commit", "commit", { sha: "abc", message: "minor cleanup" }),
      item("check", "check", { head_sha: "unrelated" }),
    ]);

    expect(result).toEqual([]);
  });
});
