import { ChevronDown } from "lucide-react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  selectSize?: "sm" | "md";
  wrapperClassName?: string;
}

export function Select({
  selectSize = "md",
  className = "",
  wrapperClassName = "",
  children,
  ...props
}: SelectProps) {
  const size = selectSize === "sm" ? "h-[38px] pl-3 pr-8 text-sm" : "h-11 pl-4 pr-10 text-[15.5px]";
  return (
    <div className={`relative ${wrapperClassName}`}>
      <select
        className={`w-full cursor-pointer appearance-none rounded-lg border border-border bg-surface-alt text-ink outline-none transition-colors focus:border-navy disabled:cursor-not-allowed disabled:opacity-60 ${size} ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className={`pointer-events-none absolute top-1/2 size-[15px] -translate-y-1/2 text-ink ${selectSize === "sm" ? "right-2.5" : "right-4"}`}
      />
    </div>
  );
}
