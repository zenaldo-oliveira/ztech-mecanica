import { Bike, Car } from "lucide-react";

import { cn } from "@/lib/utils";
import type { VehicleType } from "@/lib/api/vehicles";

interface VehicleTypeIconProps {
  type: VehicleType;
  className?: string;
}

export function VehicleTypeIcon({ type, className }: VehicleTypeIconProps) {
  const Icon = type === "CAR" ? Car : Bike;

  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground",
        className,
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
    </span>
  );
}
