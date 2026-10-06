import { Suspense } from "react";
import { AuthCard } from "@/components/AuthCard";
import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  return (
    <AuthCard title="Criar conta" subtitle="Leva menos de um minuto. Depois você já cria seu primeiro quadro.">
      <Suspense>
        <RegisterForm />
      </Suspense>
    </AuthCard>
  );
}
