import { describe, expect, it } from "vitest";
import { appendComment, sortChronological } from "./comments";
import type { Comment } from "./types";

function comment(id: string, createdAt: string): Comment {
  return { id, text: id, createdAt, author: { id: "u1", name: "Ana" } };
}

describe("histórico de comentários (CA-69, CA-70, RN-30)", () => {
  it("novo comentário aparece ao final", () => {
    const list = [comment("a", "2026-10-01T10:00:00Z")];
    const next = appendComment(list, comment("b", "2026-10-01T11:00:00Z"));
    expect(next.map((c) => c.id)).toEqual(["a", "b"]);
    expect(list).toHaveLength(1);
  });

  it("ordena do mais antigo ao mais recente (CA-70)", () => {
    const shuffled = [
      comment("c", "2026-10-03T00:00:00Z"),
      comment("a", "2026-10-01T00:00:00Z"),
      comment("b", "2026-10-02T00:00:00Z"),
    ];
    expect(sortChronological(shuffled).map((c) => c.id)).toEqual(["a", "b", "c"]);
  });

  it("empate de horário é resolvido de forma determinística pelo id", () => {
    const same = "2026-10-01T00:00:00Z";
    const a = sortChronological([comment("y", same), comment("x", same)]);
    const b = sortChronological([comment("x", same), comment("y", same)]);
    expect(a.map((c) => c.id)).toEqual(["x", "y"]);
    expect(b.map((c) => c.id)).toEqual(["x", "y"]);
  });

  it("comentários idênticos em momentos distintos são permitidos", () => {
    const first = { ...comment("a", "2026-10-01T10:00:00Z"), text: "ok" };
    const second = { ...comment("b", "2026-10-01T10:05:00Z"), text: "ok" };
    expect(appendComment([first], second)).toHaveLength(2);
  });
});
