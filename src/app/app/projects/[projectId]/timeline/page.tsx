import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireGitHubUser } from "@/lib/auth";
import { getSupabasePublicConfig } from "@/lib/env";
import type { TimelineItem, TimelineLink } from "@/lib/timeline";

import { TimelineExplorer } from "./timeline-explorer";
import styles from "./timeline.module.css";

export const instant = false;

export default async function TimelinePage({ params, searchParams }: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ event?: string | string[] }>;
}) {
  if (!getSupabasePublicConfig()) redirect("/app");
  const { projectId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(projectId)) notFound();
  const { supabase, user } = await requireGitHubUser();
  const { data: project, error: projectError } = await supabase.from("projects")
    .select("id,name,full_name").eq("id", projectId).eq("owner_id", user.id).maybeSingle();
  if (projectError) {
    return <main className={styles.shell}><p className={styles.warning} role="alert">暂时无法读取项目，请刷新重试。<Link href="/app">返回项目列表</Link></p></main>;
  }
  if (!project) notFound();
  const [itemsResult, linksResult, runsResult] = await Promise.all([
    supabase.from("evidence_items").select("id,kind,title,summary,state,source_url,occurred_at", { count: "exact" })
      .eq("project_id", projectId).eq("owner_id", user.id).order("occurred_at", { ascending: false }).limit(1000),
    supabase.from("evidence_links").select("id,source_id,target_id,relation,reasons", { count: "exact" })
      .eq("project_id", projectId).eq("owner_id", user.id).eq("status", "confirmed").order("created_at", { ascending: false }).limit(1000),
    supabase.from("ai_runs").select("id,status,review_status,model,created_at").eq("project_id", projectId).eq("owner_id", user.id).order("created_at", { ascending: false }).limit(100),
  ]);
  const query = await searchParams;
  const initialEventId = typeof query.event === "string" ? query.event : undefined;

  return (
    <main className={styles.shell}>
      <header className={styles.pageHeader}>
        <Link href="/app" className={styles.brand}>◉ <strong>Project Time Machine</strong></Link>
        <Link href={`/app/projects/${projectId}`} prefetch={false}>返回证据工作台</Link>
        <Link href={`/app/projects/${projectId}/delivery`} prefetch={false}>审稿与交付</Link>
      </header>
      <div className={styles.intro}>
        <p>{project.full_name}</p>
        <h1>沿着时间，看见项目如何发生。</h1>
        <span>需求、代码与验证对齐到同一坐标。选一个事件，顺着已确认关系读下去。</span>
      </div>
      {itemsResult.error ? <div className={styles.warning} role="alert">证据暂时无法加载，请刷新重试，或返回工作台检查同步状态。</div> : <>
        {linksResult.error ? <p className={styles.warning} role="alert">关联关系暂时无法加载，本次仅展示事件；请刷新后重试。</p> : null}
        {(linksResult.count ?? 0) > (linksResult.data?.length ?? 0) ? <p className={styles.warning}>本次载入 {linksResult.data?.length} / {linksResult.count} 条已确认关系，其余关联未加载。</p> : null}
        {(itemsResult.count ?? 0) > (itemsResult.data?.length ?? 0) ? <p className={styles.warning}>本次展示最近 {itemsResult.data?.length} / {itemsResult.count} 条证据，更早记录未加载。</p> : null}
        {runsResult.error ? <p className={styles.warning}>AI 账本暂时无法读取；其他证据仍可浏览。</p> : null}
        <TimelineExplorer key={initialEventId ?? "timeline"} items={[...(itemsResult.data ?? []) as TimelineItem[], ...(runsResult.data ?? []).map(run => ({ id: run.id, kind: "ai" as const, title: `AI 草稿任务 · ${run.model}`, summary: "真实调用记录。文字和人工审阅状态请在审稿与交付页面查看。", state: `${run.status} / ${run.review_status}`, source_url: `/app/projects/${projectId}/delivery`, occurred_at: run.created_at }))]} links={(linksResult.data ?? []) as TimelineLink[]}
          projectName={project.name} initialEventId={initialEventId} />
      </>}
      <p className={styles.pageNote}>只展示已采集的真实记录；AI 泳道显示最近 100 次真实调用，不把草稿当作事实。返回证据工作台可同步最新数据。</p>
    </main>
  );
}
