import type { ReactNode } from "react";
import type { PermissionKey } from "@/lib/permissions";
import { I } from "./icons";

export type NavBadge = {
  label: string;
  tone: "muted" | "active" | "info" | "warn" | "danger" | "positive";
};

export type NavChild =
  | { section: string; name?: never; href?: never; active?: never; disabled?: never; badge?: never; permission?: never }
  | {
      name: string;
      href: string;
      active?: boolean;
      disabled?: boolean;
      badge?: string;
      /** Permission key gating this child link. */
      permission?: PermissionKey;
      section?: never;
    };

export type NavItem = {
  name: string;
  href: string;
  icon: ReactNode;
  badge?: NavBadge;
  admin?: boolean;
  /**
   * @deprecated Use `permission` instead. Kept temporarily so old gates still work.
   * Will be removed once all consumers migrate.
   */
  requires?: "admin" | "suppliers" | "marketing";
  /**
   * Permission key gating this item. If the item has children, you usually
   * set permissions on the children instead — the parent is shown
   * whenever any of its children is accessible.
   */
  permission?: PermissionKey;
  children?: NavChild[];
};

export type NavSection = {
  title: string;
  locked?: boolean;
  items: NavItem[];
};

export const NAV: NavSection[] = [
  {
    title: "Dia a Dia",
    items: [
      { name: "Home",    href: "/",       icon: I.home,  permission: "home" },
      { name: "Tarefas", href: "/tarefas", icon: I.inbox, permission: "tarefas" },
    ],
  },
  {
    title: "Produção",
    items: [
      { name: "Esteira de Pós", href: "/esteira-de-pos", icon: I.film,   permission: "esteira_de_pos" },
      { name: "Projetos",       href: "/projetos-av",    icon: I.folder, permission: "projetos" },
      { name: "Equipamentos",   href: "/retiradas",      icon: I.package,
        children: [
          { name: "Retiradas",  href: "/retiradas",  permission: "equipamentos.retiradas" },
          { name: "Inventário", href: "/inventario", permission: "equipamentos.inventario" },
        ],
      },
      { name: "Fornecedores",   href: "/fornecedores",   icon: I.users,
        children: [
          { name: "Freelancers", href: "/fornecedores/freelancers", permission: "fornecedores.freelancers" },
          { name: "Empresas",    href: "/fornecedores/empresas",    permission: "fornecedores.empresas" },
        ],
      },
    ],
  },
  {
    title: "Marketing",
    items: [
      { name: "Marketing", href: "/marketing", icon: I.radio,
        children: [
          { section: "Métricas" },
          { name: "Dashboard",   href: "/marketing/dashboard",                   permission: "marketing.dashboard" },
          { section: "Social Media" },
          { name: "Calendário",  href: "/marketing/social-media/calendario",     permission: "marketing.calendario" },
          { name: "Instagram",   href: "/marketing/social-media/instagram",      permission: "marketing.instagram" },
          { name: "Linkedin",    href: "/marketing/social-media/linkedin", disabled: true, badge: "Em breve" },
          { name: "Ideias",      href: "/marketing/ideias",                      permission: "marketing.ideias" },
          { name: "Referências", href: "/marketing/referencias",                 permission: "marketing.referencias" },
          { section: "Site" },
          { name: "Site",        href: "/marketing/social-media/site",           permission: "marketing.site" },
        ],
      },
    ],
  },
  {
    title: "Comercial",
    items: [
      { name: "CRM", href: "/crm", icon: I.users,
        children: [
          { name: "Pipeline",   href: "/crm/pipeline",   permission: "crm.pipeline" },
          { name: "Contatos",   href: "/crm/contatos",   permission: "crm.contatos" },
          { name: "Atividades", href: "/crm/atividades", permission: "crm.atividades" },
          { name: "Dashboard",  href: "/crm/dashboard",  permission: "crm.dashboard" },
        ],
      },
      { name: "Orçamentos", href: "/orcamentos", icon: I.fileText, permission: "orcamentos" },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { name: "Financeiro", href: "/financeiro", icon: I.chart, admin: true,
        children: [
          { name: "Dashboard",       href: "/financeiro/dashboard", permission: "financeiro.dashboard" },
          { name: "Gestão de CAPEX", href: "/financeiro/capex",     permission: "financeiro.capex" },
        ],
      },
    ],
  },
  {
    title: "Tecnologia",
    items: [
      { name: "Plataformas",   href: "/plataformas", icon: I.key,   permission: "plataformas" },
      { name: "Armazenamento", href: "/ssds",        icon: I.drive, permission: "armazenamento" },
    ],
  },
  {
    title: "RH",
    items: [
      { name: "Políticas", href: "/politicas", icon: I.scroll, permission: "politicas" },
    ],
  },
  {
    title: "Admin",
    locked: true,
    items: [
      { name: "Admin", href: "/administracao", icon: I.settings, admin: true, permission: "admin",
        children: [
          { name: "Usuários",          href: "/administracao/usuarios",      permission: "admin" },
          { name: "Permissões",        href: "/administracao/permissoes",    permission: "admin" },
          { name: "Logs de Auditoria", href: "/administracao/logs",          permission: "admin" },
          { name: "Categorias",        href: "/administracao/categorias",    permission: "admin" },
          { name: "Notificações",      href: "/administracao/notificacoes",  permission: "admin" },
          { name: "Sistema",           href: "/administracao/sistema",       permission: "admin" },
          { name: "Integrações",       href: "/administracao/integracoes",   permission: "admin" },
        ],
      },
    ],
  },
];
