import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  BadgeDollarSign,
  Banknote,
  BellRing,
  Boxes,
  Building2,
  CalendarDays,
  Car,
  ChartColumn,
  ChartLine,
  CircleQuestionMark,
  ClipboardCheck,
  ClipboardList,
  ClockFading,
  Contact2,
  CreditCard,
  FileCheck,
  FileCog,
  FileText,
  KeyRound,
  LayoutDashboard,
  Lightbulb,
  MessageCircle,
  MessagesSquare,
  Package,
  Plug,
  Receipt,
  ScrollText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Stethoscope,
  Truck,
  User,
  UserCog,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/** Placeholder content for routes whose module is not built yet. */
export interface PlannedModule {
  /** Roadmap phase shown on the placeholder (ex.: "P4 — Financeiro"). */
  phase: string;
  highlights: string[];
}

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  /** Extra search terms for the global search. */
  keywords?: string[];
  /**
   * Present only for routes served by the catch-all placeholder
   * (`app/(app)/[...slug]`). Routes with their own `page.tsx` omit it.
   */
  planned?: PlannedModule;
}

export interface NavSection {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

export type NavEntry = { kind: "link"; item: NavItem } | { kind: "section"; section: NavSection };

const dashboard: NavItem = {
  label: "Dashboard",
  href: "/dashboard",
  icon: LayoutDashboard,
  description: "Visão geral da oficina.",
  keywords: ["início", "home", "painel", "indicadores"],
};

const reports: NavItem = {
  label: "Relatórios",
  href: "/reports",
  icon: ChartColumn,
  description: "Indicadores de faturamento, serviços, estoque e clientes.",
  keywords: ["indicadores", "análise"],
  planned: {
    phase: "P7 — Relatórios",
    highlights: [
      "Faturamento por período, separado em serviços e peças",
      "Serviços e peças mais vendidos",
      "Taxa de aprovação de orçamentos",
      "Produtividade por mecânico",
    ],
  },
};

const fiscalSettings: NavItem = {
  label: "Configuração fiscal",
  href: "/settings/fiscal",
  icon: FileCog,
  description: "Regime tributário, inscrições, perfis fiscais e provedor de emissão.",
  keywords: ["imposto", "tributação", "certificado", "regime"],
  planned: {
    phase: "P5 — Fiscal",
    highlights: [
      "Regime tributário, inscrição estadual e municipal",
      "Estratégia de emissão (NFS-e + NF-e, conjugada, somente serviços)",
      "Perfis fiscais de produtos e alíquotas de ISS",
      "Provedor fiscal e ambiente (homologação/produção)",
    ],
  },
};

export const primaryNav: NavEntry[] = [
  { kind: "link", item: dashboard },
  {
    kind: "section",
    section: {
      id: "workshop",
      label: "Oficina",
      icon: Wrench,
      items: [
        {
          label: "Ordens de Serviço",
          href: "/work-orders",
          icon: ClipboardList,
          description: "Abertura, execução e acompanhamento das OS.",
          keywords: ["os", "ordem", "serviço"],
        },
        {
          label: "Orçamentos",
          href: "/quotes",
          icon: FileText,
          description: "Propostas de valores enviadas aos clientes.",
          keywords: ["orçamento", "proposta"],
        },
        {
          label: "Check-up",
          href: "/checkup",
          icon: ClipboardCheck,
          description: "Check-up Inteligente do veículo.",
          keywords: ["vistoria", "inspeção", "checklist"],
        },
        {
          label: "Agenda",
          href: "/schedule",
          icon: CalendarDays,
          description: "Agendamentos de atendimento e entrega de veículos.",
          keywords: ["agendamento", "calendário"],
          planned: {
            phase: "Backlog — aguardando especificação",
            highlights: [
              "Agendamento de entrada de veículos",
              "Previsão de entrega das OS",
              "Visão por dia e por mecânico",
            ],
          },
        },
        {
          label: "Garantias",
          href: "/warranties",
          icon: ShieldCheck,
          description: "Garantias de serviços e peças e retornos de clientes.",
          keywords: ["garantia", "retorno"],
          planned: {
            phase: "Backlog — aguardando especificação",
            highlights: [
              "Garantias vigentes por veículo (prazo e km)",
              "Abertura de OS de retorno vinculada à original",
              "Garantias próximas do vencimento",
            ],
          },
        },
      ],
    },
  },
  {
    kind: "section",
    section: {
      id: "customers",
      label: "Clientes",
      icon: Users,
      items: [
        {
          label: "Clientes",
          href: "/customers",
          icon: Users,
          description: "Cadastro e relacionamento com clientes.",
          keywords: ["cliente", "cadastro"],
        },
        {
          label: "Veículos",
          href: "/vehicles",
          icon: Car,
          description: "Veículos atendidos pela oficina.",
          keywords: ["placa", "carro", "moto"],
        },
        {
          label: "Histórico",
          href: "/service-history",
          icon: ClockFading,
          description: "Histórico de atendimentos por cliente e veículo.",
          keywords: ["histórico", "atendimentos", "manutenções"],
          planned: {
            phase: "P1 — Clientes e Veículos",
            highlights: [
              "Linha do tempo de OS por veículo",
              "Serviços e peças já realizados",
              "Quilometragem registrada em cada atendimento",
            ],
          },
        },
      ],
    },
  },
  {
    kind: "section",
    section: {
      id: "inventory",
      label: "Estoque",
      icon: Boxes,
      items: [
        {
          label: "Produtos",
          href: "/products",
          icon: Package,
          description: "Peças, produtos e materiais.",
          keywords: ["peça", "produto", "sku", "ncm"],
        },
        {
          label: "Estoque",
          href: "/inventory",
          icon: Boxes,
          description: "Saldos e estoque mínimo.",
          keywords: ["saldo", "estoque mínimo"],
        },
        {
          label: "Movimentações",
          href: "/inventory/movements",
          icon: ArrowLeftRight,
          description: "Entradas, saídas, ajustes e devoluções de estoque.",
          keywords: ["entrada", "saída", "ajuste", "devolução"],
          planned: {
            phase: "P3 — Estoque",
            highlights: [
              "Entradas, saídas, ajustes e devoluções",
              "Rastreabilidade: cada saída aponta para a OS de origem",
              "Saldo após cada movimentação",
            ],
          },
        },
        {
          label: "Fornecedores",
          href: "/suppliers",
          icon: Truck,
          description: "Cadastro de fornecedores.",
          keywords: ["fornecedor", "distribuidor"],
        },
        {
          label: "Compras",
          href: "/purchases",
          icon: ShoppingCart,
          description: "Pedidos de compra e recebimento de mercadorias.",
          keywords: ["compra", "pedido"],
        },
      ],
    },
  },
  {
    kind: "section",
    section: {
      id: "financial",
      label: "Financeiro",
      icon: Wallet,
      items: [
        {
          label: "Contas a receber",
          href: "/financial/receivables",
          icon: ArrowDownToLine,
          description: "Valores a receber de clientes.",
          keywords: ["receber", "recebíveis", "inadimplência"],
          planned: {
            phase: "P4 — Financeiro",
            highlights: [
              "Contas geradas automaticamente pelas OS",
              "Parcelas, vencimentos e baixas",
              "Clientes em atraso",
            ],
          },
        },
        {
          label: "Contas a pagar",
          href: "/financial/payables",
          icon: ArrowUpFromLine,
          description: "Despesas e obrigações com fornecedores.",
          keywords: ["pagar", "despesas", "boletos"],
          planned: {
            phase: "P4 — Financeiro",
            highlights: ["Despesas fixas e variáveis", "Compras a prazo", "Vencimentos da semana"],
          },
        },
        {
          label: "Caixa",
          href: "/financial/cash-register",
          icon: Banknote,
          description: "Abertura, movimentação e fechamento de caixa.",
          keywords: ["caixa", "dinheiro", "sangria"],
          planned: {
            phase: "P4 — Financeiro",
            highlights: ["Abertura e fechamento de caixa", "Sangrias e suprimentos", "Conferência por forma de pagamento"],
          },
        },
        {
          label: "Pagamentos",
          href: "/payments",
          icon: CreditCard,
          description: "Recebimentos e formas de pagamento.",
          keywords: ["pix", "cartão", "recebimento"],
        },
        {
          label: "Fluxo de caixa",
          href: "/financial/cash-flow",
          icon: ChartLine,
          description: "Entradas e saídas previstas e realizadas.",
          keywords: ["fluxo", "projeção"],
          planned: {
            phase: "P4 — Financeiro",
            highlights: ["Previsto × realizado", "Saldo projetado por dia", "Visão semanal e mensal"],
          },
        },
      ],
    },
  },
  {
    kind: "section",
    section: {
      id: "fiscal",
      label: "Fiscal",
      icon: Receipt,
      items: [
        {
          label: "Notas fiscais",
          href: "/fiscal",
          icon: Receipt,
          description: "Documentos fiscais emitidos e recebidos.",
          keywords: ["nota", "nf", "documento fiscal"],
        },
        {
          label: "NFS-e",
          href: "/fiscal/nfse",
          icon: FileCheck,
          description: "Notas fiscais de serviço.",
          keywords: ["nota de serviço", "iss"],
          planned: {
            phase: "P5 — Fiscal",
            highlights: ["Emissão a partir da OS", "Consulta, cancelamento, XML e PDF", "Histórico e erros de emissão"],
          },
        },
        {
          label: "NF-e / NFC-e",
          href: "/fiscal/nfe",
          icon: ScrollText,
          description: "Notas fiscais de produtos.",
          keywords: ["nfe", "nfce", "nota de produto", "danfe"],
          planned: {
            phase: "P5 — Fiscal",
            highlights: ["Emissão das peças da OS", "Consulta, cancelamento, XML e DANFE", "Protocolo e chave de acesso"],
          },
        },
        fiscalSettings,
      ],
    },
  },
  { kind: "link", item: reports },
  {
    kind: "section",
    section: {
      id: "relationship",
      label: "Relacionamento",
      icon: MessagesSquare,
      items: [
        {
          label: "WhatsApp",
          href: "/whatsapp",
          icon: MessageCircle,
          description: "Comunicação com clientes pelo WhatsApp.",
          keywords: ["mensagem", "zap"],
        },
        {
          label: "CRM",
          href: "/crm",
          icon: Contact2,
          description: "Relacionamento e recorrência de clientes.",
          keywords: ["relacionamento", "funil"],
        },
        {
          label: "Lembretes",
          href: "/reminders",
          icon: BellRing,
          description: "Lembretes de manutenção preventiva.",
          keywords: ["manutenção preventiva", "troca de óleo", "revisão"],
          planned: {
            phase: "Relacionamento — após P4",
            highlights: [
              "Próxima manutenção calculada pelo histórico",
              "Lembretes por data ou quilometragem",
              "Envio por WhatsApp",
            ],
          },
        },
      ],
    },
  },
  {
    kind: "section",
    section: {
      id: "ai",
      label: "IA",
      icon: Sparkles,
      items: [
        {
          label: "Assistente",
          href: "/ai",
          icon: Sparkles,
          description: "Assistente inteligente da oficina.",
          keywords: ["ia", "inteligência artificial", "chat"],
        },
        {
          label: "Diagnóstico",
          href: "/ai/diagnosis",
          icon: Stethoscope,
          description: "Apoio ao diagnóstico a partir de sintomas.",
          keywords: ["sintoma", "defeito"],
          planned: {
            phase: "IA — após o núcleo operacional",
            highlights: [
              "Hipóteses de causa a partir dos sintomas relatados",
              "Sugestão de serviços e peças",
              "Sempre com confirmação do mecânico",
            ],
          },
        },
        {
          label: "Recomendações",
          href: "/ai/recommendations",
          icon: Lightbulb,
          description: "Sugestões de estoque, preços e relacionamento.",
          keywords: ["sugestões", "insights"],
          planned: {
            phase: "IA — após o núcleo operacional",
            highlights: ["Reposição de estoque", "Clientes para reativar", "Serviços recorrentes por veículo"],
          },
        },
      ],
    },
  },
];

export const settingsSection: NavSection = {
  id: "settings",
  label: "Configurações",
  icon: Settings,
  items: [
    {
      label: "Minha oficina",
      href: "/settings/workshop",
      icon: Building2,
      description: "Dados da empresa, endereço, logotipo e horários.",
      keywords: ["empresa", "cnpj", "endereço", "logo"],
      planned: {
        phase: "P0 — Fundação",
        highlights: ["Razão social, CNPJ e contatos", "Logotipo para impressões", "Valor-hora padrão e validade de orçamentos"],
      },
    },
    {
      label: "Usuários",
      href: "/settings/users",
      icon: UserCog,
      description: "Usuários da oficina e convites.",
      keywords: ["equipe", "funcionários", "mecânicos", "convite"],
      planned: {
        phase: "P0 — Autenticação",
        highlights: ["Convite de usuários por e-mail", "Bloqueio e reativação", "Encerramento de sessões"],
      },
    },
    {
      label: "Permissões",
      href: "/settings/permissions",
      icon: KeyRound,
      description: "Perfis de acesso e permissões.",
      keywords: ["perfil", "acesso", "rbac"],
      planned: {
        phase: "P0 — RBAC",
        highlights: ["Perfis: proprietário, administrador, gerente, atendente, mecânico, financeiro", "O que cada perfil pode ver e fazer"],
      },
    },
    {
      label: "Serviços",
      href: "/services",
      icon: Wrench,
      description: "Catálogo de serviços e mão de obra.",
      keywords: ["mão de obra", "catálogo", "valor-hora"],
    },
    {
      label: "Produtos",
      href: "/products",
      icon: Package,
      description: "Catálogo de peças e produtos.",
      keywords: ["catálogo", "peças"],
    },
    {
      label: "Pagamentos",
      href: "/settings/payments",
      icon: BadgeDollarSign,
      description: "Formas de pagamento aceitas e integrações.",
      keywords: ["pix", "cartão", "maquininha", "tef"],
      planned: {
        phase: "P4 — Pagamentos",
        highlights: ["Formas de pagamento aceitas", "Chave PIX", "Maquininha / TEF (P6)"],
      },
    },
    fiscalSettings,
    {
      label: "Notificações",
      href: "/settings/notifications",
      icon: BellRing,
      description: "Alertas do sistema e avisos aos clientes.",
      keywords: ["alertas", "avisos"],
      planned: {
        phase: "Relacionamento — após P4",
        highlights: ["Alertas de estoque mínimo", "Orçamentos vencendo", "Avisos automáticos aos clientes"],
      },
    },
    {
      label: "Integrações",
      href: "/settings/integrations",
      icon: Plug,
      description: "WhatsApp, provedores fiscais e de pagamento.",
      keywords: ["api", "conexões"],
      planned: {
        phase: "P5/P6 — Integrações",
        highlights: ["WhatsApp", "Provedor fiscal", "Provedor de pagamento e TEF"],
      },
    },
    {
      label: "Assinatura",
      href: "/settings/billing",
      icon: CreditCard,
      description: "Plano contratado, faturas e forma de pagamento.",
      keywords: ["plano", "fatura", "cobrança"],
      planned: {
        phase: "P8 — Preparação comercial",
        highlights: ["Plano atual e limites", "Faturas", "Troca de plano"],
      },
    },
  ],
};

/** Pages reachable from menus (user, help) but not listed in the sidebar. */
export const auxiliarySections: NavSection[] = [
  {
    id: "account",
    label: "Conta",
    icon: User,
    items: [
      {
        label: "Meu perfil",
        href: "/account/profile",
        icon: User,
        description: "Seus dados, senha e sessões ativas.",
        keywords: ["perfil", "senha", "conta"],
        planned: {
          phase: "P0 — Autenticação",
          highlights: ["Nome, e-mail e foto", "Troca de senha", "Sessões ativas"],
        },
      },
      {
        label: "Preferências",
        href: "/account/preferences",
        icon: SlidersHorizontal,
        description: "Tema, idioma e preferências de uso.",
        keywords: ["tema", "modo escuro"],
        planned: {
          phase: "Backlog",
          highlights: ["Tema claro/escuro", "Página inicial", "Densidade das tabelas"],
        },
      },
    ],
  },
  {
    id: "help",
    label: "Ajuda",
    icon: CircleQuestionMark,
    items: [
      {
        label: "Central de ajuda",
        href: "/help",
        icon: CircleQuestionMark,
        description: "Guias de uso e contato com o suporte.",
        keywords: ["suporte", "dúvidas", "tutorial"],
        planned: {
          phase: "P8 — Preparação comercial",
          highlights: ["Guias passo a passo", "Perguntas frequentes", "Contato com o suporte"],
        },
      },
    ],
  },
];

interface IndexedNavItem {
  item: NavItem;
  section?: NavSection;
}

function indexEntries(): IndexedNavItem[] {
  const indexed: IndexedNavItem[] = [];
  for (const entry of primaryNav) {
    if (entry.kind === "link") {
      indexed.push({ item: entry.item });
    } else {
      entry.section.items.forEach((item) => indexed.push({ item, section: entry.section }));
    }
  }
  settingsSection.items.forEach((item) => indexed.push({ item, section: settingsSection }));
  auxiliarySections.forEach((section) =>
    section.items.forEach((item) => indexed.push({ item, section })),
  );
  return indexed;
}

/** Every navigable item, in menu order. An href can appear more than once (ex.: Produtos). */
export const allNavItems: IndexedNavItem[] = indexEntries();

function matchesHref(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Resolves the single nav item that owns `pathname`: the longest matching href,
 * and the first one in menu order on ties (so a page listed twice is highlighted once).
 */
export function findActiveNavItem(pathname: string): IndexedNavItem | undefined {
  let best: IndexedNavItem | undefined;
  for (const candidate of allNavItems) {
    if (!matchesHref(pathname, candidate.item.href)) continue;
    if (!best || candidate.item.href.length > best.item.href.length) best = candidate;
  }
  return best;
}

export interface Breadcrumb {
  label: string;
  href?: string;
}

export function getBreadcrumbs(pathname: string): Breadcrumb[] {
  const active = findActiveNavItem(pathname);
  if (!active) return [];

  const crumbs: Breadcrumb[] = [];
  if (active.section) crumbs.push({ label: active.section.label });

  const isDetail = pathname !== active.item.href;
  crumbs.push({ label: active.item.label, href: isDetail ? active.item.href : undefined });
  if (isDetail) crumbs.push({ label: "Detalhes" });

  return crumbs;
}

/** Placeholder routes served by `app/(app)/[...slug]/page.tsx`, deduplicated by href. */
export function getPlannedRoutes(): NavItem[] {
  const byHref = new Map<string, NavItem>();
  allNavItems.forEach(({ item }) => {
    if (item.planned && !byHref.has(item.href)) byHref.set(item.href, item);
  });
  return [...byHref.values()];
}

export function getPlannedRoute(pathname: string): NavItem | undefined {
  return getPlannedRoutes().find((item) => item.href === pathname);
}
