import Link from "next/link";

import { Brand } from "@/components/brand";

import styles from "../../not-found.module.css";

const messages: Record<string, string> = {
  network: "登录服务暂时连接不上，请稍后重试。",
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
    <main className={styles.shell}>
      <header className={styles.header}>
        <Brand subtitle="软件项目观测站" />
      </header>

      <section className={styles.card}>
        <p className={styles.code}>AUTH CALLBACK / FAILED</p>
        <h1>GitHub 登录没有完成。</h1>
        <p className={styles.copy}>{message}</p>
        <div className={styles.actions}>
          <Link href="/login" className={styles.primary}>
            返回登录页
          </Link>
          <Link href="/" className={styles.secondary}>
            返回首页
          </Link>
        </div>
      </section>
    </main>
  );
}
