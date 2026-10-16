export type GitHubRepository = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  owner: {
    login: string;
  };
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
};

const GITHUB_API_VERSION = "2026-03-10";
const REPOSITORY_FULL_NAME_PATTERN =
  /^([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\/([A-Za-z0-9._-]{1,100})$/;

export class GitHubApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

export function parseRepositoryFullName(value: unknown) {
  if (typeof value !== "string" || value.length > 140) {
    return null;
  }

  const match = REPOSITORY_FULL_NAME_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  return {
    owner: match[1],
    name: match[2],
    fullName: `${match[1]}/${match[2]}`,
  };
}

export function isOwnedPublicRepository(
  repository: GitHubRepository,
  githubLogin: string,
) {
  return (
    repository.private === false &&
    repository.owner.login.toLowerCase() === githubLogin.toLowerCase()
  );
}

export function filterOwnedPublicRepositories(
  repositories: GitHubRepository[],
  githubLogin: string,
) {
  return repositories.filter((repository) =>
    isOwnedPublicRepository(repository, githubLogin),
  );
}

async function githubRequest<T>(path: string): Promise<T> {
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

  if (!response.ok) {
    throw new GitHubApiError(
      response.status === 403
        ? "GitHub API 请求额度暂时用尽，请稍后重试。"
        : "暂时无法读取 GitHub 仓库，请稍后重试。",
      response.status,
    );
  }

  return (await response.json()) as T;
}

export async function listOwnedPublicRepositories(githubLogin: string) {
  const repositories = await githubRequest<GitHubRepository[]>(
    `/users/${encodeURIComponent(githubLogin)}/repos?type=owner&sort=pushed&direction=desc&per_page=100`,
  );

  return filterOwnedPublicRepositories(repositories, githubLogin);
}

export async function getPublicRepository(fullName: string) {
  const parsed = parseRepositoryFullName(fullName);

  if (!parsed) {
    throw new GitHubApiError("仓库标识格式不正确。", 400);
  }

  return githubRequest<GitHubRepository>(
    `/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.name)}`,
  );
}
