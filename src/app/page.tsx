import { Brand } from "@/components/brand";
import { SampleObservatory } from "@/components/sample-observatory";

import styles from "./page.module.css";

type Signal = "requirement" | "code" | "verification" | "ai";

const stats = [
  { value: "4", unit: "类", label: "GitHub 原始记录", detail: "Issue · Commit · PR · Actions" },
  { value: "3", unit: "条", label: "可解释的关联规则", detail: "#编号 · 分支名 · 提交 SHA" },
  { value: "100", unit: "%", label: "AI 结论附带引用", detail: "引用不存在即判失败" },
  { value: "0", unit: "条", label: "未确认草稿进入公开页", detail: "教师只看到已确认内容" },
];

const workflow = [
  {
    code: "01",
    title: "连接 GitHub",
    detail: "OAuth 确认身份，只读取你本人拥有的公开仓库，服务端重新核验所有权。",
  },
  {
    code: "02",
    title: "同步证据",
    detail: "手动拉取最近 100 条 Issue、提交、PR 与 Actions，统一为同一种证据卡。",
  },
  {
    code: "03",
    title: "确认关联",
    detail: "规则给出「需求 → 实现 → 验证」建议，由你逐条确认、忽略或撤销。",
  },
  {
    code: "04",
    title: "回放与交付",
    detail: "四泳道时间线回放过程，再发布可撤销的教师只读快照或 Markdown 报告。",
  },
];

const sourceTypes = [
  { code: "01", title: "原始事实", detail: "来自 GitHub，可重新同步", tone: "verification", tag: "可回溯" },
  { code: "02", title: "学生说明", detail: "补充背景与决策原因", tone: "requirement", tag: "人工撰写" },
  { code: "03", title: "AI 草稿", detail: "未确认，不进入公开页面", tone: "ai", tag: "仅自己可见" },
  { code: "04", title: "确认叙事", detail: "保留生成和确认记录", tone: "code", tag: "已确认" },
];

const selfCase = [
  { value: "48", label: "次提交" },
  { value: "11", label: "个 Issue" },
  { value: "9", label: "个 Pull Request" },
  { value: "37", label: "次 Actions 运行" },
];

function GitHubIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M12 .7a11.5 11.5 0 0 0-3.64 22.4c.58.1.79-.25.79-.56v-2.02c-3.22.7-3.9-1.37-3.9-1.37-.52-1.34-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.76 2.7 1.25 3.36.95.1-.75.4-1.25.73-1.54-2.57-.3-5.28-1.29-5.28-5.7 0-1.27.45-2.3 1.2-3.1-.12-.3-.52-1.47.11-3.06 0 0 .98-.31 3.17 1.19A10.9 10.9 0 0 1 12 6.1c.98 0 1.95.13 2.87.39 2.2-1.5 3.17-1.19 3.17-1.19.63 1.6.23 2.77.11 3.06.75.8 1.2 1.83 1.2 3.1 0 4.43-2.72 5.4-5.3 5.69.42.36.79 1.07.79 2.16v3.22c0 .31.2.67.8.56A11.5 11.5 0 0 0 12 .7Z"
      />
    </svg>
  );
}

const miniLanes: Array<{ signal: Signal; label: string; dots: number[] }> = [
  { signal: "requirement", label: "需求", dots: [12, 58] },
  { signal: "code", label: "代码", dots: [26, 40, 47, 70] },
  { signal: "verification", label: "验证", dots: [44, 52, 76] },
  { signal: "ai", label: "AI", dots: [64] },
];

function FeatureVisualTimeline() {
  return (
    <div className={styles.visualTimeline} aria-hidden="true">
      {miniLanes.map((lane) => (
        <div key={lane.signal} className={styles.miniLane} data-signal={lane.signal}>
          <span>{lane.label}</span>
          <div>
            {lane.dots.map((x) => (
              <i key={x} style={{ left: `${x}%` }} />
            ))}
          </div>
        </div>
      ))}
      <span className={styles.miniPlayhead} />
    </div>
  );
}

