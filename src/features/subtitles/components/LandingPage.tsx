import { useRef, useState } from 'react';
import { Upload, FileText, Trash2, ArrowRight, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { DS, TYPO, PageHeader, EyebrowDot } from './shared';
import { parseSrt } from '../utils/parseSrt';
import { useSubtitleJobs, useDeleteJob, type SubtitleJob } from '../hooks/useSubtitleJobs';
import type { SrtCue } from '../types';

interface Props {
  onUploadFresh: (rawSrt: string, cues: SrtCue[], fileName: string, parseTimeMs: number) => void;
  onResumeJob: (job: SubtitleJob) => void;
}

export function LandingPage({ onUploadFresh, onResumeJob }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const { data: jobs, isLoading } = useSubtitleJobs(12);
  const deleteJob = useDeleteJob();

  const handleFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.srt')) {
      toast.error('Apenas arquivos .srt são aceitos');
      return;
    }
    if (file.size > 1_000_000) {
      toast.error('Arquivo muito grande (máx 1MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? '');
      const t0 = performance.now();
      const parsed = parseSrt(content);
      const dt = Math.round(performance.now() - t0);
      if (parsed.length === 0) {
        toast.error('Não consegui parsear o SRT. Verifique o formato.');
        return;
      }
      onUploadFresh(content, parsed, file.name, dt);
    };
    reader.onerror = () => toast.error('Erro lendo arquivo');
    reader.readAsText(file, 'utf-8');
  };

  const handleDeleteJob = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Apagar "${name}" do histórico? O arquivo original não pode ser recuperado depois.`)) return;
    try {
      await deleteJob.mutateAsync(id);
      toast.success('Removido do histórico');
    } catch (err) {
      toast.error(`Erro: ${err instanceof Error ? err.message : 'desconhecido'}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <PageHeader
        eyebrow={
          <>
            <EyebrowDot>Ferramenta · AI</EyebrowDot>
            <span style={{ color: DS.line2 }}>·</span>
            <span>Pós-Produção</span>
          </>
        }
        title="Correção de legendas"
        description={
          <>
            Carregue um <strong style={{ fontFamily: TYPO.display, fontWeight: 500, color: DS.fg1 }}>.srt</strong> pra começar uma nova revisão, ou continue uma das suas legendas recentes abaixo.
          </>
        }
      />

      <div style={{ padding: '32px 40px 32px', display: 'flex', flexDirection: 'column', gap: 32, flex: 1, minHeight: 0 }}>
        {/* DROPZONE */}
        <section>
          <p
            style={{
              fontFamily: TYPO.display,
              fontWeight: 500,
              fontSize: 18,
              letterSpacing: '-0.015em',
              color: DS.fg1,
              margin: '0 0 14px',
            }}
          >
            <span style={{ color: DS.fg4, fontVariantNumeric: 'tabular-nums', marginRight: 10 }}>0.1</span>
            Novo upload
          </p>

          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              padding: '20px 22px',
              border: `1.5px dashed ${dragging ? DS.fg1 : DS.line2}`,
              background: dragging ? DS.surface2 : DS.surface,
              cursor: 'pointer',
              transition: 'border-color 120ms, background 120ms',
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".srt"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = '';
              }}
            />
            <div
              style={{
                width: 44,
                height: 44,
                display: 'grid',
                placeItems: 'center',
                background: DS.bg,
                border: `1px solid ${DS.line2}`,
                color: DS.fg2,
                flexShrink: 0,
              }}
            >
              <Upload size={18} strokeWidth={1.5} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontFamily: TYPO.display,
                  fontWeight: 500,
                  fontSize: 14,
                  letterSpacing: '-0.005em',
                  color: DS.fg1,
                  margin: 0,
                }}
              >
                Arraste um .srt aqui ou clique pra escolher
              </p>
              <p
                style={{
                  fontSize: 11.5,
                  color: DS.fg4,
                  margin: '3px 0 0',
                  fontFamily: TYPO.text,
                  lineHeight: 1.5,
                }}
              >
                UTF-8 · até 1 MB · Whisper, manual, exportação do Premiere/Resolve
              </p>
            </div>
          </label>
        </section>

        {/* HISTÓRICO */}
        <section style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <p
              style={{
                fontFamily: TYPO.display,
                fontWeight: 500,
                fontSize: 18,
                letterSpacing: '-0.015em',
                color: DS.fg1,
                margin: 0,
              }}
            >
              <span style={{ color: DS.fg4, fontVariantNumeric: 'tabular-nums', marginRight: 10 }}>0.2</span>
              Histórico
            </p>
            {jobs && jobs.length > 0 && (
              <span style={{ fontFamily: TYPO.display, fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: DS.fg4 }}>
                últimos {jobs.length}
              </span>
            )}
          </div>

          {isLoading ? (
            <EmptyState>Carregando histórico…</EmptyState>
          ) : !jobs || jobs.length === 0 ? (
            <EmptyState>
              Nenhuma legenda processada ainda.
              <br />
              <span style={{ color: DS.fg4 }}>Faça seu primeiro upload acima.</span>
            </EmptyState>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: DS.line1, border: `1px solid ${DS.line1}`, overflowY: 'auto', maxHeight: 520 }}>
              {jobs.map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  onResume={() => onResumeJob(job)}
                  onDelete={(e) => handleDeleteJob(job.id, job.file_name, e)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 32,
        textAlign: 'center',
        border: `1px solid ${DS.line1}`,
        background: DS.surface,
        fontSize: 13,
        color: DS.fg3,
        fontFamily: TYPO.text,
        lineHeight: 1.6,
      }}
    >
      {children}
    </div>
  );
}

