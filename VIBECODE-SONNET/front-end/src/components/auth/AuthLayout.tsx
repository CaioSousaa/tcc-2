import { Logo } from "@/components/ui/Logo";

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-1 bg-page">
      <section className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-[48.5%] lg:pl-[min(215px,11vw)] lg:pr-12">
        <div className="w-full max-w-[490px]">
          <Logo href="/login" />
          <header className="flex flex-col gap-2.5 pb-8 pt-[46px]">
            <h1 className="text-[32px] font-bold tracking-[-0.6px] text-ink">{title}</h1>
            <p className="text-[17px] leading-[1.55] text-muted">{subtitle}</p>
          </header>
          {children}
        </div>
      </section>
      <aside className="hidden flex-1 flex-col justify-center bg-navy px-16 lg:flex xl:pl-[266px]">
        <p className="max-w-[480px] text-[28px] leading-[1.4] text-white">
          Quadros, listas e cards em um fluxo só. Checklists, prazos, etiquetas e
          comentários no mesmo lugar.
        </p>
      </aside>
    </div>
  );
}
