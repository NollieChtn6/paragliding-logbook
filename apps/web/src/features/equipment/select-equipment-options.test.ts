import { describe, expect, it } from "vitest";
import type { EquipmentListItem } from "./list-equipment.service";
import { selectEquipmentOptions } from "./select-equipment-options";

function makeEquipment(overrides: Partial<EquipmentListItem> & { id: string }): EquipmentListItem {
  return {
    userId: "user-1",
    equipmentTypeId: "type-1",
    brand: "Ozone",
    model: "Rush 6",
    size: null,
    purchaseDate: new Date("2025-01-01"),
    condition: "NEW",
    initialUsageMin: 0,
    status: "ACTIVE",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    equipmentType: { id: "type-1", code: "WING" },
    ...overrides,
  } as EquipmentListItem;
}

describe("selectEquipmentOptions", () => {
  it("only returns ACTIVE equipment of the requested type", () => {
    const equipment = [
      makeEquipment({
        id: "wing-active",
        status: "ACTIVE",
        equipmentType: { id: "t1", code: "WING" },
      }),
      makeEquipment({ id: "wing-sold", status: "SOLD", equipmentType: { id: "t1", code: "WING" } }),
      makeEquipment({
        id: "harness-active",
        status: "ACTIVE",
        equipmentType: { id: "t2", code: "HARNESS" },
      }),
    ];

    const options = selectEquipmentOptions(equipment, "WING");

    expect(options.map((option) => option.id)).toEqual(["wing-active"]);
  });

  it("includes the currently selected item even when it is no longer ACTIVE", () => {
    const equipment = [
      makeEquipment({
        id: "wing-active",
        status: "ACTIVE",
        equipmentType: { id: "t1", code: "WING" },
      }),
      makeEquipment({
        id: "wing-retired",
        status: "RETIRED",
        equipmentType: { id: "t1", code: "WING" },
      }),
    ];

    const options = selectEquipmentOptions(equipment, "WING", "wing-retired");

    expect(options.map((option) => option.id).sort()).toEqual(["wing-active", "wing-retired"]);
  });

  it("does not include a SOLD/RETIRED item of the requested type when it is not the selected one", () => {
    const equipment = [
      makeEquipment({
        id: "wing-retired",
        status: "RETIRED",
        equipmentType: { id: "t1", code: "WING" },
      }),
    ];

    const options = selectEquipmentOptions(equipment, "WING", "some-other-id");

    expect(options).toEqual([]);
  });

  it("maps to the expected shape", () => {
    const equipment = [
      makeEquipment({
        id: "wing-1",
        brand: "Ozone",
        model: "Rush 6",
        size: "26",
        equipmentType: { id: "t1", code: "WING" },
      }),
    ];

    expect(selectEquipmentOptions(equipment, "WING")).toEqual([
      { id: "wing-1", brand: "Ozone", model: "Rush 6", size: "26" },
    ]);
  });
});
