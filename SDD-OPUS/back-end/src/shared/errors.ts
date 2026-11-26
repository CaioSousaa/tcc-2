export type ErrorFields = Record<string, string>;

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: ErrorFields,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export interface ErrorBody {
  error: {
    code: string;
    message: string;
    fields?: ErrorFields;
    details?: Record<string, unknown>;
  };
}

export function errorBody(err: AppError): ErrorBody {
  return {
    error: {
      code: err.code,
      message: err.message,
      ...(err.fields ? { fields: err.fields } : {}),
      ...(err.details ? { details: err.details } : {}),
    },
  };
}

// Domain errors (plan §4.2). Messages are user-facing, pt-BR.
export const Errors = {
  validation: (fields: ErrorFields, message = "Dados inválidos.") =>
    new AppError(400, "VALIDATION_ERROR", message, fields),
  unauthenticated: () =>
    new AppError(401, "UNAUTHENTICATED", "Sessão inválida ou expirada. Faça login novamente."),
  invalidCredentials: () =>
    new AppError(401, "INVALID_CREDENTIALS", "E-mail ou senha inválidos."),
  forbidden: () =>
    new AppError(403, "FORBIDDEN", "Você não tem permissão para realizar esta ação."),
  notFound: () => new AppError(404, "NOT_FOUND", "Recurso não encontrado."),
  emailInUse: () => new AppError(409, "EMAIL_IN_USE", "Este e-mail já está em uso."),
  alreadyMember: () =>
    new AppError(409, "ALREADY_MEMBER", "Esta pessoa já é membro do quadro."),
  labelNameInUse: () =>
    new AppError(409, "LABEL_NAME_IN_USE", "Já existe uma etiqueta com este nome no quadro."),
  lastAdmin: () =>
    new AppError(409, "LAST_ADMIN", "O quadro precisa ter ao menos um administrador."),
  listNotEmpty: (cardCount: number) =>
    new AppError(
      409,
      "LIST_NOT_EMPTY",
      `A lista contém ${cardCount} card(s). Confirme a exclusão informando a quantidade.`,
      undefined,
      { cardCount },
    ),
  userNotFound: () =>
    new AppError(422, "USER_NOT_FOUND", "Não existe usuário cadastrado com este e-mail."),
  userNotMember: () =>
    new AppError(422, "USER_NOT_MEMBER", "Só membros do quadro podem ser responsáveis por um card."),
  invalidTarget: () =>
    new AppError(422, "INVALID_TARGET", "Não é possível mover o card para outro quadro."),
  rateLimited: () =>
    new AppError(429, "RATE_LIMITED", "Muitas requisições. Tente novamente em instantes."),
  internal: () => new AppError(500, "INTERNAL_ERROR", "Erro interno. Tente novamente."),
};
