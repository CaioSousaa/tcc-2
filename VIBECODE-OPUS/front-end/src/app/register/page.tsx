"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { GuestOnly } from "@/components/auth/RouteGuards";
import { Button } from "@/components/ui/Button";
import { FieldError, FieldLabel, Input } from "@/components/ui/Field";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/lib/api";

const MIN_PASSWORD = 8;

type Errors = Partial<Record<"name" | "email" | "password" | "confirm" | "form", string>>;

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function validate(): Errors {
    const next: Errors = {};
    if (form.name.trim().length < 2) next.name = "Informe seu nome";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = "Informe um e-mail válido";
    if (form.password.length < MIN_PASSWORD) {
      next.password = `A senha deve ter pelo menos ${MIN_PASSWORD} caracteres`;
    }
    if (form.confirm !== form.password) next.confirm = "As senhas não conferem";
    return next;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      router.replace("/boards");
    } catch (err) {
      setErrors({ form: getErrorMessage(err, "Não foi possível criar a conta") });
      setSubmitting(false);
    }
  }

  return (
    <GuestOnly>
      <AuthShell
        title="Criar conta"
        subtitle="Leva menos de um minuto. Depois você já cria seu primeiro quadro."
      >
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
          <div>
            <FieldLabel htmlFor="name">Nome</FieldLabel>
            <Input
              id="name"
              autoComplete="name"
              placeholder="Seu nome"
              value={form.name}
              invalid={Boolean(errors.name)}
              onChange={(event) => update("name", event.target.value)}
            />
            <FieldError message={errors.name} />
          </div>
          <div>
            <FieldLabel htmlFor="email">E-mail</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="voce@empresa.com"
              value={form.email}
              invalid={Boolean(errors.email)}
              onChange={(event) => update("email", event.target.value)}
            />
            <FieldError message={errors.email} />
          </div>
          <div>
            <FieldLabel htmlFor="password">Senha</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder={`Mínimo de ${MIN_PASSWORD} caracteres`}
              value={form.password}
              invalid={Boolean(errors.password)}
              onChange={(event) => update("password", event.target.value)}
            />
            <FieldError message={errors.password} />
          </div>
          <div>
            <FieldLabel htmlFor="confirm">Confirmar senha</FieldLabel>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Repita a senha"
              value={form.confirm}
              invalid={Boolean(errors.confirm)}
              onChange={(event) => update("confirm", event.target.value)}
            />
            <FieldError message={errors.confirm} />
          </div>

          <div>
            <FieldError message={errors.form} />
            <Button type="submit" loading={submitting} className="mt-2 h-[54px] w-full text-[15px]">
              Criar conta
            </Button>
          </div>

          <p className="text-center text-[16px] text-muted">
            Já tem conta?{" "}
            <Link href="/login" className="font-semibold text-ink hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      </AuthShell>
    </GuestOnly>
  );
}
