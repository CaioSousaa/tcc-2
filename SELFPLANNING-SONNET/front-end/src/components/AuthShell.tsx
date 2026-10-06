import { Logo } from "@/components/ui/Logo";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[931fr_989fr]">
      <section className="flex items-center justify-center bg-page-bg p-6">
        <div className="w-full max-w-[490px]">
          <Logo />
          <div className="flex flex-col gap-2.5 pt-[46px] pb-8">
            <h1 className="text-[32px] font-bold tracking-[-0.6px] text-ink">{title}</h1>
            <p className="text-[17px] leading-[26px] text-muted">{subtitle}</p>
          </div>
          {children}
        </div>
      </section>
      <aside className="hidden items-center bg-navy pl-[266px] lg:flex">
        <p className="w-[480px] text-[28px] leading-[39px] text-white">
          Quadros, listas e cards em um fluxo só. Checklists, prazos, etiquetas e comentários no
          mesmo lugar.
        </p>
      </aside>
    </main>
  );
}
