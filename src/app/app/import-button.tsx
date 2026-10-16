"use client";

import { useFormStatus } from "react-dom";

export function ImportButton({ imported }: { imported: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending || imported}>
      {pending ? "正在核验…" : imported ? "已导入" : "导入项目"}
    </button>
  );
}
