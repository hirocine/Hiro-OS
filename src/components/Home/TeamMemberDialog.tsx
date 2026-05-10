import { useState, useEffect } from 'react';
import { X, Plus, Upload, Loader2, Crop } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { TeamMember, TeamMemberInsert, TeamMemberUpdate, CropSettings } from '@/hooks/useTeamMembers';
import { TeamPhotoCropperDialog } from './TeamPhotoCropperDialog';

interface TeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: TeamMember | null;
  onSave: (data: TeamMemberInsert | TeamMemberUpdate) => void;
  isSaving?: boolean;
}

const fieldLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};

export function TeamMemberDialog({
  open,
  onOpenChange,
  member,
  onSave,
  isSaving,
}: TeamMemberDialogProps) {
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [uploading, setUploading] = useState(false);
  const [cropSettings, setCropSettings] = useState<CropSettings | null>(null);

  // Cropper states
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [pendingOriginalBlob, setPendingOriginalBlob] = useState<Blob | null>(null);
  const [isRecropping, setIsRecropping] = useState(false);

  const isEditing = !!member;

  useEffect(() => {
    if (member) {
      setName(member.name);
      setPosition(member.position || '');
      setPhotoUrl(member.photo_url || '');
      setOriginalPhotoUrl(member.original_photo_url || '');
      setTags(member.tags || []);
      setCropSettings(member.crop_settings || null);
    } else {
      setName('');
      setPosition('');
      setPhotoUrl('');
      setOriginalPhotoUrl('');
      setTags([]);
      setCropSettings(null);
    }
    setNewTag('');
    setTempImageSrc(null);
    setPendingOriginalBlob(null);
    setIsRecropping(false);
  }, [member, open]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const originalBlob = new Blob([arrayBuffer], { type: file.type });
    setPendingOriginalBlob(originalBlob);

    const tempUrl = URL.createObjectURL(file);
    setTempImageSrc(tempUrl);
    setIsRecropping(false);
    setShowCropper(true);

    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob, settings: CropSettings) => {
    setUploading(true);
    setShowCropper(false);

    try {
      const timestamp = Date.now();

      if (pendingOriginalBlob) {
        const originalFileName = `team-member-original-${timestamp}.webp`;
        const { data: originalData, error: originalError } = await supabase.storage
          .from('site-assets')
          .upload(`team/originals/${originalFileName}`, pendingOriginalBlob, {
            contentType: pendingOriginalBlob.type,
            upsert: true,
          });

        if (originalError) throw originalError;

        const { data: originalUrlData } = supabase.storage
          .from('site-assets')
          .getPublicUrl(originalData.path);

        setOriginalPhotoUrl(originalUrlData.publicUrl);
        setPendingOriginalBlob(null);
      }

      const croppedFileName = `team-member-${timestamp}.webp`;
      const { data, error } = await supabase.storage
        .from('site-assets')
        .upload(`team/${croppedFileName}`, croppedBlob, {
          contentType: 'image/webp',
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('site-assets')
        .getPublicUrl(data.path);

      setPhotoUrl(urlData.publicUrl);
      setCropSettings(settings);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      setIsRecropping(false);
      if (tempImageSrc) {
        URL.revokeObjectURL(tempImageSrc);
        setTempImageSrc(null);
      }
    }
  };

  const handleCropperClose = (open: boolean) => {
    if (!open && tempImageSrc) {
      URL.revokeObjectURL(tempImageSrc);
      setTempImageSrc(null);
    }
    setShowCropper(open);
    setIsRecropping(false);
  };

  const handleRecrop = () => {
    const imageToRecrop = originalPhotoUrl || photoUrl;
    if (imageToRecrop) {
      setTempImageSrc(imageToRecrop);
      setIsRecropping(true);
      setShowCropper(true);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    const data: TeamMemberInsert | TeamMemberUpdate = {
      name: name.trim(),
      position: position.trim() || undefined,
      photo_url: photoUrl || undefined,
      original_photo_url: originalPhotoUrl || undefined,
      tags,
      crop_settings: cropSettings || undefined,
    };

    if (isEditing && member) {
      onSave({ ...data, id: member.id } as TeamMemberUpdate);
    } else {
      onSave(data);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              <span style={{ fontFamily: '"HN Display", sans-serif' }}>
                {isEditing ? 'Editar Membro' : 'Adicionar Membro'}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px 0' }}>
            {/* Photo Upload */}
            <div>
              <label style={fieldLabel}>Foto</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {photoUrl ? (
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        width: 96,
                        height: 64,
                        overflow: 'hidden',
                        background: 'hsl(var(--ds-line-2) / 0.3)',
                        border: '1px solid hsl(var(--ds-line-1))',
                      }}
                    >
                      <img
                        src={photoUrl}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ position: 'absolute', top: -8, right: -8, display: 'flex', gap: 4 }}>
                      <button
                        type="button"
                        onClick={handleRecrop}
                        title="Ajustar enquadramento"
                        style={{
                          padding: 4,
                          borderRadius: '50%',
                          background: 'hsl(var(--ds-accent))',
                          color: 'white',
                          border: 0,
                          cursor: 'pointer',
                        }}
                      >
                        <Crop size={11} strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoUrl('');
                          setCropSettings(null);
                        }}
                        title="Remover foto"
                        style={{
                          padding: 4,
                          borderRadius: '50%',
                          background: 'hsl(var(--ds-danger))',
                          color: 'white',
                          border: 0,
                          cursor: 'pointer',
                        }}
                      >
                        <X size={11} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    style={{
                      width: 96,
                      height: 64,
                      border: '2px dashed hsl(var(--ds-line-1))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--ds-accent))')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--ds-line-1))')}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                      disabled={uploading}
                    />
                    {uploading ? (
                      <Loader2 size={22} strokeWidth={1.5} className="animate-spin" style={{ color: 'hsl(var(--ds-fg-3))' }} />
                    ) : (
                      <Upload size={22} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
                    )}
                  </label>
                )}
                <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
                  {photoUrl ? 'Clique no ícone de corte para ajustar' : 'Clique para fazer upload'}
                </p>
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" style={fieldLabel}>
                Nome <span style={{ marginLeft: 4, color: 'hsl(var(--ds-danger))' }}>*</span>
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome completo"
              />
            </div>

            {/* Position */}
            <div>
              <label htmlFor="position" style={fieldLabel}>Cargo</label>
              <Input
                id="position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Ex: Diretor de Produção"
              />
            </div>

            {/* Tags */}
            <div>
              <label style={fieldLabel}>Tags</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Nova tag"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn"
                  style={{ width: 36, height: 36, padding: 0, justifyContent: 'center' }}
                  onClick={handleAddTag}
                >
                  <Plus size={14} strokeWidth={1.5} />
                </button>
              </div>
              {tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="pill"
                      style={{
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        color: 'hsl(var(--ds-success))',
                        borderColor: 'hsl(var(--ds-success) / 0.3)',
                        background: 'hsl(var(--ds-success) / 0.08)',
                        transition: 'all 0.15s',
                      }}
                      onClick={() => handleRemoveTag(tag)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'hsl(var(--ds-danger))';
                        e.currentTarget.style.borderColor = 'hsl(var(--ds-danger) / 0.3)';
                        e.currentTarget.style.background = 'hsl(var(--ds-danger) / 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'hsl(var(--ds-success))';
                        e.currentTarget.style.borderColor = 'hsl(var(--ds-success) / 0.3)';
                        e.currentTarget.style.background = 'hsl(var(--ds-success) / 0.08)';
                      }}
                    >
                      {tag}
                      <X size={11} strokeWidth={1.5} />
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <button type="button" className="btn" onClick={() => onOpenChange(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={handleSubmit}
              disabled={!name.trim() || isSaving}
            >
              {isSaving && <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />}
              <span>{isEditing ? 'Salvar' : 'Adicionar'}</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Cropper Dialog */}
      {tempImageSrc && (
        <TeamPhotoCropperDialog
          open={showCropper}
          onOpenChange={handleCropperClose}
          imageSrc={tempImageSrc}
          onCropComplete={handleCropComplete}
          loading={uploading}
          initialSettings={isRecropping ? cropSettings : null}
        />
      )}
    </>
  );
}