const STATUS_LABELS: Record<SubtitleJob['status'], { label: string; color: string; bg: string }> = {
  uploaded: { label: 'Upload', color: DS.fg3, bg: DS.surface2 },
  configured: { label: 'Configurado', color: DS.fg2, bg: DS.surface2 },
  processed: { label: 'Revisado', color: DS.info, bg: 'hsl(209 71% 95%)' },
  exported: { label: 'Exportado', color: DS.accentDeep, bg: DS.accentSoft },
};

function JobRow({ job, onResume, onDelete }: { job: SubtitleJob; onResume: () => void; onDelete: (e: React.MouseEvent) => void }) {
  const status = STATUS_LABELS[job.status];
  const date = formatJobDate(job.updated_at);
  return (
    <button
      type="button"
      onClick={onResume}
      style={{
        display: 'grid',
        gridTemplateColumns: '36px 1fr auto',
        gap: 12,
        padding: '12px 14px',
        background: DS.bg,
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 120ms',
        width: '100%',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = DS.surface)}
      onMouseLeave={(e) => (e.currentTarget.style.background = DS.bg)}
    >
      <span
        style={{
          width: 36,
          height: 36,
          display: 'grid',
          placeItems: 'center',
          background: DS.fg1,
          color: DS.accentBright,
          fontFamily: TYPO.display,
          fontWeight: 500,
          fontSize: 9,
          letterSpacing: '0.08em',
        }}
      >
        SRT
      </span>
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span
          style={{
            fontFamily: TYPO.display,
            fontWeight: 500,
            fontSize: 13,
            color: DS.fg1,
            letterSpacing: '-0.005em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {job.file_name}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: DS.fg3, fontFamily: TYPO.text, fontVariantNumeric: 'tabular-nums', flexWrap: 'wrap' }}>
          <Clock size={10} strokeWidth={1.5} />
          {date}
          <span style={{ color: DS.line2 }}>·</span>
          <span>{job.cue_count} cues</span>
          <span style={{ color: DS.line2 }}>·</span>
          <span
            style={{
              padding: '1px 6px',
              fontSize: 9,
              fontFamily: TYPO.display,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: status.color,
              background: status.bg,
            }}
          >
            {status.label}
          </span>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span
          onClick={onDelete}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              onDelete(e as never);
            }
          }}
          title="Apagar do histórico"
          style={{
            width: 28,
            height: 28,
            display: 'grid',
            placeItems: 'center',
            color: DS.fg4,
            cursor: 'pointer',
            transition: 'color 120ms, background 120ms',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLSpanElement).style.color = DS.danger;
            (e.currentTarget as HTMLSpanElement).style.background = DS.surface;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLSpanElement).style.color = DS.fg4;
            (e.currentTarget as HTMLSpanElement).style.background = 'transparent';
          }}
        >
          <Trash2 size={12} strokeWidth={1.5} />
        </span>
        <ArrowRight size={14} strokeWidth={1.5} style={{ color: DS.fg3 }} />
      </div>
    </button>
  );
}

function formatJobDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin} min atrás`;
  if (diffH < 24) return `${diffH}h atrás`;
  if (diffD === 1) return 'ontem';
  if (diffD < 7) return `${diffD} dias atrás`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}
