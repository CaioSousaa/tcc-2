"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, FormError } from "@/components/ui/Field";
import { errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/quadros");
  }, [user, loading, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password, remember);
      router.replace("/quadros");
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Entrar na sua conta"
      subtitle="Acesse seus quadros com sessão persistente entre visitas."
    >
      <form onSubmit={onSubmit}>
        <div className="flex flex-col gap-4">
          <Field
            label="E-mail"
            fieldSize="lg"
            type="email"
            autoComplete="email"
            placeholder="voce@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Field
            label="Senha"
            fieldSize="lg"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-6 pt-[18px]">
          <Checkbox
            className="pl-[5px]"
            label="Manter-me conectado neste dispositivo"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <FormError message={error} />
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Entrando..." : "Entrar"}
          </Button>
          <p className="flex justify-center gap-[5px] text-base text-muted">
            Não tem conta?
            <Link href="/cadastro" className="font-semibold text-ink hover:underline">
              Criar conta
            </Link>
          </p>
        </div>
      </form>
    </AuthShell>
  );
}
