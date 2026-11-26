export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export const badRequest = (message: string, code?: string) =>
  new HttpError(400, message, code);
export const unauthorized = (message = "Não autenticado") =>
  new HttpError(401, message, "UNAUTHORIZED");
export const forbidden = (message = "Você não tem permissão para esta ação") =>
  new HttpError(403, message, "FORBIDDEN");
export const notFound = (message = "Recurso não encontrado") =>
  new HttpError(404, message, "NOT_FOUND");
export const conflict = (message: string, code?: string, details?: unknown) =>
  new HttpError(409, message, code, details);
