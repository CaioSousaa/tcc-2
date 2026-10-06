import { Suspense } from "react";
import { AuthCard } from "@/components/AuthCard";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <AuthCard title="Entrar na sua conta" subtitle="Acesse seus quadros com sessão persistente entre visitas.">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
