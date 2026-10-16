"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireGitHubUser } from "@/lib/auth";
import {
  getPublicRepository,
  isOwnedPublicRepository,
  parseRepositoryFullName,
} from "@/lib/github";

function appRedirect(parameter: "error" | "imported", value: string): never {
  redirect(`/app?${parameter}=${encodeURIComponent(value)}`);
}

export async function importRepository(formData: FormData) {
  const parsed = parseRepositoryFullName(formData.get("repository"));

  if (!parsed) {
    appRedirect("error", "仓库标识格式不正确。");
  }

  const { supabase, user, githubLogin } = await requireGitHubUser();

  let repository;

  try {
    repository = await getPublicRepository(parsed.fullName);
  } catch {
    appRedirect("error", "无法从 GitHub 重新核验这个仓库。");
  }

  if (
    repository.full_name.toLowerCase() !== parsed.fullName.toLowerCase() ||
    !isOwnedPublicRepository(repository, githubLogin)
  ) {
    appRedirect("error", "只能导入当前 GitHub 账号自己拥有的公开仓库。");
  }

  const { error } = await supabase.from("projects").upsert(
    {
      owner_id: user.id,
      github_repo_id: repository.id,
      owner_login: repository.owner.login,
      name: repository.name,
      full_name: repository.full_name,
      description: repository.description,
      html_url: repository.html_url,
      visibility: "public",
      default_branch: repository.default_branch,
      language: repository.language,
      stargazers_count: repository.stargazers_count,
      forks_count: repository.forks_count,
      open_issues_count: repository.open_issues_count,
      github_created_at: repository.created_at,
      github_updated_at: repository.updated_at,
      github_pushed_at: repository.pushed_at,
    },
    { onConflict: "owner_id,github_repo_id" },
  );

  if (error) {
    appRedirect(
      "error",
      error.code === "42P01"
        ? "数据库迁移尚未执行，请先创建 projects 表。"
        : "项目保存失败，请稍后重试。",
    );
  }

  revalidatePath("/app");
  appRedirect("imported", repository.name);
}

export async function signOut() {
  const { supabase } = await requireGitHubUser();
  await supabase.auth.signOut();
  redirect("/");
}
