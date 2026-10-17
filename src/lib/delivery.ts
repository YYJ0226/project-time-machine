import type { EvidenceKind } from "./evidence";

export type DeliveryEvidence = {
  id: string;
  kind: EvidenceKind;
  title: string;
  state: string | null;
  source_url: string;
  occurred_at: string;
};
export type DeliveryLink = {
  source_id: string;
  target_id: string;
  relation: string;
};
export type Narrative = {
  summary: string;
  gaps: string;
  script: string;
  citations: string[];
};
export type NarrativeBasis = {
  generatedAt: string;
  inputCount: number;
  freshness: "matching" | "changed" | "unknown";
};
export type ReviewSnapshot = {
  version: 1;
  capturedAt: string;
  project: { name: string; full_name: string; html_url: string };
  evidence: DeliveryEvidence[];
  links: DeliveryLink[];
  narrative: null | {
    label: string;
    reviewedAt: string;
    content: Narrative;
    basis?: NarrativeBasis;
  };
};
export const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const kindLabels = {
  issue: "需求",
  commit: "提交",
  pull_request: "PR",
  check: "验证",
};
export function narrativeVersionNotice(basis?: NarrativeBasis) {
  if (basis?.freshness === "matching")
    return "生成样本与当前 AI 输入一致；这不代表结论正确，也不代表覆盖全部证据。";
  if (basis?.freshness === "changed")
    return "历史 AI 版本：生成样本与当前证据不一致，旧文字可能已过时，不代表项目最新状态。请按来源事实复核。";
  return "历史 AI 版本缺少样本版本信息，无法确认是否与当前证据一致。请按来源事实复核，不要将其当作最新结论。";
}
export function readableNarrative(content: Narrative): Narrative {
  const replace = (text: string) =>
    content.citations.reduce(
      (value, id, index) => value.replaceAll(id, `证据${index + 1}`),
      text,
    );
  return {
    ...content,
    summary: replace(content.summary),
    gaps: replace(content.gaps),
    script: replace(content.script),
  };
}
export function restoreReferences(content: Narrative): Narrative {
  const replace = (text: string) =>
    text.replace(/证据(\d+)/g, (_match, number) => {
      const id = content.citations[Number(number) - 1];
      if (!id) throw new Error("invalid_citations");
      return id;
    });
  return {
    ...content,
    summary: replace(content.summary),
    gaps: replace(content.gaps),
    script: replace(content.script),
  };
}

export function redact(value: string) {
  return value.replace(
    /\b(?:sk-[a-zA-Z0-9_-]{16,}|gh[pousr]_[a-zA-Z0-9_]{16,}|github_pat_[a-zA-Z0-9_]{16,}|sb_secret_[a-zA-Z0-9_-]{16,})\b/g,
    "[已隐藏疑似密钥]",
  );
}
export function safeGitHubUrl(value: string): string {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.hostname === "github.com" &&
      !url.username &&
      !url.password
      ? `${url.origin}${url.pathname}`
      : "";
  } catch {
    return "";
  }
}
export function parseNarrative(
  value: unknown,
  allowedIds: string[],
): Narrative {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("invalid_output");
  const item = value as Record<string, unknown>;
  for (const key of ["summary", "gaps", "script"]) {
    if (
      typeof item[key] !== "string" ||
      !item[key].trim() ||
      item[key].length > 12000
    )
      throw new Error("invalid_output");
  }
  if (
    !Array.isArray(item.citations) ||
    !item.citations.length ||
    item.citations.length > 60 ||
    item.citations.some(
      (id) => typeof id !== "string" || !allowedIds.includes(id),
    )
  )
    throw new Error("invalid_citations");
  const mentionedIds =
    [item.summary, item.gaps, item.script]
      .join("\n")
      .match(
        /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi,
      ) ?? [];
  if (mentionedIds.some((id) => !(item.citations as string[]).includes(id)))
    throw new Error("invalid_citations");
  return {
    summary: redact((item.summary as string).trim()),
    gaps: redact((item.gaps as string).trim()),
    script: redact((item.script as string).trim()),
    citations: [...new Set(item.citations as string[])],
  };
}

