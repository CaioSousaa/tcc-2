import { describe, expect, it } from "vitest";
import { commentBodySchema } from "./comments.schemas";

describe("comentário (CA-69, CA-71, RN-29)", () => {
  it("aceita texto válido e remove espaços nas pontas", () => {
    expect(commentBodySchema.parse({ text: "  Feito!  " }).text).toBe("Feito!");
  });

  it("recusa vazio e só espaços", () => {
    expect(commentBodySchema.safeParse({ text: "" }).success).toBe(false);
    expect(commentBodySchema.safeParse({ text: "   \n  " }).success).toBe(false);
  });

  it("aceita 2.000 caracteres e recusa 2.001", () => {
    expect(commentBodySchema.safeParse({ text: "a".repeat(2000) }).success).toBe(true);
    expect(commentBodySchema.safeParse({ text: "a".repeat(2001) }).success).toBe(false);
  });

  it("emoji conta como um caractere", () => {
    expect(commentBodySchema.safeParse({ text: "😀".repeat(2000) }).success).toBe(true);
  });

  it("preserva marcas de HTML como texto (CB-04)", () => {
    expect(commentBodySchema.parse({ text: "<img src=x onerror=alert(1)>" }).text).toBe(
      "<img src=x onerror=alert(1)>",
    );
  });

  it("não aceita campos de autoria vindos do cliente (autor é o usuário autenticado)", () => {
    const parsed = commentBodySchema.parse({ text: "Oi", authorId: "outra-pessoa" });
    expect(parsed).toEqual({ text: "Oi" });
  });
});
