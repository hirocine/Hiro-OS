import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useBreadcrumbContext } from "../BreadcrumbContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme } from "@/components/ui/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile";
import { getAvatarData } from "@/lib/avatarUtils";
import { NotificationPanel } from "@/components/Layout/NotificationPanel";
import { I } from "../icons";

const BREADCRUMB_LABELS: Record<string, string> = {
  "": "Home",
  financeiro: "Financeiro",
  dashboard: "Dashboard",
  capex: "Gestão de CAPEX",
  inventario: "Inventário",
  "esteira-de-pos": "Esteira de Pós",
  tarefas: "Tarefas",
  retiradas: "Retiradas",
  ssds: "Armazenamento",
  plataformas: "Plataformas",
  politicas: "Políticas",
  "projetos-av": "Projetos",
  orcamentos: "Orçamentos",
  crm: "CRM",
  fornecedores: "Fornecedores",
  freelancers: "Freelancers",
  empresas: "Empresas",
  marketing: "Marketing",
  estrategia: "Estratégia",
  ideias: "Ideias",
  referencias: "Referências",
  "social-media": "Social Media",
  calendario: "Calendário",
  instagram: "Instagram",
  posts: "Posts",
  site: "Site",
  administracao: "Admin",
  usuarios: "Usuários",
  logs: "Logs de Auditoria",
  categorias: "Categorias",
  notificacoes: "Notificações",
  sistema: "Sistema",
  integracoes: "Integrações",
  perfil: "Perfil",
};

function humanize(seg: string) {
  if (BREADCRUMB_LABELS[seg]) return BREADCRUMB_LABELS[seg];
  // skip ids / uuids
  if (/^[0-9a-f-]{8,}$/i.test(seg)) return null;
  if (/^\d+$/.test(seg)) return null;
  return seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
}

export function TopbarReal() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuthContext();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { data: profile } = useCurrentUserProfile();
  const breadcrumbCtx = useBreadcrumbContext();

  const avatarData = getAvatarData(user, profile?.avatar_url, profile?.display_name);
  const firstName = avatarData.displayName?.split(" ")[0] || "";

  const crumbs = useMemo(() => {
    // 1) Page-provided crumbs win (set via <BreadcrumbNav items={...}> → useSetBreadcrumbs)
    if (breadcrumbCtx?.items?.length) return breadcrumbCtx.items;

    // 2) Fallback: derive from URL segments
    const segs = location.pathname.split("/").filter(Boolean);
    if (segs.length === 0) return [{ label: "Home" }];
    const acc: { label: string; href?: string }[] = [];
    let path = "";
    for (let i = 0; i < segs.length; i++) {
      path += "/" + segs[i];
      const label = humanize(segs[i]);
      if (label) {
        acc.push({ label, href: i < segs.length - 1 ? path : undefined });
      }
    }
    return acc.length > 0 ? acc : [{ label: "Home" }];
  }, [breadcrumbCtx?.items, location.pathname]);

  const resolvedTheme =
    theme === "system"
      ? (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light")
      : theme;

  const toggleTheme = () => {
    const next = resolvedTheme === "light" ? "dark" : "light";
    setTheme(next);
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <nav className="crumbs" aria-label="Breadcrumb">
          {crumbs.flatMap((c, i) => {
            const isLast = i === crumbs.length - 1;
            const node = c.href && !isLast
              ? <Link key={`l${i}`} to={c.href} className="crumb-link" title={c.label}>{c.label}</Link>
              : <span key={`c${i}`} className="crumb-current" title={c.label}>{c.label}</span>;
            return i === 0
              ? [node]
              : [<span key={`s${i}`} className="crumb-sep">/</span>, node];
          })}
        </nav>
      </div>
      <div className="topbar-right">
        <div className="tb-action" title="Notificações" style={{ padding: 0 }}>
          <NotificationPanel />
        </div>

        <button
          className="tb-action"
          title={resolvedTheme === "dark" ? "Tema claro" : "Tema escuro"}
          onClick={toggleTheme}
          type="button"
        >
          {resolvedTheme === "dark" ? I.sun : I.moon}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="tb-user" type="button">
              <div className="avatar">
                {avatarData.url ? (
                  <img
                    src={avatarData.url}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  avatarData.initials
                )}
              </div>
              {firstName && <span className="who-name">{firstName}</span>}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate("/perfil")}>
              Ver perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive"
            >
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
