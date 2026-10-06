interface AlertProps {
  children: React.ReactNode;
  tone?: "error" | "info";
  className?: string;
}

export function Alert({ children, tone = "error", className = "" }: AlertProps) {
  const palette = tone === "error" ? "bg-danger-bg text-danger-dark" : "bg-info-bg text-info";
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-lg px-3.5 py-2.5 text-sm ${palette} ${className}`}
    >
      {children}
    </div>
  );
}
