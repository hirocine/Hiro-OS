import { Calendar, Construction } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RecordingCalendar() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <Calendar className="h-5 w-5 text-orange-500" />
          </div>
          Calendário de Gravações
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Construction className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Em Desenvolvimento</h3>
          <p className="text-muted-foreground max-w-md">
            O calendário de gravações e esteira de projetos está sendo desenvolvido.
            Em breve você poderá visualizar todos os projetos de gravação aqui.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
