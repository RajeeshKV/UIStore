import { AlertTriangle } from "lucide-react";

interface StoreClosedBannerProps {
  message?: string | null;
}

export function StoreClosedBanner({ message }: StoreClosedBannerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full bg-foreground text-primary-foreground py-2.5 px-4"
    >
      <div className="container-x mx-auto flex items-center justify-center gap-2 text-body-sm text-center">
        <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
        <span>
          {message && message.trim().length > 0
            ? message
            : "Our store is temporarily closed. We'll be back soon."}
        </span>
      </div>
    </div>
  );
}
