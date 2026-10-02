"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/lib/api";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { GuestOnly } from "@/components/auth/GuestOnly";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field, Input } from "@/components/ui/Input";

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
      setError("Informe e-mail e senha.");
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password, remember);
      router.replace("/boards");
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível entrar."));
      setSubmitting(false);
    }
  }

  return (
    <GuestOnly>
      <AuthLayout
        title="Entrar na sua conta"
        subtitle="Acesse seus quadros com sessão persistente entre visitas."
      >
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
            <Field label="E-mail" htmlFor="email">
              <Input
                id="email"
                type="email"
                inputSize="lg"
                autoComplete="email"
                placeholder="voce@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Senha" htmlFor="password">
              <Input
                id="password"
                type="password"
                inputSize="lg"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
          </div>

          <div className="flex flex-col gap-6 pt-[18px]">
            <label className="flex cursor-pointer items-center gap-3 pl-[5px] text-base text-body">
              <Checkbox
                checked={remember}
                onChange={setRemember}
                label="Manter-me conectado neste dispositivo"
              />
              Manter-me conectado neste dispositivo
            </label>

            {error && (
              <p className="rounded-lg bg-red-bg px-4 py-3 text-sm text-red-dark" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" loading={submitting} className="w-full">
              Entrar
            </Button>

            <p className="flex justify-center gap-[5px] text-base">
              <span className="text-muted">Não tem conta?</span>
              <Link href="/register" className="font-semibold text-ink hover:underline">
                Criar conta
              </Link>
            </p>
          </div>
        </form>
      </AuthLayout>
    </GuestOnly>
  );
}
