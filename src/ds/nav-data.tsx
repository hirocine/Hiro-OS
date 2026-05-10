import type { ReactNode } from "react";
import { I } from "./icons";

export type NavBadge = {
  label: string;
  tone: "muted" | "active" | "info" | "warn" | "danger" | "positive";
};

export type NavChild =
  | { section: string; name?: never; href?: never; active?: never; disabled?: never; badge?: never }
  | {
      name: string;
      href: string;
      active?: boolean;
      disabled?: boolean;
      badge?: string;
      section?: never;
    };

export type NavItem = {
  name: string;
  href: string;
  icon: ReactNode;
  badge?: NavBadge;
  admin?: boolean;
  /** Per-item access gate. Sections are kept ungated so the same parent can mix open + restricted items. */
  requires?: "admin" | "suppliers" | "marketing";
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
      { name: "Home",    href: "/",       icon: I.home },
      { name: "Tarefas", href: "/tarefas", icon: I.inbox },
    ],
  },
  {
    title: "Produção",
    items: [
      { name: "Esteira de Pós", href: "/esteira-de-pos", icon: I.film },
      { name: "Projetos",       href: "/projetos-av",    icon: I.folder },
      { name: "Equipamentos",   href: "/retiradas",      icon: I.package,
        children: [
          { name: "Retiradas",  href: "/retiradas" },
          { name: "Inventário", href: "/inventario" },
        ],
      },
      { name: "Fornecedores",   href: "/fornecedores",   icon: I.users,
        requires: "suppliers",
        children: [
          { name: "Freelancers", href: "/fornecedores/freelancers" },
          { name: "Empresas",    href: "/fornecedores/empresas" },
        ],
      },
    ],
  },
  {
    title: "Marketing",
    items: [
      { name: "Marketing", href: "/marketing", icon: I.radio,
        requires: "marketing",
        children: [
          { section: "Métricas" },
          { name: "Dashboard",   href: "/marketing/dashboard" },
          { section: "Social Media" },
          { name: "Calendário",  href: "/marketing/social-media/calendario" },
          { name: "Instagram",   href: "/marketing/social-media/instagram" },
          { name: "Linkedin",    href: "/marketing/social-media/linkedin", disabled: true, badge: "Em breve" },
          { name: "Ideias",      href: "/marketing/ideias" },
          { name: "Referências", href: "/marketing/referencias" },
          { section: "Site" },
          { name: "Site",        href: "/marketing/social-media/site" },
        ],
      },
    ],
  },
  {
    title: "Comercial",
    items: [
      { name: "CRM", href: "/crm", icon: I.users,
        children: [
          { name: "Pipeline",   href: "/crm/pipeline" },
          { name: "Contatos",   href: "/crm/contatos" },
          { name: "Atividades", href: "/crm/atividades" },
          { name: "Dashboard",  href: "/crm/dashboard" },
        ],
      },
      { name: "Orçamentos", href: "/orcamentos", icon: I.fileText },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { name: "Financeiro", href: "/financeiro", icon: I.chart, admin: true,
        requires: "admin",
        children: [
          { name: "Dashboard",       href: "/financeiro/dashboard" },
          { name: "Gestão de CAPEX", href: "/financeiro/capex" },
        ],
      },
    ],
  },
  {
    title: "Tecnologia",
    items: [
      { name: "Plataformas",   href: "/plataformas", icon: I.key },
      { name: "Armazenamento", href: "/ssds",        icon: I.drive },
    ],
  },
  {
    title: "Admin",
    locked: true,
    items: [
      { name: "Admin", href: "/administracao", icon: I.settings, admin: true,
        requires: "admin",
        children: [
          { name: "Usuários",          href: "/administracao/usuarios" },
          { name: "Logs de Auditoria", href: "/administracao/logs" },
          { name: "Categorias",        href: "/administracao/categorias" },
          { name: "Notificações",      href: "/administracao/notificacoes" },
          { name: "Sistema",           href: "/administracao/sistema" },
        ],
      },
      { name: "Políticas", href: "/politicas", icon: I.scroll, admin: true },
    ],
  },
];
