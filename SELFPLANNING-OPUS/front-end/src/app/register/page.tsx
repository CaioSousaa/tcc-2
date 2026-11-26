"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GuestGuard } from "@/components/auth/AuthGuard";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Field, FormError } from "@/components/ui/Field";
import { useAuth } from "@/contexts/AuthContext";
import { errorMessage } from "@/lib/api";

export default function RegisterPage() {
  return (
    <GuestGuard>
      <RegisterForm />
    </GuestGuard>
  );
}

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await register(name, email, password);
      router.replace("/boards");
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Criar conta" subtitle="Organize seus quadros e convide o seu time.">
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="flex flex-col gap-4">
          <Field
            label="Nome"
            name="name"
            autoComplete="name"
            placeholder="Seu nome"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
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
            autoComplete="new-password"
            placeholder="Mínimo de 8 caracteres"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-6 pt-[26px]">
          <FormError message={error} />
          <Button type="submit" loading={loading} className="h-[54px] w-full text-[15px]">
            Criar conta
          </Button>
          <p className="flex justify-center gap-[5px] text-base text-muted">
            Já tem conta?
            <Link href="/login" className="font-semibold text-ink hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
