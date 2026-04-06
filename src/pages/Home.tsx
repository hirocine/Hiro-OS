import { ResponsiveContainer } from "@/components/ui/responsive-container";
import { HeroBanner } from "@/components/Home/HeroBanner";
import TodayWidgets from "@/components/Home/TodayWidgets";
import { RecordingsCalendar } from "@/components/Home/RecordingsCalendar";
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
          <div className="w-full h-48 md:h-64 lg:h-80 rounded-xl bg-muted animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-48 bg-muted rounded-lg animate-pulse" />
            <div className="h-48 bg-muted rounded-lg animate-pulse" />
            <div className="h-48 bg-muted rounded-lg animate-pulse" />
          </div>
          <div className="h-[500px] bg-muted rounded-lg animate-pulse" />
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer maxWidth="7xl" className="animate-fade-in">
      <div className="space-y-6">
        <HeroBanner />
        <TodayWidgets />
        <RecordingsCalendar />
        <TeamDirectory />
      </div>
    </ResponsiveContainer>
  );
}
