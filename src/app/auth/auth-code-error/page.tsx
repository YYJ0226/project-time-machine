import Link from "next/link";

const messages: Record<string, string> = {
  network: "登录服务暂时连接不上，请稍后重新登录。",
  expired: "这次登录校验已失效，请返回登录页重新发起，并在同一浏览器完成授权。",
  exchange: "这次登录未能完成，请返回登录页重新尝试。",
};

export const instant = false;

export default async function AuthCodeErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const message = messages[reason ?? "exchange"] ?? messages.exchange;

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "#07111f",
        color: "#eaf2f5",
      }}
    >
      <section style={{ maxWidth: "560px" }}>
        <p style={{ color: "#f2b84b", fontSize: "12px" }}>
          AUTH CALLBACK / FAILED
        </p>
        <h1 style={{ fontSize: "clamp(32px, 6vw, 58px)", lineHeight: 1.08 }}>
          GitHub 登录没有完成。
        </h1>
        <p style={{ color: "#91a3ad", lineHeight: 1.8 }}>
          {message}
        </p>
        <Link style={{ color: "#eaf2f5" }} href="/login">
          返回登录页
        </Link>
      </section>
    </main>
  );
}
