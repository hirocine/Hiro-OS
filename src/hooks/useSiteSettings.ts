import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BannerSettings {
  url: string | null;
  original_url: string | null;  // Preservar imagem original
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  zoom?: number;      // Salvar zoom para restaurar
  rotation?: number;  // Salvar rotação para restaurar
}

export function useSiteSettings() {
  const queryClient = useQueryClient();

  const { data: bannerSettings, isLoading } = useQuery({
    queryKey: ["site-settings", "home_banner"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "home_banner")
        .single();

      if (error) {
        // Se não existir, retornar valores default
        if (error.code === "PGRST116") {
          return { url: null, original_url: null, crop: null, zoom: 1, rotation: 0 };
        }
        throw error;
      }
      const value = data?.value as unknown as BannerSettings | null;
      return value || { url: null, original_url: null, crop: null, zoom: 1, rotation: 0 };
    },
  });

  const updateBanner = useMutation({
    mutationFn: async (settings: BannerSettings) => {
      // Usar upsert para criar ou atualizar
      const { error } = await supabase
        .from("site_settings")
        .upsert({ 
          key: "home_banner",
          value: settings as any,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'key' 
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings", "home_banner"] });
      toast.success("Banner atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating banner:", error);
      toast.error("Erro ao atualizar banner");
    },
  });

  const uploadBannerImage = async (file: Blob, prefix: string = "banner"): Promise<string | null> => {
    try {
      const fileName = `${prefix}-${Date.now()}.webp`;
      
      const { error: uploadError } = await supabase.storage
        .from("site-assets")
        .upload(fileName, file, {
          contentType: "image/webp",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("site-assets")
        .getPublicUrl(fileName);

      // Adicionar cache-busting timestamp
      return `${data.publicUrl}?t=${Date.now()}`;
    } catch (error) {
      console.error("Error uploading banner:", error);
      toast.error("Erro ao fazer upload do banner");
      return null;
    }
  };

  // Upload da imagem original (sem compressão/crop)
  const uploadOriginalBanner = async (file: File): Promise<string | null> => {
    try {
      // Converter para WebP mantendo dimensões originais
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/webp", 0.95);
      });

      if (!blob) return null;

      return uploadBannerImage(blob, "banner-original");
    } catch (error) {
      console.error("Error uploading original banner:", error);
      return null;
    }
  };

  return {
    bannerSettings,
    isLoading,
    updateBanner: updateBanner.mutate,
    isUpdating: updateBanner.isPending,
    uploadBannerImage,
    uploadOriginalBanner,
  };
}
