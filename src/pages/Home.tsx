import { ResponsiveContainer } from "@/components/ui/responsive-container";
import { HeroBanner } from "@/components/Home/HeroBanner";
import { AIAssistant } from "@/components/Home/AIAssistant";

export default function Home() {
  return (
    <ResponsiveContainer maxWidth="7xl">
      <div className="space-y-6">
        {/* Hero Banner */}
        <HeroBanner />

        {/* Main content sections */}
        <div className="space-y-6">
          {/* AI Assistant */}
          <AIAssistant />
        </div>
      </div>
    </ResponsiveContainer>
  );
}
