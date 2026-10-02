"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { GuestOnly } from "@/components/auth/RouteGuards";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { FieldError, FieldLabel, Input } from "@/components/ui/Field";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Informe e-mail e senha");
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password, remember);
      router.replace("/boards");
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível entrar"));
      setSubmitting(false);
    }
  }

  return (
    <GuestOnly>
      <AuthShell
        title="Entrar na sua conta"
        subtitle="Acesse seus quadros com sessão persistente entre visitas."
      >
        <form onSubmit={handleSubmit} noValidate className="flex flex-col">
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="voce@empresa.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <div className="mt-6">
            <FieldLabel htmlFor="password">Senha</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Sua senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <Checkbox
            className="mt-5 text-[16px] text-body"
            checked={remember}
            onChange={setRemember}
            label="Manter-me conectado neste dispositivo"
          />

          <FieldError message={error} />

          <Button type="submit" loading={submitting} className="mt-6 h-[54px] w-full text-[15px]">
            Entrar
          </Button>

          <p className="mt-6 text-center text-[16px] text-muted">
            Não tem conta?{" "}
            <Link href="/register" className="font-semibold text-ink hover:underline">
              Criar conta
            </Link>
          </p>
        </form>
      </AuthShell>
    </GuestOnly>
  );
}
