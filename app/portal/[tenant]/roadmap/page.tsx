import { redirect } from "next/navigation";

// Roadmap is intentionally hidden from the public portal — send visitors to the
// board. (Re-enable by restoring the previous implementation from git history.)
export default async function PortalRoadmapPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  redirect(`/portal/${decodeURIComponent(tenant)}`);
}
