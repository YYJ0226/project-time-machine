import Link from "next/link";

export default function AuthCodeErrorPage() {
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
          请检查 Supabase 的 GitHub Provider、回调地址和 Redirect URL
          白名单，然后重新尝试。
        </p>
        <Link style={{ color: "#eaf2f5" }} href="/login">
          返回登录页
        </Link>
      </section>
    </main>
  );
}
