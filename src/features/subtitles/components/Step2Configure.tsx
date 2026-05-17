import { useMemo, useState } from 'react';
import { ChevronDown, BookmarkPlus, Trash2, RotateCcw, Save, Eye, EyeOff, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { DS, TYPO } from './shared';
import { LivePreview, wrapLines } from './LivePreview';
import {
  useSubtitlePresets,
  useCreatePreset,
  useUpdatePreset,
  useDeletePreset,
  presetToStyle,
  defaultStyleForAspect,
  stylesEqual,
} from '../hooks/useSubtitlePresets';
import {
  LANGUAGE_LABELS,
  ASPECT_LABELS,
  ASPECT_HINTS,
  ASPECT_RESOLUTION,
  TONE_LABELS,
  type AspectRatio,
  type Casing,
  type SubtitlePosition,
  type Tone,
  type SubtitlePreset,
  type SubtitleStyle,
  type SupportedLanguage,
  type SrtCue,
} from '../types';
import { cueStats, estimateCost, estimateTime } from '../utils/analyze';

interface Props {
  cues: SrtCue[];
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  style: SubtitleStyle;
  glossary: string[];
  selectedPresetId: string | null;
  baselineStyle: SubtitleStyle | null;
  onChange: (next: {
    sourceLanguage: SupportedLanguage;
    targetLanguage: SupportedLanguage;
    style: SubtitleStyle;
    glossary: string[];
    selectedPresetId: string | null;
    baselineStyle: SubtitleStyle | null;
  }) => void;
}

const ASPECT_OPTIONS: AspectRatio[] = ['16:9', '9:16', '1:1', '2.39:1'];
const LANG_OPTIONS = Object.keys(LANGUAGE_LABELS) as SupportedLanguage[];

export function Step2Configure({ cues, sourceLanguage, targetLanguage, style, glossary, selectedPresetId, baselineStyle, onChange }: Props) {
  const { data: presets } = useSubtitlePresets();
  const createPreset = useCreatePreset();
  const updatePreset = useUpdatePreset();
  const deletePreset = useDeletePreset();

  const [cueIdx, setCueIdx] = useState(0);
  const [showSafeArea, setShowSafeArea] = useState(true);
  const [showSaveBox, setShowSaveBox] = useState(false);
  const [savingName, setSavingName] = useState('');
  const [glossaryInput, setGlossaryInput] = useState('');

  const currentCue = cues[cueIdx] ?? cues[0];
  const wrappedSample = useMemo(
    () => (currentCue ? wrapLines(currentCue.text, style.chars_per_line, style.max_lines) : 'a gente faz filme'),
    [currentCue, style.chars_per_line, style.max_lines],
  );

  const selected = (presets ?? []).find((p) => p.id === selectedPresetId) ?? null;
  const isModified = selected && baselineStyle ? !stylesEqual(baselineStyle, style) : false;
  const canSavePresetUpdate = !!selected && !selected.is_global && isModified;
  const filteredPresets = (presets ?? []).filter((p) => p.aspect_ratio === style.aspect_ratio);
  const userPresetCount = filteredPresets.filter((p) => !p.is_global).length;

  const update = (partial: Partial<Parameters<typeof onChange>[0]>) =>
    onChange({
      sourceLanguage,
      targetLanguage,
      style,
      glossary,
      selectedPresetId,
      baselineStyle,
      ...partial,
    });

  const setStyle = (next: SubtitleStyle) => update({ style: next });

  const setAspect = (a: AspectRatio) => {
    if (style.aspect_ratio === a) return;
    const next = defaultStyleForAspect(a);
    update({ style: next, selectedPresetId: null, baselineStyle: null });
  };

  const handleSelectPreset = (p: SubtitlePreset | null) => {
    if (p) {
      const s = presetToStyle(p);
      update({ style: s, selectedPresetId: p.id, baselineStyle: s });
    } else {
      update({ selectedPresetId: null, baselineStyle: null });
    }
  };

  const handleSaveNew = async () => {
    const name = savingName.trim();
    if (!name) {
      toast.error('Dê um nome ao preset');
      return;
    }
    try {
      const created = await createPreset.mutateAsync({ name, style });
      update({ selectedPresetId: created.id, baselineStyle: style });
      toast.success(`Preset "${name}" salvo`);
      setSavingName('');
      setShowSaveBox(false);
    } catch (e) {
      toast.error(`Erro salvando: ${e instanceof Error ? e.message : 'desconhecido'}`);
    }
  };

  const handleUpdateExisting = async () => {
    if (!selected || selected.is_global) return;
    try {
      await updatePreset.mutateAsync({ id: selected.id, style });
      update({ baselineStyle: style });
      toast.success(`Preset "${selected.name}" atualizado`);
    } catch (e) {
      toast.error(`Erro: ${e instanceof Error ? e.message : 'desconhecido'}`);
    }
  };

  const handleResetPreset = () => {
    if (baselineStyle) update({ style: baselineStyle });
  };

  const handleDeletePreset = async () => {
    if (!selected || selected.is_global) return;
    if (!confirm(`Apagar o preset "${selected.name}"?`)) return;
    try {
      await deletePreset.mutateAsync(selected.id);
      update({ selectedPresetId: null, baselineStyle: null });
      toast.success('Preset apagado');
    } catch (e) {
      toast.error(`Erro: ${e instanceof Error ? e.message : 'desconhecido'}`);
    }
  };

  const addGlossaryChip = () => {
    const v = glossaryInput.trim();
    if (!v) return;
    if (glossary.includes(v)) {
      toast.message('Termo já está no glossário');
      setGlossaryInput('');
      return;
    }
    update({ glossary: [...glossary, v] });
    setGlossaryInput('');
  };

  const stats = currentCue ? cueStats(currentCue) : null;
  const lineChars = wrappedSample.split('\n').map((l) => l.length);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 460px', minHeight: 0 }}>
      {/* CONFIG */}
      <div style={{ minWidth: 0, borderRight: `1px solid ${DS.line1}`, overflowY: 'auto' }}>
        {/* 2.1 IDIOMAS */}
        <CfgBlock ix="2.1" title="Idiomas" description="Como a Hiro lê o áudio e em que idioma escreve a legenda. Mantenha igual pra revisão; troque pra gerar uma versão traduzida.">
          <FldGrid cols={2}>
            <Fld label="Idioma da fala">
              <NativeSelect value={sourceLanguage} onChange={(v) => update({ sourceLanguage: v as SupportedLanguage })}>
                {LANG_OPTIONS.map((l) => (
                  <option key={l} value={l}>{LANGUAGE_LABELS[l]}</option>
                ))}
              </NativeSelect>
            </Fld>
            <Fld label="Idioma da legenda">
              <NativeSelect value={targetLanguage} onChange={(v) => update({ targetLanguage: v as SupportedLanguage })}>
                {LANG_OPTIONS.map((l) => (
                  <option key={l} value={l}>{LANGUAGE_LABELS[l]}</option>
                ))}
              </NativeSelect>
            </Fld>
          </FldGrid>
          {sourceLanguage !== targetLanguage && (
            <p style={{ marginTop: 8, fontSize: 11, color: DS.info, fontFamily: TYPO.text }}>
              Idiomas diferentes — Claude vai traduzir + corrigir.
            </p>
          )}
        </CfgBlock>

        {/* 2.2 FORMATO */}
        <CfgBlock
          ix="2.2"
          title="Formato do vídeo"
          description={<>Onde a legenda vai aparecer. Cada formato define limites diferentes de <strong style={{ fontFamily: TYPO.display, color: DS.fg1 }}>chars por linha</strong>, <strong style={{ fontFamily: TYPO.display, color: DS.fg1 }}>posição</strong> e <strong style={{ fontFamily: TYPO.display, color: DS.fg1 }}>safe-area</strong>.</>}
          info="define defaults dos presets"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: `1px solid ${DS.line2}` }}>
            {ASPECT_OPTIONS.map((a, i) => {
              const isOn = style.aspect_ratio === a;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAspect(a)}
                  style={{
                    padding: '14px 12px',
                    background: isOn ? DS.fg1 : DS.bg,
                    color: isOn ? DS.bg : DS.fg1,
                    borderRight: i < ASPECT_OPTIONS.length - 1 ? `1px solid ${DS.line2}` : 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    transition: 'background 120ms',
                  }}
                >
                  <FmtFrame aspect={a} isOn={isOn} />
                  <span style={{ fontFamily: TYPO.display, fontWeight: 500, fontSize: 13, letterSpacing: '-0.005em' }}>
                    {ASPECT_LABELS[a].split('·')[0].trim()}
                    <span style={{ fontFamily: DS.mono, fontSize: 11, color: isOn ? 'hsl(0 0% 70%)' : DS.fg4, marginLeft: 6 }}>
                      {a}
                    </span>
                  </span>
                  <span style={{ fontSize: 10, color: isOn ? 'hsl(0 0% 70%)' : DS.fg4, fontFamily: TYPO.text }}>
                    {ASPECT_HINTS[a]}
                  </span>
                </button>
              );
            })}
          </div>
        </CfgBlock>

        {/* 2.3 PRESETS */}
        <CfgBlock
          ix="2.3"
          title="Preset salvo"
          description="Conjunto pronto de estilo + regras. Escolha um pra preencher tudo automaticamente, ou ajuste e salve uma versão sua."
          info={`${filteredPresets.length} presets · ${userPresetCount} personalizado${userPresetCount === 1 ? '' : 's'}`}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
            {filteredPresets.map((p) => {
              const isOn = selected?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  style={{
                    padding: 12,
                    background: DS.bg,
                    border: `1px solid ${isOn ? DS.fg1 : DS.line2}`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    textAlign: 'left',
                    transition: 'border-color 120ms',
                    outline: isOn ? `2px solid ${DS.fg1}` : 'none',
                    outlineOffset: -2,
                  }}
                >
                  <PresetPreview preset={p} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                    <span style={{ fontFamily: TYPO.display, fontWeight: 500, fontSize: 12, color: DS.fg1, letterSpacing: '-0.005em', lineHeight: 1.3 }}>
                      {p.name}
                    </span>
                    {p.is_global ? (
                      <span style={{ padding: '1px 6px', background: DS.surface2, color: DS.fg3, fontFamily: TYPO.display, fontSize: 9, fontWeight: 500, letterSpacing: '0.12em', flexShrink: 0 }}>
                        PADRÃO
                      </span>
                    ) : (
                      <span style={{ padding: '1px 6px', background: DS.accentSoft, color: DS.accentDeep, fontFamily: TYPO.display, fontSize: 9, fontWeight: 500, letterSpacing: '0.12em', flexShrink: 0 }}>
                        MEU
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, fontSize: 10, color: DS.fg4, fontFamily: TYPO.text, flexWrap: 'wrap' }}>
                    <span>{p.font_family} {p.font_size}</span>
                    <span style={{ color: DS.line2 }}>·</span>
                    <span>{p.max_lines}L · {p.chars_per_line}c</span>
                  </div>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setShowSaveBox(true)}
              style={{
                padding: 12,
                background: 'transparent',
                border: `1px dashed ${DS.line2}`,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                minHeight: 110,
                color: DS.fg3,
                transition: 'color 120ms, border-color 120ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = DS.fg1;
                e.currentTarget.style.borderColor = DS.line3;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = DS.fg3;
                e.currentTarget.style.borderColor = DS.line2;
              }}
            >
              <Plus size={16} strokeWidth={1.5} />
              <span style={{ fontFamily: TYPO.display, fontSize: 11, fontWeight: 500, letterSpacing: '0.06em' }}>Novo preset</span>
            </button>
          </div>

          {/* Footer dos presets */}
          <div
            style={{
              marginTop: 14,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              background: DS.surface,
              border: `1px solid ${DS.line1}`,
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 12, color: DS.fg3, fontFamily: TYPO.text }}>
              {selected ? (
                <>
                  Editando: <strong style={{ fontFamily: TYPO.display, fontWeight: 500, color: DS.fg1 }}>{selected.name}</strong>
                  {isModified && <span style={{ color: DS.warn, marginLeft: 8 }}>· modificado</span>}
                </>
              ) : (
                'Nenhum preset selecionado — você está editando os valores padrão do formato'
              )}
            </span>
            <div style={{ display: 'flex', border: `1px solid ${DS.line2}`, alignSelf: 'flex-end' }}>
              {selected && baselineStyle && isModified && (
                <SmallActionBtn icon={<RotateCcw size={11} strokeWidth={1.5} />} onClick={handleResetPreset}>
                  Resetar
                </SmallActionBtn>
              )}
              {canSavePresetUpdate && (
                <SmallActionBtn icon={<Save size={11} strokeWidth={1.5} />} onClick={handleUpdateExisting}>
                  Salvar alterações
                </SmallActionBtn>
              )}
              <SmallActionBtn icon={<BookmarkPlus size={11} strokeWidth={1.5} />} onClick={() => setShowSaveBox(true)} last>
                Salvar como novo
              </SmallActionBtn>
              {selected && !selected.is_global && (
                <SmallActionBtn icon={<Trash2 size={11} strokeWidth={1.5} />} onClick={handleDeletePreset} last>
                  Apagar
                </SmallActionBtn>
              )}
            </div>
          </div>

          {showSaveBox && (
            <div
              style={{
                marginTop: 10,
                display: 'flex',
                gap: 8,
                padding: 10,
                border: `1px solid ${DS.line2}`,
                background: DS.surface,
                alignItems: 'center',
              }}
            >
              <input
                type="text"
                placeholder="Nome do novo preset"
                value={savingName}
                onChange={(e) => setSavingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveNew();
                  if (e.key === 'Escape') {
                    setShowSaveBox(false);
                    setSavingName('');
                  }
                }}
                autoFocus
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: 13,
                  fontFamily: TYPO.text,
                  background: DS.bg,
                  border: `1px solid ${DS.line2}`,
                  color: DS.fg1,
                  outline: 'none',
                }}
              />
              <SmallActionBtn primary onClick={handleSaveNew}>
                Salvar
              </SmallActionBtn>
              <SmallActionBtn onClick={() => { setShowSaveBox(false); setSavingName(''); }} last>
                Cancelar
              </SmallActionBtn>
            </div>
          )}
        </CfgBlock>

        {/* 2.4 ESTILO */}
        <CfgBlock
          ix="2.4"
          title="Estilo da legenda"
          description={<>Aspectos visuais e regras de leitura. Alterar qualquer coisa aqui marca o preset como <strong style={{ fontFamily: TYPO.display, color: DS.fg1 }}>modificado</strong>.</>}
        >
          {/* A LAYOUT */}
          <Group letter="A" title="Layout" subtitle="chars · linhas · CPS · posição">
            <FldGrid cols={4}>
              <Fld label="Chars / linha">
                <NumberInput value={style.chars_per_line} min={10} max={80} onChange={(v) => setStyle({ ...style, chars_per_line: v })} />
              </Fld>
              <Fld label="Máx. linhas">
                <NumberInput value={style.max_lines} min={1} max={4} onChange={(v) => setStyle({ ...style, max_lines: v })} />
              </Fld>
              <Fld label="CPS máx">
                <NumberInput value={style.cps_max} min={8} max={30} onChange={(v) => setStyle({ ...style, cps_max: v })} suffix="c/s" />
              </Fld>
              <Fld label="Posição">
                <Segmented
                  value={style.position}
                  options={[
                    { value: 'top', label: 'Topo' },
                    { value: 'middle', label: 'Centro' },
                    { value: 'bottom', label: 'Rodapé' },
                  ]}
                  onChange={(v) => setStyle({ ...style, position: v as SubtitlePosition })}
                />
              </Fld>
            </FldGrid>
            <div style={{ marginTop: 14 }}>
              <Fld label={`Margem do ${style.position === 'top' ? 'topo' : style.position === 'middle' ? 'centro' : 'rodapé'} · safe`}>
                <SliderRow value={style.margin_v} min={0} max={25} unit="%" onChange={(v) => setStyle({ ...style, margin_v: v })} />
              </Fld>
            </div>
          </Group>

          {/* B TIPOGRAFIA — simplificado */}
          <Group letter="B" title="Tipografia" subtitle="tamanho · tracking · casing · largura">
            <FldGrid cols={4}>
              <Fld label="Tamanho (px)">
                <NumberInput value={style.font_size} min={10} max={96} onChange={(v) => setStyle({ ...style, font_size: v })} suffix="px" />
              </Fld>
              <Fld label="Tracking">
                <SliderRow value={style.tracking} min={-20} max={20} unit="" onChange={(v) => setStyle({ ...style, tracking: v })} />
              </Fld>
              <Fld label="Casing">
                <Segmented
                  value={style.casing}
                  options={[
                    { value: 'sentence', label: 'Sentence' },
                    { value: 'literal', label: 'Literal' },
                    { value: 'upper', label: 'CAIXA' },
                  ]}
                  onChange={(v) => setStyle({ ...style, casing: v as Casing })}
                />
              </Fld>
              <Fld label="Largura máxima">
                <SliderRow value={style.max_width} min={40} max={100} unit="%" onChange={(v) => setStyle({ ...style, max_width: v })} />
              </Fld>
            </FldGrid>
            <p style={{ marginTop: 12, fontSize: 11, color: DS.fg4, fontFamily: TYPO.text }}>
              Fonte fixa: <strong style={{ fontFamily: TYPO.display, fontWeight: 500, color: DS.fg3 }}>Helvetica Now Display Bold</strong> · cor branca · sem outline, sombra ou caixa.
            </p>
          </Group>

          {/* C TOM */}
          <Group letter="C" title="Tom da revisão" subtitle="como a Hiro escreve">
            <Segmented
              fullWidth
              value={style.tone}
              options={(['editorial', 'neutral', 'casual', 'literal'] as Tone[]).map((t) => ({ value: t, label: TONE_LABELS[t] }))}
              onChange={(v) => setStyle({ ...style, tone: v as Tone })}
            />
          </Group>
        </CfgBlock>

        {/* 2.5 GLOSSÁRIO */}
        <CfgBlock
          ix="2.5"
          title="Glossário"
          description={<>Termos que <strong style={{ fontFamily: TYPO.display, color: DS.fg1 }}>não devem ser alterados</strong> pela revisão — nomes próprios, marcas, jargões. Pressione <kbd style={{ fontFamily: DS.mono, background: DS.surface2, padding: '1px 5px', border: `1px solid ${DS.line1}`, fontSize: 10 }}>⏎</kbd> para adicionar.</>}
          info={`${glossary.length} termo${glossary.length === 1 ? '' : 's'}`}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {glossary.map((term) => (
              <span
                key={term}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 10px',
                  background: DS.surface2,
                  border: `1px solid ${DS.line2}`,
                  fontSize: 12.5,
                  color: DS.fg1,
                  fontFamily: TYPO.display,
                  fontWeight: 500,
                }}
              >
                {term}
                <button
                  type="button"
                  onClick={() => update({ glossary: glossary.filter((t) => t !== term) })}
                  style={{
                    marginLeft: 2,
                    color: DS.fg4,
                    cursor: 'pointer',
                    background: 'transparent',
                    border: 'none',
                    display: 'grid',
                    placeItems: 'center',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = DS.danger)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = DS.fg4)}
                >
                  <X size={10} strokeWidth={2} />
                </button>
              </span>
            ))}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                background: 'transparent',
                border: `1px dashed ${DS.line2}`,
                color: glossaryInput ? DS.fg1 : DS.fg3,
              }}
            >
              <input
                type="text"
                value={glossaryInput}
                onChange={(e) => setGlossaryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addGlossaryChip();
                  }
                }}
                placeholder="+ adicionar termo"
                style={{
                  background: 'transparent',
                  border: 0,
                  outline: 0,
                  width: 140,
                  font: 'inherit',
                  fontFamily: TYPO.display,
                  fontSize: 12.5,
                  fontWeight: 500,
                }}
              />
            </span>
          </div>
        </CfgBlock>
      </div>

      {/* PREVIEW */}
      <div style={{ display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100%', maxHeight: 'calc(100vh - 200px)', minHeight: 600 }}>
        <div
          style={{
            height: 50,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: `1px solid ${DS.line1}`,
            background: DS.bg,
            flexShrink: 0,
          }}
        >
          <span style={{ fontFamily: TYPO.display, fontSize: 10, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: DS.fg3 }}>
            Preview ao vivo
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 8px',
              background: DS.accentSoft,
              color: DS.accentDeep,
              fontFamily: TYPO.display,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              border: `1px solid hsl(var(--ds-accent) / 0.25)`,
            }}
          >
            {style.aspect_ratio} · {ASPECT_RESOLUTION[style.aspect_ratio]}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            {currentCue && (
              <span style={{ fontFamily: DS.mono, fontSize: 11, color: DS.fg2, fontVariantNumeric: 'tabular-nums' }}>
                {currentCue.startStr.slice(0, 8)} → {currentCue.endStr.slice(0, 8)}
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowSafeArea((v) => !v)}
              title="Safe area"
              style={{
                width: 28,
                height: 28,
                display: 'grid',
                placeItems: 'center',
                color: showSafeArea ? DS.fg1 : DS.fg3,
                border: `1px solid ${DS.line2}`,
                background: showSafeArea ? DS.surface : 'transparent',
                cursor: 'pointer',
              }}
            >
              {showSafeArea ? <Eye size={12} strokeWidth={1.5} /> : <EyeOff size={12} strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        {/* Stage */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: `repeating-linear-gradient(45deg, ${DS.surface} 0 6px, ${DS.surface2} 6px 12px)`,
            minHeight: 0,
          }}
        >
          <LivePreview style={style} text={wrappedSample} showSafeArea={showSafeArea} width={400} />
        </div>

        {/* Cue nav */}
        <div style={{ borderTop: `1px solid ${DS.line1}`, background: DS.bg, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', gap: 14, borderBottom: `1px solid ${DS.line1}` }}>
            <div style={{ display: 'flex', border: `1px solid ${DS.line2}` }}>
              <NavBtn onClick={() => setCueIdx((i) => Math.max(0, i - 1))} disabled={cueIdx === 0}>
                <ChevronLeft size={13} strokeWidth={1.5} />
              </NavBtn>
              <NavBtn onClick={() => setCueIdx((i) => Math.min(cues.length - 1, i + 1))} disabled={cueIdx >= cues.length - 1} last>
                <ChevronRight size={13} strokeWidth={1.5} />
              </NavBtn>
            </div>
            <span style={{ fontFamily: TYPO.display, fontWeight: 500, fontSize: 12, color: DS.fg1, fontVariantNumeric: 'tabular-nums' }}>
              CUE {String((currentCue?.index ?? 1)).padStart(3, '0')}
              <span style={{ color: DS.fg4, fontWeight: 400, marginLeft: 6 }}>
                de {cues.length}
              </span>
            </span>
            <span style={{ flex: 1, height: 4, background: DS.surface3, position: 'relative', margin: '0 8px' }}>
              <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, background: DS.accent, width: `${((cueIdx + 1) / Math.max(1, cues.length)) * 100}%` }} />
            </span>
          </div>
          {/* Line stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <LineStat label={`Linha 1 · ${lineChars[0] ?? 0} chars`} value={lineChars[0] ?? 0} max={style.chars_per_line} />
            <LineStat label={`Linha 2 · ${lineChars[1] ?? 0} chars`} value={lineChars[1] ?? 0} max={style.chars_per_line} />
            <LineStat label="CPS desta cue" value={stats?.cps ?? 0} max={style.cps_max} decimals={1} last />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============== Estimate helper exposed para footer ==============
export function step2Estimate(cues: SrtCue[]) {
  const time = estimateTime(cues);
  const { cost } = estimateCost(cues);
  return { time, cost };
}

// ============== Sub components ==============

function CfgBlock({ ix, title, description, info, children }: { ix: string; title: string; description?: React.ReactNode; info?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ padding: '24px 32px', borderBottom: `1px solid ${DS.line1}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 style={{ margin: 0, fontFamily: TYPO.display, fontWeight: 500, fontSize: 18, letterSpacing: '-0.015em', color: DS.fg1, lineHeight: 1.3 }}>
            <span style={{ marginRight: 8, letterSpacing: 0 }}>{ix}</span>
            {title}
          </h3>
          {description && (
            <p style={{ margin: '4px 0 0', fontSize: 12, color: DS.fg3, fontFamily: TYPO.text, lineHeight: 1.5, maxWidth: '60ch' }}>
              {description}
            </p>
          )}
        </div>
        {info && (
          <span style={{ fontFamily: TYPO.display, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: DS.fg4, flexShrink: 0 }}>
            {info}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Group({ letter, title, subtitle, children }: { letter: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 18,
            height: 18,
            background: DS.surface2,
            color: DS.fg2,
            fontFamily: TYPO.display,
            fontWeight: 500,
            fontSize: 9,
          }}
        >
          {letter}
        </span>
        <span style={{ fontFamily: TYPO.display, fontWeight: 500, fontSize: 13, letterSpacing: '-0.005em', color: DS.fg1 }}>
          {title}
        </span>
        {subtitle && (
          <span style={{ marginLeft: 'auto', fontFamily: TYPO.display, fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: DS.fg4 }}>
            {subtitle}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function FldGrid({ cols, children }: { cols: 2 | 3 | 4; children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>{children}</div>;
}

function Fld({ label, children, colSpan }: { label: string; children: React.ReactNode; colSpan?: number }) {
  return (
    <div style={{ gridColumn: colSpan ? `span ${colSpan}` : undefined }}>
      <label style={{ display: 'block', fontFamily: TYPO.display, fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: DS.fg4, marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function NativeSelect({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          appearance: 'none',
          height: 34,
          padding: '0 32px 0 12px',
          fontSize: 13,
          fontFamily: TYPO.text,
          background: DS.bg,
          border: `1px solid ${DS.line2}`,
          color: DS.fg1,
          outline: 'none',
          cursor: 'pointer',
        }}
      >
        {children}
      </select>
      <ChevronDown size={13} strokeWidth={1.5} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: DS.fg3, pointerEvents: 'none' }} />
    </div>
  );
}

function NumberInput({ value, min, max, onChange, suffix, disabled }: { value: number; min: number; max: number; onChange: (v: number) => void; suffix?: string; disabled?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', border: `1px solid ${DS.line2}`, background: disabled ? DS.surface : DS.bg, opacity: disabled ? 0.5 : 1 }}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
        style={{
          flex: 1,
          padding: '0 0 0 10px',
          height: 32,
          fontSize: 13,
          fontFamily: TYPO.text,
          fontVariantNumeric: 'tabular-nums',
          background: 'transparent',
          border: 'none',
          color: DS.fg1,
          outline: 'none',
          width: 0,
          minWidth: 0,
        }}
      />
      {suffix && (
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 8px', fontSize: 10, color: DS.fg4, fontFamily: TYPO.text, fontWeight: 500, letterSpacing: '0.04em' }}>
          {suffix}
        </span>
      )}
    </div>
  );
}

function SliderRow({ value, min, max, unit, onChange }: { value: number; min: number; max: number; unit: string; onChange: (v: number) => void }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 32 }}>
      <span style={{ fontFamily: TYPO.display, fontWeight: 500, fontSize: 12, color: DS.fg1, fontVariantNumeric: 'tabular-nums', minWidth: 38 }}>
        {value} {unit && <small style={{ color: DS.fg4, fontWeight: 400 }}>{unit}</small>}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: DS.fg1, height: 4 }}
      />
      <span style={{ fontFamily: TYPO.display, fontSize: 11, color: DS.fg4, fontWeight: 500, fontVariantNumeric: 'tabular-nums', minWidth: 44, textAlign: 'right' }}>
        {min} → {max}
      </span>
    </div>
  );
}

function Segmented<T extends string>({ value, options, onChange, fullWidth }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; fullWidth?: boolean }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        width: fullWidth ? '100%' : undefined,
        border: `1px solid ${DS.line2}`,
      }}
    >
      {options.map((opt, i) => {
        const isOn = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              flex: fullWidth ? 1 : undefined,
              height: 32,
              padding: '0 12px',
              fontFamily: TYPO.display,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.04em',
              color: isOn ? DS.bg : DS.fg2,
              background: isOn ? DS.fg1 : DS.bg,
              border: 'none',
              borderRight: i < options.length - 1 ? `1px solid ${DS.line2}` : 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function SmallActionBtn({ icon, children, onClick, last, primary }: { icon?: React.ReactNode; children: React.ReactNode; onClick: () => void; last?: boolean; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 30,
        padding: '0 12px',
        fontFamily: TYPO.display,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: primary ? DS.bg : DS.fg2,
        background: primary ? DS.fg1 : DS.bg,
        borderRight: last ? 'none' : `1px solid ${DS.line2}`,
        border: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
        transition: 'color 120ms, background 120ms',
      }}
      onMouseEnter={(e) => {
        if (primary) return;
        e.currentTarget.style.color = DS.fg1;
        e.currentTarget.style.background = DS.surface2;
      }}
      onMouseLeave={(e) => {
        if (primary) return;
        e.currentTarget.style.color = DS.fg2;
        e.currentTarget.style.background = DS.bg;
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function NavBtn({ children, onClick, disabled, last }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; last?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 28,
        height: 28,
        display: 'grid',
        placeItems: 'center',
        color: DS.fg3,
        borderRight: last ? 'none' : `1px solid ${DS.line2}`,
        background: 'transparent',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'color 120ms, background 120ms',
      }}
    >
      {children}
    </button>
  );
}

function LineStat({ label, value, max, decimals, last }: { label: string; value: number; max: number; decimals?: number; last?: boolean }) {
  const isOk = value <= max;
  return (
    <div
      style={{
        padding: '10px 16px',
        borderRight: last ? 'none' : `1px solid ${DS.line1}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontFamily: TYPO.display,
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: DS.fg4,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {label}
      </span>
      <span style={{ fontFamily: TYPO.display, fontWeight: 500, fontSize: 13, color: DS.fg1, fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', gap: 6 }}>
        {decimals !== undefined ? value.toFixed(decimals) : value}
        <span style={{ fontSize: 10, color: DS.fg3, fontWeight: 400 }}>/ {max}</span>
        <span
          style={{
            fontSize: 9,
            padding: '1px 5px',
            color: isOk ? DS.accentDeep : DS.warn,
            background: isOk ? DS.accentSoft : 'hsl(43 89% 92%)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          {isOk ? 'OK' : 'ACIMA'}
        </span>
      </span>
    </div>
  );
}

function FmtFrame({ aspect, isOn }: { aspect: AspectRatio; isOn: boolean }) {
  const dims = (() => {
    if (aspect === '16:9') return { w: 32, h: 18 };
    if (aspect === '9:16') return { w: 18, h: 32 };
    if (aspect === '1:1') return { w: 22, h: 22 };
    if (aspect === '4:5') return { w: 20, h: 25 };
    return { w: 36, h: 15 }; // 2.39:1
  })();
  return (
    <div
      style={{
        width: dims.w,
        height: dims.h,
        background: isOn ? 'hsl(0 0% 18%)' : DS.surface3,
        border: `1px solid ${isOn ? 'hsl(0 0% 30%)' : DS.line2}`,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0 2px 2px',
      }}
    >
      <span
        style={{
          background: isOn ? 'hsl(0 0% 90%)' : DS.fg3,
          height: 2,
          width: '60%',
        }}
      />
    </div>
  );
}

function PresetPreview({ preset }: { preset: SubtitlePreset }) {
  const bg = (() => {
    if (preset.bg_type === 'none' || !preset.background_color || preset.background_opacity === 0) return 'transparent';
    return `rgba(0, 0, 0, ${preset.background_opacity})`;
  })();
  return (
    <div
      style={{
        height: 50,
        background: '#2a2a2a',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0 6px 6px',
        border: `1px solid ${DS.line2}`,
      }}
    >
      <span
        style={{
          fontFamily: `"${preset.font_family}", sans-serif`,
          fontSize: 10,
          fontWeight: preset.font_weight === 'bold' ? 700 : 500,
          color: preset.text_color,
          background: bg,
          padding: bg === 'transparent' ? 0 : '1px 5px',
          textShadow: preset.outline_width > 0 ? `0 0 ${preset.outline_width}px ${preset.outline_color}, 0 0 ${preset.outline_width}px ${preset.outline_color}` : undefined,
          textTransform: preset.casing === 'upper' ? 'uppercase' : 'none',
        }}
      >
        a gente faz filme
      </span>
    </div>
  );
}
