"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getApiError } from "@/lib/api";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { GuestOnly } from "@/components/auth/GuestOnly";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";

type Errors = Partial<Record<"name" | "email" | "password" | "confirm" | "form", string>>;

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate(): Errors {
    const next: Errors = {};
    if (form.name.trim().length < 2) next.name = "Informe seu nome.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = "Informe um e-mail válido.";
    if (form.password.length < 8) next.password = "A senha deve ter no mínimo 8 caracteres.";
    if (form.confirm !== form.password) next.confirm = "As senhas não conferem.";
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
      const apiError = getApiError(err);
      setErrors(
        apiError.code === "EMAIL_IN_USE"
          ? { email: apiError.message }
          : { form: apiError.message ?? "Não foi possível criar a conta." },
      );
      setSubmitting(false);
    }
  }

  return (
    <GuestOnly>
      <AuthLayout
        title="Criar conta"
        subtitle="Leva menos de um minuto. Depois você já cria seu primeiro quadro."
      >
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
            <Field label="Nome" htmlFor="name" error={errors.name}>
              <Input
                id="name"
                inputSize="lg"
                autoComplete="name"
                placeholder="Seu nome"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </Field>
            <Field label="E-mail" htmlFor="email" error={errors.email}>
              <Input
                id="email"
                type="email"
                inputSize="lg"
                autoComplete="email"
                placeholder="voce@empresa.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </Field>
            <Field label="Senha" htmlFor="password" error={errors.password}>
              <Input
                id="password"
                type="password"
                inputSize="lg"
                autoComplete="new-password"
                placeholder="Mínimo de 8 caracteres"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
              />
            </Field>
            <Field label="Confirmar senha" htmlFor="confirm" error={errors.confirm}>
              <Input
                id="confirm"
                type="password"
                inputSize="lg"
                autoComplete="new-password"
                placeholder="Repita a senha"
                value={form.confirm}
                onChange={(e) => update("confirm", e.target.value)}
              />
            </Field>
          </div>

          <div className="flex flex-col gap-6 pt-6">
            {errors.form && (
              <p className="rounded-lg bg-red-bg px-4 py-3 text-sm text-red-dark" role="alert">
                {errors.form}
              </p>
            )}
            <Button type="submit" size="lg" loading={submitting} className="w-full">
              Criar conta
            </Button>
            <p className="flex justify-center gap-[5px] text-base">
              <span className="text-muted">Já tem conta?</span>
              <Link href="/login" className="font-semibold text-ink hover:underline">
                Entrar
              </Link>
            </p>
          </div>
        </form>
      </AuthLayout>
    </GuestOnly>
  );
}
