import { describe, expect, it } from "vitest";
import { LIMITS } from "./limits";

// Spec §5 "Limites de tamanho" + plan §5.1 (senha 8–128).
describe("LIMITS", () => {
  it("matches the field limits defined in the specification", () => {
    expect(LIMITS).toMatchObject({
      userName: 100,
      boardName: 100,
      boardDescription: 500,
      listName: 100,
      cardTitle: 200,
      cardDescription: 5000,
      checklistTitle: 100,
      checklistItemText: 200,
      labelName: 30,
      comment: 2000,
      passwordMin: 8,
      passwordMax: 128,
    });
  });
});
