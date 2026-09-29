import type { Metadata } from "next";
import Link from "next/link";
import { storeApi } from "@/services/api/store";
import { StorefrontLayout } from "@/components/layout";
import { safeData } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Policies",
  robots: { index: false, follow: true },
};

export default async function PoliciesIndexPage() {
  const [settingsRes, policiesRes] = await Promise.allSettled([
    storeApi.getSettings(),
    storeApi.getPolicies(),
  ]);
  const settings = safeData(settingsRes, null);
  const policies = safeData(policiesRes, []);
  const published = policies.filter((p) => p.isPublished);

  return (
    <StorefrontLayout settings={settings} policies={policies}>
      <div className="container-x mx-auto py-10 md:py-14 max-w-2xl min-h-[60vh]">
        <h1 className="text-h2 font-bold text-foreground mb-8">Policies</h1>
        {published.length === 0 ? (
          <p className="text-body-sm text-foreground-muted">No policies have been published yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {published.map((p) => (
              <Link
                key={p.id}
                href={`/policies/${(p.policyType ?? "policy").toLowerCase()}`}
                className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-border-strong hover:bg-muted/20 transition-colors"
              >
                <div>
                  <p className="text-body-sm font-semibold text-foreground">{p.title ?? p.policyType}</p>
                  <p className="text-caption text-foreground-muted mt-0.5">
                    Updated {new Date(p.updatedAtUtc).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className="text-foreground-muted text-body-sm">→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}
