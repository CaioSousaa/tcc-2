import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";
import { errorMessage, parseApiError } from "./api";

function axiosFailure(status: number, data: unknown): AxiosError {
  const config = { headers: {} } as InternalAxiosRequestConfig;
  const response = { status, data, statusText: "", headers: {}, config } as AxiosResponse;
  return new AxiosError("failed", "ERR_BAD_REQUEST", config, null, response);
}

// Plan §4.2: every error body follows { error: { code, message, fields?, details? } }.
describe("parseApiError", () => {
  it("extracts code, message, field errors and details", () => {
    const info = parseApiError(
      axiosFailure(400, { error: { code: "VALIDATION_ERROR", message: "Dados inválidos.", fields: { name: "obrigatório" } } }),
    );
    expect(info).toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Dados inválidos.",
      fields: { name: "obrigatório" },
    });
  });

  it("exposes details such as the current card count (CA-L6)", () => {
    const info = parseApiError(
      axiosFailure(409, { error: { code: "LIST_NOT_EMPTY", message: "x", details: { cardCount: 3 } } }),
    );
    expect(info.code).toBe("LIST_NOT_EMPTY");
    expect(info.details).toEqual({ cardCount: 3 });
  });

  it("handles responses without the error contract", () => {
    const info = parseApiError(axiosFailure(502, "Bad gateway"));
    expect(info.status).toBe(502);
    expect(info.fields).toEqual({});
    expect(info.message.length).toBeGreaterThan(0);
  });

  it("reports connection failures (no response)", () => {
    const error = new AxiosError("Network Error", "ERR_NETWORK");
    const info = parseApiError(error);
    expect(info.status).toBeUndefined();
    expect(info.message).toContain("conectar");
  });

  it("copes with non-axios errors", () => {
    expect(parseApiError(new Error("boom")).fields).toEqual({});
    expect(errorMessage("anything").length).toBeGreaterThan(0);
  });
});
