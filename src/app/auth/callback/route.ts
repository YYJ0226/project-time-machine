import { NextResponse } from "next/server";

import { getSupabasePublicConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { callbackOrigin, safeNextPath } from "@/lib/auth-redirect";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = callbackOrigin(request.url, process.env);
  if (!origin)
    return new Response(
      "Authentication deployment configuration is incomplete.",
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (!getSupabasePublicConfig() || !code) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  const supabase = await createClient();
  let result;
  try {
    result = await supabase.auth.exchangeCodeForSession(code);
  } catch {
    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?reason=network`,
    );
  }
  const { error } = result;

  if (error) {
    console.error(
      "[auth.callback] Session exchange failed",
      JSON.stringify({
        name: error.name,
        code: error.code,
        status: error.status,
      }),
    );
    const reason =
      error.name === "AuthRetryableFetchError"
        ? "network"
        : error.code === "pkce_code_verifier_not_found"
          ? "expired"
          : "exchange";

    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?reason=${reason}`,
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
