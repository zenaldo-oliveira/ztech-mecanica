export interface MockProduct {
  code: string;
  name: string;
  brand: string;
  unit: string;
  stock: number;
  salePrice: string;
}

export const products: MockProduct[] = [
  { code: "PRD-000001", name: "Óleo de motor 5W30 sintético", brand: "Mobil", unit: "L", stock: 42, salePrice: "R$ 54,90" },
  { code: "PRD-000002", name: "Filtro de óleo", brand: "Mann", unit: "UN", stock: 7, salePrice: "R$ 38,00" },
  { code: "PRD-000003", name: "Pastilha de freio dianteira", brand: "Bosch", unit: "JG", stock: 3, salePrice: "R$ 189,00" },
  { code: "PRD-000004", name: "Disco de freio ventilado", brand: "Fremax", unit: "PAR", stock: 4, salePrice: "R$ 420,00" },
  { code: "PRD-000005", name: "Vela de ignição", brand: "NGK", unit: "UN", stock: 24, salePrice: "R$ 32,50" },
  { code: "PRD-000006", name: "Filtro de ar", brand: "Mahle", unit: "UN", stock: 11, salePrice: "R$ 46,00" },
  { code: "PRD-000007", name: "Fluido de freio DOT 4", brand: "Bosch", unit: "UN", stock: 9, salePrice: "R$ 36,90" },
  { code: "PRD-000008", name: "Bateria 60Ah", brand: "Moura", unit: "UN", stock: 2, salePrice: "R$ 649,00" },
];
