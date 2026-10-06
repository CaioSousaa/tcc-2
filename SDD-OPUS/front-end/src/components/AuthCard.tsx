import type { ReactNode } from "react";
import { Logo } from "./Logo";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-1 bg-page">
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-[48.5%] lg:justify-start lg:pl-[11.2%]">
        <div className="w-full max-w-[490px]">
          <Logo />
          <div className="flex flex-col gap-2.5 pt-[46px] pb-8">
            <h1 className="text-[32px] font-bold tracking-[-0.6px] text-ink">{title}</h1>
            <p className="text-[17px] leading-[26px] text-muted">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
      <div className="hidden flex-1 items-center bg-navy px-16 lg:flex xl:pl-[13.9%]">
        <p className="max-w-[480px] text-[28px] leading-[39px] text-white">
          Quadros, listas e cards em um fluxo só. Checklists, prazos, etiquetas e comentários no mesmo lugar.
        </p>
      </div>
    </main>
  );
}
