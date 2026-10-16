import { kindLabels, readableNarrative, safeGitHubUrl, type ReviewSnapshot } from "@/lib/delivery";
import styles from "./snapshot-view.module.css";

export function SnapshotView({ snapshot }: { snapshot: ReviewSnapshot }) {
  const { project, evidence, links, narrative } = snapshot;
  const readable = narrative ? readableNarrative(narrative.content) : null;
  return <div className={styles.document}>
    <div className={styles.title}><h2>{project.full_name}</h2><a href={safeGitHubUrl(project.html_url)} target="_blank" rel="noreferrer">打开公开仓库</a><p>数据截取：{new Date(snapshot.capturedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false })}（北京时间）</p></div>
    <div className={styles.boundary}>这是已采集公开证据的固定快照，不是实时仓库。未确认 AI 草稿不在此页；引用只帮助核对，不代表 AI 结论已经得到证明。</div>
    {narrative && readable ? <section className={styles.narrative}><p className={styles.label}>{narrative.label}</p><h3>阶段摘要</h3><p>{readable.summary}</p><h3>待核对提醒</h3><p>{readable.gaps}</p><details><summary>讲解稿与引用</summary><p>{readable.script}</p><ul>{narrative.content.citations.map((id, index) => <li key={id}><a href={`#evidence-${id}`}>证据{index + 1} · {evidence.find(item => item.id === id)?.title}</a></li>)}</ul></details><small>人工确认：{new Date(narrative.reviewedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</small></section> : <p className={styles.boundary}>尚无人工确认的 AI 文字。以下只展示原始证据。</p>}
    <section><h3>证据时间线 <small>{evidence.length} 条</small></h3><ol className={styles.timeline}>{[...evidence].sort((a,b) => Date.parse(a.occurred_at) - Date.parse(b.occurred_at)).map(item => <li key={item.id} id={`evidence-${item.id}`}><div><span>{kindLabels[item.kind]}</span><time dateTime={item.occurred_at}>{new Date(item.occurred_at).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false })}</time></div><a href={safeGitHubUrl(item.source_url)} target="_blank" rel="noreferrer">{item.title}</a><p>{item.state ?? "recorded"} <code>{item.id.slice(0,8)}</code></p></li>)}</ol></section>
    <section><h3>人工确认的关系 <small>{links.length} 条</small></h3>{links.length ? <ul className={styles.links}>{links.map((link, i) => <li key={i}><a href={`#evidence-${link.source_id}`}>{evidence.find(item => item.id === link.source_id)?.title}</a><span>{({ implements: "实现于", contains: "归入", verifies: "验证于" })[link.relation as "implements" | "contains" | "verifies"] ?? link.relation}</span><a href={`#evidence-${link.target_id}`}>{evidence.find(item => item.id === link.target_id)?.title}</a></li>)}</ul> : <p>暂无已确认关系，不将关联建议当作事实展示。</p>}</section>
  </div>;
}
