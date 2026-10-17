"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { loadDelivery } from "@/lib/delivery-server";
import { mayGenerateAI } from "@/lib/release-config";
import { parseNarrative, restoreReferences, UUID } from "@/lib/delivery";
import {
  aiInput,
  generateNarrative,
  inputHash,
  PROMPT_VERSION,
} from "@/lib/deepseek";

export type ActionState = { message: string; path?: string; ok?: boolean };
const refresh = (id: string) => {
  revalidatePath(`/app/projects/${id}/delivery`);
  revalidatePath(`/app/projects/${id}/timeline`);
};
export async function deliveryAction(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const projectId = String(form.get("projectId") ?? "");
  if (!UUID.test(projectId)) return { message: "项目编号无效。" };
  const task = String(form.get("task"));
  // Keep authentication redirects outside the error boundary.
  const { supabase, user, githubLogin, items, snapshot } =
    await loadDelivery(projectId);
  try {
    if (task === "generate") {
      if (!process.env.DEEPSEEK_API_KEY?.trim())
        return {
          message:
            "尚未配置 DEEPSEEK_API_KEY。请在本地 .env.local 中设置后重启服务。",
        };
      if (!mayGenerateAI(githubLogin, process.env))
        return {
          message:
            "当前账号未被允许使用站点的 AI 额度。证据浏览、分享与导出不受影响。",
        };
      if (!items.length) return { message: "请先同步至少一条 GitHub 证据。" };
      const model = process.env.DEEPSEEK_MODEL?.trim() || "deepseek-flash";
      if (!["deepseek-flash", "deepseek-v4-pro"].includes(model))
        return { message: "DEEPSEEK_MODEL 配置无效，请参考阶段五配置文档。" };
      // Release abandoned attempts only after the upstream timeout has elapsed.
      const stale = await supabase
        .from("ai_runs")
        .update({
          status: "failed",
          error_code: "interrupted",
          completed_at: new Date().toISOString(),
        })
        .eq("project_id", projectId)
        .eq("owner_id", user.id)
        .eq("status", "running")
        .lt("created_at", new Date(Date.now() - 120000).toISOString());
      if (stale.error)
        return { message: "无法检查 AI 任务状态，请刷新后再试。" };
      const recent = await supabase
        .from("ai_runs")
        .select("id")
        .eq("project_id", projectId)
        .eq("owner_id", user.id)
        .gt("created_at", new Date(Date.now() - 60000).toISOString())
        .limit(1);
      if (recent.error) return { message: "无法检查调用间隔，请稍后重试。" };
      if (recent.data?.length)
        return {
          message: "为避免重复计费，每个项目的 AI 调用至少间隔 60 秒。",
        };
      const input = aiInput(items);
      const { data: run, error } = await supabase
        .from("ai_runs")
        .insert({
          project_id: projectId,
          owner_id: user.id,
          status: "running",
          model,
          prompt_version: PROMPT_VERSION,
          input_hash: inputHash(input),
          evidence_ids: input.map((item) => item.id),
        })
        .select("id")
        .single();
      if (error || !run)
        return { message: "无法创建 AI 任务，可能已有任务运行中。" };
      let result;
      try {
        result = await generateNarrative(input, model);
      } catch (error) {
        const code =
          error instanceof Error &&
          /^provider_\d{3}$|^invalid_(?:output|citations)$|^incomplete_output$/.test(
            error.message,
          )
            ? error.message
            : "request_failed";
        const failed = await supabase
          .from("ai_runs")
          .update({
            status: "failed",
            error_code: code,
            completed_at: new Date().toISOString(),
          })
          .eq("id", run.id)
          .eq("owner_id", user.id);
        refresh(projectId);
        return {
          message: failed.error
            ? "AI 调用未完成，且失败状态保存失败。请两分钟后重试。"
            : `AI 调用未完成（${code}），没有生成可发布内容。请检查服务配置后重试。`,
        };
      }
      const saved = await supabase
        .from("ai_runs")
        .update({
          status: "completed",
          output: result.output,
          usage: result.usage,
          completed_at: new Date().toISOString(),
        })
        .eq("id", run.id)
        .eq("owner_id", user.id)
        .eq("status", "running")
        .select("id")
        .maybeSingle();
      if (saved.error || !saved.data)
        return {
          message:
            "AI 已返回，但草稿保存失败，请刷新检查任务账本，避免重复调用。",
        };
      refresh(projectId);
      return {
        ok: true,
        message: "AI 草稿已保存，尚未对外展示。请核对引用、编辑后确认。",
      };
    }
    if (task === "approve" || task === "reject") {
      const runId = String(form.get("runId"));
      if (!UUID.test(runId)) return { message: "草稿编号无效。" };
      const { data: run, error } = await supabase
        .from("ai_runs")
        .select("id,evidence_ids,status")
        .eq("id", runId)
        .eq("project_id", projectId)
        .eq("owner_id", user.id)
        .maybeSingle();
      if (error || !run || run.status !== "completed")
        return { message: "找不到可审阅的草稿。" };
      const content =
        task === "approve"
          ? parseNarrative(
              restoreReferences({
                summary: String(form.get("summary") ?? ""),
                gaps: String(form.get("gaps") ?? ""),
                script: String(form.get("script") ?? ""),
                citations: String(form.get("citations") ?? "")
                  .split(",")
                  .map((id) => id.trim())
                  .filter(Boolean),
              }),
              run.evidence_ids.filter((id: string) =>
                items.some((item) => item.id === id),
              ),
            )
          : null;
      const saved = await supabase
        .from("ai_runs")
        .update({
          review_status: task === "approve" ? "approved" : "rejected",
          reviewed_output: content,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", run.id)
        .eq("project_id", projectId)
        .eq("owner_id", user.id)
        .select("id")
        .maybeSingle();
      if (saved.error || !saved.data)
        return { message: "审阅结果没有保存，请重试。" };
      refresh(projectId);
      return {
        ok: true,
        message:
          task === "approve"
            ? "已确认这份文字。新导出与新快照会使用它，旧分享快照保持不变。"
            : "已忽略这份草稿。旧快照不会自动撤销；如需停止分享，请撤销对应链接。",
      };
    }
    if (task === "share") {
      if (form.get("publicationConsent") !== "yes")
        return { message: "请先核对交付预览并确认分享范围。" };
      const days = Number(form.get("days"));
      if (![1, 7, 30].includes(days))
        return { message: "请选择 1、7 或 30 天有效期。" };
      const token = randomBytes(32).toString("base64url");
      const { error } = await supabase.from("review_shares").insert({
        project_id: projectId,
        owner_id: user.id,
        token_hash: createHash("sha256").update(token).digest("hex"),
        snapshot,
        expires_at: new Date(Date.now() + days * 86400000 - 1000).toISOString(),
      });
      if (error) return { message: "快照链接创建失败，请刷新后重试。" };
      refresh(projectId);
      return {
        ok: true,
        message:
          "只读快照已创建。完整链接只显示这一次，请及时复制；任何持有链接的人都能访问。",
        path: `/review/${token}`,
      };
    }
    if (task === "revoke") {
      const shareId = String(form.get("shareId"));
      if (!UUID.test(shareId)) return { message: "分享编号无效。" };
      const { data, error } = await supabase
        .from("review_shares")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", shareId)
        .eq("project_id", projectId)
        .eq("owner_id", user.id)
        .is("revoked_at", null)
        .select("id")
        .maybeSingle();
      if (error || !data)
        return { message: "链接不存在、已撤销，或更新失败。请刷新查看状态。" };
      refresh(projectId);
      return {
        ok: true,
        message: "链接已撤销，新的访问会被拒绝；已下载内容无法召回。",
      };
    }
    return { message: "不支持的操作。" };
  } catch {
    return {
      message:
        "操作未完成。请检查草稿是否完整、引用是否属于本次证据，或稍后重试。",
    };
  }
}
