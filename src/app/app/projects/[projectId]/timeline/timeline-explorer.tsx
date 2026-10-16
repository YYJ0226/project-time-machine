"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent } from "react";

import {
  deriveMilestones, filterTimeline, formatTimelineTime, kindLabels, layoutTimeline,
  nextReplayIndex, prepareTimeline, timeDescriptions, timelineKinds, timelineTicks,
  timelineX, type TimelineFilters, type TimelineItem, type TimelineLink,
} from "@/lib/timeline";

import styles from "./timeline.module.css";

const emptyFilters = (): TimelineFilters => ({
  kinds: [...timelineKinds], query: "", fromDay: "", toDay: "", milestonesOnly: false,
});
const labelWidth = 108;
const axisHeight = 54;
const relations = { implements: "实现于", contains: "归入", verifies: "验证于" };

function subscribeMotion(listener: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
function getMotion() { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
function getServerMotion() { return true; }

export function TimelineExplorer({ items, links, projectName, initialEventId }: {
  items: TimelineItem[];
  links: TimelineLink[];
  projectName: string;
  initialEventId?: string;
}) {
  const { events, invalidCount } = useMemo(() => prepareTimeline(items), [items]);
  const milestones = useMemo(() => deriveMilestones(events), [events]);
  const [filters, setFilters] = useState(emptyFilters);
  const [selectedId, setSelectedId] = useState<string | null>(initialEventId ?? null);
  const [zoom, setZoom] = useState(1);
  const [baseWidth, setBaseWidth] = useState(860);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2500);
  const [focusMode, setFocusMode] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const reducedMotion = useSyncExternalStore(subscribeMotion, getMotion, getServerMotion);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLButtonElement>());
  const focusButtonRef = useRef<HTMLButtonElement>(null);
  const filtered = useMemo(() => filterTimeline(events, filters), [events, filters]);
  const hasVisibleEvents = filtered.length > 0;
  const width = baseWidth * zoom;
  const layout = useMemo(() => layoutTimeline(filtered, width, zoom === 1), [filtered, width, zoom]);
  const ticks = useMemo(() => timelineTicks(layout.domain, 6 * zoom), [layout.domain, zoom]);
  const selected = filtered.find((event) => event.id === selectedId) ?? filtered[0];
  const currentIndex = selected ? filtered.findIndex((event) => event.id === selected.id) : -1;
  const activePosition = selected ? layout.positions.get(selected.id) : undefined;
  const itemMap = useMemo(() => new Map(events.map((event) => [event.id, event])), [events]);
  const related = links.filter((link) => selected && (link.source_id === selected.id || link.target_id === selected.id));
  const relatedIds = new Set(related.flatMap((link) => [link.source_id, link.target_id]));
  const dateError = filters.fromDay && filters.toDay && filters.fromDay > filters.toDay;
  const activePlayback = playing && !reducedMotion && filtered.length > 1;

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => {
      setBaseWidth(Math.max(640, Math.floor(entry.contentRect.width - labelWidth)));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [hasVisibleEvents]);

  useEffect(() => {
    if (!activePlayback) return;
    const timer = window.setTimeout(() => {
      const next = nextReplayIndex(currentIndex, filtered.length, 1);
      setSelectedId(filtered[next].id);
      if (next === filtered.length - 1) setPlaying(false);
    }, speed);
    return () => window.clearTimeout(timer);
  }, [activePlayback, currentIndex, filtered, speed]);

  useEffect(() => {
    if (!activePosition || !scrollRef.current) return;
    const container = scrollRef.current;
    container.scrollTo({
      left: Math.max(0, labelWidth + activePosition.x - container.clientWidth / 2),
      top: Math.max(0, axisHeight + activePosition.y - container.clientHeight / 2),
      behavior: reducedMotion ? "instant" : "smooth",
    });
  }, [activePosition, reducedMotion]);

  useEffect(() => {
    if (!focusMode) return;
    const previousOverflow = document.body.style.overflow;
    const focusButton = focusButtonRef.current;
    document.body.style.overflow = "hidden";
    rootRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      focusButton?.focus();
    };
  }, [focusMode]);

  function updateFilters(update: Partial<TimelineFilters>) {
    setFilters((previous) => ({ ...previous, ...update }));
    setPlaying(false);
    setSelectedId(null);
    setCopyMessage("");
  }

  function select(id: string, reveal = false) {
    if (reveal && !filtered.some((event) => event.id === id)) setFilters(emptyFilters());
    setSelectedId(id);
    setPlaying(false);
    setCopyMessage("");
  }

  function step(delta: number, focus = false) {
    const index = nextReplayIndex(currentIndex, filtered.length, delta);
    if (index < 0) return;
    select(filtered[index].id);
    if (focus) nodeRefs.current.get(filtered[index].id)?.focus({ preventScroll: true });
  }

  function onCanvasKey(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const delta = event.key === "Home" ? -filtered.length : event.key === "End" ? filtered.length : event.key === "ArrowLeft" ? -1 : 1;
    step(delta, true);
  }

  function onFocusKey(event: KeyboardEvent<HTMLElement>) {
    if (!focusMode) return;
    if (event.key === "Escape") { setFocusMode(false); return; }
    if (event.key !== "Tab") return;
    const controls = Array.from(rootRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), summary, [tabindex="0"]',
    ) ?? []).filter((element) => element.getClientRects().length > 0);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === rootRef.current)) {
      event.preventDefault(); last?.focus();
    } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === rootRef.current)) {
      event.preventDefault(); first?.focus();
    }
  }

  async function copyEventLink() {
    if (!selected) return;
    try {
      const url = new URL(window.location.href);
      url.search = new URLSearchParams({ event: selected.id }).toString();
      url.hash = "";
      await navigator.clipboard.writeText(url.toString());
      setCopyMessage("事件链接已复制，打开时需要登录。");
    } catch { setCopyMessage("未能复制，请稍后重试。"); }
  }

  return (
    <section ref={rootRef} className={`${styles.explorer} ${focusMode ? styles.focusMode : ""}`}
      role={focusMode ? "dialog" : undefined} aria-modal={focusMode ? true : undefined}
      aria-label={focusMode ? "项目回放聚焦视图" : "交互项目时间线"} tabIndex={-1} onKeyDown={onFocusKey}>
      <header className={styles.explorerHeader}>
        <div><span className={styles.liveDot} />{projectName}<span className={styles.snapshot}>已同步的证据快照</span></div>
        <button ref={focusButtonRef} onClick={() => setFocusMode(!focusMode)} aria-pressed={focusMode}>
          {focusMode ? "退出聚焦（Esc）" : "聚焦讲解"}
        </button>
      </header>

      <div className={styles.filters}>
        <label className={styles.search}>查找事件
          <input type="search" placeholder="标题、正文或提交 SHA" value={filters.query} onChange={(event) => updateFilters({ query: event.target.value })} />
        </label>
        <fieldset className={styles.kindFilters}><legend>事件类型</legend>
          {timelineKinds.map((kind) => <label key={kind}>
            <input type="checkbox" checked={filters.kinds.includes(kind)} onChange={() => updateFilters({ kinds: filters.kinds.includes(kind) ? filters.kinds.filter((value) => value !== kind) : [...filters.kinds, kind] })} />
            {kindLabels[kind]}
          </label>)}
        </fieldset>
        <div className={styles.dates}>
          <label>开始日期<input type="date" value={filters.fromDay} onInput={(event) => updateFilters({ fromDay: event.currentTarget.value })} /></label>
          <label>结束日期<input type="date" value={filters.toDay} onInput={(event) => updateFilters({ toDay: event.currentTarget.value })} /></label>
        </div>
        <label className={styles.milestoneToggle}><input type="checkbox" checked={filters.milestonesOnly} onChange={(event) => updateFilters({ milestonesOnly: event.target.checked })} />仅关键节点</label>
        <button onClick={() => { setFilters(emptyFilters()); setSelectedId(null); setPlaying(false); }}>重置筛选</button>
      </div>

      <div className={styles.plotToolbar}>
        <p role="status">显示 {filtered.length} / {events.length} 条事件<span>北京时间 UTC+8</span></p>
        <label className={styles.jumpTo}>定位事件
          <select value={selected?.id ?? ""} disabled={!selected} onChange={(event) => select(event.target.value)}>
            {!selected ? <option value="">暂无事件</option> : null}
            {filtered.map((event, index) => <option key={event.id} value={event.id}>{index + 1}. {kindLabels[event.kind]} · {event.title}</option>)}
          </select>
        </label>
        <div role="group" aria-label="时间缩放">
          {[1, 2, 4].map((value) => <button key={value} aria-pressed={zoom === value} onClick={() => setZoom(value)}>{value === 1 ? "总览" : `${value}×`}</button>)}
        </div>
      </div>
      {dateError ? <p className={styles.warning} role="alert">开始日期不能晚于结束日期。</p> : null}
      {invalidCount ? <p className={styles.warning}>有 {invalidCount} 条记录的时间不可用，未放入时间坐标，请返回工作台核对。</p> : null}
      {initialEventId && !itemMap.has(initialEventId) ? <p className={styles.warning}>指定事件不在当前采集范围内，已展示现有记录。</p> : null}

      <div className={styles.milestones} aria-label="关键节点">
        <span>关键节点</span>
        {milestones.length === 0 ? <small>同步后生成</small> : milestones.slice(0, 8).map((milestone) => {
          const item = itemMap.get(milestone.eventId)!;
          return <button key={item.id} title={item.title} onClick={() => select(item.id, true)}>
            <span>{milestone.label}</span>{item.title}
          </button>;
        })}
        {milestones.length > 8 ? <small>仅关键节点筛选可查看全部 {milestones.length} 个节点</small> : null}
      </div>

      <div className={styles.observatory}>
        <div className={styles.plotColumn}>
          {filtered.length > 0 ? (
            <div ref={scrollRef} className={styles.scrollArea} tabIndex={0} onKeyDown={onCanvasKey}
              style={{ "--overview-height": `${zoom === 1 ? Math.min(760, layout.height + axisHeight) : 584}px` } as CSSProperties}
              aria-label="时间线画布，左右方向键切换事件，Home 和 End 定位首尾">
              <div className={styles.canvas} style={{ width: width + labelWidth }}>
                <div className={styles.axis}><span>时间坐标</span><div style={{ width }}>
                  {ticks.map((tick) => <time key={tick} dateTime={new Date(tick).toISOString()} style={{ left: timelineX(tick, layout.domain, width) }}>{formatTimelineTime(tick, true)}</time>)}
                </div></div>
                <svg className={styles.wires} style={{ left: labelWidth, top: axisHeight }} width={width} height={layout.height} aria-hidden="true">
                  {ticks.map((tick) => <line key={tick} x1={timelineX(tick, layout.domain, width)} x2={timelineX(tick, layout.domain, width)} y1={0} y2={layout.height} className={styles.gridLine} />)}
                  {related.map((link) => {
                    const source = layout.positions.get(link.source_id);
                    const target = layout.positions.get(link.target_id);
                    if (!source || !target) return null;
                    const midY = (source.y + target.y) / 2;
                    return <path key={link.id} d={`M ${source.x} ${source.y} C ${source.x} ${midY}, ${target.x} ${midY}, ${target.x} ${target.y}`} className={styles.trace} />;
                  })}
                  {activePosition ? <line x1={activePosition.x} x2={activePosition.x} y1={0} y2={layout.height} className={styles.playhead} /> : null}
                </svg>
                {layout.lanes.map((lane) => (
                  <div key={lane.id} className={styles.lane} style={{ height: lane.height, "--lane-color": lane.color } as CSSProperties}>
                    <div className={styles.laneLabel}><span>{lane.symbol}</span><strong>{lane.label}</strong><small>{lane.events.length} 条</small></div>
                    <div className={styles.lanePlot} style={{ width }}>
                      {lane.events.length === 0 ? <p className={styles.emptyLane}>{lane.id === "ai" ? "当前没有匹配的真实 AI 调用记录" : "当前筛选下没有记录"}</p> : null}
                      {lane.events.map((event) => {
                        const position = layout.positions.get(event.id)!;
                        const future = activePlayback && selected && event.timestamp > selected.timestamp;
                        return <button key={event.id} ref={(node) => { if (node) nodeRefs.current.set(event.id, node); else nodeRefs.current.delete(event.id); }}
                          className={`${styles.event} ${zoom === 1 ? styles.compact : ""} ${selected?.id === event.id ? styles.selected : ""} ${relatedIds.has(event.id) ? styles.related : ""} ${future ? styles.future : ""}`}
                          style={{ left: position.x, top: position.y - lane.offset - (zoom === 1 ? 10 : 24) }}
                          aria-pressed={selected?.id === event.id} aria-label={`${kindLabels[event.kind]}：${event.title}，${formatTimelineTime(event.timestamp)}`}
                          title={event.title} onClick={() => select(event.id)}>
                          <span className={styles.compactSymbol} aria-hidden="true">{event.kind === "issue" ? "◇" : event.kind === "commit" ? "C" : event.kind === "pull_request" ? "P" : event.kind === "check" ? event.state === "success" ? "✓" : event.state === "failure" ? "!" : "◌" : "✧"}</span>
                          <span>{kindLabels[event.kind]} <time>{formatTimelineTime(event.timestamp, true)}</time></span>
                          <strong>{event.title}</strong>
                        </button>;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : <div ref={scrollRef} className={styles.emptyPlot}>
            <span aria-hidden="true">◇</span><h2>{events.length === 0 ? "时间线等待第一条真实记录" : "没有符合筛选的事件"}</h2>
            <p>{events.length === 0 ? "返回证据工作台，先同步 GitHub 开发记录。" : "调整类型、日期或关键词，或者重置筛选。"}</p>
            {events.length > 0 ? <button onClick={() => { setFilters(emptyFilters()); setPlaying(false); }}>重置筛选</button> : null}
          </div>}
          <p className={styles.canvasHint}>青线为选中事件的已确认关联 · C 提交 / P PR · 方向键切换，放大后展开标题</p>
        </div>

        <aside className={styles.inspector} aria-label="事件详情">
          {selected ? <>
            <div className={styles.inspectorMeta}><span>{kindLabels[selected.kind]} · {selected.kind === "ai" ? "AI 记录" : "来源事实"}</span><span>{currentIndex + 1} / {filtered.length}</span></div>
            <h2>{selected.title}</h2>
            <time dateTime={selected.occurred_at}>{formatTimelineTime(selected.timestamp)}</time>
            <p className={styles.state}>同步时状态 <strong>{selected.state ?? "recorded"}</strong></p>
            <div className={styles.timeNote}>{timeDescriptions[selected.kind]}</div>
            <details className={styles.sourceDetails}>
              <summary>查看源记录正文</summary>
              <p className={styles.sourceBody}>{selected.summary || "源记录没有提供正文。"}</p>
            </details>
            <div className={styles.sourceActions}>
              <a href={selected.source_url} target="_blank" rel="noreferrer">{selected.kind === "ai" ? "打开 AI 任务账本" : "打开 GitHub 原文 ↗"}</a>
              <button onClick={copyEventLink}>复制事件链接</button>
            </div>
            {copyMessage ? <p className={styles.copyMessage} role="status">{copyMessage}</p> : null}
            <div className={styles.linkedEvidence}>
              <h3>已确认关联 <span>{related.length}</span></h3>
              {related.length === 0 ? <p>此事件还没有人工确认的关联。可返回证据工作台审阅。</p> : related.map((link) => {
                const otherId = link.source_id === selected.id ? link.target_id : link.source_id;
                const other = itemMap.get(otherId);
                if (!other) return <p key={link.id}>关联证据不在本次加载范围内。</p>;
                return <button key={link.id} onClick={() => select(other.id, true)}>
                  <span>{link.source_id === selected.id ? relations[link.relation] : "关联自"} · {kindLabels[other.kind]}</span>
                  <strong>{other.title}</strong><small>{link.reasons.join("；")}</small>
                </button>;
              })}
            </div>
          </> : <p>选择时间线中的事件，即可查看详情和原文。</p>}
        </aside>
      </div>

      <footer className={styles.player}>
        <div className={styles.transport}>
          <button aria-label="上一条事件" disabled={currentIndex <= 0} onClick={() => step(-1)}>←</button>
          <button className={styles.playButton} disabled={filtered.length < 2 || reducedMotion} onClick={() => {
            if (activePlayback) { setPlaying(false); return; }
            if (currentIndex === filtered.length - 1) setSelectedId(filtered[0].id);
            setPlaying(true);
          }}>{activePlayback ? "暂停回放" : "播放回放"}</button>
          <button aria-label="下一条事件" disabled={currentIndex < 0 || currentIndex >= filtered.length - 1} onClick={() => step(1)}>→</button>
        </div>
        <label className={styles.scrubber}>回放进度
          <input type="range" min={0} max={Math.max(0, filtered.length - 1)} value={Math.max(0, currentIndex)} disabled={filtered.length < 2}
            aria-valuetext={selected ? `${currentIndex + 1}/${filtered.length} ${selected.title}` : "暂无事件"}
            onInput={(event) => select(filtered[Number(event.currentTarget.value)].id)} />
        </label>
        <label className={styles.speed}>回放速度<select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>
          <option value={1000}>每秒一条</option><option value={2500}>每 2.5 秒一条</option><option value={5000}>每 5 秒一条</option>
        </select></label>
        <output className={styles.position} aria-live="off">{currentIndex < 0 ? "0 / 0" : `${currentIndex + 1} / ${filtered.length}`}</output>
      </footer>
      <p className={styles.replayNote}>{reducedMotion ? "已遵循系统减少动态效果设置，请用单步按钮回放。" : "按当前筛选的证据顺序回放；状态为同步快照，不还原完整历史或代码文件。"}</p>
    </section>
  );
}
