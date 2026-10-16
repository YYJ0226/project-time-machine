"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

type LoginButtonProps = {
  configured: boolean;
};

export function LoginButton({ configured }: LoginButtonProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function signInWithGitHub() {
    if (!configured || pending) {
      return;
    }

    setPending(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/app`,
        },
      });

      if (error) {
        setMessage("无法连接 GitHub，请检查 Supabase Provider 配置。");
        setPending(false);
      }
    } catch {
      setMessage("Supabase 环境变量尚未配置。");
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={signInWithGitHub}
        disabled={!configured || pending}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12 .7a11.5 11.5 0 0 0-3.64 22.4c.58.1.79-.25.79-.56v-2.02c-3.22.7-3.9-1.37-3.9-1.37-.52-1.34-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.76 2.7 1.25 3.36.95.1-.75.4-1.25.73-1.54-2.57-.3-5.28-1.29-5.28-5.7 0-1.27.45-2.3 1.2-3.1-.12-.3-.52-1.47.11-3.06 0 0 .98-.31 3.17 1.19A10.9 10.9 0 0 1 12 6.1c.98 0 1.95.13 2.87.39 2.2-1.5 3.17-1.19 3.17-1.19.63 1.6.23 2.77.11 3.06.75.8 1.2 1.83 1.2 3.1 0 4.43-2.72 5.4-5.3 5.69.42.36.79 1.07.79 2.16v3.22c0 .31.2.67.8.56A11.5 11.5 0 0 0 12 .7Z"
          />
        </svg>
        {pending ? "正在前往 GitHub…" : "使用 GitHub 继续"}
      </button>
      {message ? <p role="alert">{message}</p> : null}
    </div>
  );
}
