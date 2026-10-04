"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { VehicleFormSheet } from "@/components/vehicles/vehicle-form-sheet";
import { VehiclesPagination } from "@/components/vehicles/vehicles-pagination";
import { VehiclesTable } from "@/components/vehicles/vehicles-table";
import { vehicles as initialVehicles, type Vehicle } from "@/lib/mock/vehicles";

const PAGE_SIZE = 8;

export function VehiclesView() {
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>(initialVehicles);
  const [page, setPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | undefined>(undefined);

  const totalPages = Math.max(1, Math.ceil(allVehicles.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedVehicles = allVehicles.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function handleNewVehicle() {
    setEditingVehicle(undefined);
    setIsFormOpen(true);
  }

  function handleEditVehicle(vehicle: Vehicle) {
    setEditingVehicle(vehicle);
    setIsFormOpen(true);
  }

  function handleSubmitVehicle(vehicle: Vehicle) {
    setAllVehicles((previous) => {
      const exists = previous.some((item) => item.id === vehicle.id);
      if (exists) {
        return previous.map((item) => (item.id === vehicle.id ? vehicle : item));
      }
      return [...previous, vehicle];
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Veículos"
        description="Cadastro, identificação e acompanhamento dos veículos atendidos."
        actions={
          <Button size="sm" onClick={handleNewVehicle}>
            <Plus />
            Novo veículo
          </Button>
        }
      />

      <div className="flex flex-1 flex-col">
        <VehiclesTable vehicles={paginatedVehicles} onEdit={handleEditVehicle} />

        <VehiclesPagination
          page={currentPage}
          totalPages={totalPages}
          totalItems={allVehicles.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      <VehicleFormSheet
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        vehicle={editingVehicle}
        onSubmit={handleSubmitVehicle}
      />
    </div>
  );
}
