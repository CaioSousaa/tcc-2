import { Suspense } from "react";
import { AuthCard } from "@/components/AuthCard";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <AuthCard title="Entrar" subtitle="Acesse seus quadros de tarefas.">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
