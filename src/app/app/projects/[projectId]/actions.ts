"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireGitHubUser } from "@/lib/auth";
import { suggestEvidenceLinks, type EvidenceDraft } from "@/lib/evidence";
import { fetchRepositoryEvidence } from "@/lib/github-evidence";
import { isOwnedPublicRepository } from "@/lib/github";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readUuid(value: FormDataEntryValue | null) {
  return typeof value === "string" && UUID_PATTERN.test(value) ? value : null;
}

function projectRedirect(
  projectId: string,
  type: "error" | "synced",
  value: string,
): never {
  redirect(
    `/app/projects/${projectId}?${type}=${encodeURIComponent(value)}`,
  );
}

function toDatabaseItem(
  draft: EvidenceDraft,
  projectId: string,
  ownerId: string,
) {
  return {
    project_id: projectId,
    owner_id: ownerId,
    kind: draft.kind,
    external_id: draft.externalId,
    title: draft.title,
    summary: draft.summary,
    state: draft.state,
    source_url: draft.sourceUrl,
    occurred_at: draft.occurredAt,
    source_data: draft.sourceData,
    last_seen_at: new Date().toISOString(),
  };
}

export async function syncEvidence(formData: FormData) {
  const projectId = readUuid(formData.get("projectId"));

  if (!projectId) {
    redirect("/app?error=项目标识不正确。");
  }

  const { supabase, user, githubLogin } = await requireGitHubUser();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id,full_name")
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (projectError || !project) {
    redirect("/app?error=找不到可同步的项目。");
  }

  const { data: run, error: runError } = await supabase
    .from("sync_runs")
    .insert({ project_id: project.id, owner_id: user.id, status: "running" })
    .select("id")
    .single();

  if (runError || !run) {
    projectRedirect(projectId, "error", "无法创建同步记录，请确认已执行阶段三迁移。");
  }

  try {
    const evidence = await fetchRepositoryEvidence(project.full_name);

    if (!isOwnedPublicRepository(evidence.repository, githubLogin)) {
      throw new Error("仓库身份或可见性已经变化，已停止同步。");
    }

    const drafts = [
      ...evidence.issues,
      ...evidence.commits,
      ...evidence.pullRequests,
      ...evidence.checks,
    ];

    if (drafts.length > 0) {
      const { error } = await supabase.from("evidence_items").upsert(
        drafts.map((draft) => toDatabaseItem(draft, project.id, user.id)),
        { onConflict: "project_id,kind,external_id" },
      );

      if (error) {
        throw new Error("证据保存失败，请稍后重试。");
      }
    }

    const { data: storedItems, error: itemError } = await supabase
      .from("evidence_items")
      .select("id,kind,external_id,title,summary,source_data")
      .eq("project_id", project.id);

    if (itemError) {
      throw new Error("证据关联前读取失败。");
    }

    const suggestions = suggestEvidenceLinks(storedItems ?? []);

    if (suggestions.length > 0) {
      const { error } = await supabase.from("evidence_links").upsert(
        suggestions.map((suggestion) => ({
          project_id: project.id,
          owner_id: user.id,
          source_id: suggestion.sourceId,
          target_id: suggestion.targetId,
          relation: suggestion.relation,
          confidence: suggestion.confidence,
          reasons: suggestion.reasons,
        })),
        { onConflict: "project_id,source_id,target_id,relation" },
      );

      if (error) {
        throw new Error("关联建议保存失败。");
      }
    }

    const { error: completionError } = await supabase
      .from("sync_runs")
      .update({
        status: "completed",
        issue_count: evidence.issues.length,
        commit_count: evidence.commits.length,
        pull_request_count: evidence.pullRequests.length,
        check_count: evidence.checks.length,
        suggestion_count: suggestions.length,
        completed_at: new Date().toISOString(),
      })
      .eq("id", run.id);

    if (completionError) {
      throw new Error("同步完成，但同步记录更新失败。");
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "证据同步失败，请稍后重试。";

    await supabase
      .from("sync_runs")
      .update({
        status: "failed",
        error_message: message,
        completed_at: new Date().toISOString(),
      })
      .eq("id", run.id);

    projectRedirect(projectId, "error", message);
  }

  revalidatePath(`/app/projects/${projectId}`);
  projectRedirect(projectId, "synced", "1");
}

export async function reviewEvidenceLink(formData: FormData) {
  const projectId = readUuid(formData.get("projectId"));
  const linkId = readUuid(formData.get("linkId"));
  const status = formData.get("status");

  if (
    !projectId ||
    !linkId ||
    (status !== "confirmed" && status !== "rejected")
  ) {
    return;
  }

  const { supabase, user } = await requireGitHubUser();
  await supabase
    .from("evidence_links")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", linkId)
    .eq("project_id", projectId)
    .eq("owner_id", user.id);

  revalidatePath(`/app/projects/${projectId}`);
}
