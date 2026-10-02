import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { storeApi } from "@/services/api/store";
import { StorefrontLayout } from "@/components/layout";
import { safeData } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PolicyPageProps {
  params: Promise<{ policyType: string }>;
}

export async function generateMetadata({ params }: PolicyPageProps): Promise<Metadata> {
  const { policyType } = await params;
  const [settingsRes, policiesRes] = await Promise.allSettled([
    storeApi.getSettings(),
    storeApi.getPolicies(),
  ]);
  const settings = safeData(settingsRes, null);
  const policies = safeData(policiesRes, []);
  const policy = policies.find(
    (p) => (p.policyType ?? "").toLowerCase() === policyType.toLowerCase(),
  );
  if (!policy) return { title: "Policy Not Found" };
  const storeName = settings?.businessName ?? "Shopey";
  return {
    title: `${policy.title ?? policy.policyType} — ${storeName}`,
    robots: { index: false, follow: true },
  };
}

export default async function PolicyPage({ params }: PolicyPageProps) {
  const { policyType } = await params;

  const [settingsRes, policiesRes] = await Promise.allSettled([
    storeApi.getSettings(),
    storeApi.getPolicies(),
  ]);
  const settings = safeData(settingsRes, null);
  const policies = safeData(policiesRes, []);

  const policy = policies.find(
    (p) => (p.policyType ?? "").toLowerCase() === policyType.toLowerCase(),
  );

  if (!policy || !policy.isPublished) notFound();

  return (
    <StorefrontLayout settings={settings} policies={policies}>
      <div className="container-x mx-auto py-10 md:py-14 max-w-3xl min-h-[60vh]">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-body-sm text-foreground-muted hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to store
        </Link>

        {/* Policy content */}
        <article>
          <h1 className="text-h2 font-bold text-foreground mb-2">
            {policy.title ?? policy.policyType}
          </h1>
          <p className="text-caption text-foreground-muted mb-8">
            Last updated:{" "}
            {new Date(policy.updatedAtUtc).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          {policy.content ? (
            <div
              className="prose prose-sm max-w-none text-foreground-muted leading-relaxed
                [&_h1]:text-h3 [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mt-8 [&_h1]:mb-3
                [&_h2]:text-h4 [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-6 [&_h2]:mb-2
                [&_h3]:text-body [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-4 [&_h3]:mb-1
                [&_p]:mb-4 [&_p]:text-body-sm [&_p]:leading-relaxed
                [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ul]:space-y-1
                [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_ol]:space-y-1
                [&_li]:text-body-sm
                [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-foreground-muted
                [&_strong]:font-semibold [&_strong]:text-foreground
                [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic"
              dangerouslySetInnerHTML={{ __html: policy.content }}
            />
          ) : (
            <p className="text-body-sm text-foreground-muted">
              This policy has no content yet.
            </p>
          )}
        </article>

        {/* Other policies */}
        {policies.filter((p) => p.isPublished && p.id !== policy.id).length > 0 && (
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-label font-semibold text-foreground-muted uppercase tracking-wider mb-4">
              Other Policies
            </p>
            <div className="flex flex-wrap gap-3">
              {policies
                .filter((p) => p.isPublished && p.id !== policy.id)
                .map((p) => (
                  <Link
                    key={p.id}
                    href={`/policies/${(p.policyType ?? "policy").toLowerCase()}`}
                    className="text-body-sm text-foreground-muted hover:text-foreground underline underline-offset-2 transition-colors"
                  >
                    {p.title ?? p.policyType}
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}
