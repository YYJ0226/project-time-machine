import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireGitHubUser } from "@/lib/auth";
import type { EvidenceKind } from "@/lib/evidence";
import { getSupabasePublicConfig } from "@/lib/env";

import { reviewEvidenceLink, syncEvidence } from "./actions";
import { ReviewButtons } from "./review-buttons";
import styles from "./evidence.module.css";
import { SyncButton } from "./sync-button";

type Project = {
  id: string;
  name: string;
  full_name: string;
  html_url: string;
  default_branch: string;
  language: string | null;
};

type EvidenceItem = {
  id: string;
  kind: EvidenceKind;
  title: string;
  summary: string | null;
  state: string | null;
  source_url: string;
  occurred_at: string;
};

type EvidenceLink = {
  id: string;
  source_id: string;
  target_id: string;
  relation: "implements" | "contains" | "verifies";
  status: "suggested" | "confirmed" | "rejected";
  confidence: number;
  reasons: string[];
};

type SyncRun = {
  id: string;
  status: "running" | "completed" | "failed";
  issue_count: number;
  commit_count: number;
  pull_request_count: number;
  check_count: number;
  suggestion_count: number;
  started_at: string;
  completed_at: string | null;
};

export const instant = false;

const laneContent: Array<{
  key: string;
  title: string;
  description: string;
  kinds: EvidenceKind[];
}> = [
  {
    key: "requirement",
    title: "需求信号",
    description: "Issue 定义为什么要做",
    kinds: ["issue"],
  },
  {
    key: "implementation",
    title: "实现信号",
    description: "Commit 与 PR 记录怎么完成",
    kinds: ["commit", "pull_request"],
  },
  {
    key: "verification",
    title: "验证信号",
    description: "CI Check 证明结果是否可靠",
    kinds: ["check"],
  },
];

const kindNames: Record<EvidenceKind, string> = {
  issue: "Issue",
  commit: "Commit",
  pull_request: "Pull request",
  check: "CI check",
};

const relationNames = {
  implements: "实现",
  contains: "包含",
  verifies: "验证",
};

