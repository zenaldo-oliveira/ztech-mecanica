import { VehicleDetailView } from "@/components/vehicles/vehicle-detail-view";

export default async function VehicleDetailPage({ params }: PageProps<"/vehicles/[id]">) {
  const { id } = await params;

  return <VehicleDetailView vehicleId={id} />;
}
