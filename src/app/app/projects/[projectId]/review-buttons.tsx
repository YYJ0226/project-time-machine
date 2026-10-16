"use client";

import { useFormStatus } from "react-dom";

export function ReviewButtons() {
  const { pending } = useFormStatus();

  return (
    <div>
      <button name="status" value="confirmed" disabled={pending}>
        确认关联
      </button>
      <button name="status" value="rejected" disabled={pending}>
        忽略
      </button>
    </div>
  );
}
