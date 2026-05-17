import { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Loader2, Download, X } from 'lucide-react';
import { toast } from 'sonner';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { PageHeader } from '@/ds/components/toolbar';
import { StepStrip, WizardFooter, FooterButton, DS, TYPO } from '@/features/subtitles/components/shared';
import { LandingPage } from '@/features/subtitles/components/LandingPage';
import { Step1Upload } from '@/features/subtitles/components/Step1Upload';
import { Step2Configure, step2Estimate } from '@/features/subtitles/components/Step2Configure';
import { Step3Review } from '@/features/subtitles/components/Step3Review';
import { Step4Export, EXPORT_OPTS } from '@/features/subtitles/components/Step4Export';
import { defaultStyleForAspect } from '@/features/subtitles/hooks/useSubtitlePresets';
import { useCorrectSubtitle } from '@/features/subtitles/hooks/useCorrectSubtitle';
import { useCreateJob, useUpdateJob, type SubtitleJob } from '@/features/subtitles/hooks/useSubtitleJobs';
import { parseSrt, stringifySrt } from '@/features/subtitles/utils/parseSrt';
import { exportCues, downloadFile } from '@/features/subtitles/utils/export';
import type { SrtCue, SubtitleStyle, SupportedLanguage, ExportFormat } from '@/features/subtitles/types';

const STEPS = [
  { id: 1, num: '01', title: 'Upload do SRT' },
  { id: 2, num: '02', title: 'Configurar' },
  { id: 3, num: '03', title: 'Revisar' },
  { id: 4, num: '04', title: 'Exportar' },
];

