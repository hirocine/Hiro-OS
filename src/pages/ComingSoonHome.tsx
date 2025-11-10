import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ComingSoonHome() {
  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-12rem)]">
      <Card className="max-w-2xl w-full">
        <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            <Construction className="w-24 h-24 text-primary relative" />
          </div>
          
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Em Breve
          </h1>
          
          <p className="text-lg text-muted-foreground mb-6">
            Estamos preparando algo especial para você.
          </p>
          
          <p className="text-sm text-muted-foreground">
            Enquanto isso, acesse o{" "}
            <a 
              href="/dashboard" 
              className="text-primary hover:underline font-medium"
            >
              Dashboard
            </a>
            {" "}para visualizar suas estatísticas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
