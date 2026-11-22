"use client";

import { useEffect, useState } from "react";

import styles from "@/app/page.module.css";

export type SampleSignal = "requirement" | "code" | "verification" | "ai";

type SampleNode = {
  id: string;
  lane: number;
  signal: SampleSignal;
  kindLabel: string;
  x: number;
  title: string;
  meta: string;
  time: string;
  state: string;
  note: string;
  pending?: boolean;
};

type SampleTrace = {
  id: string;
  fromId: string;
  toId: string;
  relation: string;
  reason: string;
};

const lanes: Array<{ key: string; label: string; signal: SampleSignal }> = [
  { key: "REQ", label: "需求", signal: "requirement" },
  { key: "CODE", label: "代码", signal: "code" },
  { key: "TEST", label: "验证", signal: "verification" },
  { key: "AI", label: "AI", signal: "ai" },
];

const nodes: SampleNode[] = [
  {
    id: "issue-1",
    lane: 0,
    signal: "requirement",
    kindLabel: "需求 · 来源事实",
    x: 9,
    title: "确定课程项目方向",
    meta: "Issue #1",
    time: "2026-09-18 10:15",
    state: "closed",
    note: "明确目标：把课程开发记录收拢成可核验的证据链，机器建议、人来确认。",
  },
  {
    id: "commit",
    lane: 1,
    signal: "code",
    kindLabel: "代码 · 来源事实",
    x: 24,
    title: "建立应用骨架",
    meta: "dadc832",
    time: "2026-09-25 21:08",
    state: "committed",
    note: "初始化 Next.js 应用结构、视觉令牌与基础路由，归入后续合并请求。",
  },
  {
    id: "pr-12",
    lane: 1,
    signal: "code",
    kindLabel: "代码 · 来源事实",
    x: 45,
    title: "完成证据关联",
    meta: "PR #12",
    time: "2026-10-16 14:32",
    state: "merged",
    note: "实现 #编号、分支名与提交 SHA 三条关联规则，并将确认权交给学生。",
  },
  {
    id: "ci",
    lane: 2,
    signal: "verification",
    kindLabel: "验证 · 来源事实",
    x: 54,
    title: "持续集成通过",
    meta: "CI / build",
    time: "2026-10-16 14:36",
    state: "success",
    note: "同一提交 SHA 上完成 ESLint、Vitest 与生产构建检查。",
  },
  {
    id: "issue-8",
    lane: 0,
    signal: "requirement",
    kindLabel: "需求 · 来源事实",
    x: 63,
    title: "收敛教师审阅范围",
    meta: "Issue #8",
    time: "2026-10-21 16:40",
    state: "closed",
    note: "教师页免登录只读，仅展示固定快照与已确认内容，支持随时撤销。",
  },
  {
    id: "ai",
    lane: 3,
    signal: "ai",
    kindLabel: "AI · 调用留痕",
    x: 72,
    title: "生成阶段摘要",
    meta: "待人工确认",
    time: "2026-10-26 19:12",
    state: "draft",
    note: "DeepSeek 仅基于证据元数据生成带引用草稿；未确认前不进入公开页。",
    pending: true,
  },
  {
    id: "test-19",
    lane: 2,
    signal: "verification",
    kindLabel: "验证 · 来源事实",
    x: 84,
    title: "教师视角验收",
    meta: "Test #19",
    time: "2026-10-30 11:05",
    state: "success",
    note: "验证匿名快照访问、过期撤销和引用回溯均符合公开边界。",
  },
];

const traces: SampleTrace[] = [
  {
    id: "t1",
    fromId: "issue-1",
    toId: "pr-12",
    relation: "实现于",
    reason: "正文引用 #1",
  },
  {
    id: "t2",
    fromId: "commit",
    toId: "pr-12",
    relation: "归入",
    reason: "提交 SHA 归属 PR #12",
  },
  {
    id: "t3",
    fromId: "pr-12",
    toId: "ci",
    relation: "验证于",
    reason: "头提交 SHA 一致",
  },
  {
    id: "t4",
    fromId: "issue-8",
    toId: "test-19",
    relation: "验证于",
    reason: "验收用例对应 #8",
  },
];

const nodeMap = new Map(nodes.map((node) => [node.id, node]));
const laneY = (lane: number) => ((lane + 0.5) / lanes.length) * 100;

