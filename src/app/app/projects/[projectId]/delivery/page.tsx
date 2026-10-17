import Link from "next/link";
import { loadDelivery } from "@/lib/delivery-server";
import { type Narrative, kindLabels } from "@/lib/delivery";
import { DeliveryForm } from "./controls";
import { SnapshotView } from "@/components/snapshot-view";
import styles from "./delivery.module.css";

export const instant = false;
export const maxDuration = 120;
export default async function DeliveryPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { project, runs, shares, items, snapshot } =
    await loadDelivery(projectId);
  const configured = Boolean(process.env.DEEPSEEK_API_KEY?.trim());
  const draft = runs.find(
    (run) => run.status === "completed" && run.review_status === "draft",
  );
  const content = draft?.output as Narrative | undefined;
  const date = (value: string) =>
    new Date(value).toLocaleString("zh-CN", {
      timeZone: "Asia/Shanghai",
      hour12: false,
    });
  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <Link href="/app" className={styles.brand}>
          ◉ Project Time Machine
        </Link>
        <nav>
          <Link href={`/app/projects/${projectId}`} prefetch={false}>
            证据工作台
          </Link>
          <Link href={`/app/projects/${projectId}/timeline`} prefetch={false}>
            时间线与回放
          </Link>
        </nav>
      </header>
      <div className={styles.intro}>
        <p>{project.full_name}</p>
        <h1>把开发过程，交到读者手中。</h1>
        <p>先核对草稿，再发布一份固定的只读快照。每个结论都应能回到证据。</p>
      </div>
      <div className={styles.workspace}>
        <section className={styles.editor} aria-labelledby="draft-title">
          <div className={styles.sectionHeading}>
            <h2 id="draft-title">私人审稿区</h2>
            <span>未确认内容不会分享</span>
          </div>
          <DeliveryForm projectId={projectId} task="generate">
            <p className={styles.note}>
              {configured ? "DeepSeek 已配置" : "尚未配置 DeepSeek 密钥"}
              。点击生成会把最近最多 60 条公开证据的标题、类型、状态、时间和 ID
              发送给 DeepSeek，并可能产生 API
              费用；不发送证据正文、密钥或仓库文件。每次调用均留痕。
            </p>
          </DeliveryForm>
          {draft && content ? (
            <div className={styles.draft} key={draft.id}>
              <p className={styles.aiBadge}>AI 生成 · 待人工确认</p>
              <DeliveryForm
                projectId={projectId}
                task="review"
                runId={draft.id}
                content={content}
              />
              <details>
                <summary>核对引用原文（{content.citations.length} 条）</summary>
                <ul>
                  {content.citations.map((id, index) => {
                    const item = items.find((item) => item.id === id);
                    return (
                      <li key={id}>
                        {item ? (
                          <>
                            <a
                              href={item.source_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              证据{index + 1} · {kindLabels[item.kind]}：
                              {item.title}
                            </a>
                            <small>{id}</small>
                          </>
                        ) : (
                          id
                        )}
                      </li>
                    );
                  })}
                </ul>
              </details>
            </div>
          ) : (
            <div className={styles.empty}>
              <span aria-hidden="true">◇</span>
              <h3>没有待确认草稿</h3>
              <p>
                生成后可在这里编辑摘要、提醒和讲解稿。已有确认版本仍会出现在交付预览中。
              </p>
            </div>
          )}
          <details className={styles.ledger} open>
            <summary>AI 任务账本（最近 30 次）</summary>
            {runs.length ? (
              runs.map((run) => (
                <article key={run.id}>
                  <div className={styles.row}>
                    <strong>
                      {
                        {
                          running: "运行中",
                          completed: "已生成",
                          failed: "调用失败",
                        }[run.status as "running" | "completed" | "failed"]
                      }
                    </strong>
                    <span>
                      {
                        {
                          draft: "未确认",
                          approved: "人工已确认",
                          rejected: "已忽略",
                        }[
                          run.review_status as "draft" | "approved" | "rejected"
                        ]
                      }
                    </span>
                  </div>
                  <p>
                    {run.model} · {date(run.created_at)} ·{" "}
                    {run.evidence_ids.length} 条输入
                  </p>
                  <small>
                    {run.prompt_version} · {run.usage?.total_tokens ?? "—"}{" "}
                    tokens{run.error_code ? ` · ${run.error_code}` : ""}
                  </small>
                  {run.id !== draft?.id && run.status === "completed" ? (
                    <details>
                      <summary>查看／重新审阅此版本</summary>
                      <DeliveryForm
                        projectId={projectId}
                        task="review"
                        runId={run.id}
                        content={
                          (run.reviewed_output ?? run.output) as Narrative
                        }
                      />
                      <ol>
                        {(
                          (run.reviewed_output ?? run.output) as Narrative
                        ).citations.map((id, index) => {
                          const item = items.find((item) => item.id === id);
                          return (
                            <li key={id}>
                              证据{index + 1}：
                              {item ? (
                                <a
                                  href={item.source_url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {item.title}
                                </a>
                              ) : (
                                "原证据已不在当前采集列表，不能再次确认此引用。"
                              )}
                            </li>
                          );
                        })}
                      </ol>
                    </details>
                  ) : null}
                </article>
              ))
            ) : (
              <p className={styles.note}>
                还没有真实调用记录；此处不会放模拟 AI 结果。
              </p>
            )}
          </details>
        </section>
        <aside className={styles.publish} aria-labelledby="publish-title">
          <div className={styles.sectionHeading}>
            <h2 id="publish-title">交付控制</h2>
            <span>
              {snapshot.narrative ? "已确认文字可交付" : "仅交付原始证据"}
            </span>
          </div>
          <p>
            新快照将包含 {snapshot.evidence.length} 条公开证据标题、
            {snapshot.links.length} 条已确认关系
            {snapshot.narrative
              ? "和人工确认的 AI 文字"
              : "；不包含未确认 AI 文字"}
            。不包含正文、环境变量和完整提示词。
          </p>
          <DeliveryForm projectId={projectId} task="share" />
          <section className={styles.exports}>
            <h3>下载课程材料</h3>
            <a href={`/app/projects/${projectId}/export?format=report`}>
              下载 Markdown 报告
            </a>
            <a href={`/app/projects/${projectId}/export?format=script`}>
              下载视频讲解提纲
            </a>
            <p className={styles.note}>
              按当前确认版本生成。撤销分享不能召回已下载的文件。
            </p>
          </section>
          <section className={styles.shareList}>
            <h3>已创建的链接</h3>
            {shares.length ? (
              shares.map((share) => (
                <article key={share.id}>
                  <strong>
                    {share.revoked_at
                      ? "已撤销"
                      : Date.parse(share.expires_at) <=
                          Date.parse(snapshot.capturedAt)
                        ? "已过期"
                        : "有效"}
                  </strong>
                  <p>
                    创建 {date(share.created_at)}
                    <br />
                    到期 {date(share.expires_at)}
                  </p>
                  <small>
                    编号 {share.id.slice(0, 8)} · 原链接不会再次显示
                  </small>
                  {!share.revoked_at &&
                  Date.parse(share.expires_at) >
                    Date.parse(snapshot.capturedAt) ? (
                    <DeliveryForm
                      projectId={projectId}
                      task="revoke"
                      shareId={share.id}
                    />
                  ) : null}
                </article>
              ))
            ) : (
              <p className={styles.note}>还没有创建分享链接。</p>
            )}
          </section>
        </aside>
      </div>
      <section className={styles.preview} aria-label="交付内容预览">
        <div className={styles.sectionHeading}>
          <h2>交付内容预览</h2>
          <span>这是新快照／导出的内容，不是旧链接</span>
        </div>
        <SnapshotView snapshot={snapshot} />
      </section>
    </main>
  );
}
