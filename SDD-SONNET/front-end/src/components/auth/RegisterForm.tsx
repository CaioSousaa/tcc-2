"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, toApiError } from "@/lib/api";
import { LIMITS } from "@/lib/constants";
import { safeNextPath } from "@/lib/redirect";
import { charCount, validateEmail, validateText } from "@/lib/validation";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { AuthShell } from "./AuthShell";

interface Errors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
  form?: string;
}

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const nextQuery = params.get("next") ? `?next=${encodeURIComponent(next)}` : "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);

  function validate(): Errors {
    const result: Errors = {};
    const nameError = validateText(name, "Nome", LIMITS.userName.min, LIMITS.userName.max);
    if (nameError) result.name = nameError;
    const emailError = validateEmail(email);
    if (emailError) result.email = emailError;
    const length = charCount(password);
    if (length < LIMITS.password.min) {
      result.password = `A senha deve ter no mínimo ${LIMITS.password.min} caracteres.`;
    } else if (length > LIMITS.password.max) {
      result.password = `A senha deve ter no máximo ${LIMITS.password.max} caracteres.`;
    }
    if (confirm !== password) result.confirm = "As senhas não são iguais.";
    return result;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setPending(true);
    setErrors({});
    try {
      await api.post("/auth/register", { name, email, password });
      router.replace(next);
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.code === "EMAIL_IN_USE") {
        setErrors({ email: apiError.message });
      } else if (apiError.code === "VALIDATION_ERROR") {
        setErrors({
          name: apiError.fieldMessage("name"),
          email: apiError.fieldMessage("email"),
          password: apiError.fieldMessage("password"),
        });
      } else {
        setErrors({ form: apiError.message });
      }
      setPending(false);
    }
  }

  return (
    <AuthShell
      title="Criar conta"
      subtitle="Leva menos de um minuto. Depois você já cria seu primeiro quadro."
      footer={{ text: "Já tem conta?", href: `/login${nextQuery}`, label: "Entrar" }}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field
          id="name"
          label="Nome"
          tall
          placeholder="Caio Rocha"
          autoComplete="name"
          value={name}
          error={errors.name}
          onChange={(event) => setName(event.target.value)}
        />
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
          placeholder="Mínimo de 8 caracteres"
          autoComplete="new-password"
          value={password}
          error={errors.password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Field
          id="confirm"
          label="Confirmar senha"
          type="password"
          tall
          placeholder="Repita a senha"
          autoComplete="new-password"
          value={confirm}
          error={errors.confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />
        {errors.form ? (
          <p role="alert" className="rounded-lg bg-red-bg px-3.5 py-2.5 text-sm text-red">
            {errors.form}
          </p>
        ) : null}
        <Button type="submit" large loading={pending} className="mt-6 w-full">
          Criar conta
        </Button>
      </form>
    </AuthShell>
  );
}
