import { AppShell } from "@/components/layout/app-shell";
import { listCompanies } from "@/lib/actions/contacts";
import { ContactsPageClient } from "@/components/contacts/contacts-page-client";

export default async function ContactsPage() {
  const companies = await listCompanies();

  return (
    <AppShell active="/contacts">
      <ContactsPageClient initialCompanies={companies} />
    </AppShell>
  );
}
