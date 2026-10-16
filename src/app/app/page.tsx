import Link from "next/link";

import { requireGitHubUser } from "@/lib/auth";
import { getSupabasePublicConfig } from "@/lib/env";
import {
  GitHubApiError,
  listOwnedPublicRepositories,
  type GitHubRepository,
} from "@/lib/github";

import { importRepository, signOut } from "./actions";
import { ImportButton } from "./import-button";
import styles from "./workspace.module.css";

type ImportedProject = {
  id: string;
  name: string;
  full_name: string;
  html_url: string;
  language: string | null;
  imported_at: string;
};

export const instant = false;

function formatDate(value: string | null) {
  if (!value) {
    return "暂无提交";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function SetupRequired() {
  return (
    <main className={styles.setupShell}>
      <section className={styles.setupPanel}>
        <p>PHASE 02 / CONFIGURATION</p>
        <h1>认证代码已就位，还需要连接 Supabase。</h1>
        <p>
          当前没有检测到本地环境变量。完成 Supabase 项目、GitHub Provider
          和数据库迁移后，这里会显示你的公开仓库。
        </p>
        <div>
          <Link href="/login">查看登录界面</Link>
          <Link href="https://github.com/YYJ0226/project-time-machine/blob/main/docs/setup-supabase.md">
            阅读配置说明
          </Link>
        </div>
      </section>
    </main>
  );
}

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; imported?: string }>;
}) {
  if (!getSupabasePublicConfig()) {
    return <SetupRequired />;
  }

  const { supabase, user, githubLogin } = await requireGitHubUser();
  const params = await searchParams;

  const [repositoryResult, projectResult] = await Promise.allSettled([
    listOwnedPublicRepositories(githubLogin),
    supabase
      .from("projects")
      .select("id,name,full_name,html_url,language,imported_at")
      .order("imported_at", { ascending: false }),
  ]);

  let repositories: GitHubRepository[] = [];
  let repositoryError: string | null = null;

  if (repositoryResult.status === "fulfilled") {
    repositories = repositoryResult.value;
  } else {
    repositoryError =
      repositoryResult.reason instanceof GitHubApiError
        ? repositoryResult.reason.message
        : "暂时无法读取公开仓库，请稍后刷新。";
  }

  const projectQuery =
    projectResult.status === "fulfilled" ? projectResult.value : null;
  const projects = (projectQuery?.data ?? []) as ImportedProject[];
  const databaseError = projectQuery?.error
    ? projectQuery.error.code === "42P01"
      ? "数据库迁移尚未执行，暂时无法保存项目。"
      : "暂时无法读取已导入项目。"
    : projectResult.status === "rejected"
      ? "暂时无法读取已导入项目。"
      : null;
  const importedNames = new Set(
    projects.map((project) => project.full_name.toLowerCase()),
  );
  const displayName =
    typeof user.user_metadata?.name === "string"
      ? user.user_metadata.name
      : githubLogin;

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/">
          <span aria-hidden="true">◉</span>
          <strong>PTM</strong>
        </Link>

        <div className={styles.account}>
          <div className={styles.avatar}>{githubLogin.slice(0, 2).toUpperCase()}</div>
          <strong>{displayName}</strong>
          <span>@{githubLogin}</span>
        </div>

        <nav aria-label="项目工作台">
          <a className={styles.active} href="#repositories">
            <span>02</span>
            仓库导入
          </a>
          <span className={styles.locked}>
            <i>03</i>
            证据同步
          </span>
          <span className={styles.locked}>
            <i>04</i>
            时间线
          </span>
        </nav>

        <form action={signOut} className={styles.signOut}>
          <button type="submit">退出登录</button>
        </form>
      </aside>

      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <div>
            <span>PROJECT INTAKE</span>
            <strong>公开仓库接入站</strong>
          </div>
          <p>
            <i aria-hidden="true" />
            GitHub 身份已核验
          </p>
        </header>

        <section className={styles.mainGrid}>
          <div className={styles.repositoryArea} id="repositories">
            <div className={styles.heading}>
              <p>选择信号源</p>
              <h1>导入一个你拥有的公开仓库。</h1>
              <span>
                当前找到 {repositories.length} 个公开仓库。导入只保存基本信息，
                不会修改源仓库。
              </span>
            </div>

            {params.imported ? (
              <div className={styles.notice} role="status">
                已导入 {params.imported}。打开证据工作台，即可同步开发记录。
              </div>
            ) : null}
            {params.error ? (
              <div className={styles.error} role="alert">
                {params.error}
              </div>
            ) : null}
            {repositoryError ? (
              <div className={styles.error} role="alert">
                {repositoryError}
              </div>
            ) : null}

            <div className={styles.repositoryList}>
              {repositories.map((repository, index) => {
                const imported = importedNames.has(
                  repository.full_name.toLowerCase(),
                );

                return (
                  <article className={styles.repository} key={repository.id}>
                    <span className={styles.index}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className={styles.repoBody}>
                      <div className={styles.repoTitle}>
                        <h2>{repository.name}</h2>
                        <a href={repository.html_url}>在 GitHub 查看</a>
                      </div>
                      <p>
                        {repository.description || "这个仓库暂时没有描述。"}
                      </p>
                      <dl>
                        <div>
                          <dt>语言</dt>
                          <dd>{repository.language || "未识别"}</dd>
                        </div>
                        <div>
                          <dt>默认分支</dt>
                          <dd>{repository.default_branch}</dd>
                        </div>
                        <div>
                          <dt>最近推送</dt>
                          <dd>{formatDate(repository.pushed_at)}</dd>
                        </div>
                      </dl>
                    </div>
                    <form action={importRepository} className={styles.importForm}>
                      <input
                        type="hidden"
                        name="repository"
                        value={repository.full_name}
                      />
                      <ImportButton imported={imported} />
                    </form>
                  </article>
                );
              })}

              {!repositoryError && repositories.length === 0 ? (
                <div className={styles.emptyState}>
                  <strong>没有发现可导入的公开仓库</strong>
                  <p>先在 GitHub 创建一个公开仓库，然后刷新此页面。</p>
                </div>
              ) : null}
            </div>
          </div>

          <aside className={styles.importedArea}>
            <div className={styles.importedHeader}>
              <span>已接入项目</span>
              <strong>{String(projects.length).padStart(2, "0")}</strong>
            </div>

            {databaseError ? (
              <p className={styles.databaseError}>{databaseError}</p>
            ) : null}

            <div className={styles.projectRail}>
              {projects.map((project) => (
                <article key={project.id}>
                  <span aria-hidden="true" />
                  <div>
                    <strong>{project.name}</strong>
                    <p>{project.language || "未识别语言"}</p>
                    <small>导入于 {formatDate(project.imported_at)}</small>
                    <Link href={`/app/projects/${project.id}`}>
                      打开证据工作台
                    </Link>
                  </div>
                </article>
              ))}
              {!databaseError && projects.length === 0 ? (
                <p className={styles.noProjects}>
                  导入后的项目会出现在这里，打开证据工作台即可收集开发记录。
                </p>
              ) : null}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
