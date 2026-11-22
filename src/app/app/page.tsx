import Link from "next/link";

import { Brand } from "@/components/brand";
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
        <p className={styles.setupCode}>WORKSPACE / CONFIGURATION</p>
        <h1>认证代码已就位，还需要连接 Supabase。</h1>
        <p className={styles.setupCopy}>
          当前没有检测到本地环境变量。完成 Supabase 项目、GitHub Provider
          和数据库迁移后，这里会显示你的公开仓库。
        </p>
        <div className={styles.setupActions}>
          <Link href="/login" className={styles.setupPrimary}>
            查看登录界面
          </Link>
          <Link
            href="https://github.com/YYJ0226/project-time-machine/blob/main/docs/setup-supabase.md"
            className={styles.setupSecondary}
          >
            阅读配置说明 ↗
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
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Brand href="/" subtitle="项目观测工作台" />

          <div className={styles.accountCluster}>
            <div className={styles.identityPill}>
              <span className={styles.avatar} aria-hidden="true">
                {githubLogin.slice(0, 2).toUpperCase()}
              </span>
              <div className={styles.identityText}>
                <strong>{displayName}</strong>
                <span>@{githubLogin} · GitHub 已核验</span>
              </div>
            </div>

            <form action={signOut} className={styles.signOut}>
              <button type="submit">退出登录</button>
            </form>
          </div>
        </div>
      </header>

      <div className={styles.container}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>PROJECT OBSERVATORY</p>
            <h1>
              选择你的公开仓库，
              <span className={styles.gradientText}>开始记录开发证据链。</span>
            </h1>
            <p className={styles.heroDesc}>
              导入只保存仓库基础元数据，不会修改 GitHub 上的任何内容。进入项目后可同步
              Issue、Commit、PR 与 CI 记录，并生成时间线与教师只读快照。
            </p>
          </div>

          <div className={styles.heroStats} aria-label="工作台概览">
            <div className={styles.statCard}>
              <span>已接入项目</span>
              <strong>{String(projects.length).padStart(2, "0")}</strong>
            </div>
            <div className={styles.statCard}>
              <span>公开仓库数</span>
              <strong>{String(repositories.length).padStart(2, "0")}</strong>
            </div>
          </div>
        </section>

        {params.imported ? (
          <div className={styles.notice} role="status">
            已导入 <strong>{params.imported}</strong>。打开下方项目的「证据工作台」，即可同步开发记录。
          </div>
        ) : null}
        {params.error ? (
          <div className={styles.error} role="alert">
            {params.error}
          </div>
        ) : null}
        {databaseError ? (
          <div className={styles.error} role="alert">
            {databaseError}
          </div>
        ) : null}

        <section className={styles.section} aria-labelledby="projects-heading">
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionCode}>01 / ACTIVE PROJECTS</span>
              <h2 id="projects-heading">已接入项目</h2>
            </div>
            <span className={styles.sectionBadge}>
              {projects.length} 个项目可进入观测
            </span>
          </div>

          {projects.length > 0 ? (
            <div className={styles.projectGrid}>
              {projects.map((project) => (
                <article className={styles.projectCard} key={project.id}>
                  <div className={styles.projectTop}>
                    <span className={styles.projectDot} aria-hidden="true" />
                    <span className={styles.langPill}>
                      {project.language || "未识别语言"}
                    </span>
                    <a
                      className={styles.externalLink}
                      href={project.html_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      GitHub ↗
                    </a>
                  </div>

                  <h3>{project.name}</h3>
                  <p className={styles.projectFullName}>{project.full_name}</p>
                  <p className={styles.projectDate}>
                    导入于 {formatDate(project.imported_at)}
                  </p>

                  <div className={styles.projectLinks}>
                    <Link
                      href={`/app/projects/${project.id}`}
                      className={styles.projectPrimaryLink}
                    >
                      证据工作台
                    </Link>
                    <Link
                      href={`/app/projects/${project.id}/timeline`}
                      prefetch={false}
                      className={styles.projectSubLink}
                    >
                      时间线
                    </Link>
                    <Link
                      href={`/app/projects/${project.id}/delivery`}
                      prefetch={false}
                      className={styles.projectSubLink}
                    >
                      审稿交付
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.emptyCard}>
              <strong>还没有已接入的项目</strong>
              <p>从下方公开仓库列表中点击「导入项目」，导入后会立刻显示在这里。</p>
            </div>
          )}
        </section>

        <section
          className={styles.section}
          id="repositories"
          aria-labelledby="repos-heading"
        >
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionCode}>02 / SIGNAL INTAKE</span>
              <h2 id="repos-heading">你的 GitHub 公开仓库</h2>
            </div>
            <span className={styles.sectionBadge}>
              仅显示 @{githubLogin} 拥有的公开仓库
            </span>
          </div>

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
                <article
                  className={`${styles.repository} ${imported ? styles.repositoryImported : ""}`}
                  key={repository.id}
                >
                  <span className={styles.index}>
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className={styles.repoBody}>
                    <div className={styles.repoTitle}>
                      <h3>{repository.name}</h3>
                      {repository.language ? (
                        <span className={styles.langPill}>
                          {repository.language}
                        </span>
                      ) : null}
                      <a
                        href={repository.html_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        在 GitHub 查看 ↗
                      </a>
                    </div>
                    <p>
                      {repository.description || "这个仓库暂时没有描述。"}
                    </p>
                    <dl>
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
              <div className={styles.emptyCard}>
                <strong>没有发现可导入的公开仓库</strong>
                <p>先在 GitHub 创建一个公开仓库，然后刷新此页面。</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
