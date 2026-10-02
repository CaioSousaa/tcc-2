const TOKEN_KEY = "kanbo.token";

/**
 * "Manter-me conectado" grava o token no localStorage (sobrevive ao fechamento
 * do navegador); caso contrário ele fica só no sessionStorage da aba.
 */
export const authStorage = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return (
      window.localStorage.getItem(TOKEN_KEY) ??
      window.sessionStorage.getItem(TOKEN_KEY)
    );
  },
  setToken(token: string, remember: boolean) {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
    (remember ? window.localStorage : window.sessionStorage).setItem(
      TOKEN_KEY,
      token,
    );
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
  },
};
