import { useState } from 'react';
import { Bookmark, BookmarkPlus, Edit3, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useSubtitlePresets,
  useCreatePreset,
  useUpdatePreset,
  useDeletePreset,
  presetToStyle,
} from '../hooks/useSubtitlePresets';
import type { AspectRatio, SubtitlePreset, SubtitleStyle } from '../types';

interface Props {
  aspectRatio: AspectRatio;
  selectedPresetId: string | null;
  currentStyle: SubtitleStyle;
  onSelect: (preset: SubtitlePreset | null) => void;
}

export function PresetSelector({ aspectRatio, selectedPresetId, currentStyle, onSelect }: Props) {
  const { data: presets, isLoading } = useSubtitlePresets();
  const createPreset = useCreatePreset();
  const updatePreset = useUpdatePreset();
  const deletePreset = useDeletePreset();

  const [savingName, setSavingName] = useState('');
  const [showSaveBox, setShowSaveBox] = useState(false);

  const filtered = (presets ?? []).filter((p) => p.aspect_ratio === aspectRatio);
  const selected = filtered.find((p) => p.id === selectedPresetId) ?? null;
  const canEdit = selected && !selected.is_global;

  const handleSelectChange = (v: string) => {
    if (v === '__custom__') {
      onSelect(null);
      return;
    }
    const p = filtered.find((x) => x.id === v);
    if (p) onSelect(p);
  };

  const handleSaveNew = async () => {
    if (!savingName.trim()) {
      toast.error('Dê um nome ao preset');
      return;
    }
    try {
      const created = await createPreset.mutateAsync({
        name: savingName.trim(),
        style: currentStyle,
      });
      onSelect(created);
      toast.success(`Preset "${created.name}" salvo`);
      setSavingName('');
      setShowSaveBox(false);
    } catch (e) {
      toast.error(`Erro salvando: ${e instanceof Error ? e.message : 'desconhecido'}`);
    }
  };

  const handleUpdate = async () => {
    if (!selected || selected.is_global) return;
    try {
      await updatePreset.mutateAsync({ id: selected.id, style: currentStyle });
      toast.success(`Preset "${selected.name}" atualizado`);
    } catch (e) {
      toast.error(`Erro atualizando: ${e instanceof Error ? e.message : 'desconhecido'}`);
    }
  };

  const handleDelete = async () => {
    if (!selected || selected.is_global) return;
    if (!confirm(`Apagar o preset "${selected.name}"?`)) return;
    try {
      await deletePreset.mutateAsync(selected.id);
      onSelect(null);
      toast.success('Preset apagado');
    } catch (e) {
      toast.error(`Erro: ${e instanceof Error ? e.message : 'desconhecido'}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <Select value={selectedPresetId ?? '__custom__'} onValueChange={handleSelectChange}>
            <SelectTrigger className="ds-select-trigger">
              <SelectValue placeholder={isLoading ? 'Carregando...' : 'Personalizado'} />
            </SelectTrigger>
            <SelectContent className="ds-shell">
              <SelectItem value="__custom__">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Bookmark size={12} strokeWidth={1.5} />
                  Personalizado
                </span>
              </SelectItem>
              {filtered.length > 0 && (
                <>
                  {filtered.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <Bookmark
                          size={12}
                          strokeWidth={1.5}
                          style={{ color: p.is_global ? 'hsl(var(--ds-info))' : 'hsl(var(--ds-fg-3))' }}
                        />
                        {p.name}
                        {p.is_global && (
                          <span style={{ fontSize: 9, color: 'hsl(var(--ds-fg-3))', letterSpacing: '0.05em' }}>
                            · padrão
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>
        <button
          type="button"
          className="btn sm"
          onClick={() => setShowSaveBox((v) => !v)}
          title="Salvar como novo preset"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <BookmarkPlus size={12} strokeWidth={1.5} />
          Salvar
        </button>
        {canEdit && (
          <>
            <button
              type="button"
              className="btn sm"
              onClick={handleUpdate}
              disabled={updatePreset.isPending}
              title="Atualizar este preset com os ajustes atuais"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Edit3 size={12} strokeWidth={1.5} />
              Atualizar
            </button>
            <button
              type="button"
              className="btn sm danger"
              onClick={handleDelete}
              title="Apagar este preset"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Trash2 size={12} strokeWidth={1.5} />
            </button>
          </>
        )}
      </div>

      {showSaveBox && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: 10,
            border: '1px solid hsl(var(--ds-line-1))',
            background: 'hsl(var(--ds-bg-2))',
          }}
        >
          <input
            type="text"
            placeholder="Nome do novo preset"
            value={savingName}
            onChange={(e) => setSavingName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveNew()}
            autoFocus
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: 12,
              fontFamily: '"HN Text", sans-serif',
              background: 'hsl(var(--ds-surface))',
              border: '1px solid hsl(var(--ds-line-1))',
              color: 'hsl(var(--ds-text))',
              outline: 'none',
            }}
          />
          <button type="button" className="btn primary sm" onClick={handleSaveNew} disabled={createPreset.isPending}>
            {createPreset.isPending ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            type="button"
            className="btn sm"
            onClick={() => {
              setShowSaveBox(false);
              setSavingName('');
            }}
          >
            Cancelar
          </button>
        </div>
      )}

      {selected && (
        <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', margin: 0, fontFamily: '"HN Text", sans-serif' }}>
          {selected.is_global
            ? 'Preset padrão do sistema. Edite os campos abaixo e use "Salvar" pra criar um próprio.'
            : 'Preset pessoal. Edite os campos e use "Atualizar" pra salvar mudanças.'}
        </p>
      )}
    </div>
  );
}

export { presetToStyle };
