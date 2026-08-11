import { beforeEach, describe, expect, it, vi } from "vitest";
import { searchAddress } from "@/features/address-search";
import { requireAdmin } from "@/lib/current-user";
import { searchAddressAction } from "./search-address";

vi.mock("@/features/address-search", () => ({ searchAddress: vi.fn() }));
vi.mock("@/lib/current-user", () => ({ requireAdmin: vi.fn() }));

const ADMIN_USER = { id: "admin-id", role: "ADMIN" };

describe("searchAddressAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue(ADMIN_USER as never);
  });

  it("requires admin before searching", async () => {
    vi.mocked(searchAddress).mockResolvedValue([]);

    await searchAddressAction("saint hilaire");

    expect(requireAdmin).toHaveBeenCalled();
  });

  it("delegates to searchAddress with the query", async () => {
    vi.mocked(searchAddress).mockResolvedValue([]);

    await searchAddressAction("saint hilaire");

    expect(searchAddress).toHaveBeenCalledWith("saint hilaire");
  });
});
