import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
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

  const { data: weather } = useQuery({
    queryKey: ['weather-barueri'],
    queryFn: async () => {
      const res = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=-23.5087&longitude=-46.8737&daily=temperature_2m_max,precipitation_probability_max,weathercode&current_weather=true&timezone=America/Sao_Paulo&forecast_days=3'
      );
      return res.json();
    },
    staleTime: 1000 * 60 * 30,
  });

  const todayISO = new Date().toISOString();
  const futureISO = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recordings = [] } = useRecordingsCalendar(todayISO, futureISO);
  const nextRec = recordings.find(e => e.summary.startsWith('REC:'));

  // Determine banner image URL
  const bannerUrl = bannerSettings?.url || defaultBanner;

  // Pré-carregar a imagem antes de exibir
  useEffect(() => {
    if (!isLoading && bannerUrl) {
      setImageLoaded(false);
      setHasAnimated(false);
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.src = bannerUrl;
    }
  }, [bannerUrl, isLoading]);

  // Animação de entrada
  useEffect(() => {
    if (imageLoaded) {
      const timer = setTimeout(() => {
        setHasAnimated(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [imageLoaded]);

  const getScale = () => {
    if (!hasAnimated) return 'scale(1.05)';
    if (isHovered) return 'scale(1.05)';
    return 'scale(1)';
  };

  function getWeatherIcon(code: number): string {
    if (code === 0) return '☀️';
    if (code <= 2) return '⛅';
    if (code <= 3) return '☁️';
    if (code <= 67) return '🌧️';
    if (code <= 82) return '🌦️';
    return '⛈️';
  }

  function getCountdown(dateStr: string): string {
    const target = parseISO(dateStr);
    const now = new Date();
    const days = differenceInDays(target, now);
    if (days > 1) return `em ${days} dias`;
    if (days === 1) return 'amanhã';
    const hours = differenceInHours(target, now);
    if (hours > 0) return `em ${hours}h`;
    return 'hoje';
  }

  // Get user's first name
  const displayName = user?.user_metadata?.full_name || 
                      user?.user_metadata?.name || 
                      user?.email?.split("@")[0] || 
"Usuário";
  const firstName = displayName.split(" ")[0];

  // Skeleton apenas durante loading inicial dos dados
  if (isLoading) {
    return (
      <div className="relative w-full h-48 md:h-64 lg:h-80 overflow-hidden  bg-[hsl(var(--ds-bg))] animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/20 to-transparent" />
      </div>
    );
  }

  return (
    <>
      <div 
        className="relative w-full h-48 md:h-64 lg:h-80 overflow-hidden "
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Skeleton overlay */}
        <div 
          className={`absolute inset-0 bg-[hsl(var(--ds-bg))]  transition-opacity duration-300 z-10 ${
            imageLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/20 to-transparent animate-pulse" />
        </div>

        {/* Background image */}
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
        <div className="relative h-full flex flex-col justify-between px-6 md:px-10 lg:px-12 py-6 md:py-8">
          <div />
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
            Bem-Vindo à Hiro OS®, {firstName}.
          </h1>

          <div className={cn(
"flex items-end justify-between w-full mt-auto pt-8 transition-all duration-700 ease-out",
            (nextRec || weather?.current_weather)
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2 pointer-events-none"
          )}>
              {nextRec ? (
                <div className={cn(
"flex items-center gap-2 text-white/90 text-xs md:text-sm bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5 transition-all duration-500 delay-300",
                  nextRec ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                )}>
                  <span>🎬</span>
                  <span className="text-white/60">Próxima gravação</span>
                  <span className="font-medium truncate max-w-[150px] md:max-w-[200px]">
                    {getEventTitle(nextRec.summary)}
                  </span>
                  <span className="text-white/60">· {getCountdown(nextRec.start)}</span>
                </div>
              ) : <div />}

              {weather?.current_weather ? (
                <div className={cn(
"flex items-center gap-2 transition-all duration-500 delay-500",
                  weather?.current_weather ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                )}>
                  <div className="flex items-center gap-1.5 text-white/90 text-xs md:text-sm bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5">
                    <span>{getWeatherIcon(weather.current_weather.weathercode)}</span>
                    <span className="font-medium">{Math.round(weather.current_weather.temperature)}°</span>
                    <span className="text-white/60">Barueri</span>
                  </div>

                  {weather.daily?.weathercode?.[1] !== undefined && (
                    <>
                      <div className="w-px h-4 bg-white/20" />
                      <div className="flex items-center gap-1.5 text-white/90 text-xs md:text-sm bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5">
                        <span className="text-white/60">amanhã</span>
                        <span>{getWeatherIcon(weather.daily.weathercode[1])}</span>
                        <span className="font-medium">{Math.round(weather.daily.temperature_2m_max[1])}°</span>
                        {weather.daily.precipitation_probability_max[1] > 30 && (
                          <span className="text-blue-300/80">💧{weather.daily.precipitation_probability_max[1]}%</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : <div />}
          </div>
        </div>

        {/* Edit button for admins - hidden on mobile */}
        {isAdmin && !isMobile && (
          <button
            type="button"
            className="btn sm absolute top-4 right-4 opacity-80 hover:opacity-100 transition-opacity"
            onClick={() => setShowCropper(true)}
          >
            <Settings className="h-4 w-4" />
            Editar Banner
          </button>
        )}
      </div>

      <BannerCropperDialog
        open={showCropper}
        onOpenChange={setShowCropper}
      />
    </>
  );
}
