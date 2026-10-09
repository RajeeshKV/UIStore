import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface CatalogBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function CatalogBreadcrumb({ items, className }: CatalogBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center", className)}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1.5">
              {i > 0 && (
                <ChevronRight
                  className="size-3 text-border shrink-0"
                  aria-hidden="true"
                />
              )}
              {i === 0 && item.href && (
                <Home className="size-3.5 text-foreground-muted shrink-0" aria-hidden="true" />
              )}
              {isLast || !item.href ? (
                <span
                  className="text-[13px] font-semibold text-foreground"
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-[13px] text-foreground-muted hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
