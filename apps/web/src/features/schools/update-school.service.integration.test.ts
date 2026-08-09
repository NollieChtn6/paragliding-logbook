import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createSchool } from "./create-school.service";
import { updateSchool } from "./update-school.service";

let schoolId: string;

beforeAll(async () => {
  const suffix = crypto.randomUUID();
  const school = await createSchool({
    name: `Update School Test ${suffix}`,
    website: "https://www.initial.fr",
  });
  schoolId = school.id;
});

afterAll(async () => {
  await prisma.school.deleteMany({ where: { id: schoolId } });
  await prisma.$disconnect();
});

describe("updateSchool (integration)", () => {
  it("updates the school with the submitted data", async () => {
    const updated = await updateSchool(schoolId, {
      name: "Updated School Name",
      city: "Nouvelle ville",
      website: "https://www.updated.fr",
    });

    expect(updated.name).toBe("Updated School Name");
    expect(updated.city).toBe("Nouvelle ville");
    expect(updated.website).toBe("https://www.updated.fr");
  });

  it("clears an optional field when it is omitted from the input", async () => {
    const updated = await updateSchool(schoolId, { name: "Updated School Name" });

    expect(updated.city).toBeNull();
    expect(updated.website).toBeNull();
  });

  it("fails with invalid data", async () => {
    await expect(updateSchool(schoolId, { name: "" })).rejects.toThrow();
  });

  it("fails when the school does not exist", async () => {
    await expect(updateSchool(crypto.randomUUID(), { name: "Anything" })).rejects.toThrow();
  });
});
