import { AppShell } from "@/components/layout/app-shell";
import { listProposals } from "@/lib/actions/proposals";
import { listContacts } from "@/lib/actions/contacts";
import { ProposalsPageClient } from "@/components/proposals/proposals-page-client";

export default async function ProposalsPage() {
  const [proposals, contacts] = await Promise.all([listProposals(), listContacts()]);

  return (
    <AppShell active="/proposals">
      <ProposalsPageClient
        initialProposals={proposals}
        contacts={contacts.map((c) => ({ id: c.id, name: c.name, company: c.company, email: c.email }))}
      />
    </AppShell>
  );
}
