import { Suspense } from "react";
import { AuthCard } from "@/components/AuthCard";
import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  return (
    <AuthCard title="Criar conta" subtitle="Cadastre-se para organizar suas tarefas.">
      <Suspense>
        <RegisterForm />
      </Suspense>
    </AuthCard>
  );
}
