import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const query = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
  };
  return {
    query,
    from: vi.fn().mockReturnValue(query),
    requireUser: vi.fn(),
    revalidate: vi.fn(),
    redirect: vi.fn((path: string): never => { throw new Error(`redirect:${path}`); }),
  };
});

vi.mock("@/lib/auth", () => ({ requireGitHubUser: mocks.requireUser }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { reviewEvidenceLink } from "./actions";

const projectId = "0eadd56a-79cf-4980-9201-47a1394244d1";
const linkId = "6d086582-9d6b-4e3f-81a3-ef23587ab4e6";

function form(status: string) {
  const data = new FormData();
  data.set("projectId", projectId);
  data.set("linkId", linkId);
  data.set("status", status);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({
    supabase: { from: mocks.from }, user: { id: "current-user" },
  });
  mocks.query.maybeSingle.mockResolvedValue({ data: { id: linkId }, error: null });
});

describe("evidence review", () => {
  it.each(["confirmed", "rejected"])("saves %s only for the current user's project", async (status) => {
    await reviewEvidenceLink(form(status));
    expect(mocks.from).toHaveBeenCalledWith("evidence_links");
    expect(mocks.query.update).toHaveBeenCalledWith({ status, reviewed_at: expect.any(String) });
    expect(mocks.query.eq.mock.calls).toEqual([
      ["id", linkId], ["project_id", projectId], ["owner_id", "current-user"],
    ]);
    expect(mocks.revalidate).toHaveBeenCalledWith(`/app/projects/${projectId}`);
  });

  it("clears the review timestamp when undoing a decision", async () => {
    await reviewEvidenceLink(form("suggested"));
    expect(mocks.query.update).toHaveBeenCalledWith({ status: "suggested", reviewed_at: null });
  });

  it("rejects malformed identifiers and unsupported statuses before database access", async () => {
    const invalidId = form("confirmed");
    invalidId.set("linkId", "invalid");
    await reviewEvidenceLink(invalidId);
    await reviewEvidenceLink(form("deleted"));
    expect(mocks.requireUser).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it.each([
    { data: null, error: { code: "network" } },
    { data: null, error: null },
  ])("does not report success if the write fails or no owned row was updated", async (result) => {
    mocks.query.maybeSingle.mockResolvedValue(result);
    await expect(reviewEvidenceLink(form("confirmed"))).rejects.toThrow("redirect:");
    expect(mocks.redirect).toHaveBeenCalledWith(expect.stringContaining("?error="));
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
