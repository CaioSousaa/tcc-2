interface AlertProps {
  children: React.ReactNode;
  tone?: "error" | "info";
  className?: string;
}

export function Alert({ children, tone = "error", className = "" }: AlertProps) {
  const palette =
    tone === "error"
      ? "bg-red-50 text-red-800 ring-red-200"
      : "bg-sky-50 text-sky-800 ring-sky-200";
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-md px-3 py-2 text-sm ring-1 ring-inset ${palette} ${className}`}
    >
      {children}
    </div>
  );
}
