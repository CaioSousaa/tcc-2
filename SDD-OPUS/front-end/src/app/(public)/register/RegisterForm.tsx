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
  const [confirm, setConfirm] = useState("");
  const [mismatch, setMismatch] = useState(false);

  const error = register.isError ? parseApiError(register.error) : null;
  const fields = error?.fields ?? {};
  const emailError = fields.email ?? (error?.code === "EMAIL_IN_USE" ? error.message : undefined);
  const formLevel = error && !fields.name && !fields.email && !fields.password && !emailError;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const differs = password !== confirm;
    setMismatch(differs);
    if (differs) return;
    register.mutate({ name, email, password }, { onSuccess: () => router.replace(next) });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {formLevel && <Alert>{error.message}</Alert>}
      <TextField
        label="Nome"
        autoComplete="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={fields.name}
        maxLength={100}
        placeholder="Seu nome"
        large
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
        placeholder="voce@empresa.com"
        large
      />
      <TextField
        label="Senha"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={fields.password}
        maxLength={128}
        placeholder="Mínimo de 8 caracteres"
        large
      />
      <TextField
        label="Confirmar senha"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(event) => setConfirm(event.target.value)}
        error={mismatch ? "As senhas não conferem." : undefined}
        maxLength={128}
        placeholder="Repita a senha"
        large
      />
      <Button type="submit" size="lg" className="mt-2 w-full" loading={register.isPending}>
        Criar conta
      </Button>
      <p className="mt-2 text-center text-base text-muted">
        Já tem conta?{" "}
        <Link
          href={next === "/boards" ? "/login" : `/login?next=${encodeURIComponent(next)}`}
          className="font-semibold text-ink hover:underline"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