export default function Home() {
  return (
    <main className={styles.shell}>
      <div className={styles.topGlow} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Brand subtitle="软件项目观测站" />

          <nav className={styles.nav} aria-label="主导航">
            <a href="#workflow">工作流程</a>
            <a href="#features">核心能力</a>
            <a href="#trust">公开边界</a>
            <a href="https://github.com/YYJ0226/project-time-machine/tree/main/docs">项目文档</a>
          </nav>

          <div className={styles.headerActions}>
            <a
              className={styles.githubLink}
              href="https://github.com/YYJ0226/project-time-machine"
              aria-label="在 GitHub 查看源码"
            >
              <GitHubIcon />
            </a>
            <a className={styles.loginAction} href="/login">登录</a>
          </div>
        </div>
      </header>

      <section className={styles.hero} id="top">
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowDot} aria-hidden="true" />
          GitHub 项目证据已接入
          <span className={styles.eyebrowDivider} aria-hidden="true" />
          <span className={styles.eyebrowMuted}>面向 AI 辅助课程项目</span>
        </p>

        <h1>
          让一段开发历史，
          <span className={styles.gradientText}>变成可核验的项目证据。</span>
        </h1>

        <p className={styles.intro}>
          把需求、提交、测试与 AI 使用记录对齐到同一条时间线上。
          学生更容易讲清过程，老师也能从结论回到真实证据。
        </p>

        <div className={styles.actions}>
          <a className={styles.primaryAction} href="/app">进入工作台</a>
          <a className={styles.secondaryAction} href="#observatory">查看观测样例</a>
        </div>
        <p className={styles.entryHint}>未登录时将先连接 GitHub；已登录可直接浏览项目。</p>

        <dl className={styles.scope}>
          <div>
            <dt>学生端</dt>
            <dd>持续留痕与项目复盘</dd>
          </div>
          <div>
            <dt>教师端</dt>
            <dd>只读审阅与证据下钻</dd>
          </div>
          <div>
            <dt>判断权</dt>
            <dd>机器建议，人来确认</dd>
          </div>
        </dl>
      </section>

      <section className={styles.observatoryStage} aria-labelledby="observatory-title">
        <SampleObservatory />
      </section>

      <section className={styles.stats} aria-label="平台约束">
        {stats.map((stat) => (
          <div key={stat.label} className={styles.stat}>
            <strong>
              {stat.value}
              <small>{stat.unit}</small>
            </strong>
            <span>{stat.label}</span>
            <p>{stat.detail}</p>
          </div>
        ))}
      </section>

      <section className={styles.section} id="workflow" aria-labelledby="workflow-title">
        <div className={styles.sectionHead}>
          <p className={styles.kicker}>工作流程</p>
          <h2 id="workflow-title">从仓库到审阅，四步走完。</h2>
          <p>不要求改变开发习惯：照常写 Issue、提 PR、跑 CI，平台负责把散落的记录连成一条链。</p>
        </div>
        <ol className={styles.workflow}>
          {workflow.map((step) => (
            <li key={step.code}>
              <span className={styles.stepCode}>{step.code}</span>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section} id="features" aria-labelledby="features-title">
        <div className={styles.sectionHead}>
          <p className={styles.kicker}>核心能力</p>
          <h2 id="features-title">每一句讲述，都能点回原文。</h2>
          <p>平台不替老师判断项目好坏，只把已经存在的原始记录收拢、连起来，让过程可以被低成本核对。</p>
        </div>

        <div className={styles.bento}>
          <article className={`${styles.card} ${styles.cardWide}`}>
            <div>
              <span className={styles.cardTag} data-signal="code">时间线与回放</span>
              <h3>四条泳道，一个时间坐标</h3>
              <p>需求、代码、验证与 AI 调用对齐到同一坐标，支持缩放、筛选、关键节点、单步与自动回放，以及适合讲解的聚焦模式。</p>
            </div>
            <FeatureVisualTimeline />
          </article>

          <article className={styles.card}>
            <span className={styles.cardTag} data-signal="requirement">关联建议</span>
            <h3>规则建议，人工确认</h3>
            <p>按 #编号、分支名、提交 SHA 生成建议。确认、忽略或撤销都由学生完成，重复同步不会覆盖人工决定。</p>
            <div className={styles.chain} aria-hidden="true">
              <span data-signal="requirement">Issue #3</span>
              <i />
              <span data-signal="code">PR #4</span>
              <i />
              <span data-signal="verification">CI ✓</span>
            </div>
          </article>

          <article className={styles.card}>
            <span className={styles.cardTag} data-signal="ai">AI 草稿</span>
            <h3>带引用的 AI 草稿</h3>
            <p>DeepSeek 只读取证据元数据，生成摘要、缺失提醒与讲解稿；每句结论必须引用证据，引用会被校验。</p>
            <div className={styles.citation} aria-hidden="true">
              <span>“首个需求在 PR #4 中实现并通过 CI”</span>
              <small>引用 证据1 · 证据2 · 证据3</small>
            </div>
          </article>

          <article className={styles.card}>
            <span className={styles.cardTag} data-signal="verification">教师快照</span>
            <h3>免登录的只读快照</h3>
            <p>可选 1 / 7 / 30 天有效期并随时撤销；只包含已确认内容，令牌在数据库中仅存哈希。</p>
            <div className={styles.expiry} aria-hidden="true">
              <span>1 天</span>
              <span className={styles.expiryActive}>7 天</span>
              <span>30 天</span>
            </div>
          </article>

          <article className={styles.card}>
            <span className={styles.cardTag} data-signal="code">版本提醒</span>
            <h3>证据变了，会明确告诉你</h3>
            <p>AI 草稿生成时的证据与当前不一致时，标注为「历史 AI 版本」，保留原文不改写，避免过时结论被当作事实。</p>
          </article>

          <article className={`${styles.card} ${styles.cardFull}`}>
            <div>
              <span className={styles.cardTag} data-signal="requirement">导出</span>
              <h3>课程过程报告与视频讲解提纲</h3>
              <p>一键导出两种结构化 Markdown，内容严格与当前已确认版本和公开证据一致，方便直接归档或用于课程答辩。</p>
            </div>
            <div className={styles.exportPreview} aria-hidden="true">
              <div className={styles.exportFile}>
                <span>MD</span>
                <div>
                  <strong>course-process-report.md</strong>
                  <small>时间线摘要 · 已确认关联 · 原始证据索引</small>
                </div>
              </div>
              <div className={styles.exportFile}>
                <span>MD</span>
                <div>
                  <strong>video-script-outline.md</strong>
                  <small>分阶段讲解提纲 · 每段附带证据引用编号</small>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.trustSection} id="trust" aria-labelledby="trust-title">
        <div className={styles.trustLead}>
          <p className={styles.kicker}>公开边界</p>
          <h2 id="trust-title">
            谁写的，是否确认，
            <br />
            一眼能分清。
          </h2>
          <p>
            四类内容各有标识与去处。只有原始事实与学生确认过的叙事，才会出现在教师能看到的页面里。
          </p>
        </div>
        <ol className={styles.sourceGrid}>
          {sourceTypes.map((source) => (
            <li key={source.code} data-signal={source.tone}>
              <div className={styles.sourceTop}>
                <span className={styles.sourceCode}>{source.code}</span>
                <span className={styles.sourceTag}>{source.tag}</span>
              </div>
              <strong>{source.title}</strong>
              <p>{source.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.selfCase} aria-labelledby="self-case-title">
        <div className={styles.selfCaseCopy}>
          <p className={styles.kicker}>真实案例</p>
          <h2 id="self-case-title">用它，记录它自己。</h2>
          <p>
            本项目全程以 Issue → 分支 → Pull Request → CI 的方式开发，并把自己导入平台验证：首次同步收回 27
            条证据，线上验收时增长到 63 条；自用中发现的问题也都留下了 Issue。
          </p>
          <a
            className={styles.textLink}
            href="https://github.com/YYJ0226/project-time-machine/issues/3"
          >
            查看「需求 #3 → PR #4 → CI」这条真实链路
          </a>
        </div>
        <div className={styles.selfCaseStats}>
          {selfCase.map((item) => (
            <div key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.cta} aria-labelledby="cta-title">
        <div className={styles.ctaGlow} aria-hidden="true" />
        <h2 id="cta-title">把过程交给证据，把判断留给老师。</h2>
        <p>连接 GitHub，导入一个公开仓库，几分钟内看到你的项目时间线。</p>
        <div className={styles.actions}>
          <a className={styles.primaryAction} href="/app">进入工作台</a>
          <a
            className={styles.secondaryAction}
            href="https://github.com/YYJ0226/project-time-machine"
          >
            查看源码
          </a>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <Brand subtitle="把开发过程变成可核验的证据链" />
          </div>
          <nav className={styles.footerNav} aria-label="页脚导航">
            <a href="https://github.com/YYJ0226/project-time-machine">GitHub</a>
            <a href="https://github.com/YYJ0226/project-time-machine/tree/main/docs">项目文档</a>
            <a href="https://github.com/YYJ0226/project-time-machine/blob/main/docs/security.md">安全说明</a>
            <a href="/login">登录</a>
          </nav>
        </div>
        <div className={styles.footerBottom}>
          <span>Project Time Machine · 课程学习与展示作品</span>
          <p>首页观测样例不代表你的项目数据；登录后进入真实项目工作台。</p>
        </div>
      </footer>
    </main>
  );
}
