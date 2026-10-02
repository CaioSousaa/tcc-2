"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { parseApiError } from "@/lib/api";
import { useLogin } from "@/lib/auth";
import { safeNext } from "@/lib/safeNext";

export function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const error = login.isError ? parseApiError(login.error) : null;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    login.mutate({ email, password }, { onSuccess: () => router.replace(next) });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {error && !error.fields.email && !error.fields.password && <Alert>{error.message}</Alert>}
      <TextField
        label="E-mail"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={error?.fields.email}
        maxLength={254}
        autoFocus
      />
      <TextField
        label="Senha"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={error?.fields.password}
        maxLength={128}
      />
      <Button type="submit" className="w-full" loading={login.isPending}>
        Entrar
      </Button>
      <p className="text-center text-sm text-slate-600">
        Não tem conta?{" "}
        <Link
          href={next === "/boards" ? "/register" : `/register?next=${encodeURIComponent(next)}`}
          className="font-medium text-indigo-600 hover:underline"
        >
          Cadastre-se
        </Link>
      </p>
    </form>
  );
}
