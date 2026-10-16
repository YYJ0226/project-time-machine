"use client";

import { useFormStatus } from "react-dom";

export function SyncButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      <span aria-hidden="true">{pending ? "◌" : "↻"}</span>
      {pending ? "正在采集证据…" : "同步 GitHub 证据"}
    </button>
  );
}
