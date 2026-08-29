import { prisma } from "@/lib/prisma";

// Shared by createProject/createLead (auto-link a new record's client to a
// Company + a Contact person under it) and the one-off backfill script for
// existing data. Dedupes primarily by contact email (the most reliable
// identifier — a client's email doesn't change even if their company name
// gets typed slightly differently, e.g. "X & Y" vs "X + Y"), falling back
// to a case-insensitive company-name match, only creating a new Company if
// neither matches.
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

  let company = email
    ? (await prisma.contact.findFirst({ where: { email }, include: { company: true } }))?.company ?? null
    : null;

  if (!company) {
    company = await prisma.company.findFirst({
      where: { name: { equals: companyName, mode: "insensitive" } },
    });
  }

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
