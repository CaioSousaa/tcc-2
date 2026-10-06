export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "INVALID_CREDENTIALS"
  | "FORBIDDEN"
  | "ORIGIN_NOT_ALLOWED"
  | "NOT_FOUND"
  | "USER_NOT_FOUND"
  | "EMAIL_IN_USE"
  | "ALREADY_MEMBER"
  | "LAST_ADMIN"
  | "LABEL_NAME_IN_USE"
  | "LIST_NOT_EMPTY"
  | "TARGET_LIST_INVALID"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "PAYLOAD_TOO_LARGE"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_ERROR";

export interface FieldError {
  field: string;
  message: string;
}

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly extra?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errors = {
  validation: (message: string, fields?: FieldError[]) =>
    new AppError(400, "VALIDATION_ERROR", message, fields ? { fields } : undefined),
  unauthenticated: () =>
    new AppError(401, "UNAUTHENTICATED", "Sessão inválida ou expirada. Entre novamente."),
  invalidCredentials: () =>
    new AppError(401, "INVALID_CREDENTIALS", "E-mail ou senha incorretos."),
  forbidden: () =>
    new AppError(403, "FORBIDDEN", "Você não tem permissão para executar esta ação."),
  originNotAllowed: () =>
    new AppError(403, "ORIGIN_NOT_ALLOWED", "Origem da requisição não permitida."),
  notFound: (what = "Recurso") =>
    new AppError(404, "NOT_FOUND", `${what} não encontrado.`),
  userNotFound: () =>
    new AppError(404, "USER_NOT_FOUND", "Não existe usuário com esse e-mail."),
  emailInUse: () =>
    new AppError(409, "EMAIL_IN_USE", "Este e-mail já está em uso."),
  alreadyMember: () =>
    new AppError(409, "ALREADY_MEMBER", "Esta pessoa já é membro do quadro."),
  lastAdmin: () =>
    new AppError(
      409,
      "LAST_ADMIN",
      "O quadro precisa ter ao menos um administrador.",
    ),
  labelNameInUse: () =>
    new AppError(409, "LABEL_NAME_IN_USE", "Já existe uma etiqueta com esse nome no quadro."),
  listNotEmpty: (cardCount: number) =>
    new AppError(
      409,
      "LIST_NOT_EMPTY",
      "A lista contém cards. Escolha mover os cards para outra lista ou excluí-los junto.",
      { cardCount },
    ),
  targetListInvalid: () =>
    new AppError(
      409,
      "TARGET_LIST_INVALID",
      "A lista de destino não existe ou não pertence ao mesmo quadro.",
    ),
};
