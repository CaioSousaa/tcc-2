import { describe, expect, it } from "vitest";
import { initials } from "./initials";

describe("iniciais do avatar", () => {
  it("usa primeira e última palavra do nome", () => {
    expect(initials("Ana Maria Souza")).toBe("AS");
    expect(initials("bia")).toBe("B");
  });

  it("suporta acentos, emoji e espaços extras", () => {
    expect(initials("  édson   lima ")).toBe("ÉL");
    expect(initials("😀 Teste")).toBe("😀T");
  });

  it("nome vazio vira ?", () => {
    expect(initials("   ")).toBe("?");
  });
});
