import { FundDetailPage } from "@/components/dashboard/fund-detail-page";

export default function FundSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  return <FundDetailPage slug={params.slug} />;
}
