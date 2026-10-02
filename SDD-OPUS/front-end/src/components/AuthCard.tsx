import type { ReactNode } from "react";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Quadros</p>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        {children}
      </div>
    </main>
  );
}
