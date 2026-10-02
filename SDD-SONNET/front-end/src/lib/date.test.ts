import { describe, expect, it } from "vitest";
import {
  daysBetween,
  dueStatus,
  dueText,
  dueTone,
  formatCommentTime,
  formatDueDate,
  formatShortDate,
  isOverdue,
  isValidCalendarDate,
  todayLocal,
} from "./date";

const TODAY = "2026-10-02";

describe("hoje local (RT-16)", () => {
  it("monta AAAA-MM-DD pela data local, com zeros à esquerda", () => {
    expect(todayLocal(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
    expect(todayLocal(new Date(2026, 11, 31, 0, 0))).toBe("2026-12-31");
  });
});

describe("atrasado (RN-32, CA-74 a CA-80)", () => {
  it("prazo futuro não está atrasado (CA-74)", () => {
    expect(isOverdue({ dueDate: "2026-10-03", completed: false }, TODAY)).toBe(false);
  });

  it("prazo igual a hoje não está atrasado (CA-75)", () => {
    expect(isOverdue({ dueDate: TODAY, completed: false }, TODAY)).toBe(false);
  });

  it("prazo anterior a hoje e não concluído está atrasado (CA-76)", () => {
    expect(isOverdue({ dueDate: "2026-10-01", completed: false }, TODAY)).toBe(true);
  });

  it("concluir tira o atraso; reabrir devolve (CA-77)", () => {
    expect(isOverdue({ dueDate: "2026-09-01", completed: true }, TODAY)).toBe(false);
    expect(isOverdue({ dueDate: "2026-09-01", completed: false }, TODAY)).toBe(true);
  });

  it("alterar o prazo para hoje, futuro ou remover tira o atraso (CA-78)", () => {
    expect(isOverdue({ dueDate: TODAY, completed: false }, TODAY)).toBe(false);
    expect(isOverdue({ dueDate: "2027-01-01", completed: false }, TODAY)).toBe(false);
    expect(isOverdue({ dueDate: null, completed: false }, TODAY)).toBe(false);
  });

  it("sem prazo nunca está atrasado (CA-79, CB-23)", () => {
    expect(isOverdue({ dueDate: null, completed: false }, TODAY)).toBe(false);
    expect(isOverdue({ dueDate: null, completed: true }, TODAY)).toBe(false);
  });

  it("na virada do dia o card passa a atrasado (CA-80)", () => {
    const card = { dueDate: "2026-10-02", completed: false };
    expect(isOverdue(card, "2026-10-02")).toBe(false);
    expect(isOverdue(card, "2026-10-03")).toBe(true);
  });

  it("compara corretamente entre meses e anos", () => {
    expect(isOverdue({ dueDate: "2025-12-31", completed: false }, "2026-01-01")).toBe(true);
    expect(isOverdue({ dueDate: "2026-09-30", completed: false }, "2026-10-01")).toBe(true);
    expect(isOverdue({ dueDate: "9999-12-31", completed: false }, TODAY)).toBe(false);
  });
});

describe("formatação de prazo", () => {
  it("não desloca o dia por causa de fuso (CB-36)", () => {
    expect(formatDueDate("2026-10-02")).toBe("02/10/2026");
    expect(formatDueDate("2024-02-29")).toBe("29/02/2024");
  });
});

describe("validação de data no cliente (CA-82, CB-37, CB-38)", () => {
  it("aceita datas reais, incluindo 29/02 em ano bissexto e ano 9999", () => {
    expect(isValidCalendarDate("2026-10-02")).toBe(true);
    expect(isValidCalendarDate("2024-02-29")).toBe(true);
    expect(isValidCalendarDate("9999-12-31")).toBe(true);
  });

  it("recusa 29/02 fora de ano bissexto e datas inexistentes", () => {
    expect(isValidCalendarDate("2025-02-29")).toBe(false);
    expect(isValidCalendarDate("2026-04-31")).toBe(false);
    expect(isValidCalendarDate("2026-13-01")).toBe(false);
  });

  it("recusa formatos irreconhecíveis, vazio e ano com mais de 4 dígitos", () => {
    expect(isValidCalendarDate("")).toBe(false);
    expect(isValidCalendarDate("amanhã")).toBe(false);
    expect(isValidCalendarDate("275760-09-13")).toBe(false);
  });
});

describe("estado visual do prazo (CA-76, CA-77, CA-79)", () => {
  it("sem prazo", () => {
    expect(dueStatus({ dueDate: null, completed: false }, TODAY)).toBe("none");
  });

  it("em dia: hoje ou futuro", () => {
    expect(dueStatus({ dueDate: TODAY, completed: false }, TODAY)).toBe("ok");
    expect(dueStatus({ dueDate: "2027-01-01", completed: false }, TODAY)).toBe("ok");
  });

  it("atrasado só se anterior a hoje e não concluído", () => {
    expect(dueStatus({ dueDate: "2026-10-01", completed: false }, TODAY)).toBe("overdue");
    expect(dueStatus({ dueDate: "2026-10-01", completed: true }, TODAY)).toBe("done");
  });
});

describe("textos e tons do prazo, como no protótipo (RF-36)", () => {
  it("formata data curta sem deslocar o dia", () => {
    expect(formatShortDate("2026-09-12")).toBe("12 set");
    expect(formatShortDate("2026-01-05")).toBe("5 jan");
  });

  it("conta dias corridos, inclusive entre meses e anos", () => {
    expect(daysBetween("2026-10-02", "2026-10-02")).toBe(0);
    expect(daysBetween("2026-10-02", "2026-10-05")).toBe(3);
    expect(daysBetween("2026-09-30", "2026-10-02")).toBe(2);
    expect(daysBetween("2025-12-31", "2026-01-01")).toBe(1);
    expect(daysBetween("2026-10-04", "2026-10-02")).toBe(-2);
  });

  it("atrasado: 'Atrasado há N dias', singular para 1 dia", () => {
    expect(dueText({ dueDate: "2026-10-01", completed: false }, TODAY)).toBe("Atrasado há 1 dia");
    expect(dueText({ dueDate: "2026-09-30", completed: false }, TODAY)).toBe("Atrasado há 2 dias");
  });

  it("vence hoje não é atraso (CA-75)", () => {
    expect(dueText({ dueDate: TODAY, completed: false }, TODAY)).toBe("Vence hoje");
    expect(dueTone({ dueDate: TODAY, completed: false }, TODAY)).toBe("soon");
  });

  it("vencimento próximo é âmbar; distante é neutro", () => {
    expect(dueTone({ dueDate: "2026-10-05", completed: false }, TODAY)).toBe("soon");
    expect(dueTone({ dueDate: "2026-10-06", completed: false }, TODAY)).toBe("ok");
    expect(dueText({ dueDate: "2026-10-20", completed: false }, TODAY)).toBe("Vence 20 out");
  });

  it("concluído mostra o prazo sem atraso (CA-77)", () => {
    expect(dueTone({ dueDate: "2026-09-01", completed: true }, TODAY)).toBe("done");
    expect(dueText({ dueDate: "2026-09-01", completed: true }, TODAY)).toBe("Vence 1 set");
  });

  it("sem prazo: sem tom e sem texto (CA-79)", () => {
    expect(dueTone({ dueDate: null, completed: false }, TODAY)).toBe("none");
    expect(dueText({ dueDate: null, completed: false }, TODAY)).toBe("");
  });
});

describe("hora do comentário (CA-69)", () => {
  const now = new Date(2026, 9, 2, 12, 0);

  it("hoje, ontem e data completa, no fuso local", () => {
    expect(formatCommentTime(new Date(2026, 9, 2, 9, 10).toISOString(), now)).toBe("hoje, 09:10");
    expect(formatCommentTime(new Date(2026, 9, 1, 16, 42).toISOString(), now)).toBe("ontem, 16:42");
    expect(formatCommentTime(new Date(2026, 8, 20, 8, 5).toISOString(), now)).toBe("20/09/2026, 08:05");
  });
});
