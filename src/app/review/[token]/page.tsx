import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import { connection } from "next/server";

import { Brand } from "@/components/brand";
import { SnapshotView } from "@/components/snapshot-view";
import type { ReviewSnapshot } from "@/lib/delivery";
import { getSupabasePublicConfig } from "@/lib/env";

import styles from "./review.module.css";

export const instant = false;
export const metadata: Metadata = {
  title: "项目只读审阅 | Project Time Machine",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  await connection();
  const { token } = await params;
  const config = getSupabasePublicConfig();
  if (!config || !/^[A-Za-z0-9_-]{43}$/.test(token)) return <Unavailable />;
  // Intentionally anonymous. No user cookies, service-role key or auth.getUser call.
  const supabase = createClient(config.url, config.publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
  const { data, error } = await supabase.rpc("get_public_review", {
    p_token: token,
  });
  if (error) {
    return (
      <main className={styles.shell}>
        <div className={styles.container}>
          <header className={styles.header}>
            <Brand subtitle="教师只读审阅" />
          </header>
          <section className={styles.stateCard}>
            <p className={styles.stateCode}>REVIEW / TEMPORARILY UNAVAILABLE</p>
            <h1>审阅服务暂时不可用</h1>
            <p>请稍后刷新；此状态不代表链接已撤销。</p>
          </section>
        </div>
      </main>
    );
  }
  if (!data || data.version !== 1) return <Unavailable />;

  return (
    <main className={styles.shell}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Brand subtitle="项目只读审阅快照" />
          <span className={styles.badge}>教师只读审阅 · 无需登录</span>
        </header>

        <p className={styles.notice}>
          你正在阅读学生发布的固定快照。请勿公开传播此链接；页面不提供编辑权限。
        </p>

        <section className={styles.dossier}>
          <SnapshotView snapshot={data as ReviewSnapshot} mainHeading />
        </section>

        <footer className={styles.footer}>
          分享可能到期或被撤销。已下载文件与截图不受撤销控制。
        </footer>
      </div>
    </main>
  );
}

function Unavailable() {
  return (
    <main className={styles.shell}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Brand subtitle="教师只读审阅" />
        </header>
        <section className={styles.stateCard}>
          <p className={styles.stateCode}>REVIEW / LINK UNAVAILABLE</p>
          <h1>此审阅链接不可用</h1>
          <p>链接可能有误、已到期或已被撤销。请向项目所有者索取新链接。</p>
        </section>
      </div>
    </main>
  );
}
