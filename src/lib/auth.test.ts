import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  create: vi.fn(),
  redirect: vi.fn((path: string): never => {
    throw new Error(`redirect:${path}`);
  }),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.create }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
import { requireGitHubUser } from "./auth";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.create.mockResolvedValue({ auth: { getUser: mocks.getUser } });
});
afterEach(() => vi.restoreAllMocks());
describe("authentication failure isolation", () => {
  it("redirects safely when the provider throws instead of returning an error", async () => {
    mocks.getUser.mockRejectedValue(new Error("upstream-private-message"));
    await expect(requireGitHubUser()).rejects.toThrow(
      "redirect:/login?error=network",
    );
  });
  it("rejects a missing session without accepting caller identity", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { name: "AuthSessionMissingError", status: 400 },
    });
    await expect(requireGitHubUser()).rejects.toThrow(
      "redirect:/login?error=session",
    );
  });
  it("requires a GitHub identity from the verified server user", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "owned", user_metadata: { user_name: "student" } } },
      error: null,
    });
    expect((await requireGitHubUser()).githubLogin).toBe("student");
    mocks.getUser.mockResolvedValue({
      data: {
        user: { id: "owned", user_metadata: { user_name: "invalid login" } },
      },
      error: null,
    });
    await expect(requireGitHubUser()).rejects.toThrow(
      "redirect:/login?error=github-identity",
    );
  });
});