function formatDate(value: string | null) {
  if (!value) {
    return "尚未完成";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function EvidenceCard({ item }: { item: EvidenceItem }) {
  return (
    <article className={styles.evidenceCard} data-kind={item.kind}>
      <div className={styles.cardMeta}>
        <span>{kindNames[item.kind]}</span>
        <time dateTime={item.occurred_at}>{formatDate(item.occurred_at)}</time>
      </div>
      <h3>{item.title}</h3>
      <div className={styles.cardFooter}>
        <span>{item.state || "recorded"}</span>
        <a href={item.source_url} target="_blank" rel="noreferrer">
          GitHub 原文
        </a>
      </div>
    </article>
  );
}

export default async function EvidencePage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ error?: string; synced?: string }>;
}) {
  if (!getSupabasePublicConfig()) {
    redirect("/app");
  }

  const { projectId } = await params;
  const query = await searchParams;
  const { supabase, user, githubLogin } = await requireGitHubUser();
  const { data: projectData } = await supabase
    .from("projects")
    .select("id,name,full_name,html_url,default_branch,language")
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!projectData) {
    notFound();
  }

  const project = projectData as Project;
  const [itemsResult, linksResult, runResult] = await Promise.all([
    supabase
      .from("evidence_items")
      .select("id,kind,title,summary,state,source_url,occurred_at")
      .eq("project_id", project.id)
      .order("occurred_at", { ascending: false }),
    supabase
      .from("evidence_links")
      .select("id,source_id,target_id,relation,status,confidence,reasons")
      .eq("project_id", project.id)
      .neq("status", "rejected")
      .order("confidence", { ascending: false }),
    supabase
      .from("sync_runs")
      .select(
        "id,status,issue_count,commit_count,pull_request_count,check_count,suggestion_count,started_at,completed_at",
      )
      .eq("project_id", project.id)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const migrationMissing =
    itemsResult.error?.code === "42P01" ||
    linksResult.error?.code === "42P01" ||
    runResult.error?.code === "42P01";
  const items = (itemsResult.data ?? []) as EvidenceItem[];
  const links = (linksResult.data ?? []) as EvidenceLink[];
  const lastRun = runResult.data as SyncRun | null;
  const itemMap = new Map(items.map((item) => [item.id, item]));
  const suggestedLinks = links.filter((link) => link.status === "suggested");
  const confirmedLinks = links.filter((link) => link.status === "confirmed");

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brandBlock}>
          <Link href="/app" aria-label="返回项目列表">
            ◉
          </Link>
          <div>
            <span>证据观测台</span>
            <strong>{project.name}</strong>
          </div>
        </div>

        <div className={styles.repositoryMeta}>
          <span>@{githubLogin}</span>
          <span>{project.language || "未识别语言"}</span>
          <span>{project.default_branch}</span>
          <a href={project.html_url} target="_blank" rel="noreferrer">
            查看仓库
          </a>
        </div>
      </header>

      <section className={styles.commandBar}>
        <div>
          <p>把开发过程变成可验证的链条</p>
          <h1>从需求，到实现，再到通过测试。</h1>
        </div>
        <form action={syncEvidence} className={styles.syncForm}>
          <input type="hidden" name="projectId" value={project.id} />
          <SyncButton />
          <small>
            {lastRun
              ? `最近同步：${formatDate(lastRun.completed_at || lastRun.started_at)}`
              : "尚未同步"}
          </small>
        </form>
      </section>

      {migrationMissing ? (
        <div className={styles.error} role="alert">
          阶段三数据库迁移尚未执行，请先运行
          <code>20261016000200_create_evidence_graph.sql</code>。
        </div>
      ) : null}
      {query.error ? (
        <div className={styles.error} role="alert">
          {query.error}
        </div>
      ) : null}
      {query.synced ? (
        <div className={styles.success} role="status">
          GitHub 证据已更新，新的关联建议正在等待确认。
        </div>
      ) : null}

      <section className={styles.metrics} aria-label="证据统计">
        <div>
          <strong>{items.filter((item) => item.kind === "issue").length}</strong>
          <span>需求</span>
        </div>
        <div>
          <strong>
            {items.filter((item) => item.kind === "commit").length}
          </strong>
          <span>提交</span>
        </div>
        <div>
          <strong>
            {items.filter((item) => item.kind === "pull_request").length}
          </strong>
          <span>PR</span>
        </div>
        <div>
          <strong>{items.filter((item) => item.kind === "check").length}</strong>
          <span>验证</span>
        </div>
        <div className={styles.confirmedMetric}>
          <strong>{confirmedLinks.length}</strong>
          <span>已确认关联</span>
        </div>
      </section>

      <section className={styles.signalBoard} aria-label="项目证据链">
        {laneContent.map((lane) => {
          const laneItems = items.filter((item) => lane.kinds.includes(item.kind));

          return (
            <section className={styles.lane} key={lane.key}>
              <header>
                <i aria-hidden="true" />
                <div>
                  <h2>{lane.title}</h2>
                  <p>{lane.description}</p>
                </div>
                <strong>{String(laneItems.length).padStart(2, "0")}</strong>
              </header>
              <div className={styles.laneTrack}>
                {laneItems.slice(0, 12).map((item) => (
                  <EvidenceCard item={item} key={item.id} />
                ))}
                {laneItems.length === 0 ? (
                  <div className={styles.emptyLane}>
                    <span aria-hidden="true">＋</span>
                    <p>同步后，这条信号轨道会出现真实 GitHub 证据。</p>
                  </div>
                ) : null}
              </div>
            </section>
          );
        })}
      </section>

      <section className={styles.suggestions}>
        <header>
          <div>
            <span>人工确认区</span>
            <h2>关联建议</h2>
          </div>
          <p>
            系统只提出建议，不替你决定。确认后，这条关系才会进入项目叙事。
          </p>
        </header>

        <div className={styles.suggestionList}>
          {suggestedLinks.map((link) => {
            const source = itemMap.get(link.source_id);
            const target = itemMap.get(link.target_id);

            if (!source || !target) {
              return null;
            }

            return (
              <article className={styles.suggestion} key={link.id}>
                <div className={styles.confidence}>
                  <strong>{Math.round(Number(link.confidence) * 100)}</strong>
                  <span>% 匹配</span>
                </div>
                <div className={styles.relationship}>
                  <div>
                    <span>{kindNames[source.kind]}</span>
                    <strong>{source.title}</strong>
                  </div>
                  <i>{relationNames[link.relation]}</i>
                  <div>
                    <span>{kindNames[target.kind]}</span>
                    <strong>{target.title}</strong>
                  </div>
                  <p>{link.reasons.join("；")}</p>
                </div>
                <form action={reviewEvidenceLink} className={styles.reviewForm}>
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="linkId" value={link.id} />
                  <ReviewButtons />
                </form>
              </article>
            );
          })}

          {!migrationMissing && suggestedLinks.length === 0 ? (
            <div className={styles.emptySuggestions}>
              <strong>目前没有待确认的关联</strong>
              <p>同步仓库后，系统会根据 Issue 编号、分支名和提交 SHA 给出建议。</p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
