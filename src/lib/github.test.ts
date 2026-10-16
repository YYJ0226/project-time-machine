import { describe, expect, it } from "vitest";

import {
  filterOwnedPublicRepositories,
  isOwnedPublicRepository,
  parseRepositoryFullName,
  type GitHubRepository,
} from "./github";

function repository(
  overrides: Partial<GitHubRepository> = {},
): GitHubRepository {
  return {
    id: 1,
    name: "project-time-machine",
    full_name: "YYJ0226/project-time-machine",
    private: false,
    html_url: "https://github.com/YYJ0226/project-time-machine",
    description: null,
    owner: { login: "YYJ0226" },
    default_branch: "main",
    language: "TypeScript",
    stargazers_count: 0,
    forks_count: 0,
    open_issues_count: 0,
    created_at: "2026-10-16T00:00:00Z",
    updated_at: "2026-10-16T00:00:00Z",
    pushed_at: "2026-10-16T00:00:00Z",
    ...overrides,
  };
}

describe("parseRepositoryFullName", () => {
  it("accepts a valid owner and repository", () => {
    expect(parseRepositoryFullName("YYJ0226/project-time-machine")).toEqual({
      owner: "YYJ0226",
      name: "project-time-machine",
      fullName: "YYJ0226/project-time-machine",
    });
  });

  it("rejects path traversal and malformed input", () => {
    expect(parseRepositoryFullName("YYJ0226/../private")).toBeNull();
    expect(parseRepositoryFullName("not-a-repository")).toBeNull();
    expect(parseRepositoryFullName(null)).toBeNull();
  });
});

describe("repository ownership", () => {
  it("requires both public visibility and matching owner", () => {
    expect(isOwnedPublicRepository(repository(), "yyj0226")).toBe(true);
    expect(
      isOwnedPublicRepository(repository({ private: true }), "YYJ0226"),
    ).toBe(false);
    expect(isOwnedPublicRepository(repository(), "someone-else")).toBe(false);
  });

  it("filters out private and collaborator repositories", () => {
    const repositories = [
      repository(),
      repository({ id: 2, private: true }),
      repository({
        id: 3,
        full_name: "other/public-project",
        owner: { login: "other" },
      }),
    ];

    expect(filterOwnedPublicRepositories(repositories, "YYJ0226")).toEqual([
      repositories[0],
    ]);
  });
});
