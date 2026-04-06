import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RecordingEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  allDay: boolean;
  location: string | null;
  description: string | null;
  colorId: string | null;
}

const RECORDINGS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-recordings`;

// Extract prefix type from summary: "REC: Mascavo" → "REC"
export function getEventType(summary: string): "REC" | "PRE" | "VT" | "EDIT" | "OTHER" {
  if (summary.startsWith("REC:")) return "REC";
  if (summary.startsWith("Pré-Agenda:") || summary.startsWith("Pre-Agenda:") || summary.startsWith("PRE:")) return "PRE";
  if (summary.startsWith("VT:")) return "VT";
  if (summary.startsWith("EDIT:")) return "EDIT";
  return "OTHER";
}

// Extract clean title (remove prefix)
export function getEventTitle(summary: string): string {
  return summary.replace(/^(REC:|Pré-Agenda:|Pre-Agenda:|PRE:|VT:|EDIT:)\s*/, "").trim();
}

export function useRecordingsCalendar(timeMin?: string, timeMax?: string) {
  return useQuery({
    queryKey: ["recordings-calendar", timeMin, timeMax],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const params = new URLSearchParams();
      if (timeMin) params.set("timeMin", timeMin);
      if (timeMax) params.set("timeMax", timeMax);

      const res = await fetch(`${RECORDINGS_URL}?${params}`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch recordings");
      const data = await res.json();
      return data.events as RecordingEvent[];
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  });
}

export function useRecordingsToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const timeMin = today.toISOString();
  const timeMax = tomorrow.toISOString();

  return useRecordingsCalendar(timeMin, timeMax);
}
