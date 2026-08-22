import { describe, expect, it } from "vitest";
import { getActivityMilestone } from "./activity-milestone";

describe("getActivityMilestone", () => {
  it("returns the first-activity milestone when the user had no prior activity", () => {
    expect(getActivityMilestone(0)).toEqual({ kind: "first-activity" });
  });

  it("returns null once the user already has at least one activity", () => {
    expect(getActivityMilestone(1)).toBeNull();
    expect(getActivityMilestone(42)).toBeNull();
  });
});
