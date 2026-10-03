export interface MockTenant {
  name: string;
  document: string;
  city: string;
  plan: "Essencial" | "Profissional" | "Premium";
}

export interface MockUser {
  name: string;
  email: string;
  role: string;
  initials: string;
}

export interface MockSession {
  tenant: MockTenant;
  user: MockUser;
}

export const mockSession: MockSession = {
  tenant: {
    name: "Oficina Central Auto Peças",
    document: "12.345.678/0001-90",
    city: "São Paulo · SP",
    plan: "Profissional",
  },
  user: {
    name: "Ricardo Almeida",
    email: "ricardo@oficinacentral.com.br",
    role: "Proprietário",
    initials: "RA",
  },
};
