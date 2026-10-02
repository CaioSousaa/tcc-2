import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";

/** Duas colunas do protótipo: formulário à esquerda e mensagem da marca em azul-marinho. */
export function AuthShell({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle: string;
  footer: { text: string; href: string; label: string };
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-1">
      <section className="flex w-full flex-col justify-center bg-page-bg px-6 py-12 lg:w-[48.5%] lg:shrink-0 lg:pl-[11.2vw] lg:pr-8">
        <div className="w-full max-w-[490px]">
          <Logo />
          <header className="space-y-2.5 pb-8 pt-[46px]">
            <h1 className="text-[32px] font-bold tracking-[-0.6px] text-ink">{title}</h1>
            <p className="text-[17px] leading-[1.55] text-muted">{subtitle}</p>
          </header>
          {children}
          <p className="mt-6 flex justify-center gap-[5px] text-base text-muted">
            {footer.text}
            <Link href={footer.href} className="font-semibold text-ink hover:underline">
              {footer.label}
            </Link>
          </p>
        </div>
      </section>
      <aside className="hidden flex-1 flex-col justify-center bg-navy lg:flex lg:pl-[13.8vw] lg:pr-8">
        <p className="max-w-[480px] text-[28px] leading-[1.4] text-white">
          Quadros, listas e cards em um fluxo só. Checklists, prazos, etiquetas e comentários no
          mesmo lugar.
        </p>
      </aside>
    </main>
  );
}
