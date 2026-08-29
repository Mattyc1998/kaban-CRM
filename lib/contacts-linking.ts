import { prisma } from "@/lib/prisma";

// Shared by createProject/createLead (auto-link a new record's client to a
// Company + a Contact person under it) and the one-off backfill script for
// existing data. Dedupes the Company by name, and the Contact person by
// email within that company.
export async function findOrCreateCompany(input: {
  name?: string | null;
  email?: string | null;
  company?: string | null;
  phone?: string | null;
}): Promise<string | null> {
  const personName = input.name?.trim() || null;
  const email = input.email?.trim() || null;
  const companyName = input.company?.trim() || personName;
  const phone = input.phone?.trim() || null;

  if (!companyName) return null;

  let company = await prisma.company.findFirst({ where: { name: companyName } });
  if (!company) {
    company = await prisma.company.create({ data: { name: companyName } });
  }

  if (personName || email) {
    const existingContact = email
      ? await prisma.contact.findFirst({ where: { companyId: company.id, email } })
      : await prisma.contact.findFirst({ where: { companyId: company.id, name: personName ?? undefined } });

    if (existingContact) {
      const updates: Record<string, string> = {};
      if (!existingContact.email && email) updates.email = email;
      if (!existingContact.phone && phone) updates.phone = phone;
      if (Object.keys(updates).length > 0) {
        await prisma.contact.update({ where: { id: existingContact.id }, data: updates });
      }
    } else {
      await prisma.contact.create({
        data: { companyId: company.id, name: personName || companyName, email, phone },
      });
    }
  }

  return company.id;
}
