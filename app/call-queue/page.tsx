import { AppShell } from "@/components/layout/app-shell";
import { listCallQueueLeads } from "@/lib/actions/call-queue";
import { CallQueuePageClient } from "@/components/call-queue/call-queue-page-client";

export default async function CallQueuePage() {
  const leads = await listCallQueueLeads();

  return (
    <AppShell active="/call-queue">
      <CallQueuePageClient initialLeads={leads} />
    </AppShell>
  );
}
