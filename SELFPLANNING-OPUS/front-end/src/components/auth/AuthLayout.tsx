import { Logo } from "@/components/ui/Logo";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen flex-1">
      <section className="flex flex-1 items-center justify-center bg-page px-6 py-12 lg:basis-[48.5%] lg:justify-start lg:pl-[11.2%]">
        <div className="w-full max-w-[490px]">
          <Logo />
          <header className="flex flex-col gap-2.5 pb-8 pt-[46px]">
            <h1 className="text-[32px] font-bold text-ink">{title}</h1>
            <p className="text-[17px] text-muted">{subtitle}</p>
          </header>
          {children}
        </div>
      </section>
      <aside className="hidden items-center bg-navy pl-[13.9%] pr-16 lg:flex lg:basis-[51.5%]">
        <p className="max-w-[460px] text-[28px] leading-snug text-white">
          Quadros, listas e cards em um fluxo só. Checklists, prazos, etiquetas e comentários no
          mesmo lugar.
        </p>
      </aside>
    </main>
  );
}
