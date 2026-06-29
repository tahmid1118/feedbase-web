import { redirect } from "next/navigation";

// Changelog is intentionally hidden from the public portal — send visitors to
// the board. (Re-enable by restoring the previous implementation from git.)
export default async function PortalChangelogDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { tenant } = await params;
  redirect(`/portal/${decodeURIComponent(tenant)}`);
}
