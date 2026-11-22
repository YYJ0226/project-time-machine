import Link from "next/link";

import { Brand } from "@/components/brand";

import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <Brand subtitle="软件项目观测站" />
      </header>

      <section className={styles.card}>
        <p className={styles.code}>404 / SIGNAL NOT FOUND</p>
        <h1>
          这个观测坐标不存在，
          <br />
          或已移出范围。
        </h1>
        <p className={styles.copy}>
          请检查页面地址是否正确，或者返回首页与项目工作台重新定位你的开发证据链。
        </p>
        <div className={styles.actions}>
          <Link href="/" className={styles.primary}>
            返回首页
          </Link>
          <Link href="/app" className={styles.secondary}>
            进入工作台
          </Link>
        </div>
      </section>
    </main>
  );
}
