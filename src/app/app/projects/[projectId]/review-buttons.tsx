"use client";

import { useFormStatus } from "react-dom";

export function ReviewButtons({ reviewed = false }: { reviewed?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <div>
      {reviewed ? (
        <button name="status" value="suggested" disabled={pending}>
          撤销审阅
        </button>
      ) : (
        <>
          <button name="status" value="confirmed" disabled={pending}>
            确认关联
          </button>
          <button name="status" value="rejected" disabled={pending}>
            忽略
          </button>
        </>
      )}
    </div>
  );
}
