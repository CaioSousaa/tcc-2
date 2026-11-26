import { describe, expect, it } from "vitest";
import {
  DEFAULT_LIST_NAMES,
  createBoardSchema,
  listBoardsQuerySchema,
  updateBoardSchema,
} from "./boards.schemas";

describe("criar quadro (CA-10, CA-11, RN-11)", () => {
  it("aceita nome válido e remove espaços nas extremidades", () => {
    expect(createBoardSchema.parse({ name: "  Projeto X  " }).name).toBe("Projeto X");
  });

  it("recusa vazio, só espaços e ausente", () => {
    expect(createBoardSchema.safeParse({ name: "" }).success).toBe(false);
    expect(createBoardSchema.safeParse({ name: "     " }).success).toBe(false);
    expect(createBoardSchema.safeParse({}).success).toBe(false);
  });

  it("aceita 100 caracteres e recusa 101", () => {
    expect(createBoardSchema.safeParse({ name: "a".repeat(100) }).success).toBe(true);
    expect(createBoardSchema.safeParse({ name: "a".repeat(101) }).success).toBe(false);
  });

  it("permite nomes repetidos: não há unicidade (RN-12)", () => {
    expect(createBoardSchema.safeParse({ name: "Igual" }).success).toBe(true);
    expect(createBoardSchema.safeParse({ name: "Igual" }).success).toBe(true);
  });

  it("não interpreta marcas de HTML: guarda como digitado (CB-04)", () => {
    expect(createBoardSchema.parse({ name: "<script>x</script>" }).name).toBe("<script>x</script>");
  });

  it("cor de faixa só aceita as cores do protótipo", () => {
    for (const color of ["navy", "blue", "green", "amber", "purple"]) {
      expect(createBoardSchema.safeParse({ name: "Q", color }).success).toBe(true);
    }
    expect(createBoardSchema.safeParse({ name: "Q", color: "pink" }).success).toBe(false);
  });

  it("listas padrão são opcionais e booleanas", () => {
    expect(createBoardSchema.parse({ name: "Q", withDefaultLists: true }).withDefaultLists).toBe(true);
    expect(createBoardSchema.safeParse({ name: "Q", withDefaultLists: "sim" }).success).toBe(false);
    expect([...DEFAULT_LIST_NAMES]).toEqual(["A fazer", "Em progresso", "Concluído"]);
  });
});

describe("editar quadro (CA-14)", () => {
  it("aceita nome, cor ou ambos; exige ao menos um", () => {
    expect(updateBoardSchema.safeParse({ name: "Novo" }).success).toBe(true);
    expect(updateBoardSchema.safeParse({ color: "green" }).success).toBe(true);
    expect(updateBoardSchema.safeParse({}).success).toBe(false);
    expect(updateBoardSchema.safeParse({ name: "  " }).success).toBe(false);
  });
});

describe("listagem de quadros: hoje local do cliente (RT-16)", () => {
  it("aceita AAAA-MM-DD ou nada", () => {
    expect(listBoardsQuerySchema.safeParse({ today: "2026-10-02" }).success).toBe(true);
    expect(listBoardsQuerySchema.safeParse({}).success).toBe(true);
    expect(listBoardsQuerySchema.safeParse({ today: "hoje" }).success).toBe(false);
  });
});
