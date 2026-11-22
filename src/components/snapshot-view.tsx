import {
  kindLabels,
  narrativeVersionNotice,
  readableNarrative,
  safeGitHubUrl,
  type ReviewSnapshot,
} from "@/lib/delivery";
import styles from "./snapshot-view.module.css";

const kindTone: Record<string, "requirement" | "code" | "verification"> = {
  issue: "requirement",
  commit: "code",
  pull_request: "code",
  check: "verification",
};

export function SnapshotView({
  snapshot,
  mainHeading = false,
}: {
  snapshot: ReviewSnapshot;
  mainHeading?: boolean;
}) {
  const { project, evidence, links, narrative } = snapshot;
  const readable = narrative ? readableNarrative(narrative.content) : null;
  const Heading = mainHeading ? "h1" : "h2";

  return (
    <div className={styles.document}>
      <div className={styles.titleBar}>
        <div className={styles.titleMeta}>
          <Heading>{project.full_name}</Heading>
          <p>
            数据截取：
            {new Date(snapshot.capturedAt).toLocaleString("zh-CN", {
              timeZone: "Asia/Shanghai",
              hour12: false,
            })}
            （北京时间） · 共 {evidence.length} 条公开证据 · {links.length} 条已确认关系
          </p>
        </div>
        <a
          className={styles.repoButton}
          href={safeGitHubUrl(project.html_url)}
          target="_blank"
          rel="noreferrer"
        >
          打开公开仓库 ↗
        </a>
      </div>

      <div className={styles.boundary}>
        这是已采集公开证据的固定快照，不是实时仓库。未确认 AI
        草稿不在此页；引用只帮助核对，不代表 AI 结论已经得到证明。
      </div>

      {narrative && readable ? (
        <section className={styles.narrative}>
          <div className={styles.narrativeHead}>
            <p className={styles.label}>{narrative.label}</p>
            <small>
              人工确认：
              {new Date(narrative.reviewedAt).toLocaleString("zh-CN", {
                timeZone: "Asia/Shanghai",
              })}
            </small>
          </div>

          <div
            className={styles.versionNote}
            role="note"
            aria-label="AI 版本与样本范围"
          >
            <p>{narrativeVersionNotice(narrative.basis)}</p>
            {narrative.basis ? (
              <p>
                生成时间：
                {new Date(narrative.basis.generatedAt).toLocaleString("zh-CN", {
                  timeZone: "Asia/Shanghai",
                  hour12: false,
                })}
                （北京时间） · 生成输入 {narrative.basis.inputCount} 条；
                下方原始证据为本快照的 {evidence.length} 条，不应混同。
              </p>
            ) : null}
          </div>

          <div className={styles.narrativeGrid}>
            <div className={styles.narrativeBlock}>
              <h3>阶段摘要</h3>
              <p>{readable.summary}</p>
            </div>
            <div className={styles.narrativeBlock}>
              <h3>待核对提醒</h3>
              <p>{readable.gaps}</p>
            </div>
          </div>

          <details className={styles.scriptDetails}>
            <summary>讲解稿与引用（{narrative.content.citations.length} 条）</summary>
            <p>{readable.script}</p>
            <ul>
              {narrative.content.citations.map((id, index) => (
                <li key={id}>
                  <a href={`#evidence-${id}`}>
                    证据{index + 1} ·{" "}
                    {evidence.find((item) => item.id === id)?.title}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        </section>
      ) : (
        <p className={styles.boundary}>
          尚无人工确认的 AI 文字。以下只展示原始证据。
        </p>
      )}

      <section className={styles.sectionBlock}>
        <div className={styles.sectionTitle}>
          <h3>证据时间线</h3>
          <small>{evidence.length} 条</small>
        </div>

        <ol className={styles.timeline}>
          {[...evidence]
            .sort(
              (a, b) => Date.parse(a.occurred_at) - Date.parse(b.occurred_at),
            )
            .map((item) => (
              <li
                key={item.id}
                id={`evidence-${item.id}`}
                data-signal={kindTone[item.kind] ?? "verification"}
              >
                <div className={styles.eventMeta}>
                  <span className={styles.kindChip}>
                    {kindLabels[item.kind]}
                  </span>
                  <time dateTime={item.occurred_at}>
                    {new Date(item.occurred_at).toLocaleString("zh-CN", {
                      timeZone: "Asia/Shanghai",
                      hour12: false,
                    })}
                  </time>
                </div>
                <a
                  className={styles.eventTitle}
                  href={safeGitHubUrl(item.source_url)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {item.title}
                </a>
                <p className={styles.eventSub}>
                  {item.state ?? "recorded"} <code>{item.id.slice(0, 8)}</code>
                </p>
              </li>
            ))}
        </ol>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionTitle}>
          <h3>人工确认的关系</h3>
          <small>{links.length} 条</small>
        </div>

        {links.length ? (
          <ul className={styles.links}>
            {links.map((link, i) => (
              <li key={i}>
                <a href={`#evidence-${link.source_id}`}>
                  {evidence.find((item) => item.id === link.source_id)?.title}
                </a>
                <span>
                  {{
                    implements: "实现于",
                    contains: "归入",
                    verifies: "验证于",
                  }[link.relation as "implements" | "contains" | "verifies"] ??
                    link.relation}
                </span>
                <a href={`#evidence-${link.target_id}`}>
                  {evidence.find((item) => item.id === link.target_id)?.title}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyText}>
            暂无已确认关系，不将关联建议当作事实展示。
          </p>
        )}
      </section>
    </div>
  );
}
