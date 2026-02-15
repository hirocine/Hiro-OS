import { ResponsiveContainer } from "@/components/ui/responsive-container";
import { HeroBanner } from "@/components/Home/HeroBanner";
import { AIAssistant } from "@/components/Home/AIAssistant";
import { TeamDirectory } from "@/components/Home/TeamDirectory";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useTeamMembers } from "@/hooks/useTeamMembers";

export default function Home() {
  const { isLoading: bannerLoading } = useSiteSettings();
  const { isLoading: teamLoading } = useTeamMembers();

  if (bannerLoading && teamLoading) {
    return (
      <ResponsiveContainer maxWidth="7xl">
        <div className="space-y-6">
          {/* Banner skeleton */}
          <div className="w-full h-48 md:h-64 lg:h-80 rounded-xl bg-muted animate-pulse" />
          {/* AI Assistant skeleton */}
          <div className="h-[220px] bg-muted rounded-lg animate-pulse" />
          {/* Team skeleton */}
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer maxWidth="7xl" className="animate-fade-in">
      <div className="space-y-6">
        <HeroBanner />
        <div className="space-y-6">
          <AIAssistant />
          <TeamDirectory />
        </div>
      </div>
    </ResponsiveContainer>
  );
}
