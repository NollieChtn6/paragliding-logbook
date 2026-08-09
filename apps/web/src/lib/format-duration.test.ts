import { describe, expect, it } from "vitest";
import { formatDurationMinutes } from "./format-duration";

describe("formatDurationMinutes", () => {
  it("shows raw minutes under one hour", () => {
    expect(formatDurationMinutes(0)).toBe("0 min");
    expect(formatDurationMinutes(45)).toBe("45 min");
    expect(formatDurationMinutes(59)).toBe("59 min");
  });

  it("shows hours with no leftover minutes as a bare hour count", () => {
    expect(formatDurationMinutes(60)).toBe("1h");
    expect(formatDurationMinutes(300)).toBe("5h");
  });

  it("shows hours with leftover minutes as HhMM", () => {
    expect(formatDurationMinutes(90)).toBe("1h30");
    expect(formatDurationMinutes(65)).toBe("1h05");
  });

  it("shows days and hours once a full day is reached, dropping remaining minutes", () => {
    expect(formatDurationMinutes(1440)).toBe("1j 0h");
    expect(formatDurationMinutes(1500)).toBe("1j 1h");
    expect(formatDurationMinutes(1500 + 45)).toBe("1j 1h");
  });

  it("handles several days", () => {
    expect(formatDurationMinutes(3 * 1440 + 120)).toBe("3j 2h");
  });
});
