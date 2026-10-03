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
    <main className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="hidden flex-col justify-between bg-navy p-12 text-white lg:flex">
        <Logo light />
        <div>
          <p className="max-w-sm text-3xl font-semibold leading-tight">
            Quadros, listas e cards em um fluxo só.
          </p>
          <p className="mt-4 max-w-sm text-white/70">
            Checklists, prazos, etiquetas e comentários no mesmo lugar.
          </p>
        </div>
        <span className="text-sm text-white/50">Sistema Kanban</span>
      </aside>
      <section className="flex items-center justify-center bg-surface p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-semibold text-ink">{title}</h1>
          <p className="mt-1.5 mb-6 text-sm text-muted">{subtitle}</p>
          {children}
        </div>
      </section>
    </main>
  );
}
