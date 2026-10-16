import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
const mocks = vi.hoisted(() => ({ updateSession: vi.fn() }));
vi.mock("@/lib/supabase/proxy", () => ({ updateSession: mocks.updateSession }));
import { proxy } from "./proxy";
beforeEach(() => { vi.clearAllMocks(); mocks.updateSession.mockResolvedValue(NextResponse.next()); });
describe("session refresh boundary", () => {
  it.each(["/api/health", "/api/ready", "/auth/callback", "/", "/app-other"])("does not contact auth for public route %s", async path => {
    await proxy(new NextRequest(`https://example.com${path}`)); expect(mocks.updateSession).not.toHaveBeenCalled();
  });
  it.each(["/app", "/app/projects/id", "/login"])("refreshes the existing session for %s", async path => {
    await proxy(new NextRequest(`https://example.com${path}`)); expect(mocks.updateSession).toHaveBeenCalledOnce();
  });
  it("keeps teacher pages anonymous and non-cacheable", async () => {
    const response = await proxy(new NextRequest("https://example.com/review/fixture"));
    expect(mocks.updateSession).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-robots-tag")).toContain("noindex");
  });
});
