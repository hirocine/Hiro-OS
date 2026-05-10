import { I } from "../icons";

type Props = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
};

export function Topbar({ theme, onToggleTheme }: Props) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="crumbs">
          <span>Administração</span>
          <span className="crumb-sep">/</span>
          <span>Financeiro</span>
          <span className="crumb-sep">/</span>
          <span>Dashboard</span>
        </div>
      </div>
      <div className="topbar-right">
        <button className="tb-action" title="Buscar">{I.search}</button>
        <button className="tb-action" title="Notificações">
          {I.bell}
          <span className="tb-dot" />
        </button>
        <button className="tb-action" title="Tema" onClick={onToggleTheme}>
          {theme === "dark" ? I.sun : I.moon}
        </button>
        <div className="tb-user">
          <div className="avatar">RJ</div>
          <span className="who-name">Rodrigo</span>
        </div>
      </div>
    </header>
  );
}
