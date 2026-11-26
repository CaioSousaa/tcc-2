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
    <main className="flex min-h-screen flex-1">
      <section className="flex w-full items-center bg-page-bg px-6 py-12 lg:w-[48.5%] lg:px-0">
        <div className="mx-auto w-full max-w-[490px]">
          <Logo href="/login" />
          <h1 className="mt-14 text-[32px] font-bold tracking-tight text-ink">
            {title}
          </h1>
          <p className="mt-3 text-[16px] leading-relaxed text-muted">{subtitle}</p>
          <div className="mt-10">{children}</div>
        </div>
      </section>
      <aside className="hidden flex-1 items-center justify-center bg-navy px-16 lg:flex">
        <p className="max-w-[470px] text-[27px] leading-[1.45] text-white">
          Quadros, listas e cards em um fluxo só. Checklists, prazos, etiquetas
          e comentários no mesmo lugar.
        </p>
      </aside>
    </main>
  );
}
