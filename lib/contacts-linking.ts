import { prisma } from "@/lib/prisma";

// Shared by createProject (auto-link a new project's client to a Contact)
// and the one-off backfill script for existing projects. Dedupes by email
// when given, otherwise by name + company, and fills in any details a
// match was missing.
export async function findOrCreateContact(input: {
  name?: string | null;
  email?: string | null;
  company?: string | null;
  phone?: string | null;
}): Promise<string | null> {
  const name = input.name?.trim() || null;
  const email = input.email?.trim() || null;
  const company = input.company?.trim() || null;
  const phone = input.phone?.trim() || null;

  if (!name && !email && !company) return null;

  let contact = email
    ? await prisma.contact.findFirst({ where: { email } })
    : await prisma.contact.findFirst({ where: { name: name ?? undefined, company } });

  if (contact) {
    const updates: Record<string, string> = {};
    if (!contact.company && company) updates.company = company;
    if (!contact.email && email) updates.email = email;
    if (!contact.phone && phone) updates.phone = phone;
    if (Object.keys(updates).length > 0) {
      contact = await prisma.contact.update({ where: { id: contact.id }, data: updates });
    }
    return contact.id;
  }

  contact = await prisma.contact.create({
    data: { name: name || company || "Unnamed contact", email, company, phone },
  });
  return contact.id;
}
