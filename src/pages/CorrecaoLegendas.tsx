import { useState } from 'react';
import { toast } from 'sonner';
import { StepIndicator } from '@/features/subtitles/components/StepIndicator';
import { Step1Upload } from '@/features/subtitles/components/Step1Upload';
import { Step2Configure } from '@/features/subtitles/components/Step2Configure';
import { Step3Review } from '@/features/subtitles/components/Step3Review';
import { Step4Export } from '@/features/subtitles/components/Step4Export';
import { defaultStyleForAspect } from '@/features/subtitles/hooks/useSubtitlePresets';
import { useCorrectSubtitle } from '@/features/subtitles/hooks/useCorrectSubtitle';
import { parseSrt } from '@/features/subtitles/utils/parseSrt';
import type { SrtCue, SubtitleStyle, SupportedLanguage } from '@/features/subtitles/types';

const STEPS = [
  { id: 1, label: 'Upload do SRT' },
  { id: 2, label: 'Configurar' },
  { id: 3, label: 'Revisão' },
  { id: 4, label: 'Export' },
];

export default function CorrecaoLegendas() {
  const [step, setStep] = useState(1);
  const [srt, setSrt] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [originalCues, setOriginalCues] = useState<SrtCue[]>([]);
  const [correctedCues, setCorrectedCues] = useState<SrtCue[]>([]);

  const [sourceLanguage, setSourceLanguage] = useState<SupportedLanguage>('pt-BR');
  const [targetLanguage, setTargetLanguage] = useState<SupportedLanguage>('pt-BR');
  const [style, setStyle] = useState<SubtitleStyle>(() => defaultStyleForAspect('16:9'));
  const [glossary, setGlossary] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  const correct = useCorrectSubtitle();

  const handleUpload = (rawSrt: string, cues: SrtCue[], name: string) => {
    setSrt(rawSrt);
    setFileName(name);
    setOriginalCues(cues);
    setCorrectedCues([]);
  };

  const handleReset = () => {
    setStep(1);
    setSrt(null);
    setFileName(null);
    setOriginalCues([]);
    setCorrectedCues([]);
    setGlossary('');
    setSelectedPresetId(null);
    setStyle(defaultStyleForAspect('16:9'));
    setSourceLanguage('pt-BR');
    setTargetLanguage('pt-BR');
  };

  const handleProcess = async () => {
    if (!srt) return;
    try {
      const glossaryList = glossary
        .split(/\n+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const correctedSrt = await correct.mutateAsync({
        srt,
        sourceLanguage,
        targetLanguage,
        style,
        glossary: glossaryList,
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

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <header style={{ marginBottom: 28 }}>
          <p
            style={{
              fontFamily: '"HN Display", sans-serif',
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'hsl(var(--ds-fg-3))',
              margin: '0 0 8px',
            }}
          >
            Pós-Produção
          </p>
          <h1
            style={{
              fontFamily: '"HN Display", sans-serif',
              fontSize: 32,
              fontWeight: 500,
              letterSpacing: '-0.015em',
              margin: 0,
              color: 'hsl(var(--ds-text))',
            }}
          >
            Correção de Legendas.
          </h1>
          <p
            style={{
              fontFamily: '"HN Text", sans-serif',
              fontSize: 14,
              color: 'hsl(var(--ds-fg-3))',
              margin: '8px 0 0',
              lineHeight: 1.5,
              maxWidth: 640,
            }}
          >
            Carregue um SRT, configure o estilo do vídeo, revise as mudanças e exporte pronto pro DaVinci Resolve.
          </p>
        </header>

        <div style={{ marginBottom: 28 }}>
          <StepIndicator
            steps={STEPS}
            current={step}
            onJump={(s) => {
              if (s < step) setStep(s);
              else if (s === 3 && correctedCues.length > 0) setStep(3);
              else if (s === 4 && correctedCues.length > 0) setStep(4);
            }}
          />
        </div>

        {step === 1 && (
          <Step1Upload
            srt={srt}
            cues={originalCues}
            fileName={fileName}
            onUpload={handleUpload}
            onReset={handleReset}
            onNext={() => setStep(2)}
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
            processing={correct.isPending}
            onChange={(next) => {
              setSourceLanguage(next.sourceLanguage);
              setTargetLanguage(next.targetLanguage);
              setStyle(next.style);
              setGlossary(next.glossary);
              setSelectedPresetId(next.selectedPresetId);
            }}
            onBack={() => setStep(1)}
            onProcess={handleProcess}
          />
        )}

        {step === 3 && correctedCues.length > 0 && (
          <Step3Review
            beforeCues={originalCues}
            afterCues={correctedCues}
            onUpdate={setCorrectedCues}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}

        {step === 4 && correctedCues.length > 0 && (
          <Step4Export
            cues={correctedCues}
            style={style}
            onBack={() => setStep(3)}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
}
