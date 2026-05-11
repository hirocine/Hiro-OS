import { useState } from 'react';
import { Plus, List, Columns3, CalendarDays, Table, Grid3x3, LayoutGrid, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  PageHeader,
  PageToolbar,
  SearchField,
  FilterDropdown,
  ViewToggle,
  PeriodPicker,
  FilterChip,
  FilterChipRow,
  FilterIndicator,
  type ViewToggleItem,
} from '@/ds/components/toolbar';

type PresetKey = 'tasks-list' | 'tasks-calendar' | 'pp' | 'platforms';

const PRESETS: { value: PresetKey; label: string; description: string }[] = [
  { value: 'tasks-list', label: 'Tarefas · Lista', description: 'Caso 1 — view padrão da Tarefas com tabs primárias.' },
  { value: 'tasks-calendar', label: 'Tarefas · Calendário', description: 'Caso 2 — Tarefas com view = calendário (period picker aparece).' },
  { value: 'pp', label: 'Esteira de Pós', description: 'Caso 3 — toolbar com chips de prioridade (com tone) e responsáveis.' },
  { value: 'platforms', label: 'Plataformas', description: 'Caso 4 — sem view toggle / sem dropdowns; só search + chips de categoria.' },
];

const TASKS_VIEWS: ViewToggleItem<string>[] = [
  { value: 'lista', label: 'Lista', icon: List },
  { value: 'kanban', label: 'Kanban', icon: Columns3 },
  { value: 'calendario', label: 'Calendário', icon: CalendarDays },
];

const PP_VIEWS: ViewToggleItem<string>[] = [
  { value: 'tabela', label: 'Tabela', icon: Table },
  { value: 'kanban', label: 'Kanban', icon: Columns3 },
  { value: 'calendario', label: 'Calendário', icon: CalendarDays },
];

const INV_VIEWS: ViewToggleItem<string>[] = [
  { value: 'tabela', label: 'Tabela', icon: Table },
  { value: 'grade', label: 'Grade', icon: Grid3x3 },
  { value: 'cards', label: 'Cards', icon: LayoutGrid },
];

