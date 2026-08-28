import { AppShell } from "@/components/layout/app-shell";
import { listContacts } from "@/lib/actions/contacts";
import { ContactsPageClient } from "@/components/contacts/contacts-page-client";

export default async function ContactsPage() {
  const contacts = await listContacts();

  return (
    <AppShell active="/contacts">
      <ContactsPageClient initialContacts={contacts} />
    </AppShell>
  );
}
