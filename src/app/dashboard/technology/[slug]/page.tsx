import { redirect } from "next/navigation";

export default function TechnologyCompanyPage({
  params,
}: {
  params: { slug: string };
}) {
  redirect(`/dashboard/portfolio/technology/${params.slug}`);
}
