import { describe, expect, it } from "vitest";
import { LABEL_COLORS } from "../../shared/validation";
import { labelNameKey } from "./labels.rules";
import { createLabelSchema, updateLabelSchema } from "./labels.schemas";

describe("etiquetas (CA-58, CA-60, RN-26)", () => {
  it("cria com nome e cor da paleta", () => {
    const result = createLabelSchema.parse({ name: " Urgente ", color: "red" });
    expect(result).toEqual({ name: "Urgente", color: "red" });
  });

  it("recusa nome vazio, só espaços ou acima de 30 caracteres", () => {
    expect(createLabelSchema.safeParse({ name: "", color: "red" }).success).toBe(false);
    expect(createLabelSchema.safeParse({ name: "   ", color: "red" }).success).toBe(false);
    expect(createLabelSchema.safeParse({ name: "a".repeat(30), color: "red" }).success).toBe(true);
    expect(createLabelSchema.safeParse({ name: "a".repeat(31), color: "red" }).success).toBe(false);
  });

  it("recusa cor fora do conjunto fixo", () => {
    expect(createLabelSchema.safeParse({ name: "X", color: "pink" }).success).toBe(false);
    expect(createLabelSchema.safeParse({ name: "X", color: "teal" }).success).toBe(false);
    expect(createLabelSchema.safeParse({ name: "X" }).success).toBe(false);
  });

  it("a paleta tem as seis cores do protótipo, as mesmas do banco e da interface (RT-30)", () => {
    expect([...LABEL_COLORS]).toEqual(["red", "amber", "green", "blue", "purple", "slate"]);
  });

  it("editar exige ao menos nome ou cor (CA-62)", () => {
    expect(updateLabelSchema.safeParse({}).success).toBe(false);
    expect(updateLabelSchema.safeParse({ color: "blue" }).success).toBe(true);
    expect(updateLabelSchema.safeParse({ name: "Novo" }).success).toBe(true);
  });
});

describe("unicidade do nome sem diferenciar caixa (CA-59)", () => {
  it("Urgente, urgente e URGENTE geram a mesma chave", () => {
    expect(labelNameKey("Urgente")).toBe(labelNameKey("urgente"));
    expect(labelNameKey("Urgente")).toBe(labelNameKey("URGENTE"));
    expect(labelNameKey("  Urgente ")).toBe("urgente");
  });

  it("nomes diferentes geram chaves diferentes", () => {
    expect(labelNameKey("Backend")).not.toBe(labelNameKey("Frontend"));
  });
});
