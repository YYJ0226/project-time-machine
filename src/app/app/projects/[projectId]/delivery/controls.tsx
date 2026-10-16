"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { deliveryAction, type ActionState } from "./actions";
import { readableNarrative, type Narrative } from "@/lib/delivery";
import styles from "./delivery.module.css";

function Submit({ children, task, secondary = false }: { children: React.ReactNode; task: string; secondary?: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" name="task" value={task} disabled={pending} className={secondary ? styles.secondary : styles.primary}>{pending ? "处理中…" : children}</button>;
}
export function DeliveryForm({ projectId, task, runId, shareId, content, children }: {
  projectId: string; task: "generate" | "review" | "share" | "revoke"; runId?: string; shareId?: string; content?: Narrative; children?: React.ReactNode;
}) {
  const [state, action, pending] = useActionState(deliveryAction, { message: "" } as ActionState);
  const [copied, setCopied] = useState(false);
  const readable = content ? readableNarrative(content) : null;
  return <form action={action} className={styles.form} aria-busy={pending}>
    <input type="hidden" name="projectId" value={projectId} />
    {runId ? <input type="hidden" name="runId" value={runId} /> : null}
    {shareId ? <input type="hidden" name="shareId" value={shareId} /> : null}
    {children}
    {task === "review" && content && readable ? <>
      <label>阶段摘要<textarea name="summary" defaultValue={readable.summary} required maxLength={12000} rows={6} /></label>
      <label>缺失证据提醒（AI 推断，需核对）<textarea name="gaps" defaultValue={readable.gaps} required maxLength={12000} rows={4} /></label>
      <label>视频讲解草稿<textarea name="script" defaultValue={readable.script} required maxLength={12000} rows={8} /></label>
      <input type="hidden" name="citations" value={content.citations.join(",")} />
      <p className={styles.note}>确认前请逐条打开下方引用原文核对。确认只代表你接受这份文字，不证明 AI 的推断正确。</p>
      <div className={styles.row}><Submit task="approve">确认这份文字</Submit><Submit task="reject" secondary>忽略这份草稿</Submit></div>
    </> : task === "share" ? <>
      <label>链接有效期<select name="days" defaultValue="7"><option value="1">1 天</option><option value="7">7 天</option><option value="30">30 天</option></select></label>
      <label className={styles.consent}><input type="checkbox" name="publicationConsent" value="yes" required />我已核对下方交付预览，同意任何持有链接的人在有效期内读取这份快照。</label>
      <Submit task="share">创建只读快照</Submit>
    </> : task === "generate" ? <Submit task="generate">生成 AI 草稿</Submit> : task === "revoke" ? <Submit task="revoke" secondary>撤销链接</Submit> : null}
    {state.message ? <p role={state.ok ? "status" : "alert"} className={state.ok ? styles.success : styles.warning}>{state.message}</p> : null}
    {state.path ? <div className={styles.created}>
      <a href={state.path} target="_blank" rel="noreferrer">打开教师视图</a>
      <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(new URL(state.path!, window.location.origin).href); setCopied(true); } catch { setCopied(false); } }}>{copied ? "已复制完整链接" : "复制完整链接"}</button>
      <p>链接：<code>{state.path}</code></p>
      <small>本地 localhost 链接仅当前电脑可访问；公网访问将在部署阶段完成。</small>
    </div> : null}
  </form>;
}
