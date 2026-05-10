import { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { PageHeader } from "./components/PageHeader";
import { I } from "./icons";
import "./preview.css";

export default function DsPreview() {
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    return () => {
      if (hadDark) root.classList.add("dark");
      else root.classList.remove("dark");
    };
  }, [theme]);

  return (
    <div className={"ds-preview" + (theme === "dark" ? " theme-dark" : "")}>
      <div className={"app" + (collapsed ? " sidebar-collapsed" : "")}>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
        <div className="main">
          <Topbar
            theme={theme}
            onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          />
          <div className="content">
            <PageHeader
              eyebrow="Financeiro · Dashboard"
              title="Visão geral."
              subtitle="Performance e saúde financeira do mês."
              meta="Sincronizado há 2 min"
              actions={
                <>
                  <button className="btn btn-ghost">{I.filter}<span>Filtros</span></button>
                  <button className="btn btn-ghost">{I.download}<span>Exportar</span></button>
                  <button className="btn btn-primary"><span>Novo lançamento</span>{I.arrUp}</button>
                </>
              }
            />

            <section className="section">
              <div className="section-head">
                <div className="section-head-l">
                  <span className="section-eyebrow">01</span>
                  <span className="section-title">Mês atual</span>
                </div>
                <span className="section-meta">Maio · 2026</span>
              </div>
              <div className="grid-3">
                <KpiCard
                  label="Faturamento do mês"
                  value="R$ 284.500"
                  tone="positive"
                  badge={{ label: "Meta batida", tone: "positive" }}
                  meta={<>Meta <strong>R$ 265.000</strong></>}
                  delta="+7,4%"
                  deltaUp
                  progress={107}
                />
                <KpiCard
                  label="Margem de contribuição"
                  value="42,8%"
                  tone="warn"
                  badge={{ label: "Abaixo", tone: "warn" }}
                  meta={<>Meta <strong>50%</strong></>}
                  delta="-7,2pp"
                  progress={86}
                />
                <KpiCard
                  label="Lucro líquido"
                  value="18,2%"
                  meta={<>Meta <strong>20%</strong></>}
                  delta="-1,8pp"
                  progress={91}
                />
              </div>
            </section>

            <section className="section">
              <div className="section-head">
                <div className="section-head-l">
                  <span className="section-eyebrow">02</span>
                  <span className="section-title">Próximas peças</span>
                </div>
                <span className="section-meta">A definir</span>
              </div>
              <div className="frame">
                <div className="frame-head">
                  <span className="frame-title">Placeholder</span>
                  <span className="badge b-muted"><span className="badge-dot" />Em construção</span>
                </div>
                <p style={{ color: "var(--fg-3)", fontSize: 13, lineHeight: 1.6 }}>
                  Esta tela é um sandbox para validar o design system Hiro OS antes de migrar páginas reais.
                  Conforme cada componente passar pela revisão visual, ele entra na plataforma.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

type KpiCardProps = {
  label: string;
  value: string;
  tone?: "positive" | "warn" | "danger";
  badge?: { label: string; tone: "positive" | "warn" | "danger" | "muted" | "active" | "info" };
  meta?: React.ReactNode;
  delta?: string;
  deltaUp?: boolean;
  progress?: number;
};

function KpiCard({ label, value, tone, badge, meta, delta, deltaUp, progress }: KpiCardProps) {
  return (
    <div className={"kpi" + (tone ? " is-" + tone : "")}>
      <div className="kpi-head">
        <span className="kpi-label">{label}</span>
        {badge && (
          <span className={"badge b-" + badge.tone}>
            <span className="badge-dot" />
            {badge.label}
          </span>
        )}
      </div>
      <div className="kpi-value">{value}</div>
      {progress != null && (
        <div className="bar">
          <div className="bar-fill" style={{ ["--p" as string]: Math.min(progress, 100) + "%" }} />
        </div>
      )}
      {(meta || delta) && (
        <div className="kpi-sub">
          {meta && <span className="kpi-meta">{meta}</span>}
          {delta && (
            <span
              style={{
                fontFamily: '"HN Display", sans-serif',
                fontSize: 11,
                fontWeight: 500,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "0.04em",
                color: deltaUp ? "var(--accent)" : "var(--danger)",
              }}
            >
              {delta}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
