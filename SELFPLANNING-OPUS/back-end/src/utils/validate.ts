import type { Request } from "express";
import { z } from "zod";
import { AppError } from "../errors/AppError";

export const uuid = z.uuid("Identificador inválido");

export const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Cor deve estar no formato #RRGGBB");

/** Lê um parâmetro de rota que deve ser um UUID; IDs malformados viram 404. */
export function idParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== "string" || !uuid.safeParse(value).success) {
    throw new AppError("Recurso não encontrado", 404);
  }
  return value;
}
