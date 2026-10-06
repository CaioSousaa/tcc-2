"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, toApiError } from "@/lib/api";
import { safeNextPath } from "@/lib/redirect";
import { validateEmail } from "@/lib/validation";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { AuthShell } from "./AuthShell";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const nextQuery = params.get("next") ? `?next=${encodeURIComponent(next)}` : "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [pending, setPending] = useState(false);

  // Quem já está autenticado não precisa ver o login (RF-03).
  useEffect(() => {
    api
      .get("/auth/me")
      .then(() => router.replace(next))
      .catch(() => {});
  }, [router, next]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const clientErrors = {
      email: validateEmail(email) ?? undefined,
      password: password.length === 0 ? "Senha é obrigatória." : undefined,
    };
    if (clientErrors.email || clientErrors.password) {
      setErrors(clientErrors);
      return;
    }

    setPending(true);
    setErrors({});
    try {
      await api.post("/auth/login", { email, password });
      router.replace(next);
    } catch (error) {
      const apiError = toApiError(error);
      setErrors(
        apiError.code === "VALIDATION_ERROR"
          ? {
              email: apiError.fieldMessage("email"),
              password: apiError.fieldMessage("password"),
            }
          : { form: apiError.message },
      );
      setPending(false);
    }
  }

  return (
    <AuthShell
      title="Entrar na sua conta"
      subtitle="Acesse seus quadros com sessão persistente entre visitas."
      footer={{ text: "Não tem conta?", href: `/register${nextQuery}`, label: "Criar conta" }}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field
          id="email"
          label="E-mail"
          type="email"
          tall
          placeholder="voce@empresa.com"
          autoComplete="email"
          value={email}
          error={errors.email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Field
          id="password"
          label="Senha"
          type="password"
          tall
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          error={errors.password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {errors.form ? (
          <p role="alert" className="rounded-lg bg-red-bg px-3.5 py-2.5 text-sm text-red">
            {errors.form}
          </p>
        ) : null}
        <Button type="submit" large loading={pending} className="mt-5 w-full">
          Entrar
        </Button>
      </form>
    </AuthShell>
  );
}
