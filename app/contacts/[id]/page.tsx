import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getCompanyDetail } from "@/lib/actions/contacts";
import { CompanyDetailView } from "@/components/contacts/company-detail-view";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let company;
  try {
    company = await getCompanyDetail(id);
  } catch {
    notFound();
  }

  return (
    <AppShell active="/contacts">
      <CompanyDetailView company={company} />
    </AppShell>
  );
}
