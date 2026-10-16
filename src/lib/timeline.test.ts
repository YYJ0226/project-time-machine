import { describe, expect, it } from "vitest";
import {
  deriveMilestones, filterTimeline, formatTimelineTime, layoutTimeline,
  nextReplayIndex, prepareTimeline, timelineDomain, timelineTicks, timelineX,
  timelineKinds, type TimelineFilters, type TimelineItem,
} from "./timeline";

function item(id: string, overrides: Partial<TimelineItem> = {}): TimelineItem {
  return { id, kind: "commit", title: "Build timeline", summary: null, state: null,
    source_url: "https://github.com/demo/repo/commit/abc123", occurred_at: "2026-10-16T00:00:00Z", ...overrides };
}
const filters: TimelineFilters = { kinds: timelineKinds, query: "", fromDay: "", toDay: "", milestonesOnly: false };

describe("timeline data and filters", () => {
  it("sorts without mutating source data and reports invalid timestamps", () => {
    const items = [item("b"), item("a"), item("bad", { occurred_at: "not-a-time" })];
    const result = prepareTimeline(items);
    expect(result.events.map((event) => event.id)).toEqual(["a", "b"]);
    expect(result.invalidCount).toBe(1);
    expect(items.map((event) => event.id)).toEqual(["b", "a", "bad"]);
  });

  it("combines type, text and inclusive Shanghai calendar dates", () => {
    const { events } = prepareTimeline([
      item("before", { occurred_at: "2026-10-15T15:59:59Z" }),
      item("start", { occurred_at: "2026-10-15T16:00:00Z" }),
      item("end", { occurred_at: "2026-10-16T15:59:59Z" }),
      item("after", { occurred_at: "2026-10-16T16:00:00Z" }),
      item("pr", { kind: "pull_request", occurred_at: "2026-10-16T00:00:00Z" }),
    ]);
    expect(filterTimeline(events, { ...filters, kinds: ["commit"], query: "BUILD", fromDay: "2026-10-16", toDay: "2026-10-16" }).map((event) => event.id)).toEqual(["start", "end"]);
  });

  it("finds source SHA, handles reversed dates and empty kind selection", () => {
    const { events } = prepareTimeline([item("a")]);
    expect(filterTimeline(events, { ...filters, query: "abc123" })).toHaveLength(1);
    expect(filterTimeline(events, { ...filters, fromDay: "2026-10-17", toDay: "2026-10-16" })).toEqual([]);
    expect(filterTimeline(events, { ...filters, kinds: [] })).toEqual([]);
  });

  it("marks source milestones without inventing success for running CI", () => {
    const { events } = prepareTimeline([
      item("first", { occurred_at: "2026-10-15T23:00:00Z" }), item("pr", { kind: "pull_request", state: "merged" }),
      item("failure", { kind: "check", state: "failure" }),
      item("running", { kind: "check", state: "in_progress" }),
    ]);
    const milestones = deriveMilestones(events);
    expect(milestones).toEqual(expect.arrayContaining([
      { eventId: "pr", label: "PR 已合并" }, { eventId: "failure", label: "验证未通过" },
    ]));
    expect(milestones.some((entry) => entry.eventId === "running")).toBe(false);
    expect(filterTimeline(events, { ...filters, milestonesOnly: true })).toHaveLength(3);
  });
});

describe("shared time geometry", () => {
  it("uses one time coordinate across lanes and stacks colliding events", () => {
    const { events } = prepareTimeline([item("a"), item("b"), item("check", { kind: "check" })]);
    const layout = layoutTimeline(events, 800);
    expect(layout.positions.get("a")?.x).toBe(layout.positions.get("check")?.x);
    expect(layout.positions.get("a")?.tier).not.toBe(layout.positions.get("b")?.tier);
    expect(layout.lanes).toHaveLength(4);
    expect(layout.lanes[3].events).toHaveLength(0);
  });

  it("keeps all nodes inside the plot and separates labels sharing a tier", () => {
    const { events } = prepareTimeline(Array.from({ length: 20 }, (_, index) => item(String(index), {
      occurred_at: new Date(Date.UTC(2026, 9, 16, index)).toISOString(),
    })));
    const layout = layoutTimeline(events, 800);
    const lastInTier = new Map<number, number>();
    for (const event of events) {
      const position = layout.positions.get(event.id)!;
      expect(position.x).toBeGreaterThanOrEqual(80);
      expect(position.x).toBeLessThanOrEqual(720);
      const previous = lastInTier.get(position.tier);
      if (previous !== undefined) expect(position.x - previous).toBeGreaterThanOrEqual(160);
      lastInTier.set(position.tier, position.x);
    }
  });

  it("supports empty data, identical times and zoom without NaN", () => {
    expect(layoutTimeline([], 800).height).toBeGreaterThan(0);
    const { events } = prepareTimeline([item("a")]);
    const domain = timelineDomain(events);
    expect(domain.end).toBeGreaterThan(domain.start);
    expect(timelineX(events[0].timestamp, domain, 800)).toBe(400);
    expect(timelineX(events[0].timestamp, domain, 1600)).toBe(800);
    expect(timelineTicks(domain)).toHaveLength(6);
  });

  it("keeps dense overview nodes distinct while reserving all four lanes", () => {
    const { events } = prepareTimeline(Array.from({ length: 20 }, (_, index) => item(String(index))));
    const compact = layoutTimeline(events, 800, true);
    const expanded = layoutTimeline(events, 800);
    expect(new Set([...compact.positions.values()].map((position) => `${position.x}:${position.y}`)).size).toBe(20);
    expect(compact.height).toBeLessThan(expanded.height);
    expect(compact.lanes.map((lane) => lane.id)).toEqual(["requirement", "code", "verification", "ai"]);
  });
});

describe("replay bounds and time display", () => {
  it("stops at both ends and handles zero/one event", () => {
    expect(nextReplayIndex(0, 0, 1)).toBe(-1);
    expect(nextReplayIndex(0, 1, 1)).toBe(0);
    expect(nextReplayIndex(4, 5, 1)).toBe(4);
    expect(nextReplayIndex(0, 5, -1)).toBe(0);
  });

  it("uses the same timezone independently of the browser or server timezone", () => {
    expect(formatTimelineTime(Date.parse("2026-10-15T16:00:00Z"))).toContain("10/16 00:00:00");
  });
});
