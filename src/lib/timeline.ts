import type { EvidenceKind, EvidenceRelation } from "./evidence";

export type TimelineKind = EvidenceKind | "ai";
export type TimelineItem = {
  id: string;
  kind: TimelineKind;
  title: string;
  summary: string | null;
  state: string | null;
  source_url: string;
  occurred_at: string;
};
export type TimelineEvent = TimelineItem & { timestamp: number };
export type TimelineLink = {
  id: string;
  source_id: string;
  target_id: string;
  relation: EvidenceRelation;
  reasons: string[];
};
export const timelineKinds: TimelineKind[] = ["issue", "commit", "pull_request", "check", "ai"];
export const kindLabels: Record<TimelineKind, string> = {
  issue: "需求", commit: "提交", pull_request: "PR", check: "验证", ai: "AI",
};
export const timelineLanes = [
  { id: "requirement", label: "需求", symbol: "◇", kinds: ["issue"], color: "#f2b84b" },
  { id: "code", label: "代码", symbol: "⌘", kinds: ["commit", "pull_request"], color: "#8b91ff" },
  { id: "verification", label: "验证", symbol: "✓", kinds: ["check"], color: "#64d8d1" },
  { id: "ai", label: "AI", symbol: "✧", kinds: ["ai"], color: "#94a3b8" },
] as const;

export const timeDescriptions: Record<TimelineKind, string> = {
  issue: "需求的关闭时间或最近更新时间，不一定是最初提出时间。",
  commit: "提交的作者时间；作者时间缺失时使用提交者时间。",
  pull_request: "PR 的合并、关闭或最近更新时间，不一定是创建时间。",
  check: "Actions 运行的最近更新时间，状态来自这次同步的快照。",
  ai: "AI 调用任务的创建时间；状态来自当前任务账本，内容需人工审阅。",
};

export function prepareTimeline(items: TimelineItem[]) {
  const events = items
    .map((item) => ({ ...item, timestamp: Date.parse(item.occurred_at) }))
    .filter((item) => Number.isFinite(item.timestamp) && timelineKinds.includes(item.kind))
    .sort((a, b) => a.timestamp - b.timestamp || a.id.localeCompare(b.id, "en"));
  return { events, invalidCount: items.length - events.length };
}

export function deriveMilestones(events: TimelineEvent[]) {
  const result: Array<{ eventId: string; label: string }> = [];
  const first = events[0];
  if (first) result.push({ eventId: first.id, label: "最早记录" });
  for (const event of events) {
    if (event.kind === "pull_request" && event.state === "merged") {
      result.push({ eventId: event.id, label: "PR 已合并" });
    } else if (event.kind === "check" && ["failure", "timed_out", "cancelled"].includes(event.state ?? "")) {
      result.push({ eventId: event.id, label: event.state === "cancelled" ? "验证已取消" : "验证未通过" });
    } else if (event.kind === "issue" && event.state === "closed") {
      result.push({ eventId: event.id, label: "需求已关闭" });
    }
  }
  return result.filter((entry, index) => result.findIndex((other) => other.eventId === entry.eventId) === index);
}

export type TimelineFilters = {
  kinds: TimelineKind[];
  query: string;
  fromDay: string;
  toDay: string;
  milestonesOnly: boolean;
};

export function filterTimeline(events: TimelineEvent[], filters: TimelineFilters) {
  const query = filters.query.trim().toLowerCase();
  const from = filters.fromDay ? Date.parse(`${filters.fromDay}T00:00:00+08:00`) : -Infinity;
  const until = filters.toDay ? Date.parse(`${filters.toDay}T00:00:00+08:00`) + 86_400_000 : Infinity;
  const milestones = new Set(deriveMilestones(events).map((entry) => entry.eventId));
  return events.filter((event) =>
    filters.kinds.includes(event.kind) && event.timestamp >= from && event.timestamp < until &&
    (!filters.milestonesOnly || milestones.has(event.id)) &&
    (!query || `${event.title}\n${event.summary ?? ""}\n${event.source_url}\n${kindLabels[event.kind]}`.toLowerCase().includes(query)),
  );
}

export function timelineDomain(events: TimelineEvent[]) {
  if (events.length === 0) return { start: 0, end: 3_600_000 };
  const min = Math.min(...events.map((event) => event.timestamp));
  const max = Math.max(...events.map((event) => event.timestamp));
  const padding = Math.max(60_000, (max - min) * 0.03);
  return { start: min - padding, end: max + padding };
}

export function timelineX(timestamp: number, domain: { start: number; end: number }, width: number) {
  const ratio = domain.end > domain.start ? (timestamp - domain.start) / (domain.end - domain.start) : 0.5;
  const margin = Math.min(80, width / 2);
  return margin + Math.max(0, Math.min(1, ratio)) * Math.max(0, width - margin * 2);
}

export function layoutTimeline(events: TimelineEvent[], width: number, compact = false) {
  const domain = timelineDomain(events);
  let offset = 0;
  const positions = new Map<string, { x: number; y: number; tier: number }>();
  const lanes = timelineLanes.map((lane) => {
    const laneEvents = events.filter((event) => (lane.kinds as readonly string[]).includes(event.kind));
    const occupied: number[] = [];
    for (const event of laneEvents) {
      const x = timelineX(event.timestamp, domain, width);
      let tier = occupied.findIndex((lastX) => x - lastX >= (compact ? 24 : 160));
      if (tier === -1) tier = occupied.length;
      occupied[tier] = x;
      positions.set(event.id, { x, y: offset + 18 + tier * (compact ? 24 : 62) + (compact ? 10 : 24), tier });
    }
    const height = Math.max(compact ? 90 : 100, 36 + occupied.length * (compact ? 24 : 62));
    const result = { ...lane, events: laneEvents, offset, height };
    offset += height;
    return result;
  });
  return { domain, positions, lanes, height: offset };
}

export function timelineTicks(domain: { start: number; end: number }, count = 6) {
  const safeCount = Math.max(2, Math.floor(count));
  return Array.from({ length: safeCount }, (_, index) => domain.start + (domain.end - domain.start) * index / (safeCount - 1));
}

export function formatTimelineTime(timestamp: number, compact = false) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai", month: "2-digit", day: "2-digit",
    ...(compact ? {} : { year: "numeric" }),
    hour: "2-digit", minute: "2-digit", ...(compact ? {} : { second: "2-digit" }),
    hourCycle: "h23",
  }).format(new Date(timestamp));
}

export function nextReplayIndex(current: number, length: number, delta: number) {
  return length === 0 ? -1 : Math.max(0, Math.min(length - 1, current + delta));
}
