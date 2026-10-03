import type { VehicleType } from "@/lib/mock/vehicles";
import type { CheckupCategoryDefinition } from "@/lib/checkup/types";

const CAR_CHECKLIST: CheckupCategoryDefinition[] = [
  {
    id: "car-engine",
    label: "Motor e Fluidos",
    items: [
      { id: "car-engine-oil-level", label: "Nível de óleo do motor" },
      { id: "car-coolant-level", label: "Nível do fluido de arrefecimento" },
      { id: "car-brake-fluid-level", label: "Nível do fluido de freio" },
      { id: "car-belt", label: "Correia dentada/acessórios" },
      { id: "car-leaks", label: "Vazamentos aparentes" },
      { id: "car-air-filter", label: "Filtro de ar" },
    ],
  },
  {
    id: "car-brakes",
    label: "Freios",
    items: [
      { id: "car-brake-pads-front", label: "Pastilhas dianteiras" },
      { id: "car-brake-pads-rear", label: "Pastilhas traseiras" },
      { id: "car-brake-discs", label: "Discos/tambores" },
      { id: "car-handbrake", label: "Freio de mão" },
    ],
  },
  {
    id: "car-suspension",
    label: "Suspensão e Direção",
    items: [
      { id: "car-shocks-front", label: "Amortecedores dianteiros" },
      { id: "car-shocks-rear", label: "Amortecedores traseiros" },
      { id: "car-bushings", label: "Buchas e batentes" },
      { id: "car-alignment", label: "Alinhamento/geometria" },
      { id: "car-steering", label: "Direção (folga)" },
    ],
  },
  {
    id: "car-tires",
    label: "Pneus e Rodas",
    items: [
      { id: "car-tire-fl", label: "Pneu dianteiro esquerdo" },
      { id: "car-tire-fr", label: "Pneu dianteiro direito" },
      { id: "car-tire-rl", label: "Pneu traseiro esquerdo" },
      { id: "car-tire-rr", label: "Pneu traseiro direito" },
      { id: "car-spare-tire", label: "Estepe" },
      { id: "car-tire-pressure", label: "Calibragem" },
    ],
  },
  {
    id: "car-electrical",
    label: "Elétrica e Iluminação",
    items: [
      { id: "car-battery", label: "Bateria" },
      { id: "car-headlights", label: "Faróis" },
      { id: "car-taillights", label: "Lanternas/setas" },
      { id: "car-brake-light", label: "Luz de freio" },
      { id: "car-dashboard", label: "Painel de instrumentos" },
      { id: "car-horn", label: "Buzina" },
    ],
  },
  {
    id: "car-safety",
    label: "Itens de Segurança",
    items: [
      { id: "car-seatbelts", label: "Cintos de segurança" },
      { id: "car-airbags", label: "Airbags (indicador)" },
      { id: "car-emergency-kit", label: "Extintor/triângulo" },
      { id: "car-wipers", label: "Palhetas do limpador de para-brisa" },
    ],
  },
];

const MOTORCYCLE_CHECKLIST: CheckupCategoryDefinition[] = [
  {
    id: "moto-engine",
    label: "Motor e Fluidos",
    items: [
      { id: "moto-engine-oil-level", label: "Nível de óleo do motor" },
      { id: "moto-leaks", label: "Vazamentos aparentes" },
      { id: "moto-air-filter", label: "Filtro de ar" },
      { id: "moto-chain-kit", label: "Relação (corrente/coroa/pinhão)" },
    ],
  },
  {
    id: "moto-brakes",
    label: "Freios",
    items: [
      { id: "moto-brake-front", label: "Pastilhas/lonas dianteiras" },
      { id: "moto-brake-rear", label: "Pastilhas/lonas traseiras" },
      { id: "moto-brake-discs", label: "Discos/tambores" },
      { id: "moto-brake-fluid", label: "Fluido de freio" },
      { id: "moto-brake-lever", label: "Cabo/pedal de freio" },
    ],
  },
  {
    id: "moto-suspension",
    label: "Suspensão e Chassi",
    items: [
      { id: "moto-fork", label: "Suspensão dianteira" },
      { id: "moto-rear-suspension", label: "Suspensão traseira" },
      { id: "moto-shock", label: "Amortecedor" },
      { id: "moto-steering-column", label: "Coluna de direção" },
    ],
  },
  {
    id: "moto-tires",
    label: "Pneus e Rodas",
    items: [
      { id: "moto-tire-front", label: "Pneu dianteiro" },
      { id: "moto-tire-rear", label: "Pneu traseiro" },
      { id: "moto-tire-pressure", label: "Calibragem" },
      { id: "moto-wheel", label: "Aro/raios" },
    ],
  },
  {
    id: "moto-electrical",
    label: "Elétrica e Iluminação",
    items: [
      { id: "moto-battery", label: "Bateria" },
      { id: "moto-headlight", label: "Farol" },
      { id: "moto-taillight", label: "Lanterna/setas" },
      { id: "moto-brake-light", label: "Luz de freio" },
      { id: "moto-dashboard", label: "Painel/instrumentos" },
      { id: "moto-horn", label: "Buzina" },
    ],
  },
  {
    id: "moto-safety",
    label: "Itens de Segurança",
    items: [
      { id: "moto-mirrors", label: "Espelhos retrovisores" },
      { id: "moto-grips", label: "Manoplas" },
      { id: "moto-kickstand", label: "Descanso lateral/central" },
      { id: "moto-steering-lock", label: "Trava de guidão" },
    ],
  },
];

export const CHECKUP_CHECKLISTS: Record<VehicleType, CheckupCategoryDefinition[]> = {
  CAR: CAR_CHECKLIST,
  MOTORCYCLE: MOTORCYCLE_CHECKLIST,
};
