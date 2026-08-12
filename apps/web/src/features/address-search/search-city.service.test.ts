import { afterEach, describe, expect, it, vi } from "vitest";
import { searchCity } from "./search-city.service";

function mockFetchOnce(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
      ...response,
    } as Response),
  );
}

describe("searchCity", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not call the API for a query shorter than 3 characters", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const result = await searchCity("an");

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("requests municipalities only (type=municipality)", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ features: [] }),
    } as Response);
    vi.stubGlobal("fetch", fetchSpy);

    await searchCity("Annecy");

    const requestedUrl = fetchSpy.mock.calls[0]?.[0] as URL;
    expect(requestedUrl.searchParams.get("type")).toBe("municipality");
  });

  it("maps BAN municipality features to city suggestions", async () => {
    mockFetchOnce({
      json: async () => ({
        features: [
          {
            properties: { id: "74010", city: "Annecy", postcode: "74000" },
          },
        ],
      }),
    });

    const result = await searchCity("Annecy");

    expect(result).toEqual([{ id: "74010", city: "Annecy", postalCode: "74000" }]);
  });

  it("skips features without a city (unexpected BAN response shape)", async () => {
    mockFetchOnce({
      json: async () => ({
        features: [{ properties: { id: "74010", postcode: "74000" } }],
      }),
    });

    const result = await searchCity("Annecy");

    expect(result).toEqual([]);
  });

  it("returns an empty array when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));

    const result = await searchCity("Annecy");

    expect(result).toEqual([]);
  });

  it("returns an empty array when the response is not ok", async () => {
    mockFetchOnce({ ok: false });

    const result = await searchCity("Annecy");

    expect(result).toEqual([]);
  });

  it("returns an empty array when the response body is unexpected", async () => {
    mockFetchOnce({ json: async () => ({ unexpected: true }) });

    const result = await searchCity("Annecy");

    expect(result).toEqual([]);
  });
});
