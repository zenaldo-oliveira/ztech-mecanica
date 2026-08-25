export type PersonType = "INDIVIDUAL" | "BUSINESS";

export type CustomerStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";

export type ContactPreference = "WHATSAPP" | "EMAIL" | "PHONE" | "NONE";

export interface CustomerAddress {
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export interface Customer {
  id: string;
  personType: PersonType;
  name: string;
  tradeName?: string;
  document: string;
  status: CustomerStatus;
  phone: string;
  whatsapp?: string;
  email?: string;
  secondaryPhone?: string;
  secondaryEmail?: string;
  address?: CustomerAddress;
  contactPreference: ContactPreference;
}

export const customers: Customer[] = [
  {
    id: "CLI-000001",
    personType: "INDIVIDUAL",
    name: "João Silva",
    document: "45678912303",
    status: "ACTIVE",
    phone: "11987654321",
    whatsapp: "11987654321",
    email: "joao.silva@email.com",
    address: {
      zipCode: "01310-100",
      street: "Av. Paulista",
      number: "1000",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
    },
    contactPreference: "WHATSAPP",
  },
  {
    id: "CLI-000002",
    personType: "INDIVIDUAL",
    name: "Maria Souza",
    document: "78912345600",
    status: "ACTIVE",
    phone: "11976543210",
    address: {
      city: "São Paulo",
      state: "SP",
    },
    contactPreference: "PHONE",
  },
  {
    id: "CLI-000003",
    personType: "BUSINESS",
    name: "Auto Peças Bandeirantes Ltda",
    tradeName: "Bandeirantes Auto Peças",
    document: "12345678000190",
    status: "ACTIVE",
    phone: "1132145566",
    whatsapp: "11991234567",
    email: "contato@bandeirantespecas.com.br",
    address: {
      zipCode: "04567-000",
      street: "Rua dos Bandeirantes",
      number: "450",
      complement: "Galpão 2",
      neighborhood: "Vila Industrial",
      city: "São Paulo",
      state: "SP",
    },
    contactPreference: "EMAIL",
  },
  {
    id: "CLI-000004",
    personType: "INDIVIDUAL",
    name: "Carlos Lima",
    document: "32165498700",
    status: "INACTIVE",
    phone: "11965432198",
    whatsapp: "11965432198",
    contactPreference: "WHATSAPP",
  },
  {
    id: "CLI-000005",
    personType: "BUSINESS",
    name: "Transportes Rocha Eireli",
    document: "98765432000110",
    status: "ACTIVE",
    phone: "1134567890",
    email: "financeiro@transportesrocha.com.br",
    secondaryPhone: "1134567891",
    address: {
      zipCode: "02345-100",
      street: "Rua Guaicurus",
      number: "780",
      neighborhood: "Lapa",
      city: "São Paulo",
      state: "SP",
    },
    contactPreference: "PHONE",
  },
  {
    id: "CLI-000006",
    personType: "INDIVIDUAL",
    name: "Ana Ferreira",
    document: "15975385300",
    status: "BLOCKED",
    phone: "11955512345",
    contactPreference: "NONE",
  },
  {
    id: "CLI-000007",
    personType: "INDIVIDUAL",
    name: "Pedro Costa",
    document: "85236974100",
    status: "ACTIVE",
    phone: "11998877665",
    whatsapp: "11998877665",
    secondaryPhone: "1130405060",
    email: "pedro.costa@email.com",
    address: {
      city: "Guarulhos",
      state: "SP",
    },
    contactPreference: "WHATSAPP",
  },
  {
    id: "CLI-000008",
    personType: "BUSINESS",
    name: "Frota Norte Logística S.A.",
    tradeName: "Frota Norte",
    document: "23456789000155",
    status: "BLOCKED",
    phone: "1145678899",
    email: "cobranca@frotanorte.com.br",
    secondaryEmail: "juridico@frotanorte.com.br",
    address: {
      zipCode: "07890-000",
      street: "Rodovia Presidente Dutra, km 12",
      city: "Guarulhos",
      state: "SP",
    },
    contactPreference: "EMAIL",
  },
  {
    id: "CLI-000009",
    personType: "INDIVIDUAL",
    name: "Beatriz Nunes",
    document: "74185296300",
    status: "ACTIVE",
    phone: "11991112233",
    email: "beatriz.nunes@email.com",
    address: {
      zipCode: "05678-200",
      street: "Rua Cardeal Arcoverde",
      number: "220",
      neighborhood: "Pinheiros",
      city: "São Paulo",
      state: "SP",
    },
    contactPreference: "EMAIL",
  },
  {
    id: "CLI-000010",
    personType: "INDIVIDUAL",
    name: "Ricardo Oliveira",
    document: "96385274100",
    status: "INACTIVE",
    phone: "11934567812",
    contactPreference: "PHONE",
  },
  {
    id: "CLI-000011",
    personType: "BUSINESS",
    name: "Moto Center Sul Comércio Ltda",
    tradeName: "Moto Center Sul",
    document: "34567890000122",
    status: "ACTIVE",
    phone: "1123456677",
    whatsapp: "11981234455",
    email: "vendas@motocentersul.com.br",
    secondaryEmail: "posvenda@motocentersul.com.br",
    address: {
      zipCode: "03456-050",
      street: "Av. Celso Garcia",
      number: "3200",
      neighborhood: "Tatuapé",
      city: "São Paulo",
      state: "SP",
    },
    contactPreference: "WHATSAPP",
  },
  {
    id: "CLI-000012",
    personType: "INDIVIDUAL",
    name: "Fernanda Alves",
    document: "25836914700",
    status: "BLOCKED",
    phone: "11922334455",
    whatsapp: "11922334455",
    contactPreference: "NONE",
  },
];
