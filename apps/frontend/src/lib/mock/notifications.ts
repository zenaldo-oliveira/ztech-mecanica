export type NotificationKind = "work-order" | "quote" | "stock" | "financial";

export interface MockNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  time: string;
  href: string;
  unread: boolean;
}

export const notifications: MockNotification[] = [
  {
    id: "n1",
    kind: "quote",
    title: "Orçamento aprovado",
    description: "Carlos Lima aprovou o ORC-000042 (R$ 950,00).",
    time: "há 12 min",
    href: "/quotes",
    unread: true,
  },
  {
    id: "n2",
    kind: "stock",
    title: "Estoque abaixo do mínimo",
    description: "Pastilha de freio dianteira: 3 em estoque (mínimo 5).",
    time: "há 1 h",
    href: "/inventory",
    unread: true,
  },
  {
    id: "n3",
    kind: "work-order",
    title: "OS pronta para entrega",
    description: "OS-003 · Honda Civic de Carlos Lima.",
    time: "há 3 h",
    href: "/work-orders",
    unread: true,
  },
  {
    id: "n4",
    kind: "financial",
    title: "Conta a receber vencida",
    description: "Pedro Rocha · R$ 320,00 venceu ontem.",
    time: "ontem",
    href: "/financial/receivables",
    unread: false,
  },
];
