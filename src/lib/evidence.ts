export type EvidenceKind = "issue" | "commit" | "pull_request" | "check";
export type EvidenceRelation = "implements" | "contains" | "verifies";

export type EvidenceDraft = {
  kind: EvidenceKind;
  externalId: string;
  title: string;
  summary: string | null;
  state: string | null;
  sourceUrl: string;
  occurredAt: string;
  sourceData: Record<string, unknown>;
};

export type StoredEvidence = {
  id: string;
  kind: EvidenceKind;
  external_id: string;
  title: string;
  summary: string | null;
  source_data: Record<string, unknown>;
};

export type LinkSuggestion = {
  sourceId: string;
  targetId: string;
  relation: EvidenceRelation;
  confidence: number;
  reasons: string[];
};

export function extractIssueReferences(value: unknown) {
  if (typeof value !== "string") {
    return new Set<number>();
  }

  const references = new Set<number>();

  for (const match of value.matchAll(/#(\d{1,10})\b/g)) {
    references.add(Number(match[1]));
  }

  return references;
}

function readString(data: Record<string, unknown>, key: string) {
  const value = data[key];
  return typeof value === "string" ? value : null;
}

function readNumber(data: Record<string, unknown>, key: string) {
  const value = data[key];
  return typeof value === "number" ? value : null;
}

function pushSuggestion(
  suggestions: LinkSuggestion[],
  keys: Set<string>,
  suggestion: LinkSuggestion,
) {
  const key = `${suggestion.sourceId}:${suggestion.targetId}:${suggestion.relation}`;

  if (!keys.has(key)) {
    keys.add(key);
    suggestions.push(suggestion);
  }
}

export function suggestEvidenceLinks(items: StoredEvidence[]) {
  const issues = items.filter((item) => item.kind === "issue");
  const commits = items.filter((item) => item.kind === "commit");
  const pullRequests = items.filter((item) => item.kind === "pull_request");
  const checks = items.filter((item) => item.kind === "check");
  const suggestions: LinkSuggestion[] = [];
  const keys = new Set<string>();

  for (const issue of issues) {
    const issueNumber = readNumber(issue.source_data, "number");

    if (!issueNumber) {
      continue;
    }

    for (const commit of commits) {
      const references = extractIssueReferences(
        readString(commit.source_data, "message") ?? commit.title,
      );

      if (references.has(issueNumber)) {
        pushSuggestion(suggestions, keys, {
          sourceId: issue.id,
          targetId: commit.id,
          relation: "implements",
          confidence: 0.94,
          reasons: [`提交信息引用了 #${issueNumber}`],
        });
      }
    }

    for (const pullRequest of pullRequests) {
      const text = [
        pullRequest.title,
        pullRequest.summary,
        readString(pullRequest.source_data, "head_ref"),
      ]
        .filter(Boolean)
        .join("\n");

      if (extractIssueReferences(text).has(issueNumber)) {
        pushSuggestion(suggestions, keys, {
          sourceId: issue.id,
          targetId: pullRequest.id,
          relation: "implements",
          confidence: 0.9,
          reasons: [`PR 标题、描述或分支名引用了 #${issueNumber}`],
        });
      }
    }
  }

  for (const pullRequest of pullRequests) {
    const headSha = readString(pullRequest.source_data, "head_sha");
    const mergeSha = readString(pullRequest.source_data, "merge_commit_sha");

    for (const commit of commits) {
      const sha = readString(commit.source_data, "sha");

      if (sha && (sha === headSha || sha === mergeSha)) {
        pushSuggestion(suggestions, keys, {
          sourceId: commit.id,
          targetId: pullRequest.id,
          relation: "contains",
          confidence: 0.98,
          reasons: [
            sha === headSha
              ? "提交是 PR 当前的头提交"
              : "提交与 PR 的合并提交一致",
          ],
        });
      }
    }

    for (const check of checks) {
      const checkSha = readString(check.source_data, "head_sha");

      if (checkSha && (checkSha === headSha || checkSha === mergeSha)) {
        pushSuggestion(suggestions, keys, {
          sourceId: pullRequest.id,
          targetId: check.id,
          relation: "verifies",
          confidence: 0.99,
          reasons: ["CI 运行与 PR 使用同一个提交 SHA"],
        });
      }
    }
  }

  return suggestions;
}
