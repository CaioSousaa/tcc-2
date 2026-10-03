"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GuestGuard } from "@/components/auth/AuthGuard";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field, FormError } from "@/components/ui/Field";
import { useAuth } from "@/contexts/AuthContext";
import { errorMessage } from "@/lib/api";

export default function LoginPage() {
  return (
    <GuestGuard>
      <LoginForm />
    </GuestGuard>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password, remember);
      router.replace("/boards");
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Entrar na sua conta" subtitle="Acesse seus quadros com sessão persistente entre visitas.">
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="flex flex-col gap-4">
          <Field
            label="E-mail"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="voce@empresa.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Field
            label="Senha"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-6 pt-[18px]">
          <label className="flex cursor-pointer items-center gap-3 pl-[5px] text-base text-body">
            <Checkbox checked={remember} onChange={setRemember} label="Manter-me conectado" />
            Manter-me conectado neste dispositivo
          </label>
          <FormError message={error} />
          <Button type="submit" loading={loading} className="h-[54px] w-full text-[15px]">
            Entrar
          </Button>
          <p className="flex justify-center gap-[5px] text-base text-muted">
            Não tem conta?
            <Link href="/register" className="font-semibold text-ink hover:underline">
              Criar conta
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
