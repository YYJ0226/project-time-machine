import Link from "next/link";

import { Brand } from "@/components/brand";
import { getSupabasePublicConfig } from "@/lib/env";

import { LoginButton } from "./login-button";
import styles from "./login.module.css";

const loginErrors: Record<string, string> = {
  network: "登录服务暂时连接不上，请稍后重试。",
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
        <Brand subtitle="软件项目观测站" />
        <div className={styles.headerRight}>
          <span className={styles.stage}>IDENTITY GATE · 公开只读</span>
          <Link href="/" className={styles.backLink}>
            返回首页
          </Link>
        </div>
      </header>

      <section className={styles.content}>
        <div className={styles.explanation}>
          <p className={styles.signal}>
            <span aria-hidden="true" />
            身份信号等待接入
          </p>
          <h1>
            先确认你是谁，
            <span className={styles.gradientText}>再读取你的公开项目。</span>
          </h1>
          <p className={styles.intro}>
            GitHub 登录只用于确认账号身份。平台仅展示你本人拥有的公开仓库，
            不申请私有仓库权限，也不会修改 GitHub 上的任何内容。
          </p>

          <ol className={styles.steps}>
            <li>
              <span>01</span>
              <div>
                <strong>连接身份</strong>
                <p>通过 Supabase 完成 GitHub OAuth 授权登录。</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>核验边界</strong>
                <p>服务端重新核验仓库所有权与公开可见性。</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>建立证据链</strong>
                <p>导入仓库并同步 Issue、Commit、PR 与 CI 记录。</p>
              </div>
            </li>
          </ol>
        </div>

        <section className={styles.gateway} aria-labelledby="gateway-title">
          <div className={styles.orbit} aria-hidden="true">
            <span />
            <i />
          </div>

          <div className={styles.gatewayBody}>
            <p className={styles.gatewayCode}>IDENTITY GATE / GITHUB OAUTH</p>
            <h2 id="gateway-title">连接你的开发身份</h2>
            <p className={styles.gatewayCopy}>
              授权完成后自动返回项目观测站，选择一个公开仓库开始同步证据与生成时间线。
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
                  查看配置说明 ↗
                </Link>
              </div>
            ) : (
              <ul className={styles.guarantees}>
                <li>仅读取你拥有的公开仓库元数据</li>
                <li>OAuth 令牌只在服务端处理，不进入浏览器日志</li>
              </ul>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
