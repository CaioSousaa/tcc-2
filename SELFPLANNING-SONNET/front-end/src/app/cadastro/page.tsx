"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/Button";
import { Field, FormError } from "@/components/ui/Field";
import { errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const { user, loading, register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/quadros");
  }, [user, loading, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }
    setSubmitting(true);
    try {
      await register(name, email, password);
      router.replace("/quadros");
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Criar conta"
      subtitle="Leva menos de um minuto. Depois você já cria seu primeiro quadro."
    >
      <form onSubmit={onSubmit}>
        <div className="flex flex-col gap-4">
          <Field
            label="Nome"
            fieldSize="lg"
            autoComplete="name"
            placeholder="Caio Rocha"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
            autoComplete="new-password"
            placeholder="Mínimo de 8 caracteres"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Field
            label="Confirmar senha"
            fieldSize="lg"
            type="password"
            autoComplete="new-password"
            placeholder="Repita a senha"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-6 pt-6">
          <FormError message={error} />
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Criando..." : "Criar conta"}
          </Button>
          <p className="flex justify-center gap-[5px] text-base text-muted">
            Já tem conta?
            <Link href="/login" className="font-semibold text-ink hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </form>
    </AuthShell>
  );
}
