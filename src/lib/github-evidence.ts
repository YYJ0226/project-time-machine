import {
  GitHubApiError,
  type GitHubRepository,
  parseRepositoryFullName,
} from "@/lib/github";
import type { EvidenceDraft } from "@/lib/evidence";

type GitHubIssue = {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  pull_request?: unknown;
};

type GitHubCommit = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { date: string } | null;
    committer: { date: string } | null;
  };
};

type GitHubPullRequest = {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  merge_commit_sha: string | null;
  head: { ref: string; sha: string };
  base: { ref: string; sha: string };
};

type GitHubWorkflowRun = {
  id: number;
  name: string | null;
  display_title: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  head_sha: string;
  event: string;
  created_at: string;
  updated_at: string;
  run_started_at: string;
};

type GitHubWorkflowRuns = {
  workflow_runs: GitHubWorkflowRun[];
};

export type RepositoryEvidence = {
  repository: GitHubRepository;
  issues: EvidenceDraft[];
  commits: EvidenceDraft[];
  pullRequests: EvidenceDraft[];
  checks: EvidenceDraft[];
};

const GITHUB_API_VERSION = "2026-03-10";

async function githubEvidenceRequest<T>(
  path: string,
  fallback?: { statuses: number[]; value: T },
): Promise<T> {
  const token = process.env.GITHUB_TOKEN?.trim();
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
      "User-Agent": "project-time-machine",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  if (fallback?.statuses.includes(response.status)) {
    return fallback.value;
  }

  if (!response.ok) {
    throw new GitHubApiError(
      response.status === 403
        ? "GitHub API 请求额度暂时用尽，请稍后重试。"
        : "GitHub 证据暂时无法同步，请稍后重试。",
      response.status,
    );
  }

  return (await response.json()) as T;
}

function repositoryPath(fullName: string) {
  const parsed = parseRepositoryFullName(fullName);

  if (!parsed) {
    throw new GitHubApiError("仓库标识格式不正确。", 400);
  }

  return `${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.name)}`;
}

export function normalizeIssues(items: GitHubIssue[]): EvidenceDraft[] {
  return items
    .filter((item) => !item.pull_request)
    .map((item) => ({
      kind: "issue",
      externalId: String(item.id),
      title: `#${item.number} ${item.title}`,
      summary: item.body,
      state: item.state,
      sourceUrl: item.html_url,
      occurredAt: item.closed_at ?? item.updated_at ?? item.created_at,
      sourceData: { number: item.number },
    }));
}

export function normalizeCommits(items: GitHubCommit[]): EvidenceDraft[] {
  return items.map((item) => {
    const [title] = item.commit.message.split("\n");

    return {
      kind: "commit",
      externalId: item.sha,
      title,
      summary: item.commit.message,
      state: null,
      sourceUrl: item.html_url,
      occurredAt:
        item.commit.author?.date ??
        item.commit.committer?.date ??
        new Date(0).toISOString(),
      sourceData: { sha: item.sha, message: item.commit.message },
    };
  });
}

export function normalizePullRequests(
  items: GitHubPullRequest[],
): EvidenceDraft[] {
  return items.map((item) => ({
    kind: "pull_request",
    externalId: String(item.id),
    title: `#${item.number} ${item.title}`,
    summary: item.body,
    state: item.merged_at ? "merged" : item.state,
    sourceUrl: item.html_url,
    occurredAt: item.merged_at ?? item.closed_at ?? item.updated_at,
    sourceData: {
      number: item.number,
      head_ref: item.head.ref,
      head_sha: item.head.sha,
      base_ref: item.base.ref,
      merge_commit_sha: item.merge_commit_sha,
    },
  }));
}

export function normalizeChecks(items: GitHubWorkflowRun[]): EvidenceDraft[] {
  return items.map((item) => ({
    kind: "check",
    externalId: String(item.id),
    title: item.name || item.display_title,
    summary: item.display_title,
    state: item.conclusion ?? item.status,
    sourceUrl: item.html_url,
    occurredAt: item.updated_at ?? item.run_started_at ?? item.created_at,
    sourceData: { head_sha: item.head_sha, event: item.event },
  }));
}

export async function fetchRepositoryEvidence(fullName: string) {
  const path = repositoryPath(fullName);
  const [repository, issues, commits, pullRequests, workflowRuns] =
    await Promise.all([
      githubEvidenceRequest<GitHubRepository>(`/repos/${path}`),
      githubEvidenceRequest<GitHubIssue[]>(
        `/repos/${path}/issues?state=all&sort=updated&direction=desc&per_page=100`,
      ),
      githubEvidenceRequest<GitHubCommit[]>(
        `/repos/${path}/commits?per_page=100`,
        { statuses: [409], value: [] },
      ),
      githubEvidenceRequest<GitHubPullRequest[]>(
        `/repos/${path}/pulls?state=all&sort=updated&direction=desc&per_page=100`,
      ),
      githubEvidenceRequest<GitHubWorkflowRuns>(
        `/repos/${path}/actions/runs?per_page=100`,
        { statuses: [404, 409], value: { workflow_runs: [] } },
      ),
    ]);

  return {
    repository,
    issues: normalizeIssues(issues),
    commits: normalizeCommits(commits),
    pullRequests: normalizePullRequests(pullRequests),
    checks: normalizeChecks(workflowRuns.workflow_runs),
  } satisfies RepositoryEvidence;
}
