import "server-only";

import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const GITHUB_LOGIN_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;

export function extractGitHubLogin(user: User): string | null {
  // Editable user metadata is never an authorization source.
  const identity = user.identities?.find(identity => identity.provider === "github");
  const candidates = [
    identity?.identity_data?.user_name,
    identity?.identity_data?.preferred_username,
  ];

  const login = candidates.find(
    (candidate): candidate is string =>
      typeof candidate === "string" && GITHUB_LOGIN_PATTERN.test(candidate),
  );

  return login ?? null;
}

export async function requireGitHubUser() {
  const supabase = await createClient();
  let result;
  try {
    result = await supabase.auth.getUser();
  } catch {
    redirect("/login?error=network");
  }
  const {
    data: { user },
    error,
  } = result;

  if (error || !user) {
    console.error(
      "[auth.user] User verification failed",
      JSON.stringify({
        name: error?.name,
        code: error?.code,
        status: error?.status,
      }),
    );
    redirect(
      error?.name === "AuthRetryableFetchError"
        ? "/login?error=network"
        : "/login?error=session",
    );
  }

  const githubLogin = extractGitHubLogin(user);

  if (!githubLogin) {
    redirect("/login?error=github-identity");
  }

  return { supabase, user, githubLogin };
}
