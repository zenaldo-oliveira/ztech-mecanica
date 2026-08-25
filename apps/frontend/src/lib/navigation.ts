import {
  Boxes,
  Car,
  ClipboardList,
  Contact2,
  CreditCard,
  FileText,
  LayoutDashboard,
  MessageCircle,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Sparkles,
  Truck,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const dashboardNavItem: NavItem = {
  label: "Dashboard",
  href: "/dashboard",
  icon: LayoutDashboard,
};

export const navGroups: NavGroup[] = [
  {
    label: "Operação",
    items: [
      { label: "Clientes", href: "/customers", icon: Users },
      { label: "Veículos", href: "/vehicles", icon: Car },
      { label: "Orçamentos", href: "/quotes", icon: FileText },
      { label: "Ordens de Serviço", href: "/work-orders", icon: ClipboardList },
      { label: "Serviços", href: "/services", icon: Wrench },
    ],
  },
  {
    label: "Estoque",
    items: [
      { label: "Produtos", href: "/products", icon: Package },
      { label: "Estoque", href: "/inventory", icon: Boxes },
      { label: "Compras", href: "/purchases", icon: ShoppingCart },
      { label: "Fornecedores", href: "/suppliers", icon: Truck },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { label: "Financeiro", href: "/financial", icon: Wallet },
      { label: "Pagamentos", href: "/payments", icon: CreditCard },
    ],
  },
  {
    label: "Fiscal",
    items: [{ label: "Documentos fiscais", href: "/fiscal", icon: Receipt }],
  },
  {
    label: "Relacionamento",
    items: [
      { label: "CRM", href: "/crm", icon: Contact2 },
      { label: "WhatsApp", href: "/whatsapp", icon: MessageCircle },
    ],
  },
  {
    label: "Inteligência",
    items: [{ label: "IA", href: "/ai", icon: Sparkles }],
  },
  {
    label: "Administração",
    items: [{ label: "Configurações", href: "/settings", icon: Settings }],
  },
];
