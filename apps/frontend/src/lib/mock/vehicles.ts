export type VehicleType = "CAR" | "MOTORCYCLE";

export interface VehicleCustomer {
  id: string;
  name: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  type: VehicleType;
  brand: string;
  model: string;
  version?: string;
  manufactureYear?: string;
  modelYear?: string;
  chassisNumber?: string;
  renavam?: string;
  mileage?: number;
  customer: VehicleCustomer;
}

export const vehicles: Vehicle[] = [
  {
    id: "1",
    plate: "ABC1D23",
    type: "CAR",
    brand: "Toyota",
    model: "Corolla",
    version: "XEi",
    manufactureYear: "2021",
    modelYear: "2022",
    mileage: 45230,
    customer: { id: "CLI-000002", name: "Maria Souza" },
  },
  {
    id: "2",
    plate: "BRA2E19",
    type: "MOTORCYCLE",
    brand: "Honda",
    model: "CG 160",
    version: "Titan",
    manufactureYear: "2020",
    modelYear: "2020",
    mileage: 18500,
    customer: { id: "CLI-000001", name: "João Silva" },
  },
  {
    id: "3",
    plate: "QRS4F56",
    type: "CAR",
    brand: "Honda",
    model: "Civic",
    version: "Touring",
    manufactureYear: "2019",
    modelYear: "2019",
    chassisNumber: "9BWZZZ377VT004251",
    mileage: 62310,
    customer: { id: "CLI-000003", name: "Auto Peças Bandeirantes Ltda" },
  },
  {
    id: "4",
    plate: "XYZ7G88",
    type: "CAR",
    brand: "Jeep",
    model: "Renegade",
    customer: { id: "CLI-000007", name: "Pedro Costa" },
  },
  {
    id: "5",
    plate: "MOT5H12",
    type: "MOTORCYCLE",
    brand: "Yamaha",
    model: "Fazer 250",
    version: "Blueflex",
    manufactureYear: "2018",
    mileage: 32100,
    renavam: "00123456789",
    customer: { id: "CLI-000009", name: "Beatriz Nunes" },
  },
  {
    id: "6",
    plate: "FIT8J34",
    type: "CAR",
    brand: "Fiat",
    model: "Argo",
    modelYear: "2023",
    mileage: 8900,
    customer: { id: "CLI-000012", name: "Fernanda Alves" },
  },
  {
    id: "7",
    plate: "TRK1K90",
    type: "CAR",
    brand: "Toyota",
    model: "Corolla Cross",
    manufactureYear: "2022",
    modelYear: "2023",
    mileage: 15400,
    customer: { id: "CLI-000005", name: "Transportes Rocha Eireli" },
  },
  {
    id: "8",
    plate: "MCS3L47",
    type: "MOTORCYCLE",
    brand: "Honda",
    model: "CB 500",
    version: "F",
    manufactureYear: "2021",
    chassisNumber: "9C2MC4110ME012345",
    mileage: 9800,
    customer: { id: "CLI-000011", name: "Moto Center Sul Comércio Ltda" },
  },
  {
    id: "9",
    plate: "CIV6M02",
    type: "CAR",
    brand: "Chevrolet",
    model: "Onix",
    version: "LT",
    mileage: 52000,
    customer: { id: "CLI-000004", name: "Carlos Lima" },
  },
  {
    id: "10",
    plate: "BET9N75",
    type: "MOTORCYCLE",
    brand: "Yamaha",
    model: "XTZ 250",
    manufactureYear: "2017",
    modelYear: "2017",
    mileage: 41200,
    renavam: "00987654321",
    customer: { id: "CLI-000006", name: "Ana Ferreira" },
  },
];
