import { describe, expect, it } from "vitest";
import { getDictionary } from "@/messages";
import { getGreeting } from "./greeting";

const t = getDictionary("fr-FR").dashboard;

describe("getGreeting", () => {
  it("says Bonjour before 19h", () => {
    expect(getGreeting("Martin Dupont", t, new Date("2026-01-01T18:59:00"))).toBe(
      "Bonjour Martin 👋",
    );
  });

  it("says Bonsoir from 19h", () => {
    expect(getGreeting("Martin Dupont", t, new Date("2026-01-01T19:00:00"))).toBe(
      "Bonsoir Martin 👋",
    );
  });

  it("extracts only the first word of the full name", () => {
    expect(getGreeting("Jean-Paul Martin", t, new Date("2026-01-01T10:00:00"))).toBe(
      "Bonjour Jean-Paul 👋",
    );
  });

  it("uses the whole name when there is no space", () => {
    expect(getGreeting("Dev", t, new Date("2026-01-01T10:00:00"))).toBe("Bonjour Dev 👋");
  });
});
