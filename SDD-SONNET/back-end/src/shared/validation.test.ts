import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  LIMITS,
  charCount,
  dueDateField,
  emailField,
  isValidCalendarDate,
  isUuid,
  labelColorField,
  normalizeEmail,
  optionalTextField,
  passwordField,
  positionField,
  textField,
} from "./validation";

const cardTitle = textField("Título", LIMITS.cardTitle.min, LIMITS.cardTitle.max);

describe("contagem de caracteres (RT-33)", () => {
  it("conta emoji como um único caractere", () => {
    expect(charCount("a😀b")).toBe(3);
  });

  it("aceita 100 emojis em nome de quadro de limite 100", () => {
    const schema = textField("Nome", 1, 100);
    expect(schema.safeParse("😀".repeat(100)).success).toBe(true);
    expect(schema.safeParse("😀".repeat(101)).success).toBe(false);
  });
});

describe("campos de texto (CB-01, CB-02, CA-11, CA-29)", () => {
  it("recusa texto vazio ou só com espaços", () => {
    expect(cardTitle.safeParse("").success).toBe(false);
    expect(cardTitle.safeParse("    ").success).toBe(false);
  });

  it("remove espaços nas extremidades antes de validar", () => {
    const result = cardTitle.safeParse("  Tarefa  ");
    expect(result.success && result.data).toBe("Tarefa");
  });

  it("aceita exatamente o limite e recusa acima dele, sem truncar", () => {
    expect(cardTitle.safeParse("a".repeat(200)).success).toBe(true);
    expect(cardTitle.safeParse("a".repeat(201)).success).toBe(false);
  });

  it("preserva caracteres especiais como digitados (CB-04)", () => {
    const text = `<b>"Olá" & 'ç'</b> 😀`;
    const result = cardTitle.safeParse(text);
    expect(result.success && result.data).toBe(text);
  });

  it("recusa valor que não é texto", () => {
    expect(cardTitle.safeParse(42).success).toBe(false);
    expect(cardTitle.safeParse(undefined).success).toBe(false);
  });
});

describe("descrição opcional (RN-11)", () => {
  const description = optionalTextField("Descrição", LIMITS.cardDescription.max);

  it("vazio ou só espaços vira null", () => {
    expect(description.parse("")).toBeNull();
    expect(description.parse("   ")).toBeNull();
    expect(description.parse(null)).toBeNull();
  });

  it("aceita 5.000 e recusa 5.001 caracteres", () => {
    expect(description.safeParse("a".repeat(5000)).success).toBe(true);
    expect(description.safeParse("a".repeat(5001)).success).toBe(false);
  });
});

describe("e-mail (RN-01, RN-02, CA-02, CB-27)", () => {
  it("normaliza para minúsculas sem espaços", () => {
    expect(normalizeEmail("  ANA@Exemplo.COM ")).toBe("ana@exemplo.com");
    expect(emailField.parse("  ANA@Exemplo.COM ")).toBe("ana@exemplo.com");
  });

  it("recusa formato inválido", () => {
    for (const value of ["", "ana", "ana@", "@exemplo.com", "ana@exemplo", "a b@c.com"]) {
      expect(emailField.safeParse(value).success).toBe(false);
    }
  });

  it("recusa e-mail acima de 254 caracteres", () => {
    const long = `${"a".repeat(250)}@b.co`;
    expect(emailField.safeParse(long).success).toBe(false);
  });
});

describe("senha (RN-02, CA-03)", () => {
  it("exige no mínimo 8 caracteres", () => {
    expect(passwordField.safeParse("1234567").success).toBe(false);
    expect(passwordField.safeParse("12345678").success).toBe(true);
  });

  it("limita a 128 caracteres (RT-43)", () => {
    expect(passwordField.safeParse("a".repeat(128)).success).toBe(true);
    expect(passwordField.safeParse("a".repeat(129)).success).toBe(false);
  });

  it("não remove espaços da senha", () => {
    expect(passwordField.parse("  abcdefg  ")).toBe("  abcdefg  ");
  });
});

describe("datas de prazo (CA-82, CB-37, CB-38)", () => {
  it("aceita datas reais", () => {
    expect(isValidCalendarDate("2026-10-02")).toBe(true);
    expect(isValidCalendarDate("0001-01-01")).toBe(true);
    expect(isValidCalendarDate("9999-12-31")).toBe(true);
  });

  it("aceita 29 de fevereiro só em ano bissexto", () => {
    expect(isValidCalendarDate("2024-02-29")).toBe(true);
    expect(isValidCalendarDate("2000-02-29")).toBe(true);
    expect(isValidCalendarDate("2025-02-29")).toBe(false);
    expect(isValidCalendarDate("1900-02-29")).toBe(false);
  });

  it("recusa dias e meses inexistentes", () => {
    expect(isValidCalendarDate("2026-04-31")).toBe(false);
    expect(isValidCalendarDate("2026-13-01")).toBe(false);
    expect(isValidCalendarDate("2026-00-10")).toBe(false);
    expect(isValidCalendarDate("2026-01-00")).toBe(false);
  });

  it("recusa formatos irreconhecíveis e ano zero", () => {
    for (const value of ["", "amanhã", "2026/10/02", "02-10-2026", "2026-1-2", "0000-01-01"]) {
      expect(isValidCalendarDate(value)).toBe(false);
    }
    expect(dueDateField.safeParse("2026-02-30").success).toBe(false);
  });
});

describe("demais campos", () => {
  it("aceita só as cores da paleta (CA-60)", () => {
    expect(labelColorField.safeParse("red").success).toBe(true);
    expect(labelColorField.safeParse("pink").success).toBe(false);
  });

  it("posição deve ser inteiro não negativo (RT-09)", () => {
    expect(positionField.safeParse(0).success).toBe(true);
    expect(positionField.safeParse(3).success).toBe(true);
    expect(positionField.safeParse(-1).success).toBe(false);
    expect(positionField.safeParse(1.5).success).toBe(false);
    expect(positionField.safeParse("1").success).toBe(false);
  });

  it("reconhece UUID e recusa identificador mal formado (RT-06)", () => {
    expect(isUuid("3f2b8a1e-5c4d-4e6f-9a7b-1c2d3e4f5a6b")).toBe(true);
    expect(isUuid("123")).toBe(false);
    expect(isUuid(undefined)).toBe(false);
  });

  it("descarta campos desconhecidos do corpo (RT-33)", () => {
    const schema = z.object({ name: textField("Nome", 1, 10) });
    expect(schema.parse({ name: "A", role: "admin" })).toEqual({ name: "A" });
  });
});
