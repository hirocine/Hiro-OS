import { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { BannerCropperDialog } from "./BannerCropperDialog";
import defaultBanner from "/images/default-banner.jpg";

export function HeroBanner() {
  const { user, isAdmin } = useAuthContext();
  const { bannerSettings, isLoading } = useSiteSettings();
  const [showCropper, setShowCropper] = useState(false);

  // Get user's first name
  const displayName = user?.user_metadata?.full_name || 
                      user?.user_metadata?.name || 
                      user?.email?.split("@")[0] || 
                      "Usuário";
  const firstName = displayName.split(" ")[0];

  // Determine banner image URL
  const bannerUrl = bannerSettings?.url || defaultBanner;

  return (
    <>
      <div className="relative w-full h-48 md:h-64 lg:h-80 overflow-hidden rounded-xl group">
        {/* Background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[2500ms] ease-out group-hover:scale-105"
          style={{ 
            backgroundImage: `url(${bannerUrl})`,
            backgroundPosition: bannerSettings?.crop 
              ? `${bannerSettings.crop.x}% ${bannerSettings.crop.y}%` 
              : "center"
          }}
        />
        
        {/* Dark overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        
        {/* Content */}
        <div className="relative h-full flex flex-col justify-center px-6 md:px-10 lg:px-12">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
            Bem-Vindo à Hiro Hub, {firstName}.
          </h1>
        </div>

        {/* Edit button for admins */}
        {isAdmin && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-4 right-4 opacity-80 hover:opacity-100 transition-opacity"
            onClick={() => setShowCropper(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Editar Banner
          </Button>
        )}
      </div>

      <BannerCropperDialog
        open={showCropper}
        onOpenChange={setShowCropper}
      />
    </>
  );
}