export function SampleObservatory() {
  const [selectedId, setSelectedId] = useState<string>("pr-12");
  const [playing, setPlaying] = useState(false);

  const selectedIndex = Math.max(
    0,
    nodes.findIndex((node) => node.id === selectedId),
  );
  const selected = nodes[selectedIndex] ?? nodes[2];

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setSelectedId((prev) => {
        const idx = nodes.findIndex((node) => node.id === prev);
        const next = nodes[(idx + 1) % nodes.length];
        return next.id;
      });
    }, 2400);
    return () => window.clearInterval(timer);
  }, [playing]);

  const relatedTraces = traces.filter(
    (trace) => trace.fromId === selected.id || trace.toId === selected.id,
  );
  const relatedNodeIds = new Set(
    relatedTraces.flatMap((trace) => [trace.fromId, trace.toId]),
  );

  return (
    <div className={styles.observatory} id="observatory">
      <div className={styles.instrumentTop}>
        <div className={styles.instrumentTitle}>
          <span className={styles.instrumentId}>OBS / PTM-001</span>
          <h2 id="observatory-title">课程项目证据流</h2>
        </div>

        <div className={styles.legend} aria-hidden="true">
          {lanes.map((lane) => (
            <span key={lane.key} data-signal={lane.signal}>
              <i />
              {lane.label}
            </span>
          ))}
        </div>

        <div className={styles.instrumentControls}>
          <button
            type="button"
            className={styles.replayToggle}
            onClick={() => setPlaying((v) => !v)}
            aria-pressed={playing}
          >
            <span aria-hidden="true">{playing ? "❚❚" : "▶"}</span>
            {playing ? "暂停演示" : "自动回放"}
          </button>
          <div className={styles.liveState}>
            <i aria-hidden="true" />
            样例数据
          </div>
        </div>
      </div>

      <div className={styles.instrumentBody}>
        <div className={styles.plotArea}>
          <div className={styles.ruler} aria-hidden="true">
            <span>09.18</span>
            <span>10.02</span>
            <span>10.16</span>
            <span>10.30</span>
          </div>

          <div className={styles.lanes}>
            <div className={styles.laneLabels}>
              {lanes.map((lane) => (
                <div
                  className={styles.laneLabel}
                  key={lane.key}
                  data-signal={lane.signal}
                >
                  <span>{lane.key}</span>
                  {lane.label}
                </div>
              ))}
            </div>

            <div className={styles.plot}>
              {lanes.map((lane, index) => (
                <div
                  className={styles.rail}
                  key={lane.key}
                  style={{ top: `${laneY(index)}%` }}
                  aria-hidden="true"
                />
              ))}

              <svg
                className={styles.traces}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {traces.map((trace) => {
                  const from = nodeMap.get(trace.fromId);
                  const to = nodeMap.get(trace.toId);
                  if (!from || !to) return null;
                  const y1 = laneY(from.lane);
                  const y2 = laneY(to.lane);
                  const mid = (y1 + y2) / 2;
                  const active =
                    trace.fromId === selected.id || trace.toId === selected.id;
                  return (
                    <path
                      key={trace.id}
                      className={active ? styles.traceActive : styles.traceMuted}
                      d={
                        from.lane === to.lane
                          ? `M ${from.x} ${y1} L ${to.x} ${y2}`
                          : `M ${from.x} ${y1} C ${from.x} ${mid}, ${to.x} ${mid}, ${to.x} ${y2}`
                      }
                    />
                  );
                })}
              </svg>

              <div
                className={styles.playheadLine}
                style={{ left: `${selected.x}%` }}
                aria-hidden="true"
              />

              {nodes.map((node) => {
                const isSelected = node.id === selected.id;
                const isRelated = !isSelected && relatedNodeIds.has(node.id);
                return (
                  <button
                    type="button"
                    key={node.id}
                    className={`${styles.event} ${isSelected ? styles.eventSelected : ""} ${isRelated ? styles.eventRelated : ""} ${node.pending ? styles.eventPending : ""}`}
                    data-signal={node.signal}
                    style={{ left: `${node.x}%`, top: `${laneY(node.lane)}%` }}
                    onClick={() => {
                      setPlaying(false);
                      setSelectedId(node.id);
                    }}
                    aria-pressed={isSelected}
                    aria-label={`${node.meta} ${node.title}`}
                  >
                    <span className={styles.eventDot} aria-hidden="true" />
                    <span className={styles.eventNote}>
                      <strong>{node.title}</strong>
                      <small>{node.meta}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <aside className={styles.inspector} aria-label="样例事件详情">
          <p className={styles.inspectorMeta}>
            <span data-signal={selected.signal}>{selected.kindLabel}</span>
            <span>
              {String(selectedIndex + 1).padStart(2, "0")} /{" "}
              {String(nodes.length).padStart(2, "0")}
            </span>
          </p>
          <h3>
            {selected.meta} · {selected.title}
          </h3>
          <p className={styles.inspectorTime}>
            {selected.time} · {selected.state}
          </p>
          <p className={styles.inspectorNote}>{selected.note}</p>

          {relatedTraces.length > 0 ? (
            <ul className={styles.inspectorLinks}>
              {relatedTraces.map((trace) => {
                const isOutgoing = trace.fromId === selected.id;
                const other = nodeMap.get(
                  isOutgoing ? trace.toId : trace.fromId,
                );
                if (!other) return null;
                return (
                  <li key={trace.id} data-signal={other.signal}>
                    <button
                      type="button"
                      className={styles.inspectorLinkBtn}
                      onClick={() => {
                        setPlaying(false);
                        setSelectedId(other.id);
                      }}
                    >
                      <span>
                        {isOutgoing ? trace.relation : "关联自"} ·{" "}
                        {lanes[other.lane].label}
                      </span>
                      <strong>
                        {other.meta} {other.title}
                      </strong>
                      <small>{trace.reason}</small>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={styles.inspectorEmpty}>
              {selected.pending
                ? "此节点为未确认的 AI 草稿，不会进入教师公开快照。"
                : "点击轨道上任意节点可切换查看关联证据链。"}
            </p>
          )}

          <p className={styles.inspectorFoot}>
            <i
              aria-hidden="true"
              data-pending={selected.pending ? "true" : undefined}
            />
            {selected.pending
              ? "等待学生人工审阅与确认"
              : `${relatedTraces.length} 条关联已由学生确认 · 点击节点可交互查看`}
          </p>
        </aside>
      </div>

      <div className={styles.instrumentFooter}>
        <span>7 个关键事件</span>
        <span>4 条证据轨道</span>
        <span>4 条已确认关联</span>
        <span>点击轨道节点体验证据下钻</span>
      </div>
    </div>
  );
}
