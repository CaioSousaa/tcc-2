import { describe, expect, it } from "vitest";
import { charCount, validateEmail, validateText } from "./validation";

describe("validação no cliente, igual ao servidor (RT-33)", () => {
  it("conta emoji como um caractere", () => {
    expect(charCount("😀😀")).toBe(2);
  });

  it("recusa vazio e só espaços (CB-01)", () => {
    expect(validateText("", "Nome", 1, 100)).not.toBeNull();
    expect(validateText("   ", "Nome", 1, 100)).not.toBeNull();
  });

  it("aceita o limite e recusa acima (CB-02)", () => {
    expect(validateText("a".repeat(100), "Nome", 1, 100)).toBeNull();
    expect(validateText("a".repeat(101), "Nome", 1, 100)).not.toBeNull();
  });

  it("valida e-mail (CA-03)", () => {
    expect(validateEmail("ana@exemplo.com")).toBeNull();
    expect(validateEmail("ana")).not.toBeNull();
    expect(validateEmail("")).not.toBeNull();
  });
});
