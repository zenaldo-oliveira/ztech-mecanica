export type QuoteStatus = "DRAFT" | "SENT" | "APPROVED" | "REJECTED" | "EXPIRED" | "CANCELLED" | "CONVERTED";

export const quoteStatusLabel: Record<QuoteStatus, string> = {
  DRAFT: "Rascunho",
  SENT: "Enviado",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
  EXPIRED: "Expirado",
  CANCELLED: "Cancelado",
  CONVERTED: "Convertido em OS",
};

export interface MockQuote {
  id: string;
  customer: string;
  vehicle: string;
  plate: string;
  status: QuoteStatus;
  total: string;
}

export const quotes: MockQuote[] = [
  { id: "ORC-000041", customer: "Maria Souza", vehicle: "Toyota Corolla", plate: "ABC1D23", status: "SENT", total: "R$ 1.280,00" },
  { id: "ORC-000042", customer: "Carlos Lima", vehicle: "Honda Civic", plate: "QWE4R56", status: "APPROVED", total: "R$ 950,00" },
  { id: "ORC-000043", customer: "Pedro Rocha", vehicle: "Jeep Renegade", plate: "RTY7U89", status: "DRAFT", total: "R$ 2.340,00" },
  { id: "ORC-000044", customer: "Beatriz Nunes", vehicle: "Fiat Argo", plate: "FGH2J34", status: "EXPIRED", total: "R$ 410,00" },
  { id: "ORC-000045", customer: "João Silva", vehicle: "Honda CG 160", plate: "BRA2E19", status: "CONVERTED", total: "R$ 480,00" },
];
