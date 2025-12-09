import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BannerSettings {
  url: string | null;
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
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

      if (error) throw error;
      const value = data?.value as unknown as BannerSettings | null;
      return value || { url: null, crop: null };
    },
  });

  const updateBanner = useMutation({
    mutationFn: async (settings: BannerSettings) => {
      const { error } = await supabase
        .from("site_settings")
        .update({ value: settings as any })
        .eq("key", "home_banner");

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

  const uploadBannerImage = async (file: Blob): Promise<string | null> => {
    try {
      const fileName = `banner-${Date.now()}.webp`;
      
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

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading banner:", error);
      toast.error("Erro ao fazer upload do banner");
      return null;
    }
  };

  return {
    bannerSettings,
    isLoading,
    updateBanner: updateBanner.mutate,
    isUpdating: updateBanner.isPending,
    uploadBannerImage,
  };
}
