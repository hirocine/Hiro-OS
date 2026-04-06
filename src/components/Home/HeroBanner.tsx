import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useIsMobile } from "@/hooks/use-mobile";
import { BannerCropperDialog } from "./BannerCropperDialog";
import defaultBanner from "/images/default-banner.jpg";
import { useQuery } from '@tanstack/react-query';
import { useRecordingsCalendar, getEventTitle } from '@/hooks/useRecordingsCalendar';
import { parseISO, differenceInDays, differenceInHours } from 'date-fns';

export function HeroBanner() {
  const { user, isAdmin } = useAuthContext();
  const { bannerSettings, isLoading } = useSiteSettings();
  const isMobile = useIsMobile();
  const [showCropper, setShowCropper] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Determine banner image URL
  const bannerUrl = bannerSettings?.url || defaultBanner;

  // Pré-carregar a imagem antes de exibir
  useEffect(() => {
    if (!isLoading && bannerUrl) {
      setImageLoaded(false);
      setHasAnimated(false); // Resetar animação quando URL muda
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.src = bannerUrl;
    }
  }, [bannerUrl, isLoading]);

  // Animação de entrada: zoom out suave APÓS imagem carregar e fade-in completar
  useEffect(() => {
    if (imageLoaded) {
      // Delay de 100ms para garantir que:
      // 1. O fade-in (opacity) do banner começou
      // 2. O browser pintou o frame com scale(1.05)
      const timer = setTimeout(() => {
        setHasAnimated(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [imageLoaded]);

  // Calcular scale dinamicamente
  const getScale = () => {
    if (!hasAnimated) return 'scale(1.05)';
    if (isHovered) return 'scale(1.05)';
    return 'scale(1)';
  };

  // Get user's first name
  const displayName = user?.user_metadata?.full_name || 
                      user?.user_metadata?.name || 
                      user?.email?.split("@")[0] || 
                      "Usuário";
  const firstName = displayName.split(" ")[0];

  // Skeleton apenas durante loading inicial dos dados
  if (isLoading) {
    return (
      <div className="relative w-full h-48 md:h-64 lg:h-80 overflow-hidden rounded-xl bg-muted animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/20 to-transparent" />
      </div>
    );
  }

  return (
    <>
      <div 
        className="relative w-full h-48 md:h-64 lg:h-80 overflow-hidden rounded-xl"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Skeleton overlay - fade out quando imagem carrega */}
        <div 
          className={`absolute inset-0 bg-muted rounded-xl transition-opacity duration-300 z-10 ${
            imageLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/20 to-transparent animate-pulse" />
        </div>

        {/* Background image - sempre montado, fade in quando carrega */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-300"
          style={{ 
            backgroundImage: `url(${bannerUrl})`,
            backgroundPosition: "center",
            transform: getScale(),
            transformOrigin: "center center",
            transitionProperty: "transform, opacity",
            transitionDuration: "1.5s, 0.3s",
            transitionTimingFunction: "ease-out, ease-in",
            opacity: imageLoaded ? 1 : 0
          }}
        />
        
        {/* Dark overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent pointer-events-none" />
        
        {/* Content */}
        <div className="relative h-full flex flex-col justify-center px-6 md:px-10 lg:px-12">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
            Bem-Vindo à Hiro OS®, {firstName}.
          </h1>
        </div>

        {/* Edit button for admins - hidden on mobile */}
        {isAdmin && !isMobile && (
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
