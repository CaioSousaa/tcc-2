"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { parseApiError } from "@/lib/api";
import { useRegister } from "@/lib/auth";
import { safeNext } from "@/lib/safeNext";

export function RegisterForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const register = useRegister();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const error = register.isError ? parseApiError(register.error) : null;
  const fields = error?.fields ?? {};
  const emailError = fields.email ?? (error?.code === "EMAIL_IN_USE" ? error.message : undefined);
  const formLevel = error && !fields.name && !fields.email && !fields.password && !emailError;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    register.mutate({ name, email, password }, { onSuccess: () => router.replace(next) });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formLevel && <Alert>{error.message}</Alert>}
      <TextField
        label="Nome"
        autoComplete="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={fields.name}
        maxLength={100}
        autoFocus
      />
      <TextField
        label="E-mail"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={emailError}
        maxLength={254}
      />
      <TextField
        label="Senha"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={fields.password}
        hint="Mínimo de 8 caracteres."
        maxLength={128}
      />
      <Button type="submit" className="w-full" loading={register.isPending}>
        Criar conta
      </Button>
      <p className="text-center text-sm text-slate-600">
        Já tem conta?{" "}
        <Link
          href={next === "/boards" ? "/login" : `/login?next=${encodeURIComponent(next)}`}
          className="font-medium text-indigo-600 hover:underline"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
