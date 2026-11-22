import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ProjectNav } from "@/components/project-nav";
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
  error_message: string | null;
};

export const instant = false;
export const maxDuration = 120;

const laneContent: Array<{
  key: "requirement" | "implementation" | "verification";
  signal: "requirement" | "code" | "verification";
  title: string;
  description: string;
  kinds: EvidenceKind[];
}> = [
  {
    key: "requirement",
    signal: "requirement",
    title: "需求信号",
    description: "Issue 定义为什么要做",
    kinds: ["issue"],
  },
  {
    key: "implementation",
    signal: "code",
    title: "实现信号",
    description: "Commit 与 PR 记录怎么完成",
    kinds: ["commit", "pull_request"],
  },
  {
    key: "verification",
    signal: "verification",
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

const kindSignal: Record<EvidenceKind, "requirement" | "code" | "verification"> = {
  issue: "requirement",
  commit: "code",
  pull_request: "code",
  check: "verification",
};

const relationNames = {
  implements: "实现于",
  contains: "归入",
  verifies: "验证于",
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
    <article
      className={styles.evidenceCard}
      data-kind={item.kind}
      data-signal={kindSignal[item.kind]}
    >
      <div className={styles.cardMeta}>
        <span className={styles.kindTag}>{kindNames[item.kind]}</span>
        <time dateTime={item.occurred_at}>{formatDate(item.occurred_at)}</time>
      </div>
      <h3>{item.title}</h3>
      {item.summary ? (
        <details className={styles.evidenceDetails}>
          <summary>查看证据详情</summary>
          <p>{item.summary}</p>
        </details>
      ) : null}
      <div className={styles.cardFooter}>
        <span className={styles.statePill}>{item.state || "recorded"}</span>
        <a href={item.source_url} target="_blank" rel="noreferrer">
          GitHub 原文 ↗
        </a>
      </div>
    </article>
  );
}

function EvidenceLinkCard({
  link,
  source,
  target,
  projectId,
}: {
  link: EvidenceLink;
  source: EvidenceItem;
  target: EvidenceItem;
  projectId: string;
}) {
  return (
    <article className={styles.suggestion} data-status={link.status}>
      <div className={styles.confidence}>
        {link.status === "suggested" ? (
          <>
            <strong>{Math.round(Number(link.confidence) * 100)}</strong>
            <span>/100 规则评分</span>
          </>
        ) : (
          <span className={styles.reviewBadge}>
            {link.status === "confirmed" ? "已确认" : "已忽略"}
          </span>
        )}
      </div>
      <div className={styles.relationship}>
        <div className={styles.endpoint} data-signal={kindSignal[source.kind]}>
          <span>{kindNames[source.kind]}</span>
          <a href={source.source_url} target="_blank" rel="noreferrer">
            {source.title}
          </a>
        </div>
        <i className={styles.relationPill}>{relationNames[link.relation]}</i>
        <div className={styles.endpoint} data-signal={kindSignal[target.kind]}>
          <span>{kindNames[target.kind]}</span>
          <a href={target.source_url} target="_blank" rel="noreferrer">
            {target.title}
          </a>
        </div>
        <p className={styles.reasons}>{link.reasons.join("；")}</p>
      </div>
      <form action={reviewEvidenceLink} className={styles.reviewForm}>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="linkId" value={link.id} />
        <ReviewButtons reviewed={link.status !== "suggested"} />
      </form>
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
  const { data: projectData, error: projectError } = await supabase
    .from("projects")
    .select("id,name,full_name,html_url,default_branch,language")
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (projectError) {
    return (
      <main className={styles.shell}>
        <div className={styles.container}>
          <div className={styles.error} role="alert">
            暂时无法读取项目，请刷新重试。<Link href="/app">返回项目列表</Link>
          </div>
        </div>
      </main>
    );
  }

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
      .order("confidence", { ascending: false }),
    supabase
      .from("sync_runs")
      .select(
        "id,status,issue_count,commit_count,pull_request_count,check_count,suggestion_count,started_at,completed_at,error_message",
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
  const rejectedLinks = links.filter((link) => link.status === "rejected");
  const readError = itemsResult.error || linksResult.error || runResult.error;
  const groups = [
    {
      id: "suggestions",
      title: "待确认关联",
      links: suggestedLinks,
      description:
        "规则评分来自编号引用与提交 SHA，不代表正确率。核对原文后再确认。",
      empty: "目前没有待确认的关联",
      hint: "同步后，有明确引用或相同 SHA 的证据会出现在这里。",
    },
    {
      id: "confirmed",
      title: "已确认关系",
      links: confirmedLinks,
      description:
        "这些关系已经过人工确认。点击两端证据查看 GitHub 原文；发现不合适时可撤销审阅。",
      empty: "还没有已确认的关系",
      hint: "从待确认区核对一条建议，再点击「确认关联」。",
    },
    {
      id: "rejected",
      title: "已忽略关系",
      links: rejectedLinks,
      description:
        "忽略记录会保留，重复同步不会再次打扰。撤销审阅可把它放回待确认区。",
      empty: "目前没有已忽略的关系",
      hint: "不合适的建议可以忽略，也可以随时恢复。",
    },
  ];

  return (
    <main className={styles.shell}>
      <ProjectNav
        projectId={project.id}
        projectName={project.name}
        active="evidence"
        actions={
          <a href={project.html_url} target="_blank" rel="noreferrer">
            GitHub 仓库 ↗
          </a>
        }
      />

      <div className={styles.container}>
        <section className={styles.commandBar}>
          <div className={styles.commandCopy}>
            <div className={styles.metaPills}>
              <span>@{githubLogin}</span>
              <span>{project.language || "未识别语言"}</span>
              <span>分支 {project.default_branch}</span>
            </div>
            <h1>
              从需求，到实现，
              <span className={styles.gradientText}>再到通过测试。</span>
            </h1>
            <p>
              同步最近 100 条 GitHub 原始记录，按规则生成关联建议，再由你逐条核对确认。
            </p>
          </div>

          <form action={syncEvidence} className={styles.syncForm}>
            <input type="hidden" name="projectId" value={project.id} />
            <SyncButton />
            <small>
              {lastRun
                ? `最近同步：${formatDate(lastRun.completed_at || lastRun.started_at)}`
                : "尚未同步过 GitHub 证据"}
            </small>
          </form>
        </section>

        {migrationMissing ? (
          <div className={styles.error} role="alert">
            阶段三数据库迁移尚未执行，请先运行
            <code>20261016000200_create_evidence_graph.sql</code>。
          </div>
        ) : readError ? (
          <div className={styles.error} role="alert">
            部分证据暂时无法读取，下面的数量可能不完整，请刷新重试。
          </div>
        ) : null}
        {query.error ? (
          <div className={styles.error} role="alert">
            {query.error}
          </div>
        ) : null}
        {query.synced ? (
          <div className={styles.success} role="status">
            GitHub 证据已更新，已有的人工审阅结果会保留。
          </div>
        ) : null}

        <section className={styles.metrics} aria-label="证据统计">
          <div data-signal="requirement">
            <span>需求 Issue</span>
            <strong>{items.filter((item) => item.kind === "issue").length}</strong>
          </div>
          <div data-signal="code">
            <span>代码 Commit</span>
            <strong>{items.filter((item) => item.kind === "commit").length}</strong>
          </div>
          <div data-signal="code">
            <span>合并请求 PR</span>
            <strong>
              {items.filter((item) => item.kind === "pull_request").length}
            </strong>
          </div>
          <div data-signal="verification">
            <span>CI 验证</span>
            <strong>{items.filter((item) => item.kind === "check").length}</strong>
          </div>
          <div className={styles.confirmedMetric} data-signal="verification">
            <span>已确认关联</span>
            <strong>{confirmedLinks.length}</strong>
          </div>
        </section>

        <div className={styles.toolbarRow}>
          <nav className={styles.sectionNav} aria-label="证据工作台导航">
            <a href="#evidence">
              全部证据 <span>{items.length}</span>
            </a>
            {groups.map((group) => (
              <a key={group.id} href={`#${group.id}`}>
                {group.title} <span>{group.links.length}</span>
              </a>
            ))}
          </nav>

          {lastRun ? (
            <p className={styles.syncStatus} role="status">
              最近批次：
              <strong>
                {
                  ({ running: "同步中", completed: "已完成", failed: "失败" })[
                    lastRun.status
                  ]
                }
              </strong>
              {lastRun.status === "failed"
                ? ` · ${lastRun.error_message || "请重新同步"}`
                : null}
              {lastRun.status === "completed"
                ? ` · 需求 ${lastRun.issue_count} · 提交 ${lastRun.commit_count} · PR ${lastRun.pull_request_count} · 验证 ${lastRun.check_count}`
                : null}
            </p>
          ) : null}
        </div>

        <section
          className={styles.signalBoard}
          aria-label="项目证据链"
          id="evidence"
        >
          {laneContent.map((lane) => {
            const laneItems = items.filter((item) =>
              lane.kinds.includes(item.kind),
            );

            return (
              <section
                className={styles.lane}
                key={lane.key}
                data-signal={lane.signal}
              >
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
                  {laneItems.length > 12 ? (
                    <details className={styles.moreEvidence}>
                      <summary>查看其余 {laneItems.length - 12} 条证据</summary>
                      <div>
                        {laneItems.slice(12).map((item) => (
                          <EvidenceCard item={item} key={item.id} />
                        ))}
                      </div>
                    </details>
                  ) : null}
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

        {groups.map((group) => (
          <section
            className={styles.suggestions}
            key={group.id}
            id={group.id}
            aria-label={group.title}
          >
            <header>
              <div>
                <h2>
                  {group.title} <small>{group.links.length}</small>
                </h2>
                <p>{group.description}</p>
              </div>
            </header>
            <div className={styles.suggestionList}>
              {group.links.map((link) => {
                const source = itemMap.get(link.source_id);
                const target = itemMap.get(link.target_id);

                return source && target ? (
                  <EvidenceLinkCard
                    key={link.id}
                    link={link}
                    source={source}
                    target={target}
                    projectId={project.id}
                  />
                ) : null;
              })}
              {!readError && group.links.length === 0 ? (
                <div className={styles.emptySuggestions}>
                  <strong>{group.empty}</strong>
                  <p>{group.hint}</p>
                </div>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
