import { prisma } from "@/lib/prisma";

// DB-backed settings, falling back to process.env — lets local dev keep
// using .env while the same code works once deployed (see AppSetting in
// schema.prisma for why this exists instead of writing to .env at runtime).
export async function getSetting(key: string): Promise<string | undefined> {
  const row = await prisma.appSetting.findUnique({ where: { key } });
  return row?.value ?? process.env[key];
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}
