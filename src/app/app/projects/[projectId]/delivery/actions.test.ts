import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
    then: vi.fn(),
  };
  return {
    load: vi.fn(),
    from: vi.fn().mockReturnValue(query),
    query,
    revalidate: vi.fn(),
  };
});
vi.mock("@/lib/delivery-server", () => ({ loadDelivery: mocks.load }));
vi.mock("@/lib/deepseek", () => ({
  aiInput: vi.fn(),
  generateNarrative: vi.fn(),
  inputHash: vi.fn(),
  PROMPT_VERSION: "test",
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { deliveryAction } from "./actions";
const projectId = "0eadd56a-79cf-4980-9201-47a1394244d1";
const runId = "011049e7-08e8-4b44-a9d8-c1a09a7bc079";
const evidenceId = "c522abbf-1dd9-48e5-bbd2-bed5fadd96d5";
function form(task: string) {
  const data = new FormData();
  data.set("projectId", projectId);
  data.set("task", task);
  data.set("publicationConsent", "yes");
  return data;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.load.mockResolvedValue({
    supabase: { from: mocks.from },
    user: { id: "owner" },
    items: [{ id: evidenceId }],
    snapshot: { version: 1, narrative: null },
  });
  mocks.query.maybeSingle.mockResolvedValue({
    data: { id: runId },
    error: null,
  });
  mocks.query.then.mockImplementation((resolve) => resolve({ error: null }));
});
afterEach(() => vi.unstubAllEnvs());
describe("delivery actions", () => {
  it("rejects invalid project IDs before any data access", async () => {
    const data = form("share");
    data.set("projectId", "invalid");
    expect((await deliveryAction({ message: "" }, data)).ok).not.toBe(true);
    expect(mocks.load).not.toHaveBeenCalled();
  });
  it("shows missing key without making a billable call or creating a task", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "");
    expect(
      (await deliveryAction({ message: "" }, form("generate"))).message,
    ).toContain("尚未配置");
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("creates a share using a hash, safe snapshot and current owner only", async () => {
    const data = form("share");
    data.set("days", "1");
    const result = await deliveryAction({ message: "" }, data);
    expect(result.ok).toBe(true);
    expect(result.path).toMatch(/^\/review\/[A-Za-z0-9_-]{43}$/);
    const row = mocks.query.insert.mock.calls[0][0];
    expect(row.owner_id).toBe("owner");
    expect(row.project_id).toBe(projectId);
    expect(row.token_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(row)).not.toContain(result.path!.slice(8));
    expect(row.snapshot.narrative).toBeNull();
  });
  it("rejects arbitrary expiry and never reports success on an insert error", async () => {
    const data = form("share");
    data.set("days", "999");
    expect((await deliveryAction({ message: "" }, data)).ok).not.toBe(true);
    expect(mocks.query.insert).not.toHaveBeenCalled();
    data.set("days", "7");
    mocks.query.then.mockImplementation((resolve) =>
      resolve({ error: { code: "failed" } }),
    );
    expect((await deliveryAction({ message: "" }, data)).ok).not.toBe(true);
  });
  it("requires explicit publication consent on the server too", async () => {
    const data = form("share");
    data.delete("publicationConsent");
    data.set("days", "1");
    expect((await deliveryAction({ message: "" }, data)).ok).not.toBe(true);
    expect(mocks.query.insert).not.toHaveBeenCalled();
  });
  it("scopes revocation to this project and owner and rejects zero-row writes", async () => {
    const data = form("revoke");
    data.set("shareId", runId);
    expect((await deliveryAction({ message: "" }, data)).ok).toBe(true);
    expect(mocks.query.eq.mock.calls).toEqual([
      ["id", runId],
      ["project_id", projectId],
      ["owner_id", "owner"],
    ]);
    mocks.query.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect((await deliveryAction({ message: "" }, data)).ok).not.toBe(true);
  });
  it("approves edited text with valid references after loading the owned completed run", async () => {
    mocks.query.maybeSingle.mockResolvedValueOnce({
      data: { id: runId, status: "completed", evidence_ids: [evidenceId] },
      error: null,
    });
    const data = form("approve");
    data.set("runId", runId);
    data.set("summary", "观察提交 [证据1]");
    data.set("gaps", "样本缺少用例，待核对");
    data.set("script", "展示 [证据1]");
    data.set("citations", evidenceId);
    expect((await deliveryAction({ message: "" }, data)).ok).toBe(true);
    const row = mocks.query.update.mock.calls[0][0];
    expect(row.review_status).toBe("approved");
    expect(row.reviewed_output.summary).toContain(evidenceId);
    expect(mocks.query.eq.mock.calls).toContainEqual(["owner_id", "owner"]);
  });
  it("does not approve a fabricated source or a non-owned run", async () => {
    const data = form("approve");
    data.set("runId", runId);
    data.set("summary", "invented");
    data.set("gaps", "unknown");
    data.set("script", "script");
    data.set("citations", runId);
    mocks.query.maybeSingle.mockResolvedValueOnce({
      data: { id: runId, status: "completed", evidence_ids: [evidenceId] },
      error: null,
    });
    expect((await deliveryAction({ message: "" }, data)).ok).not.toBe(true);
    expect(mocks.query.update).not.toHaveBeenCalled();
    mocks.query.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    expect((await deliveryAction({ message: "" }, data)).ok).not.toBe(true);
    expect(mocks.query.update).not.toHaveBeenCalled();
  });
});
