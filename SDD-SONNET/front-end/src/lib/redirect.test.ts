import { describe, expect, it } from "vitest";
import { safeNextPath } from "./redirect";

describe("destino pós-login (RF-05, CA-09, RT-13)", () => {
  it("aceita caminhos internos, com consulta", () => {
    expect(safeNextPath("/boards/abc")).toBe("/boards/abc");
    expect(safeNextPath("/boards/abc?card=1")).toBe("/boards/abc?card=1");
  });

  it("sem valor cai no padrão", () => {
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath(undefined)).toBe("/");
    expect(safeNextPath("")).toBe("/");
  });

  it("recusa URLs externas e esquemas", () => {
    expect(safeNextPath("https://evil.com")).toBe("/");
    expect(safeNextPath("//evil.com")).toBe("/");
    expect(safeNextPath("/\\evil.com")).toBe("/");
    expect(safeNextPath("javascript:alert(1)")).toBe("/");
    expect(safeNextPath("boards")).toBe("/");
  });

  it("recusa caracteres de controle", () => {
    expect(safeNextPath("/ok\r\nLocation: x")).toBe("/");
  });
});