export default function PlaygroundToolbar() {
  const [preset, setPreset] = useState<PresetKey>('tasks-list');

  // Shared mutable state for the demo
  const [tasksView, setTasksView] = useState('lista');
  const [ppView, setPpView] = useState('tabela');
  const [completedOpen, setCompletedOpen] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('all');
  const [dept, setDept] = useState('all');
  const [assignee, setAssignee] = useState('all');
  const [periodMonth, setPeriodMonth] = useState(new Date(2026, 4, 1));
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [platformCategory, setPlatformCategory] = useState('all');

  const togglePriority = (p: string) => {
    setSelectedPriorities((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  };
  const toggleAssignee = (a: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    );
  };

  const hasTasksFilters =
    search !== '' ||
    priority !== 'all' ||
    dept !== 'all' ||
    assignee !== 'all' ||
    selectedPriorities.length > 0 ||
    selectedAssignees.length > 0;

  const clearTasksFilters = () => {
    setSearch('');
    setPriority('all');
    setDept('all');
    setAssignee('all');
    setSelectedPriorities([]);
    setSelectedAssignees([]);
  };

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        {/* Playground switcher */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
            padding: 14,
            border: '1px dashed hsl(var(--ds-line-2))',
            background: 'hsl(var(--ds-line-2) / 0.2)',
            marginBottom: 24,
          }}
        >
          <span
            style={{
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 500,
              color: 'hsl(var(--ds-fg-3))',
            }}
          >
            Playground
          </span>
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPreset(p.value)}
              className={'pill' + (preset === p.value ? ' acc' : '')}
              style={{ cursor: 'pointer' }}
            >
              {p.label}
            </button>
          ))}
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>
            {PRESETS.find((p) => p.value === preset)?.description}
          </span>
        </div>

        {/* ─────────────── CASE 1: Tarefas · Lista ─────────────── */}
        {preset === 'tasks-list' && (
          <>
            <PageHeader
              title="Tarefas."
              subtitle="Gerencie suas tarefas e acompanhe o progresso."
              action={
                <button type="button" className="btn primary">
                  <Plus size={14} strokeWidth={1.5} />
                  <span>Nova Tarefa</span>
                </button>
              }
            />

            {/* Stats */}
            <div className="summary" style={{ marginTop: 24 }}>
              <div className="stat">
                <span className="stat-lbl">Ativas</span>
                <span className="stat-num">1</span>
              </div>
              <div className="stat danger">
                <span className="stat-lbl">Atrasadas</span>
                <span className="stat-num">1</span>
              </div>
              <div className="stat warn">
                <span className="stat-lbl">Urgentes</span>
                <span className="stat-num">1</span>
              </div>
              <div className="stat success">
                <span className="stat-lbl">Concluídas</span>
                <span className="stat-num">3</span>
              </div>
            </div>

            <PageToolbar
              search={
                <SearchField
                  value={search}
                  onChange={setSearch}
                  placeholder="Buscar tarefas…"
                />
              }
              filters={[
                <FilterDropdown
                  key="priority"
                  label="Prioridade"
                  value={priority}
                  onChange={setPriority}
                  options={[
                    { value: 'urgente', label: 'Urgente' },
                    { value: 'alta', label: 'Alta' },
                    { value: 'media', label: 'Média' },
                    { value: 'baixa', label: 'Baixa' },
                  ]}
                  allOptionLabel="Todas"
                  width="md"
                />,
                <FilterDropdown
                  key="dept"
                  label="Departamento"
                  value={dept}
                  onChange={setDept}
                  options={[
                    { value: 'producao', label: 'Produção' },
                    { value: 'marketing', label: 'Marketing' },
                    { value: 'admin', label: 'Admin' },
                  ]}
                  width="md"
                />,
                <FilterDropdown
                  key="assignee"
                  label="Responsável"
                  value={assignee}
                  onChange={setAssignee}
                  options={[
                    { value: 'yuji', label: 'Yuji' },
                    { value: 'diego', label: 'Diego' },
                    { value: 'paulo', label: 'Paulo' },
                  ]}
                  width="md"
                />,
              ]}
              viewToggle={<ViewToggle items={TASKS_VIEWS} value={tasksView} onChange={setTasksView} />}
            />

            <FilterIndicator
              active={hasTasksFilters}
              count={5}
              total={87}
              noun="tarefas"
              onClear={clearTasksFilters}
            />

            {tasksView === 'lista' ? (
              <>
                {/* Section 01 — Ativas (sempre aberta) */}
                <section className="section" style={{ marginTop: 24 }}>
                  <div className="section-head">
                    <div className="section-head-l">
                      <span className="section-eyebrow">01</span>
                      <span className="section-title">Ativas</span>
                    </div>
                    <span className="section-eyebrow" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      1 ITEM
                    </span>
                  </div>
                  <DemoContent label="Tabela de tarefas ativas (1)" />
                </section>

                {/* Section 02 — Concluídas (colapsável) */}
                <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
                  <section className="section" style={{ marginTop: 24 }}>
                    <CollapsibleTrigger asChild>
                      <div style={{ cursor: 'pointer' }} className="section-head">
                        <div className="section-head-l">
                          <span className="section-eyebrow">02</span>
                          <span className="section-title">Concluídas</span>
                        </div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                          <span className="section-eyebrow" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            3 ITENS
                          </span>
                          <ChevronDown
                            size={14}
                            strokeWidth={1.5}
                            style={{
                              color: 'hsl(var(--ds-fg-3))',
                              transition: 'transform 0.2s',
                              transform: completedOpen ? 'rotate(180deg)' : 'none',
                            }}
                          />
                        </span>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <DemoContent label="Tabela de tarefas concluídas (3)" />
                    </CollapsibleContent>
                  </section>
                </Collapsible>

                {/* Section 03 — Arquivadas (colapsável) */}
                <Collapsible open={archivedOpen} onOpenChange={setArchivedOpen}>
                  <section className="section" style={{ marginTop: 24 }}>
                    <CollapsibleTrigger asChild>
                      <div style={{ cursor: 'pointer' }} className="section-head">
                        <div className="section-head-l">
                          <span className="section-eyebrow">03</span>
                          <span className="section-title">Arquivadas</span>
                        </div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                          <span className="section-eyebrow" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            1 ITEM
                          </span>
                          <ChevronDown
                            size={14}
                            strokeWidth={1.5}
                            style={{
                              color: 'hsl(var(--ds-fg-3))',
                              transition: 'transform 0.2s',
                              transform: archivedOpen ? 'rotate(180deg)' : 'none',
                            }}
                          />
                        </span>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <DemoContent label="Tabela de tarefas arquivadas (1)" />
                    </CollapsibleContent>
                  </section>
                </Collapsible>
              </>
            ) : (
              /* View != lista: kanban / calendário sem divisão por seção */
              <div style={{ marginTop: 24 }}>
                <DemoContent
                  label={
                    tasksView === 'kanban'
                      ? 'Kanban (colunas por status — Ativas/Concluídas/Arquivadas viram colunas)'
                      : 'Calendário (todas as tarefas no calendário, independente de status)'
                  }
                />
              </div>
            )}
          </>
        )}

        {/* ─────────────── CASE 2: Tarefas · Calendário ─────────────── */}
        {preset === 'tasks-calendar' && (
          <>
            <PageHeader
              title="Tarefas."
              subtitle="Gerencie suas tarefas e acompanhe o progresso."
              action={
                <button type="button" className="btn primary">
                  <Plus size={14} strokeWidth={1.5} />
                  <span>Nova Tarefa</span>
                </button>
              }
            />

            <div className="summary" style={{ marginTop: 24 }}>
              <div className="stat">
                <span className="stat-lbl">Ativas</span>
                <span className="stat-num">1</span>
              </div>
              <div className="stat danger">
                <span className="stat-lbl">Atrasadas</span>
                <span className="stat-num">1</span>
              </div>
              <div className="stat warn">
                <span className="stat-lbl">Urgentes</span>
                <span className="stat-num">1</span>
              </div>
              <div className="stat success">
                <span className="stat-lbl">Concluídas</span>
                <span className="stat-num">3</span>
              </div>
            </div>

            <PageToolbar
              search={
                <SearchField
                  value={search}
                  onChange={setSearch}
                  placeholder="Buscar tarefas…"
                />
              }
              filters={[
                <FilterDropdown
                  key="priority"
                  label="Prioridade"
                  value={priority}
                  onChange={setPriority}
                  options={[
                    { value: 'urgente', label: 'Urgente' },
                    { value: 'alta', label: 'Alta' },
                  ]}
                  allOptionLabel="Todas"
                  width="md"
                />,
              ]}
              viewToggle={
                <ViewToggle
                  items={TASKS_VIEWS}
                  value="calendario"
                  onChange={() => setTasksView('calendario')}
                />
              }
              periodPicker={<PeriodPicker mode="month" value={periodMonth} onChange={setPeriodMonth} />}
            />

            <DemoContent label="Calendário (period picker visível à direita do view toggle)" />
          </>
        )}

        {/* ─────────────── CASE 3: Esteira de Pós ─────────────── */}
        {preset === 'pp' && (
          <>
            <PageHeader
              title="Esteira de Pós."
              subtitle="Controle da fila de pós-produção."
              action={
                <button type="button" className="btn primary">
                  <Plus size={14} strokeWidth={1.5} />
                  <span>Novo Vídeo</span>
                </button>
              }
            />

            <div className="summary" style={{ marginTop: 24 }}>
              <div className="stat">
                <span className="stat-lbl">Total na esteira</span>
                <span className="stat-num">54</span>
              </div>
              <div className="stat">
                <span className="stat-lbl">Em produção</span>
                <span className="stat-num">5</span>
              </div>
              <div className="stat danger">
                <span className="stat-lbl">Atrasados</span>
                <span className="stat-num">32</span>
              </div>
              <div className="stat success">
                <span className="stat-lbl">Entregues (mês)</span>
                <span className="stat-num">1</span>
              </div>
            </div>

            <PageToolbar
              search={
                <SearchField
                  value={search}
                  onChange={setSearch}
                  placeholder="Buscar vídeo, projeto, editor…"
                />
              }
              filters={[
                <FilterDropdown
                  key="assignee"
                  label="Responsável"
                  value={selectedAssignees[0] ?? 'all'}
                  onChange={(v) => setSelectedAssignees(v === 'all' ? [] : [v])}
                  options={[
                    { value: 'Yuji', label: 'Yuji' },
                    { value: 'Diego', label: 'Diego' },
                    { value: 'Paulo', label: 'Paulo' },
                    { value: 'Keel', label: 'Keel' },
                    { value: 'Giovanna', label: 'Giovanna' },
                  ]}
                  width="md"
                />,
              ]}
              viewToggle={<ViewToggle items={PP_VIEWS} value={ppView} onChange={setPpView} />}
              periodPicker={
                ppView === 'calendario' ? (
                  <PeriodPicker mode="month" value={periodMonth} onChange={setPeriodMonth} />
                ) : undefined
              }
            />

            <div style={{ marginTop: 12 }}>
              <FilterChipRow>
                <FilterChip
                  label="Urgente"
                  dot="danger"
                  active={selectedPriorities.includes('urgente')}
                  onClick={() => togglePriority('urgente')}
                />
                <FilterChip
                  label="Alta"
                  dot="warning"
                  active={selectedPriorities.includes('alta')}
                  onClick={() => togglePriority('alta')}
                />
                <FilterChip
                  label="Média"
                  dot="info"
                  active={selectedPriorities.includes('media')}
                  onClick={() => togglePriority('media')}
                />
                <FilterChip
                  label="Baixa"
                  dot="muted"
                  active={selectedPriorities.includes('baixa')}
                  onClick={() => togglePriority('baixa')}
                />
              </FilterChipRow>
            </div>

            <FilterIndicator
              active={selectedPriorities.length > 0 || selectedAssignees.length > 0 || search !== ''}
              count={12}
              total={54}
              noun="vídeos"
              onClear={() => {
                setSelectedPriorities([]);
                setSelectedAssignees([]);
                setSearch('');
              }}
            />

            <DemoContent label={`Esteira de Pós — view = ${ppView}`} />
          </>
        )}

        {/* ─────────────── CASE 4: Plataformas ─────────────── */}
        {preset === 'platforms' && (
          <>
            <PageHeader
              title="Plataformas."
              subtitle="Gerencie senhas e credenciais de forma segura com criptografia."
              action={
                <button type="button" className="btn primary">
                  <Plus size={14} strokeWidth={1.5} />
                  <span>Novo Acesso</span>
                </button>
              }
            />

            <PageToolbar
              search={
                <SearchField
                  value={search}
                  onChange={setSearch}
                  placeholder="Buscar plataformas, usuários ou categorias…"
                />
              }
            />

            <div style={{ marginTop: 12 }}>
              <FilterChipRow>
                {[
                  { value: 'favoritas', label: 'Favoritas', count: 4 },
                  { value: 'all', label: 'Todas', count: 34 },
                  { value: 'cloud', label: 'Cloud', count: 4 },
                  { value: 'ia', label: 'IA', count: 7 },
                  { value: 'references', label: 'References', count: 1 },
                  { value: 'social', label: 'Social Media', count: 5 },
                  { value: 'site', label: 'Site', count: 1 },
                  { value: 'software', label: 'Software', count: 8 },
                  { value: 'music', label: 'Music', count: 1 },
                  { value: 'stock', label: 'Stock', count: 4 },
                  { value: 'outras', label: 'Outras', count: 3 },
                ].map((c) => (
                  <FilterChip
                    key={c.value}
                    label={c.label}
                    count={c.count}
                    active={platformCategory === c.value}
                    onClick={() => setPlatformCategory(c.value)}
                  />
                ))}
              </FilterChipRow>
            </div>

            <FilterIndicator
              active={platformCategory !== 'all' || search !== ''}
              count={4}
              total={34}
              noun="plataformas"
              onClear={() => {
                setPlatformCategory('all');
                setSearch('');
              }}
            />

            <DemoContent label="Grade de cards de plataformas" />
          </>
        )}
      </div>
    </div>
  );
}

function DemoContent({ label }: { label: string }) {
  return (
    <div
      style={{
        marginTop: 16,
        border: '1px dashed hsl(var(--ds-line-2))',
        background: 'hsl(var(--ds-line-2) / 0.2)',
        padding: '64px 0',
        textAlign: 'center',
        color: 'hsl(var(--ds-fg-3))',
        fontSize: 13,
      }}
    >
      ⟨ {label} ⟩
    </div>
  );
}
