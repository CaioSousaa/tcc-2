import { describe, expect, it } from "vitest";
import { BOARD_COLOR_ORDER, BOARD_STYLES, LABEL_COLOR_ORDER, LABEL_STYLES, avatarClass } from "./palette";

describe("paleta do protótipo (RT-30)", () => {
  it("etiquetas têm exatamente as seis cores do protótipo, cada uma com estilo", () => {
    expect([...LABEL_COLOR_ORDER].sort()).toEqual(
      ["amber", "blue", "green", "purple", "red", "slate"],
    );
    for (const color of LABEL_COLOR_ORDER) {
      expect(LABEL_STYLES[color].chip).toContain("bg-");
      expect(LABEL_STYLES[color].dot).toContain("bg-");
    }
  });

  it("quadros têm cinco cores de faixa", () => {
    expect([...BOARD_COLOR_ORDER].sort()).toEqual(["amber", "blue", "green", "navy", "purple"]);
    for (const color of BOARD_COLOR_ORDER) expect(BOARD_STYLES[color].band).toContain("bg-");
  });

  it("a cor do avatar é estável para a mesma pessoa", () => {
    expect(avatarClass("user-1")).toBe(avatarClass("user-1"));
    expect(avatarClass("user-1")).toMatch(/^bg-/);
  });
});
