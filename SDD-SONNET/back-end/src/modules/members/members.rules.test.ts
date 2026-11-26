import { describe, expect, it } from "vitest";
import { checkRemoval, checkRoleChange, removalAction } from "./members.rules";
import { inviteSchema } from "./members.schemas";

describe("último administrador (RN-06, CA-51, CA-52)", () => {
  it("recusa rebaixar o único administrador", () => {
    expect(checkRoleChange("admin", "member", 1)).toBe("last_admin");
    expect(checkRoleChange("admin", "viewer", 1)).toBe("last_admin");
  });

  it("aceita rebaixar um administrador quando há outro (CB-30)", () => {
    expect(checkRoleChange("admin", "member", 2)).toBe("ok");
  });

  it("manter o papel de administrador é sempre aceito", () => {
    expect(checkRoleChange("admin", "admin", 1)).toBe("ok");
  });

  it("alterar o papel de quem não é administrador não depende da contagem", () => {
    expect(checkRoleChange("member", "viewer", 1)).toBe("ok");
    expect(checkRoleChange("viewer", "admin", 1)).toBe("ok");
  });

  it("recusa remover ou sair sendo o único administrador (CA-51, CB-31)", () => {
    expect(checkRemoval("admin", 1)).toBe("last_admin");
  });

  it("aceita um administrador sair quando há outro (CA-52)", () => {
    expect(checkRemoval("admin", 2)).toBe("ok");
  });

  it("membros e observadores saem ou são removidos livremente (CA-57)", () => {
    expect(checkRemoval("member", 1)).toBe("ok");
    expect(checkRemoval("viewer", 1)).toBe("ok");
  });
});

describe("permissão de remoção (RF-26, RF-28, CA-53)", () => {
  it("sair do quadro exige só ser membro", () => {
    expect(removalAction("u1", "u1")).toBe("board.leave");
  });

  it("remover outra pessoa exige gestão de membros", () => {
    expect(removalAction("u1", "u2")).toBe("members.manage");
  });
});

describe("convite (CA-46, CB-27, CB-28)", () => {
  it("normaliza o e-mail em outra caixa", () => {
    expect(inviteSchema.parse({ email: "BIA@Exemplo.com", role: "member" }).email).toBe(
      "bia@exemplo.com",
    );
  });

  it("e-mail inválido é erro de validação, distinto de usuário não encontrado", () => {
    expect(inviteSchema.safeParse({ email: "bia", role: "member" }).success).toBe(false);
  });

  it("aceita só os três papéis", () => {
    for (const role of ["admin", "member", "viewer"]) {
      expect(inviteSchema.safeParse({ email: "bia@exemplo.com", role }).success).toBe(true);
    }
    expect(inviteSchema.safeParse({ email: "bia@exemplo.com", role: "owner" }).success).toBe(false);
  });
});
