import styles from "./page.module.css";

const evidenceLanes = [
  {
    key: "REQ",
    label: "需求",
    color: "violet",
    nodes: [
      { left: "18%", title: "确定课程项目方向", meta: "Issue #1" },
      { left: "71%", title: "收敛教师审阅范围", meta: "Issue #8" },
    ],
  },
  {
    key: "DEV",
    label: "实现",
    color: "amber",
    nodes: [
      { left: "34%", title: "建立应用骨架", meta: "dadc832" },
      { left: "57%", title: "完成证据关联", meta: "PR #12" },
    ],
  },
  {
    key: "TST",
    label: "验证",
    color: "cyan",
    nodes: [
      { left: "46%", title: "持续集成通过", meta: "CI / build" },
      { left: "83%", title: "教师视角验收", meta: "Test #19" },
    ],
  },
  {
    key: "AI",
    label: "AI",
    color: "blue",
    nodes: [
      { left: "63%", title: "生成阶段摘要", meta: "待人工确认" },
    ],
  },
];

const sourceTypes = [
  { code: "01", title: "原始事实", detail: "来自 GitHub，可重新同步" },
  { code: "02", title: "学生说明", detail: "补充背景与决策原因" },
  { code: "03", title: "AI 草稿", detail: "未确认，不进入公开页面" },
  { code: "04", title: "确认叙事", detail: "保留生成和确认记录" },
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

export default function Home() {
  return (
    <main className={styles.shell}>
      <div className={styles.noise} aria-hidden="true" />

      <header className={styles.header}>
        <a className={styles.brand} href="#top" aria-label="Project Time Machine 首页">
          <span className={styles.brandMark} aria-hidden="true">
            <span />
          </span>
          <span>
            <strong>Project Time Machine</strong>
            <small>软件项目观测站</small>
          </span>
        </a>

        <nav className={styles.nav} aria-label="主导航">
          <a href="https://github.com/YYJ0226/project-time-machine/tree/main/docs">
            项目文档
          </a>
          <a
            className={styles.githubLink}
            href="https://github.com/YYJ0226/project-time-machine"
          >
            <GitHubIcon />
            GitHub
          </a>
        </nav>

        <div className={styles.stage}>
          <span>当前阶段</span>
          <strong>01 / 06</strong>
        </div>
      </header>

      <section className={styles.hero} id="top">
        <div className={styles.heroCopy}>
          <p className={styles.statusLine}>
            <span aria-hidden="true" />
            工程基线已建立
          </p>
          <h1>让一段开发历史，变成可核验的项目证据。</h1>
          <p className={styles.intro}>
            把需求、提交、测试与 AI 使用记录对齐到同一条时间线上。
            学生更容易讲清过程，老师也能从结论回到真实证据。
          </p>

          <div className={styles.actions}>
            <a className={styles.primaryAction} href="#observatory">
              查看观测样例
              <span aria-hidden="true">⌄</span>
            </a>
            <a
              className={styles.secondaryAction}
              href="https://github.com/YYJ0226/project-time-machine/blob/main/docs/roadmap.md"
            >
              阅读阶段计划
            </a>
          </div>

          <dl className={styles.scope}>
            <div>
              <dt>学生端</dt>
              <dd>持续留痕与项目复盘</dd>
            </div>
            <div>
              <dt>教师端</dt>
              <dd>只读审阅与证据下钻</dd>
            </div>
          </dl>
        </div>

        <div className={styles.observatory} id="observatory">
          <div className={styles.instrumentTop}>
            <div>
              <span className={styles.instrumentId}>OBS / PTM-001</span>
              <h2>课程项目证据流</h2>
            </div>
            <div className={styles.liveState}>
              <i aria-hidden="true" />
              样例数据
            </div>
          </div>

          <div className={styles.ruler} aria-hidden="true">
            <span>09.18</span>
            <span>10.02</span>
            <span>10.16</span>
            <span>10.30</span>
          </div>

          <div className={styles.lanes}>
            <div className={styles.scanLine} aria-hidden="true" />
            {evidenceLanes.map((lane) => (
              <div className={styles.lane} key={lane.key}>
                <div className={styles.laneLabel}>
                  <span>{lane.key}</span>
                  {lane.label}
                </div>
                <div className={styles.rail}>
                  {lane.nodes.map((node) => (
                    <div
                      className={`${styles.event} ${styles[lane.color]}`}
                      key={node.title}
                      style={{ left: node.left }}
                    >
                      <span className={styles.eventDot} aria-hidden="true" />
                      <div className={styles.eventNote}>
                        <strong>{node.title}</strong>
                        <small>{node.meta}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.instrumentFooter}>
            <span>7 个关键事件</span>
            <span>4 条证据轨道</span>
            <span>可回溯来源</span>
          </div>
        </div>
      </section>

      <section className={styles.trustSection} aria-labelledby="trust-title">
        <div className={styles.trustLead}>
          <p>公开边界</p>
          <h2 id="trust-title">谁写的，是否确认，一眼能分清。</h2>
        </div>
        <ol className={styles.sourceGrid}>
          {sourceTypes.map((source) => (
            <li key={source.code}>
              <span>{source.code}</span>
              <div>
                <strong>{source.title}</strong>
                <p>{source.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <footer className={styles.footer}>
        <span>Project Time Machine · Phase 01</span>
        <p>当前页面是视觉与信息架构原型，业务数据接入将在后续阶段完成。</p>
      </footer>
    </main>
  );
}
