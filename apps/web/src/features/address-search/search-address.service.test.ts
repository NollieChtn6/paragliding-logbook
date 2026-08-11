import { afterEach, describe, expect, it, vi } from "vitest";
import { searchAddress } from "./search-address.service";

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

describe("searchAddress", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not call the API for a query shorter than 3 characters", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const result = await searchAddress("ab");

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("maps BAN features to address suggestions", async () => {
    mockFetchOnce({
      json: async () => ({
        features: [
          {
            geometry: { coordinates: [5.888, 45.3067] },
            properties: {
              id: "38387_0184",
              label: "84 Route des Trois Villages 38660 Saint-Hilaire-du-Touvet",
              postcode: "38660",
              city: "Saint-Hilaire-du-Touvet",
            },
          },
        ],
      }),
    });

    const result = await searchAddress("84 route des trois villages");

    expect(result).toEqual([
      {
        id: "38387_0184",
        label: "84 Route des Trois Villages 38660 Saint-Hilaire-du-Touvet",
        postalCode: "38660",
        city: "Saint-Hilaire-du-Touvet",
        latitude: 45.3067,
        longitude: 5.888,
      },
    ]);
  });

  it("returns an empty array when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));

    const result = await searchAddress("saint hilaire du touvet");

    expect(result).toEqual([]);
  });

  it("returns an empty array when the response is not ok", async () => {
    mockFetchOnce({ ok: false });

    const result = await searchAddress("saint hilaire du touvet");

    expect(result).toEqual([]);
  });

  it("returns an empty array when the response body is unexpected", async () => {
    mockFetchOnce({ json: async () => ({ unexpected: true }) });

    const result = await searchAddress("saint hilaire du touvet");

    expect(result).toEqual([]);
  });
});
