import { describe, expect, it } from "vitest";

import { normalizeIssues, normalizePullRequests, normalizeChecks } from "./github-evidence";

describe("GitHub evidence normalization", () => {
  it("does not count PRs returned by the Issues API as requirements", () => {
    const issue = {
      id: 1, number: 3, title: "Evidence sync", body: "Acceptance criteria",
      state: "closed", html_url: "https://github.com/demo/repo/issues/3",
      created_at: "2026-10-15T00:00:00Z", updated_at: "2026-10-16T00:00:00Z",
      closed_at: "2026-10-16T01:00:00Z",
    };
    const result = normalizeIssues([issue, { ...issue, id: 2, pull_request: { url: "https://api.github.com/repos/demo/repo/pulls/4" } }]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ kind: "issue", externalId: "1", sourceData: { number: 3 }, occurredAt: issue.closed_at });
  });

  it("keeps the SHA and issue references needed to trace a merged PR", () => {
    const [result] = normalizePullRequests([{
      id: 2, number: 4, title: "Evidence sync", body: "Closes #3", state: "closed",
      html_url: "https://github.com/demo/repo/pull/4",
      created_at: "2026-10-15T00:00:00Z", updated_at: "2026-10-16T00:00:00Z",
      closed_at: "2026-10-16T01:00:00Z", merged_at: "2026-10-16T01:00:00Z",
      merge_commit_sha: "merged-sha", head: { ref: "feat/evidence", sha: "head-sha" },
      base: { ref: "main", sha: "base-sha" },
    }]);
    expect(result).toMatchObject({ state: "merged", summary: "Closes #3", sourceData: { head_sha: "head-sha", merge_commit_sha: "merged-sha" } });
  });

  it("does not present a running workflow as successful validation", () => {
    const [result] = normalizeChecks([{
      id: 10, name: "CI", display_title: "Test evidence sync", status: "in_progress",
      conclusion: null, html_url: "https://github.com/demo/repo/actions/runs/10",
      head_sha: "head-sha", event: "push", created_at: "2026-10-16T00:00:00Z",
      updated_at: "2026-10-16T01:00:00Z", run_started_at: "2026-10-16T00:00:00Z",
    }]);
    expect(result).toMatchObject({ state: "in_progress", sourceData: { head_sha: "head-sha", event: "push" } });
  });
});
