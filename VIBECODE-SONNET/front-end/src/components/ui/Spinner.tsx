import { LoaderCircle } from "lucide-react";

export function FullPageSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <LoaderCircle className="size-7 animate-spin text-muted" />
    </div>
  );
}
