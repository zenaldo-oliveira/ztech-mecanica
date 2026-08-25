import { CustomerDetailView } from "@/components/customers/customer-detail-view";

export default async function CustomerDetailPage({ params }: PageProps<"/customers/[id]">) {
  const { id } = await params;

  return <CustomerDetailView customerId={id} />;
}
