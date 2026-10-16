import Link from "next/link";

import { getSupabasePublicConfig } from "@/lib/env";

import { LoginButton } from "./login-button";
import styles from "./login.module.css";

const loginErrors: Record<string, string> = {
  session: "登录状态已过期，请重新连接 GitHub。",
  "github-identity": "当前账号缺少 GitHub 身份信息，请重新授权。",
};

export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const configured = Boolean(getSupabasePublicConfig());
  const { error } = await searchParams;
  const errorMessage = error ? loginErrors[error] : null;

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <span aria-hidden="true">◉</span>
          <strong>Project Time Machine</strong>
        </Link>
        <div className={styles.stage}>阶段 02 / 身份接入</div>
      </header>

      <section className={styles.content}>
        <div className={styles.explanation}>
          <p className={styles.signal}>身份信号等待接入</p>
          <h1>先确认你是谁，再读取你的公开项目。</h1>
          <p className={styles.intro}>
            GitHub 登录只用于确认账号身份。此阶段仅展示该账号自己拥有的公开仓库，
            不申请私有仓库权限，也不会修改 GitHub 上的任何内容。
          </p>

          <ol className={styles.steps}>
            <li>
              <span>01</span>
              <div>
                <strong>连接身份</strong>
                <p>通过 Supabase 完成 GitHub OAuth 登录。</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>核验边界</strong>
                <p>服务端确认 GitHub 用户名和公开可见性。</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>选择项目</strong>
                <p>导入仓库基本信息，后续阶段再同步开发证据。</p>
              </div>
            </li>
          </ol>
        </div>

        <section className={styles.gateway} aria-labelledby="gateway-title">
          <div className={styles.orbit} aria-hidden="true">
            <span />
            <i />
          </div>
          <p className={styles.gatewayCode}>IDENTITY GATE / GITHUB</p>
          <h2 id="gateway-title">连接你的开发身份</h2>
          <p className={styles.gatewayCopy}>
            授权完成后返回项目观测站，选择一个公开仓库开始建立时间线。
          </p>

          {errorMessage ? (
            <p className={styles.error} role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className={styles.loginAction}>
            <LoginButton configured={configured} />
          </div>

          {!configured ? (
            <div className={styles.setupNotice}>
              <strong>本地尚未配置认证服务</strong>
              <p>
                复制 <code>.env.example</code> 为 <code>.env.local</code>，
                并按配置文档填写 Supabase 项目信息。
              </p>
              <Link href="https://github.com/YYJ0226/project-time-machine/blob/main/docs/setup-supabase.md">
                查看配置说明
              </Link>
            </div>
          ) : (
            <p className={styles.privacyNote}>
              将跳转到 GitHub 授权页。平台只保存项目基本信息。
            </p>
          )}
        </section>
      </section>
    </main>
  );
}
