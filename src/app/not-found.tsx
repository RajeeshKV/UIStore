import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center bg-background">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="Shopey" className="h-28 w-28 object-contain mb-8" />
      <h1 className="text-h2 font-bold text-foreground">Page not found</h1>
      <p className="mt-3 text-body-sm text-foreground-muted max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="inline-flex h-10 items-center px-5 rounded-md bg-primary text-primary-foreground text-body-sm font-medium hover:bg-primary/85 transition-colors"
        >
          Back to home
        </Link>
        <Link
          href="/shop"
          className="inline-flex h-10 items-center px-5 rounded-md border border-border text-foreground text-body-sm font-medium hover:bg-muted transition-colors"
        >
          Browse shop
        </Link>
      </div>
    </div>
  );
}