export function buildSnapshot(
  project: ReviewSnapshot["project"],
  evidence: DeliveryEvidence[],
  links: DeliveryLink[],
  approved: null | {
    reviewedAt: string;
    content: Narrative;
    basis?: NarrativeBasis;
  },
  now = new Date(),
): ReviewSnapshot {
  // Allowlist fields, never spread a database row (raw source_data and AI prompts must stay private).
  const items = evidence.map((item) => ({
    id: item.id,
    kind: item.kind,
    title: redact(item.title),
    state: item.state ? redact(item.state) : null,
    source_url: safeGitHubUrl(item.source_url),
    occurred_at: item.occurred_at,
  }));
  const ids = items.map((item) => item.id);
  return {
    version: 1,
    capturedAt: now.toISOString(),
    project: {
      name: redact(project.name),
      full_name: redact(project.full_name),
      html_url: safeGitHubUrl(project.html_url),
    },
    evidence: items,
    links: links
      .filter(
        (link) => ids.includes(link.source_id) && ids.includes(link.target_id),
      )
      .map((link) => ({
        source_id: link.source_id,
        target_id: link.target_id,
        relation: link.relation,
      })),
    narrative: approved
      ? {
          label: "AI 生成，经学生编辑并确认；不代表原始事实",
          reviewedAt: approved.reviewedAt,
          content: parseNarrative(approved.content, ids),
          ...(approved.basis
            ? {
                basis: {
                  generatedAt: approved.basis.generatedAt,
                  inputCount: approved.basis.inputCount,
                  freshness: approved.basis.freshness,
                },
              }
            : {}),
        }
      : null,
  };
}

const plain = (value: string) =>
  value.replace(/[\r\n]+/g, " ").replace(/[\\`*_{}\[\]<>#!|]/g, "\\$&");
export function exportMarkdown(
  snapshot: ReviewSnapshot,
  format: "report" | "script",
) {
  const { project, evidence, narrative } = snapshot;
  const intro = `# ${plain(project.full_name)} · ${format === "report" ? "课程过程报告" : "视频讲解提纲"}\n\n仓库：${project.html_url}\n\n数据截取：${snapshot.capturedAt}\n\n`;
  const facts = `## 原始证据索引\n\n${evidence.map((item) => `- ${plain(kindLabels[item.kind])} | ${plain(item.title)} | ${plain(item.state ?? "recorded")} | ${item.occurred_at} | ${item.source_url} | ID: ${item.id}`).join("\n")}\n\n## 已确认关系\n\n${snapshot.links.map((link) => `- ${link.source_id} → ${link.target_id} (${link.relation})`).join("\n") || "暂无人工确认关系。"}\n\n`;
  // Keep AI/user text as literal text, not executable HTML or invented Markdown links.
  const quote = (value: string) =>
    value
      .split("\n")
      .map((line) => `> ${plain(line)}`)
      .join("\n");
  const readable = narrative ? readableNarrative(narrative.content) : null;
  const provenance = narrative
    ? `${narrativeVersionNotice(narrative.basis)}\n\n${narrative.basis ? `生成时间：${narrative.basis.generatedAt}；生成输入：${narrative.basis.inputCount} 条。\n\n` : ""}`
    : "";
  const body =
    narrative && readable
      ? `## ${narrative.label}\n\n确认时间：${narrative.reviewedAt}\n\n${provenance}${format === "report" ? `### 阶段摘要\n\n${quote(readable.summary)}\n\n### 待核对提醒（AI 推断）\n\n${quote(readable.gaps)}` : quote(readable.script)}\n\n引用证据：\n${narrative.content.citations.map((id, i) => `- 证据${i + 1}：${id}`).join("\n")}\n\n`
      : `## 尚无人工确认的 AI 草稿\n\n${format === "script" ? "以下为固定录屏结构，不是 AI 生成稿：\n\n1. 介绍项目目的与仓库。\n2. 打开需求、提交、PR 和验证记录，说明原文在哪里。\n3. 沿已确认关系演示时间线与回放。\n4. 说明已完成部分、局限和下一步。\n\n" : "本报告仅整理原始证据，不把未确认草稿作为结论。\n\n"}`;
  return (
    intro +
    body +
    facts +
    "## 边界\n\n证据来自公开仓库的已采集记录，不代表完整开发历史。AI 归纳可能出错；引用不等于结论已被验证。分享撤销无法召回已下载文件或截图。\n"
  );
}
