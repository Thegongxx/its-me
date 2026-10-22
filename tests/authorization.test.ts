import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn(), configured: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ configured: mocks.configured, sessionClient: async () => ({ auth: { getUser: mocks.getUser }, rpc: mocks.rpc }) }));
import { requireAdmin } from "@/lib/auth";
describe("authentication and authorization are distinct", () => {
  beforeEach(() => { process.env.DEMO_MODE = "false"; mocks.configured.mockReturnValue(true); mocks.getUser.mockReset(); mocks.rpc.mockReset(); });
  it("blocks preview writes even when a real backend is configured", async () => { process.env.DEMO_MODE = "true"; await expect(requireAdmin()).rejects.toMatchObject({ status: 503 }); expect(mocks.getUser).not.toHaveBeenCalled(); });
  it("requires verified login first", async () => { mocks.getUser.mockResolvedValue({ data: { user: null }, error: null }); await expect(requireAdmin()).rejects.toMatchObject({ status: 401 }); expect(mocks.rpc).not.toHaveBeenCalled(); });
  it("denies ordinary signed-in accounts, ignoring user metadata", async () => { mocks.getUser.mockResolvedValue({ data: { user: { id: "ordinary", user_metadata: { admin: true } } }, error: null }); mocks.rpc.mockResolvedValue({ data: false, error: null }); await expect(requireAdmin()).rejects.toMatchObject({ status: 403 }); expect(mocks.rpc).toHaveBeenCalledWith("is_admin"); });
  it("fails closed if the permission query errors", async () => { mocks.getUser.mockResolvedValue({ data: { user: { id: "admin" } }, error: null }); mocks.rpc.mockResolvedValue({ data: null, error: { message: "offline" } }); await expect(requireAdmin()).rejects.toMatchObject({ status: 503 }); });
  it("allows only an explicitly authorized verified user", async () => { mocks.getUser.mockResolvedValue({ data: { user: { id: "admin" } }, error: null }); mocks.rpc.mockResolvedValue({ data: true, error: null }); await expect(requireAdmin()).resolves.toMatchObject({ state: "authorized", user: { id: "admin" } }); });
});
