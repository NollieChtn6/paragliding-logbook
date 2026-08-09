import { describe, expect, it } from "vitest";
import { toSafeRedirectPath } from "./safe-redirect";

describe("toSafeRedirectPath", () => {
  it("accepts an internal absolute path", () => {
    expect(toSafeRedirectPath("/activities/new", "/fallback")).toBe("/activities/new");
  });

  it.each([
    [null, "no value"],
    [undefined, "undefined value"],
    ["", "empty string"],
    ["activities", "path without leading slash"],
    ["//evil.example.com", "protocol-relative URL"],
    ["https://evil.example.com", "absolute URL"],
    ["/redirect?to=https://evil.example.com", "path containing a nested scheme"],
  ])("falls back for %s (%s)", (input, _description) => {
    expect(toSafeRedirectPath(input, "/fallback")).toBe("/fallback");
  });
});
