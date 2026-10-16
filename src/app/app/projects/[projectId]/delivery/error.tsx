"use client";
import Link from "next/link";
import styles from "./delivery.module.css";
export default function DeliveryError({ reset }: { reset: () => void }) {
  return <main className={styles.shell}><h1>交付台暂时无法加载</h1><p className={styles.warning} role="alert">请检查阶段五数据库迁移是否执行，或稍后刷新。为避免交付不完整内容，本次没有生成快照。</p><button type="button" className={styles.primary} onClick={reset}>重新加载</button><p><Link href="/app">返回项目列表</Link></p></main>;
}
