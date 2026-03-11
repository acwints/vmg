import { redirect } from "next/navigation";

export default function ConsumerCompanyPage({
  params,
}: {
  params: { slug: string };
}) {
  redirect(`/dashboard/portfolio/consumer/${params.slug}`);
}
