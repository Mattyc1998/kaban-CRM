import { AppShell } from "@/components/layout/app-shell";
import { listProposals } from "@/lib/actions/proposals";
import { listCompanies } from "@/lib/actions/contacts";
import { ProposalsPageClient } from "@/components/proposals/proposals-page-client";

export default async function ProposalsPage() {
  const [proposals, companies] = await Promise.all([listProposals(), listCompanies()]);

  return (
    <AppShell active="/proposals">
      <ProposalsPageClient
        initialProposals={proposals}
        companies={companies.map((c) => ({
          id: c.id,
          name: c.name,
          primaryContact: c.contacts[0] ? { name: c.contacts[0].name, email: c.contacts[0].email } : null,
        }))}
      />
    </AppShell>
  );
}
