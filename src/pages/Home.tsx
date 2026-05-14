import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { I } from "@/ds/icons";
import { useAuthContext } from "@/contexts/AuthContext";
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { BannerCropperDialog } from "@/components/Home/BannerCropperDialog";
import { TeamMemberDialog } from "@/components/Home/TeamMemberDialog";
import {
  useTeamMembers,
  useTeamMemberMutations,
  type TeamMember,
  type TeamMemberInsert,
  type TeamMemberUpdate,
} from "@/hooks/useTeamMembers";
import { usePostProduction } from "@/features/post-production/hooks/usePostProduction";
import { PP_PRIORITY_ORDER, PP_PRIORITY_CONFIG } from "@/features/post-production/types";
import { useTasks } from "@/features/tasks/hooks/useTasks";
import {
  useRecordingsCalendar,
  useRecordingsToday,
  getEventTitle,
  getEventType,
  type RecordingEvent,
} from "@/hooks/useRecordingsCalendar";

function greetingFor(date: Date) {
  const h = date.getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const WEEKDAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const MONTHS_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function isoWeekNumber(d: Date) {
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

function localDateKey(d: Date) {
  return d.toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
}

function initialsFromName(name: string | null | undefined) {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase() || "—";
}

function formatShortDate(iso: string) {
  const [, m, d] = iso.split("-");
  return d && m ? `${d}/${m}` : iso;
}

function formatTime(iso: string) {
  const dt = new Date(iso);
  if (Number.isNaN(dt.valueOf())) return "";
  return dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function recTypeToCalendarType(t: ReturnType<typeof getEventType>): "rec" | "vt" | "edit" | "pre" {
  if (t === "REC") return "rec";
  if (t === "VT") return "vt";
  if (t === "EDIT") return "edit";
  return "pre";
}

// All-day events come as YYYY-MM-DD (date-only). `new Date(...)` would parse it as UTC,
// shifting the day backwards in negative-offset timezones. These helpers anchor the
// event to its calendar day in local time regardless of the user's timezone.
function eventDateKey(r: RecordingEvent): string {
  if (r.allDay && /^\d{4}-\d{2}-\d{2}/.test(r.start)) {
    return r.start.slice(0, 10);
  }
  return localDateKey(new Date(r.start));
}
function eventLocalDate(r: RecordingEvent): Date {
  if (r.allDay && /^\d{4}-\d{2}-\d{2}/.test(r.start)) {
    const [y, m, d] = r.start.slice(0, 10).split("-").map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }
  return new Date(r.start);
}

/**
 * Returns the *last* day an event visually covers, in local time. For Google
 * all-day events `end` is exclusive (the day AFTER the last day), so we
 * subtract a day there. For timed events we just use the start of the
 * `end`'s local date.
 */
function eventLocalEndDate(r: RecordingEvent): Date {
  if (!r.end) return eventLocalDate(r);
  if (r.allDay && /^\d{4}-\d{2}-\d{2}/.test(r.end)) {
    const [y, m, d] = r.end.slice(0, 10).split("-").map(Number);
    return new Date(y, m - 1, d - 1, 0, 0, 0, 0);
  }
  const e = new Date(r.end);
  return new Date(e.getFullYear(), e.getMonth(), e.getDate(), 0, 0, 0, 0);
}

/** Inclusive list of YYYY-MM-DD keys an event spans, in local time. */
function eventSpanKeys(r: RecordingEvent): string[] {
  const start = eventLocalDate(r);
  const end = eventLocalEndDate(r);
  const out: string[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
  // Safety cap so a malformed long-running event can't loop forever.
  for (let i = 0; i < 366 && cur <= end; i++) {
    out.push(localDateKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out.length > 0 ? out : [localDateKey(start)];
}

function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const cells: { n: number; other: boolean; date: Date }[] = [];
  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push({ n: prevDays - i, other: true, date: new Date(year, month - 1, prevDays - i) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ n: d, other: false, date: new Date(year, month, d) });
  }
  let trail = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ n: trail, other: true, date: new Date(year, month + 1, trail) });
    trail++;
  }
  return cells;
}

export default function Home() {
  const navigate = useNavigate();
  const now = new Date();
  const [view, setView] = useState<"month" | "week" | "list">("month");
  // The date currently *displayed* in the calendar — independent of `now`
  // so the prev/next/Hoje buttons can navigate without affecting the
  // "today" highlight (which always compares against the real Date).
  const [displayDate, setDisplayDate] = useState<Date>(() => new Date());
  const [selectedEvent, setSelectedEvent] = useState<RecordingEvent | null>(null);
  const [showBannerCropper, setShowBannerCropper] = useState(false);
  // Team — profile modal (everyone) + edit dialog (admins only)
  const [profileMember, setProfileMember] = useState<TeamMember | null>(null);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  const { createMember, updateMember } = useTeamMemberMutations();
  const { user, isAdmin } = useAuthContext();
  const { data: profile } = useCurrentUserProfile();
  const { bannerSettings } = useSiteSettings();
  const { data: team = [] as TeamMember[] } = useTeamMembers();

  // Data sources
  const { items: ppItems = [] } = usePostProduction();
  const { tasks = [] } = useTasks();
  const { data: todayRecsAll = [] } = useRecordingsToday();

  // Month range for the calendar — follows the currently-displayed month
  const monthStart = useMemo(
    () => new Date(displayDate.getFullYear(), displayDate.getMonth(), 1).toISOString(),
    [displayDate],
  );
  const monthEnd = useMemo(
    () => new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0, 23, 59, 59).toISOString(),
    [displayDate],
  );
  const { data: monthRecs = [] as RecordingEvent[] } = useRecordingsCalendar(monthStart, monthEnd);

  // Upcoming recording (for hero chip) — next 30 days
  const upcomingStart = useMemo(() => new Date().toISOString(), []);
  const upcomingEnd = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString();
  }, []);
  const { data: upcomingRecs = [] as RecordingEvent[] } = useRecordingsCalendar(upcomingStart, upcomingEnd);

  // ----- derived data -----
  const todayKey = localDateKey(now);

  const todayDeliveries = useMemo(
    () =>
      ppItems
        .filter((i) => i.due_date === todayKey && i.status !== "entregue")
        .sort((a, b) => PP_PRIORITY_ORDER[b.priority] - PP_PRIORITY_ORDER[a.priority]),
    [ppItems, todayKey],
  );

  const myTasks = useMemo(
    () =>
      tasks
        .filter(
          (t) =>
            t.status !== "concluida" &&
            t.status !== "arquivada" &&
            t.assignees?.some((a) => a.user_id === user?.id),
        )
        .sort((a, b) => {
          const aToday = a.due_date === todayKey ? 0 : 1;
          const bToday = b.due_date === todayKey ? 0 : 1;
          return aToday - bToday;
        }),
    [tasks, user?.id, todayKey],
  );

  const todayRecs = useMemo(
    () => todayRecsAll.filter((r) => getEventType(r.summary) !== "PRE"),
    [todayRecsAll],
  );

  // Calendar event map (YYYY-MM-DD → events). Multi-day events get
  // a row entry on *every* day they cover, tagged with where in the
  // span the cell sits so the chip can render as a continuous bar.
  const calendarEvents = useMemo(() => {
    type Span = "single" | "start" | "middle" | "end";
    type Entry = {
      event: RecordingEvent;
      type: "rec" | "vt" | "edit" | "pre";
      title: string;
      span: Span;
    };
    const map: Record<string, Entry[]> = {};
    for (const r of monthRecs) {
      const type = recTypeToCalendarType(getEventType(r.summary));
      const title = getEventTitle(r.summary);
      const keys = eventSpanKeys(r);
      const isSingle = keys.length === 1;
      keys.forEach((key, idx) => {
        const span: Span = isSingle
          ? "single"
          : idx === 0
            ? "start"
            : idx === keys.length - 1
              ? "end"
              : "middle";
        (map[key] ||= []).push({ event: r, type, title, span });
      });
    }
    return map;
  }, [monthRecs]);

  // Next upcoming REC (any non-PRE) for hero chip
  const nextRec = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const startMs = todayStart.valueOf();
    const future = upcomingRecs
      .filter((r) => getEventType(r.summary) !== "PRE")
      .map((r) => ({ r, t: eventLocalDate(r).valueOf() }))
      .filter(({ t }) => t >= startMs)
      .sort((a, b) => a.t - b.t);
    return future[0]?.r ?? null;
  }, [upcomingRecs]);

  // ----- presentational helpers -----
  const displayName = (profile?.display_name?.split(" ")[0]) || user?.email?.split("@")[0] || "";
  const greeting = greetingFor(now);
  const monthLabel = `${MONTHS[displayDate.getMonth()].charAt(0).toUpperCase() + MONTHS[displayDate.getMonth()].slice(1)} · ${displayDate.getFullYear()}`;
  const cells = useMemo(
    () => buildMonthGrid(displayDate.getFullYear(), displayDate.getMonth()),
    [displayDate],
  );

  const heroPhoto = bannerSettings?.url || null;
  const visibleTeam = team.filter((m) => m.is_visible);

  // Week view — Sun → Sat anchored on the currently-displayed date.
  const weekCells = useMemo(() => {
    const dow = displayDate.getDay();
    const weekStart = new Date(displayDate.getFullYear(), displayDate.getMonth(), displayDate.getDate() - dow);
    const out: { n: number; other: boolean; date: Date }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
      out.push({ n: d.getDate(), other: d.getMonth() !== displayDate.getMonth(), date: d });
    }
    return out;
  }, [displayDate]);

  // Nav handlers for the calendar header (prev / Hoje / next).
  // In month view a step is a calendar month; in week view it's 7 days.
  const goPrev = () => {
    setDisplayDate((d) =>
      view === "week"
        ? new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7)
        : new Date(d.getFullYear(), d.getMonth() - 1, 1),
    );
  };
  const goNext = () => {
    setDisplayDate((d) =>
      view === "week"
        ? new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7)
        : new Date(d.getFullYear(), d.getMonth() + 1, 1),
    );
  };
  const goToday = () => setDisplayDate(new Date());

  // Team handlers
  const handleAddTeam = () => {
    setEditingTeamMember(null);
    setTeamDialogOpen(true);
  };
  const handleEditFromProfile = () => {
    if (!profileMember) return;
    setEditingTeamMember(profileMember);
    setProfileMember(null);
    setTeamDialogOpen(true);
  };
  const handleSaveTeam = (data: TeamMemberInsert | TeamMemberUpdate) => {
    if ("id" in data) {
      updateMember.mutate(data as TeamMemberUpdate, {
        onSuccess: () => setTeamDialogOpen(false),
      });
    } else {
      createMember.mutate(data as TeamMemberInsert, {
        onSuccess: () => setTeamDialogOpen(false),
      });
    }
  };

  // Chronological events (filtered to month for list view)
  const sortedMonthEvents = useMemo(
    () => [...monthRecs].sort((a, b) => eventLocalDate(a).valueOf() - eventLocalDate(b).valueOf()),
    [monthRecs],
  );

  const recCount = monthRecs.length;
  const nextRecLabel = nextRec
    ? `${getEventTitle(nextRec.summary)}${(() => {
        const evDate = eventLocalDate(nextRec);
        const todayMid = new Date();
        todayMid.setHours(0, 0, 0, 0);
        const days = Math.round((evDate.valueOf() - todayMid.valueOf()) / 86400000);
        if (days <= 0) return nextRec.allDay ? " · hoje" : ` · hoje ${formatTime(nextRec.start)}`;
        if (days === 1) return " · amanhã";
        return ` · em ${days} dias`;
      })()}`
    : "Sem gravação agendada";

  return (
    <div className="ds-shell ds-home">
      {/* HERO */}
      <section className="hero">
        <div
          className={"hero-img" + (heroPhoto ? "" : " placeholder")}
          style={heroPhoto ? { backgroundImage: `url(${heroPhoto})` } : undefined}
        />
        <div className="hero-shade" />
        <div className="hero-shade-bottom" />

        <div className="hero-inner">
          <div className="hero-top">
            <div className="hero-eyebrow">
              <span className="acc-mark" />
              Hiro OS<sup style={{ fontSize: 8 }}>®</sup> · {WEEKDAYS[now.getDay()]} · {String(now.getDate()).padStart(2, "0")} de {MONTHS[now.getMonth()]} · semana {isoWeekNumber(now)}
            </div>
            {isAdmin && (
              <button
                className="hero-edit"
                type="button"
                onClick={() => setShowBannerCropper(true)}
              >
                {I.edit}
                <span>Editar banner</span>
              </button>
            )}
          </div>

          <div className="hero-mid">
            <h1 className="hero-greet">
              {greeting},<br />
              {displayName}<em>.</em>
            </h1>
          </div>

          <div className="hero-bottom">
            <div className="hero-chip">
              <span className="hero-rec-dot" />
              <span className="hero-chip-label">Próx. gravação</span>
              <span className="hero-chip-value" style={{ maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {nextRecLabel}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="ds-home-inner">
        {/* 01 — Hoje na Hiro */}
        <section className="section">
          <div className="section-head">
            <div className="section-head-l">
              <span className="section-eyebrow">01</span>
              <span className="section-title">Hoje na Hiro</span>
            </div>
            <span className="section-meta">Atualizado há instantes</span>
          </div>
          <div className="today">
            {/* Entregas hoje */}
            <div className="today-card" onClick={() => navigate("/esteira-de-pos")}>
              <div className="today-head">
                <span className="today-label">
                  <span className="dot" style={{ background: "var(--info)" }} />
                  Entregas hoje
                </span>
                <span className="today-arrow">{I.arrR}</span>
              </div>
              <div className="today-num">
                <span className="today-num-val">{String(todayDeliveries.length).padStart(2, "0")}</span>
                <span className="today-num-unit">{todayDeliveries.length === 1 ? "vídeo para entregar" : "vídeos para entregar"}</span>
              </div>
              {todayDeliveries.length > 0 ? (
                <div className="today-list">
                  {todayDeliveries.slice(0, 3).map((it) => (
                    <div key={it.id} className="today-list-row del">
                      <span className="row-dot" />
                      <span className="today-list-title">{it.title}</span>
                      <span className="today-list-meta">{PP_PRIORITY_CONFIG[it.priority].label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="today-empty">Nenhuma entrega para hoje</div>
              )}
            </div>

            {/* Minhas tarefas */}
            <div className="today-card" onClick={() => navigate("/tarefas")}>
              <div className="today-head">
                <span className="today-label">
                  <span className="dot" style={{ background: "var(--warn)" }} />
                  Minhas tarefas
                </span>
                <span className="today-arrow">{I.arrR}</span>
              </div>
              <div className="today-num">
                <span className="today-num-val">{String(myTasks.length).padStart(2, "0")}</span>
                <span className="today-num-unit">{myTasks.length === 1 ? "tarefa pendente" : "tarefas pendentes"}</span>
              </div>
              {myTasks.length > 0 ? (
                <div className="today-list">
                  {myTasks.slice(0, 3).map((t) => (
                    <div key={t.id} className="today-list-row task">
                      <span className="row-dot" />
                      <span className="today-list-title">{t.title}</span>
                      <span className="today-list-meta">
                        {t.due_date === todayKey ? "hoje" : t.due_date ? formatShortDate(t.due_date) : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="today-empty">Nenhuma tarefa pendente</div>
              )}
            </div>

            {/* Gravações do dia */}
            <div className="today-card" onClick={() => navigate("/projetos-av")}>
              <div className="today-head">
                <span className="today-label">
                  <span className="dot" style={{ background: "var(--danger)" }} />
                  Gravações do dia
                </span>
                <span className="today-arrow">{I.arrR}</span>
              </div>
              <div className="today-num">
                <span className="today-num-val">{String(todayRecs.length).padStart(2, "0")}</span>
                <span className="today-num-unit">{todayRecs.length === 1 ? "gravação agendada" : "gravações agendadas"}</span>
              </div>
              {todayRecs.length > 0 ? (
                <div className="today-list">
                  {todayRecs.slice(0, 3).map((r) => (
                    <div key={r.id} className="today-list-row rec">
                      <span className="row-dot" />
                      <span className="today-list-title">{getEventTitle(r.summary)}</span>
                      <span className="today-list-meta">{r.allDay ? "dia todo" : formatTime(r.start)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="today-empty">Nenhuma gravação hoje</div>
              )}
            </div>
          </div>
        </section>

        {/* 02 — Agenda de gravações */}
        <section className="section">
          <div className="section-head">
            <div className="section-head-l">
              <span className="section-eyebrow">02</span>
              <span className="section-title">Agenda de gravações</span>
            </div>
          </div>
          <div className="rc">
            <div className="rc-head">
              <div className="rc-head-l">
                <span className="rec-mark" />
                <div>
                  <div className="rc-period">{monthLabel}</div>
                  <div className="rc-period-meta">
                    {recCount} {recCount === 1 ? "evento" : "eventos"} · sincronizado · google calendar
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div className="rc-controls">
                  <button
                    className="rc-nav"
                    type="button"
                    onClick={goPrev}
                    aria-label={view === "week" ? "Semana anterior" : "Mês anterior"}
                  >
                    {I.chevL}
                  </button>
                  <button
                    className="rc-nav"
                    type="button"
                    onClick={goToday}
                    aria-label="Ir para hoje"
                  >
                    <span style={{ fontFamily: '"HN Display", sans-serif', fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", padding: "0 10px" }}>Hoje</span>
                  </button>
                  <button
                    className="rc-nav"
                    type="button"
                    onClick={goNext}
                    aria-label={view === "week" ? "Próxima semana" : "Próximo mês"}
                  >
                    {I.chevR}
                  </button>
                </div>
                <div className="rc-views">
                  <button className={view === "month" ? "on" : ""} type="button" onClick={() => setView("month")}>Mês</button>
                  <button className={view === "week" ? "on" : ""} type="button" onClick={() => setView("week")}>Semana</button>
                  <button className={view === "list" ? "on" : ""} type="button" onClick={() => setView("list")}>Lista</button>
                </div>
              </div>
            </div>

            {view !== "list" && (
              <div className={"rc-grid" + (view === "week" ? " is-week" : "")}>
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((w) => (
                  <div key={w} className="rc-week-head"><span>{w}</span></div>
                ))}
                {(view === "week" ? weekCells : cells).map((cell, idx) => {
                  const key = localDateKey(cell.date);
                  const events = calendarEvents[key] || [];
                  // Compare the cell date to the real "today" (not displayDate),
                  // so the highlight stays on the actual current day while the
                  // user navigates other months.
                  const isToday = localDateKey(cell.date) === todayKey;
                  const dow = idx % 7;
                  const isWeekend = dow === 0 || dow === 6;
                  const eventCap = view === "week" ? 8 : 3;
                  return (
                    <div
                      key={idx}
                      className={
                        "rc-day" +
                        (cell.other ? " other" : "") +
                        (isToday ? " today" : "") +
                        (isWeekend ? " weekend" : "")
                      }
                    >
                      <span className="rc-day-num">{cell.n}</span>
                      <div className="rc-events">
                        {events.slice(0, eventCap).map((e, i) => {
                          // Title only on `single` and on the first day of a
                          // multi-day span. Subsequent days (including any
                          // week-wrap into a new row) stay empty so the
                          // colored bar reads as one continuous strip — the
                          // title from the start day carries the meaning.
                          const showTitle = e.span === "single" || e.span === "start";
                          return (
                            <div
                              key={i}
                              className={"rc-event " + e.type + " span-" + e.span}
                              onClick={(ev) => {
                                ev.stopPropagation();
                                setSelectedEvent(e.event);
                              }}
                              role="button"
                              tabIndex={0}
                              title={e.title}
                            >
                              <span className="rc-event-title">
                                {showTitle ? e.title : " "}
                              </span>
                            </div>
                          );
                        })}
                        {events.length > eventCap && (
                          <span className="rc-event-more">+{events.length - eventCap} mais</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {view === "list" && (
              <div className="rc-list">
                {sortedMonthEvents.length === 0 && (
                  <div className="rc-list-empty">Sem eventos neste mês.</div>
                )}
                {sortedMonthEvents.map((r) => {
                  const d = eventLocalDate(r);
                  const type = recTypeToCalendarType(getEventType(r.summary));
                  const typeLabel =
                    type === "rec" ? "REC" : type === "vt" ? "VT" : type === "edit" ? "Edição" : "Pré-agenda";
                  const isToday = localDateKey(d) === localDateKey(now);
                  return (
                    <div
                      key={r.id}
                      className={"rc-list-row" + (isToday ? " today" : "")}
                      onClick={() => setSelectedEvent(r)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="rc-list-day">
                        <div className="rc-list-day-num">{String(d.getDate()).padStart(2, "0")}</div>
                        <div className="rc-list-day-meta">
                          {WEEKDAYS[d.getDay()].slice(0, 3)}
                          {isToday && <span className="rc-list-today"> · HOJE</span>}
                        </div>
                      </div>
                      <div className="rc-list-title">
                        <span className={"ev-bar " + type} />
                        <span className="rc-list-title-text">{getEventTitle(r.summary)}</span>
                      </div>
                      <span className={"rc-list-tag " + type}>{typeLabel}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="rc-foot">
              <div className="rc-legend">
                <span className="rc-legend-item"><span className="swatch" style={{ background: "var(--danger)" }} /> REC</span>
                <span className="rc-legend-item"><span className="swatch" style={{ background: "var(--warn)" }} /> VT</span>
                <span className="rc-legend-item"><span className="swatch" style={{ background: "var(--info)" }} /> Edição</span>
                <span className="rc-legend-item"><span className="swatch" style={{ background: "var(--fg-4)" }} /> Pré-agenda</span>
              </div>
              <a
                className="section-link"
                href={`https://calendar.google.com/calendar/u/0/r/${view === "week" ? "week" : "month"}/${displayDate.getFullYear()}/${displayDate.getMonth() + 1}/${displayDate.getDate()}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir no Google Calendar {I.ext}
              </a>
            </div>
          </div>
        </section>

        {/* 03 — Nossa equipe */}
        <section className="section">
          <div className="section-head">
            <div className="section-head-l">
              <span className="section-eyebrow">03</span>
              <span className="section-title">Nossa equipe</span>
            </div>
            {isAdmin && (
              <button
                type="button"
                className="section-link"
                onClick={handleAddTeam}
                style={{ background: "transparent", border: 0, cursor: "pointer" }}
              >
                {I.plus} Adicionar
              </button>
            )}
          </div>
          <div className="team-grid">
            {visibleTeam.map((m, idx) => (
              <div
                key={m.id}
                className="team-card"
                onClick={() => setProfileMember(m)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setProfileMember(m);
                  }
                }}
              >
                <div className="team-photo">
                  {m.photo_url ? (
                    <img src={m.photo_url} alt={m.name} />
                  ) : (
                    <div className="team-photo-fallback">{initialsFromName(m.name)}</div>
                  )}
                  <div className="team-photo-num">№ {String(idx + 1).padStart(2, "0")}</div>
                </div>
                <div className="team-info">
                  <div className="team-name">{m.name}</div>
                  <div className="team-position">{m.position || ""}</div>
                  {m.tags && m.tags.length > 0 && (
                    <div className="team-tags">
                      {m.tags.map((t, i) => (
                        <span key={i} className={"team-tag" + (i === 0 ? " acc" : "")}>
                          {i === 0 && <span style={{ width: 4, height: 4, background: "var(--accent)" }} />}
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {selectedEvent && (
        <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}

      {profileMember && (
        <TeamProfileModal
          member={profileMember}
          isAdmin={isAdmin}
          onClose={() => setProfileMember(null)}
          onEdit={handleEditFromProfile}
        />
      )}

      <TeamMemberDialog
        open={teamDialogOpen}
        onOpenChange={setTeamDialogOpen}
        member={editingTeamMember}
        onSave={handleSaveTeam}
        isSaving={createMember.isPending || updateMember.isPending}
      />

      <BannerCropperDialog open={showBannerCropper} onOpenChange={setShowBannerCropper} />
    </div>
  );
}

function EventDetailModal({ event, onClose }: { event: RecordingEvent; onClose: () => void }) {
  const type = recTypeToCalendarType(getEventType(event.summary));
  const typeLabel =
    type === "rec" ? "REC" : type === "vt" ? "VT" : type === "edit" ? "Edição" : "Pré-agenda";
  const title = getEventTitle(event.summary);

  const startDate = eventLocalDate(event);
  const endDate = event.end ? (event.allDay && /^\d{4}-\d{2}-\d{2}/.test(event.end)
    ? (() => {
        const [y, m, d] = event.end.slice(0, 10).split("-").map(Number);
        return new Date(y, m - 1, d - 1, 0, 0, 0, 0); // Google end-exclusive for all-day
      })()
    : new Date(event.end)) : null;

  const dayLabel = `${WEEKDAYS[startDate.getDay()]}, ${String(startDate.getDate()).padStart(2, "0")} de ${MONTHS[startDate.getMonth()]} de ${startDate.getFullYear()}`;
  const timeLabel = !event.allDay
    ? `${formatTime(event.start)}${endDate ? ` – ${formatTime(event.end)}` : ""}`
    : (endDate && localDateKey(endDate) !== localDateKey(startDate)
      ? `Dia todo · até ${String(endDate.getDate()).padStart(2, "0")} de ${MONTHS[endDate.getMonth()]}`
      : "Dia todo");

  return createPortal(
    <div className="ds-shell ev-modal-overlay" onClick={onClose}>
      <div className="ev-modal" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className={"ev-modal-bar " + type} />
        <div className="ev-modal-body">
          <div className="ev-modal-head">
            <span className={"ev-modal-tag " + type}>{typeLabel}</span>
            <button className="ev-modal-close" onClick={onClose} aria-label="Fechar" type="button">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M3 3l10 10M13 3L3 13" />
              </svg>
            </button>
          </div>
          <h3 className="ev-modal-title">{title}</h3>

          <div className="ev-modal-meta">
            <div className="ev-modal-row">
              <span className="ev-modal-label">Data</span>
              <span className="ev-modal-value">{dayLabel}</span>
            </div>
            <div className="ev-modal-row">
              <span className="ev-modal-label">Quando</span>
              <span className="ev-modal-value">{timeLabel}</span>
            </div>
            {event.location && (
              <div className="ev-modal-row">
                <span className="ev-modal-label">Local</span>
                <span className="ev-modal-value">{event.location}</span>
              </div>
            )}
            {event.description && (
              <div className="ev-modal-row">
                <span className="ev-modal-label">Descrição</span>
                <span className="ev-modal-value ev-modal-desc">{event.description}</span>
              </div>
            )}
          </div>

          <a
            className="ev-modal-link"
            href={event.htmlLink || "https://calendar.google.com"}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Abrir no Google Calendar</span>
            {I.ext}
          </a>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function TeamProfileModal({
  member,
  isAdmin,
  onClose,
  onEdit,
}: {
  member: TeamMember;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  return createPortal(
    <div className="ds-shell ev-modal-overlay" onClick={onClose}>
      <div
        className="ev-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Perfil — ${member.name}`}
        style={{ maxWidth: 420 }}
      >
        {/* Photo banner — square, fills modal width */}
        <div
          style={{
            position: "relative",
            aspectRatio: "1 / 1",
            background: "hsl(var(--ds-surface-2))",
            overflow: "hidden",
          }}
        >
          {member.photo_url ? (
            <img
              src={member.photo_url}
              alt={member.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "grayscale(0.15) contrast(1.04)",
              }}
            />
          ) : (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                fontFamily: '"HN Display", sans-serif',
                fontWeight: 500,
                fontSize: 64,
                letterSpacing: "-0.04em",
                color: "hsl(var(--ds-fg-3))",
                background:
                  "linear-gradient(135deg, hsl(var(--ds-surface-2)), hsl(var(--ds-surface-3)))",
              }}
            >
              {initialsFromName(member.name)}
            </div>
          )}
          <button
            className="ev-modal-close"
            onClick={onClose}
            aria-label="Fechar"
            type="button"
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "hsl(0 0% 0% / 0.5)",
              color: "#fff",
              border: "1px solid hsl(0 0% 100% / 0.18)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>

        <div className="ev-modal-body" style={{ paddingTop: 20 }}>
          <h3 className="ev-modal-title" style={{ marginBottom: 4 }}>
            {member.name}
          </h3>
          {member.position && (
            <div style={{ fontSize: 13, color: "hsl(var(--ds-fg-3))", marginBottom: 14 }}>
              {member.position}
            </div>
          )}

          {member.tags && member.tags.length > 0 && (
            <div className="team-tags" style={{ marginBottom: 18 }}>
              {member.tags.map((t, i) => (
                <span key={i} className={"team-tag" + (i === 0 ? " acc" : "")}>
                  {i === 0 && (
                    <span style={{ width: 4, height: 4, background: "hsl(var(--ds-accent))" }} />
                  )}
                  {t}
                </span>
              ))}
            </div>
          )}

          {isAdmin && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 14, borderTop: "1px solid hsl(var(--ds-line-1))" }}>
              <button type="button" className="btn" onClick={onClose}>
                Fechar
              </button>
              <button type="button" className="btn primary" onClick={onEdit}>
                {I.edit}
                <span>Editar</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
