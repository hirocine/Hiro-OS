import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Loader2, Clock, Bookmark, MoreHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';
import { StepStrip, PageHeader, PageAction, EyebrowDot, WizardFooter, FooterButton, DS, TYPO } from '@/features/subtitles/components/shared';
import { Step1Upload } from '@/features/subtitles/components/Step1Upload';
import { Step2Configure, step2Estimate } from '@/features/subtitles/components/Step2Configure';
import { Step3Review } from '@/features/subtitles/components/Step3Review';
import { Step4Export } from '@/features/subtitles/components/Step4Export';
import { defaultStyleForAspect } from '@/features/subtitles/hooks/useSubtitlePresets';
import { useCorrectSubtitle } from '@/features/subtitles/hooks/useCorrectSubtitle';
import { parseSrt } from '@/features/subtitles/utils/parseSrt';
import type { SrtCue, SubtitleStyle, SupportedLanguage } from '@/features/subtitles/types';

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
  const [showRawSrt, setShowRawSrt] = useState(false);

  const [sourceLanguage, setSourceLanguage] = useState<SupportedLanguage>('pt-BR');
  const [targetLanguage, setTargetLanguage] = useState<SupportedLanguage>('pt-BR');
  const [style, setStyle] = useState<SubtitleStyle>(() => defaultStyleForAspect('16:9'));
  const [glossary, setGlossary] = useState<string[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [baselineStyle, setBaselineStyle] = useState<SubtitleStyle | null>(null);

  const correct = useCorrectSubtitle();

  const handleUpload = (rawSrt: string, cues: SrtCue[], name: string, dt: number) => {
    setSrt(rawSrt);
    setFileName(name);
    setOriginalCues(cues);
    setCorrectedCues([]);
    setParseTimeMs(dt);
  };

  const handleReset = () => {
    setStep(1);
    setSrt(null);
    setFileName(null);
    setOriginalCues([]);
    setCorrectedCues([]);
    setParseTimeMs(null);
    setGlossary([]);
    setSelectedPresetId(null);
    setBaselineStyle(null);
    setStyle(defaultStyleForAspect('16:9'));
    setSourceLanguage('pt-BR');
    setTargetLanguage('pt-BR');
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
      setStep(3);
      toast.success(`${parsed.length} legendas processadas`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido';
      toast.error(`Erro processando: ${msg}`);
    }
  };

  const estimate = useMemo(() => (originalCues.length > 0 ? step2Estimate(originalCues) : null), [originalCues]);
  const canVisit = (s: number): boolean => {
    if (s === 1) return true;
    if (s === 2) return !!srt;
    if (s >= 3) return correctedCues.length > 0;
    return false;
  };

  return (
    <div className="ds-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: DS.bg }}>
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
            Carregue um <strong style={{ fontFamily: TYPO.display, fontWeight: 500, color: DS.fg1 }}>.srt</strong> e a engine de revisão limpa pontuação, normaliza casing, respeita o{' '}
            <strong style={{ fontFamily: TYPO.display, fontWeight: 500, color: DS.fg1 }}>CPS</strong> e quebra as linhas conforme o formato final. Saída pronta pro DaVinci Resolve, Premiere ou pra queimar direto no vídeo.
          </>
        }
        actions={
          <>
            <PageAction icon={<Clock size={12} strokeWidth={1.5} />}>Histórico</PageAction>
            <PageAction icon={<Bookmark size={12} strokeWidth={1.5} />}>Presets</PageAction>
            <PageAction icon={<MoreHorizontal size={12} strokeWidth={1.5} />} iconOnly />
          </>
        }
      />

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
            onUpload={handleUpload}
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
            selectedPresetId={selectedPresetId}
            baselineStyle={baselineStyle}
            onChange={(next) => {
              setSourceLanguage(next.sourceLanguage);
              setTargetLanguage(next.targetLanguage);
              setStyle(next.style);
              setGlossary(next.glossary);
              setSelectedPresetId(next.selectedPresetId);
              setBaselineStyle(next.baselineStyle);
            }}
          />
        )}

        {step === 3 && correctedCues.length > 0 && (
          <Step3Review beforeCues={originalCues} afterCues={correctedCues} glossary={glossary} onUpdate={setCorrectedCues} />
        )}

        {step === 4 && correctedCues.length > 0 && (
          <Step4Export beforeCues={originalCues} afterCues={correctedCues} style={style} fileNameBase={fileName ?? 'legenda.srt'} />
        )}
      </div>

      {/* FOOTER */}
      {step === 1 && srt && (
        <WizardFooter
          hint={
            <>
              Tudo pronto. <strong style={{ fontFamily: TYPO.display, fontWeight: 500, color: DS.fg1 }}>{originalCues.length} cues</strong> serão enviadas para a engine de revisão na próxima etapa.
            </>
          }
        >
          <FooterButton icon={<ChevronLeft size={12} strokeWidth={1.5} />} onClick={handleReset}>
            Cancelar
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
          <FooterButton primary iconRight={<ChevronRight size={12} strokeWidth={1.5} />} onClick={() => setStep(4)}>
            Aprovar e exportar
          </FooterButton>
        </WizardFooter>
      )}

      {step === 4 && (
        <WizardFooter>
          <FooterButton icon={<ChevronLeft size={12} strokeWidth={1.5} />} onClick={() => setStep(3)}>
            Voltar
          </FooterButton>
          <FooterButton primary onClick={handleReset}>
            Nova legenda
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
