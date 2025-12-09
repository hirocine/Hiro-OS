import { useState, useEffect } from 'react';
import { X, Plus, Upload, Loader2, Crop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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

    // Store the original file as blob for later upload
    const arrayBuffer = await file.arrayBuffer();
    const originalBlob = new Blob([arrayBuffer], { type: file.type });
    setPendingOriginalBlob(originalBlob);

    // Create temporary URL and open cropper
    const tempUrl = URL.createObjectURL(file);
    setTempImageSrc(tempUrl);
    setIsRecropping(false); // New image, not a recrop
    setShowCropper(true);
    
    // Reset the input so the same file can be selected again
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob, settings: CropSettings) => {
    setUploading(true);
    setShowCropper(false);
    
    try {
      const timestamp = Date.now();
      
      // Upload original image only if it's a new upload (not a re-crop)
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

      // Upload cropped image
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
      setCropSettings(settings); // Save the crop settings
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      setIsRecropping(false);
      // Clean up temporary URL
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
    // For re-cropping, use original image if available, otherwise use current photo
    const imageToRecrop = originalPhotoUrl || photoUrl;
    if (imageToRecrop) {
      setTempImageSrc(imageToRecrop);
      setIsRecropping(true); // This is a recrop, use saved settings
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
              {isEditing ? 'Editar Membro' : 'Adicionar Membro'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Photo Upload */}
            <div className="space-y-2">
              <Label>Foto</Label>
              <div className="flex items-center gap-4">
                {photoUrl ? (
                  <div className="relative">
                    <div className="w-24 h-16 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={photoUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -top-2 -right-2 flex gap-1">
                      <button
                        onClick={handleRecrop}
                        className="p-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                        title="Ajustar enquadramento"
                      >
                        <Crop className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => {
                          setPhotoUrl('');
                          setCropSettings(null);
                        }}
                        className="p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm"
                        title="Remover foto"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="w-24 h-16 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={uploading}
                    />
                    {uploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    )}
                  </label>
                )}
                <p className="text-sm text-muted-foreground">
                  {photoUrl ? 'Clique no ícone de corte para ajustar' : 'Clique para fazer upload'}
                </p>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome completo"
              />
            </div>

            {/* Position */}
            <div className="space-y-2">
              <Label htmlFor="position">Cargo</Label>
              <Input
                id="position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Ex: Diretor de Produção"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
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
                <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-success/10 text-success border-success/20 cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!name.trim() || isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Salvar' : 'Adicionar'}
            </Button>
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
