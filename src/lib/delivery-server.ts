import "server-only";
import { notFound } from "next/navigation";
import { requireGitHubUser } from "./auth";
import { buildSnapshot, type DeliveryEvidence, type DeliveryLink, type Narrative, UUID } from "./delivery";

export async function loadDelivery(projectId: string) {
  if (!UUID.test(projectId)) notFound();
  const { supabase, user } = await requireGitHubUser();
  const { data: project, error } = await supabase.from("projects").select("id,name,full_name,html_url,visibility").eq("id", projectId).eq("owner_id", user.id).maybeSingle();
  if (error) throw new Error("暂时无法读取项目，请刷新重试。");
  if (!project || project.visibility !== "public") notFound();
  const [items, links, runs, shares] = await Promise.all([
    supabase.from("evidence_items").select("id,kind,title,state,source_url,occurred_at", { count: "exact" }).eq("project_id", projectId).eq("owner_id", user.id).order("occurred_at", { ascending: false }).limit(1000),
    supabase.from("evidence_links").select("source_id,target_id,relation", { count: "exact" }).eq("project_id", projectId).eq("owner_id", user.id).eq("status", "confirmed").limit(1000),
    supabase.from("ai_runs").select("id,status,review_status,model,prompt_version,evidence_ids,output,reviewed_output,usage,error_code,created_at,reviewed_at").eq("project_id", projectId).eq("owner_id", user.id).order("created_at", { ascending: false }).limit(30),
    supabase.from("review_shares").select("id,created_at,expires_at,revoked_at").eq("project_id", projectId).eq("owner_id", user.id).order("created_at", { ascending: false }).limit(30),
  ]);
  if (items.error || links.error || runs.error || shares.error) throw new Error("交付数据读取失败。请确认阶段五数据库迁移已执行，或稍后刷新。");
  if ((items.count ?? 0) > 1000 || (links.count ?? 0) > 1000) throw new Error("证据或关联超过本阶段 1000 条交付上限，已停止导出，避免静默遗漏。");
  // Fetch approved revision independently, so 30 later drafts cannot hide the published revision.
  const { data: approved, error: approvedError } = await supabase.from("ai_runs").select("reviewed_output,reviewed_at").eq("project_id", projectId).eq("owner_id", user.id).eq("review_status", "approved").order("reviewed_at", { ascending: false }).limit(1).maybeSingle();
  if (approvedError) throw new Error("无法读取已确认版本，请刷新重试。");
  const snapshot = buildSnapshot(project, items.data as DeliveryEvidence[], links.data as DeliveryLink[], approved ? { reviewedAt: approved.reviewed_at, content: approved.reviewed_output as Narrative } : null);
  return { supabase, user, project, items: items.data as DeliveryEvidence[], runs: runs.data, shares: shares.data, snapshot };
}