export default function CorrecaoLegendas() {
  const [step, setStep] = useState(1);
  const [srt, setSrt] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseTimeMs, setParseTimeMs] = useState<number | null>(null);
  const [originalCues, setOriginalCues] = useState<SrtCue[]>([]);
  const [correctedCues, setCorrectedCues] = useState<SrtCue[]>([]);
  const [aiBaselineCues, setAiBaselineCues] = useState<SrtCue[]>([]);
  const [showRawSrt, setShowRawSrt] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const [sourceLanguage, setSourceLanguage] = useState<SupportedLanguage>('pt-BR');
  const [targetLanguage, setTargetLanguage] = useState<SupportedLanguage>('pt-BR');
  const [style, setStyle] = useState<SubtitleStyle>(() => defaultStyleForAspect('16:9'));
  const [glossary, setGlossary] = useState<string[]>([]);

  // Step 4 state (no parent pra footer poder disparar Download)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('srt');
  const [exportName, setExportName] = useState<string>('');

  // Inicializa o nome do arquivo de export quando o usuário entra no Step 4 sem nome ainda.
  useEffect(() => {
    if (step === 4 && !exportName && fileName) {
      const base = fileName.replace(/\.srt$/i, '');
      setExportName(`${base}_revisado_v1`);
    }
  }, [step, fileName, exportName]);

  const handleDownload = () => {
    if (!exportName) return;
    const { content, filename, mime } = exportCues(correctedCues, style, exportFormat, exportName, EXPORT_OPTS);
    downloadFile(content, filename, mime);
    toast.success(`${filename} baixado`);
  };

  const correct = useCorrectSubtitle();
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();

  // Última versão do SRT já persistida no banco — usado pelo auto-save
  // pra não disparar updates duplicados quando o estado já está sincronizado.
  const lastSavedSrtRef = useRef<string>('');

  // Auto-save: persiste edições manuais (Step 3) no banco com debounce.
  // Só dispara quando o conteúdo realmente muda em relação ao último salvo.
  useEffect(() => {
    if (!jobId || correctedCues.length === 0) return;
    const srtNow = stringifySrt(correctedCues);
    if (srtNow === lastSavedSrtRef.current) return;
    const timer = setTimeout(() => {
      updateJob.mutate({ id: jobId, patch: { corrected_srt: srtNow } });
      lastSavedSrtRef.current = srtNow;
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [correctedCues, jobId]);

  const handleUploadFresh = async (rawSrt: string, cues: SrtCue[], name: string, dt: number) => {
    setSrt(rawSrt);
    setFileName(name);
    setOriginalCues(cues);
    setCorrectedCues([]);
    setAiBaselineCues([]);
    lastSavedSrtRef.current = '';
    setParseTimeMs(dt);
    setStep(1);
    // Persist job
    try {
      const job = await createJob.mutateAsync({
        file_name: name,
        file_size_bytes: new Blob([rawSrt]).size,
        cue_count: cues.length,
        original_srt: rawSrt,
      });
      setJobId(job.id);
    } catch (e) {
      console.error('Falha ao salvar job no histórico:', e);
      // não bloqueia o fluxo
    }
  };

  const handleResumeJob = (job: SubtitleJob) => {
    setSrt(job.original_srt);
    setFileName(job.file_name);
    setOriginalCues(parseSrt(job.original_srt));
    const parsedCorrected = job.corrected_srt ? parseSrt(job.corrected_srt) : [];
    setCorrectedCues(parsedCorrected);
    setAiBaselineCues(parsedCorrected);
    // já está sincronizado com o banco — evita re-save no useEffect
    lastSavedSrtRef.current = job.corrected_srt ?? '';
    setParseTimeMs(null);
    setJobId(job.id);
    setSourceLanguage(job.source_language);
    setTargetLanguage(job.target_language);
    setGlossary(job.glossary ?? []);
    if (job.aspect_ratio) setStyle(defaultStyleForAspect(job.aspect_ratio));
    if (job.corrected_srt) {
      setStep(job.status === 'exported' ? 4 : 3);
    } else {
      setStep(1);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSrt(null);
    setFileName(null);
    setOriginalCues([]);
    setCorrectedCues([]);
    setAiBaselineCues([]);
    lastSavedSrtRef.current = '';
    setParseTimeMs(null);
    setGlossary([]);
    setStyle(defaultStyleForAspect('16:9'));
    setSourceLanguage('pt-BR');
    setTargetLanguage('pt-BR');
    setJobId(null);
  };

  const handleProcess = async () => {
    if (!srt) return;
    try {
      const correctedSrt = await correct.mutateAsync({
        srt,
        sourceLanguage,
        targetLanguage,
        style,
        glossary,
      });
      const parsed = parseSrt(correctedSrt);
      if (parsed.length === 0) {
        toast.error('Resposta inválida da Claude');
        return;
      }
      setCorrectedCues(parsed);
      setAiBaselineCues(parsed);
      // o banco vai receber esse mesmo SRT no updateJob abaixo — evita re-save pelo auto-save
      lastSavedSrtRef.current = correctedSrt;
      setStep(3);
      toast.success(`${parsed.length} legendas processadas`);
      if (jobId) {
        updateJob.mutate({
          id: jobId,
          patch: {
            status: 'processed',
            corrected_srt: correctedSrt,
            source_language: sourceLanguage,
            target_language: targetLanguage,
            aspect_ratio: style.aspect_ratio,
            glossary,
          },
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido';
      toast.error(`Erro processando: ${msg}`);
    }
  };

  const handleAdvanceToExport = () => {
    setStep(4);
    if (jobId) {
      updateJob.mutate({ id: jobId, patch: { status: 'exported' } });
    }
  };

  const estimate = useMemo(() => (originalCues.length > 0 ? step2Estimate(originalCues) : null), [originalCues]);
  const canVisit = (s: number): boolean => {
    if (s === 1) return true;
    if (s === 2) return !!srt;
    if (s >= 3) return correctedCues.length > 0;
    return false;
  };

  // ============ LANDING ============
  if (!srt) {
    return (
      <div className="ds-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: DS.bg }}>
        <BreadcrumbNav items={[{ label: 'Correção de Legendas' }]} />
        <LandingPage onUploadFresh={handleUploadFresh} onResumeJob={handleResumeJob} />
      </div>
    );
  }

  // ============ WIZARD ============
  return (
    <div className="ds-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: DS.bg }}>
      <BreadcrumbNav
        items={[
          { label: 'Correção de Legendas', onClick: handleReset },
          { label: fileName ?? 'Sem nome' },
        ]}
      />
      <div className="ds-page-inner" style={{ paddingTop: 32 }}>
        <PageHeader
          title="Correção de Legendas."
          subtitle="Carregue um .srt e a engine de revisão limpa pontuação, normaliza casing, respeita o CPS e quebra as linhas conforme o formato final."
        />
      </div>

      <StepStrip
        steps={STEPS}
        current={step}
        canVisit={canVisit}
        onJump={(s) => {
          if (canVisit(s)) setStep(s);
        }}
      />

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {step === 1 && (
          <Step1Upload
            srt={srt}
            cues={originalCues}
            fileName={fileName}
            parseTimeMs={parseTimeMs}
            cpsMax={style.cps_max}
            maxCharsPerLine={style.chars_per_line}
            onUpload={handleUploadFresh}
            onRename={(next) => setFileName(next)}
            onRemove={handleReset}
            onShowRaw={() => setShowRawSrt(true)}
          />
        )}

        {step === 2 && (
          <Step2Configure
            cues={originalCues}
            sourceLanguage={sourceLanguage}
            targetLanguage={targetLanguage}
            style={style}
            glossary={glossary}
            onChange={(next) => {
              setSourceLanguage(next.sourceLanguage);
              setTargetLanguage(next.targetLanguage);
              setStyle(next.style);
              setGlossary(next.glossary);
            }}
          />
        )}

        {step === 3 && correctedCues.length > 0 && (
          <Step3Review beforeCues={originalCues} afterCues={correctedCues} aiBaselineCues={aiBaselineCues} onUpdate={setCorrectedCues} />
        )}

        {step === 4 && correctedCues.length > 0 && (
          <Step4Export
            beforeCues={originalCues}
            afterCues={correctedCues}
            style={style}
            format={exportFormat}
            fileName={exportName}
            onFormatChange={setExportFormat}
            onFileNameChange={setExportName}
          />
        )}
      </div>

      {/* FOOTER */}
      {step === 1 && (
        <WizardFooter
          hint={
            <>
              Tudo pronto. <strong style={{ fontFamily: TYPO.display, fontWeight: 500, color: DS.fg1 }}>{originalCues.length} cues</strong> serão enviadas para a engine de revisão na próxima etapa.
            </>
          }
        >
          <FooterButton icon={<ChevronLeft size={12} strokeWidth={1.5} />} onClick={handleReset}>
            Voltar ao início
          </FooterButton>
          <FooterButton primary iconRight={<ChevronRight size={12} strokeWidth={1.5} />} onClick={() => setStep(2)}>
            Avançar para Configurar
          </FooterButton>
        </WizardFooter>
      )}

      {step === 2 && (
        <WizardFooter
          hint={
            estimate ? (
              <>
                <strong style={{ fontFamily: TYPO.display, fontWeight: 500, color: DS.fg1 }}>{originalCues.length} cues</strong>
                {' '}· estimativa <strong style={{ fontFamily: TYPO.display, fontWeight: 500, color: DS.fg1 }}>~{estimate.time}s</strong>
                {' '}· custo <strong style={{ fontFamily: TYPO.display, fontWeight: 500, color: DS.fg1 }}>~US$ {estimate.cost.toFixed(3)}</strong>
              </>
            ) : null
          }
        >
          <FooterButton icon={<ChevronLeft size={12} strokeWidth={1.5} />} onClick={() => setStep(1)} disabled={correct.isPending}>
            Voltar
          </FooterButton>
          <FooterButton
            primary
            icon={correct.isPending ? <Loader2 size={12} strokeWidth={1.5} className="animate-spin" /> : <Sparkles size={12} strokeWidth={1.5} />}
            onClick={handleProcess}
            disabled={correct.isPending}
          >
            {correct.isPending ? 'Processando…' : 'Processar com Claude'}
          </FooterButton>
        </WizardFooter>
      )}

      {step === 3 && (
        <WizardFooter>
          <FooterButton icon={<ChevronLeft size={12} strokeWidth={1.5} />} onClick={() => setStep(2)}>
            Voltar
          </FooterButton>
          <FooterButton primary iconRight={<ChevronRight size={12} strokeWidth={1.5} />} onClick={handleAdvanceToExport}>
            Aprovar e exportar
          </FooterButton>
        </WizardFooter>
      )}

      {step === 4 && (
        <WizardFooter
          hint={
            exportName ? (
              <>
                <strong style={{ fontFamily: TYPO.display, fontWeight: 500, color: DS.fg1 }}>
                  {exportName}.{exportFormat === 'srt' ? 'srt' : 'txt'}
                </strong>
                {' '}· {correctedCues.length} cues
              </>
            ) : null
          }
        >
          <FooterButton icon={<ChevronLeft size={12} strokeWidth={1.5} />} onClick={() => setStep(3)}>
            Voltar
          </FooterButton>
          <FooterButton primary icon={<Download size={12} strokeWidth={1.5} />} onClick={handleDownload} disabled={!exportName}>
            Baixar arquivo
          </FooterButton>
        </WizardFooter>
      )}

      {/* RAW SRT MODAL */}
      {showRawSrt && srt && (
        <div
          onClick={() => setShowRawSrt(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: DS.bg,
              border: `1px solid ${DS.line2}`,
              maxWidth: 800,
              width: '100%',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ padding: '16px 22px', borderBottom: `1px solid ${DS.line1}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontFamily: TYPO.display, fontWeight: 500, fontSize: 15, color: DS.fg1 }}>
                SRT bruto · {fileName}
              </h3>
              <button
                type="button"
                onClick={() => setShowRawSrt(false)}
                style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', color: DS.fg3, background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
            <pre
              style={{
                margin: 0,
                padding: 22,
                overflow: 'auto',
                fontSize: 12,
                fontFamily: DS.mono,
                color: DS.fg2,
                background: DS.surface,
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap',
                flex: 1,
              }}
            >
              {srt}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
