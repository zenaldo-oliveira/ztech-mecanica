export interface MockTenant {
  name: string;
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
    plan: "Profissional",
  },
  user: {
    name: "Ricardo Almeida",
    email: "ricardo@oficinacentral.com.br",
    role: "Proprietário",
    initials: "RA",
  },
};
