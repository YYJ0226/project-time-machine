import "server-only";

import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const GITHUB_LOGIN_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;

export function extractGitHubLogin(user: User): string | null {
  const candidates = [
    user.user_metadata?.user_name,
    user.user_metadata?.preferred_username,
    user.identities?.find((identity) => identity.provider === "github")
      ?.identity_data?.user_name,
  ];

  const login = candidates.find(
    (candidate): candidate is string =>
      typeof candidate === "string" && GITHUB_LOGIN_PATTERN.test(candidate),
  );

  return login ?? null;
}

export async function requireGitHubUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?error=session");
  }

  const githubLogin = extractGitHubLogin(user);

  if (!githubLogin) {
    redirect("/login?error=github-identity");
  }

  return { supabase, user, githubLogin };
}
