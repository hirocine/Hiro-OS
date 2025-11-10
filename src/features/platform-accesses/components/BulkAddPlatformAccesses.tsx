import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePlatformAccesses } from '../hooks/usePlatformAccesses';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

const accessesToAdd = [
  {
    platformName: "Framer",
    platformUrl: "https://framer.com",
    username: "plataforma@hiro.film",
    password: "Login via Inbox Email",
    category: "site" as const,
    isFavorite: false,
    isActive: true
  },
  {
    platformName: "Pinterest",
    platformUrl: "https://pinterest.com",
    username: "plataforma@hiro.film",
    password: "P·HiroFilm5044",
    category: "social_media" as const,
    isFavorite: false,
    isActive: true
  },
  {
    platformName: "Linktree",
    platformUrl: "https://linktr.ee",
    username: "gabriel@hiro.film",
    password: "L·HiroFilm5044",
    category: "social_media" as const,
    isFavorite: false,
    isActive: true
  },
  {
    platformName: "Behance",
    platformUrl: "https://behance.net",
    username: "plataforma@hiro.film",
    password: "*9$%n-QhsRKa2q%",
    category: "social_media" as const,
    isFavorite: false,
    isActive: true
  },
  {
    platformName: "Instagram",
    platformUrl: "https://instagram.com",
    username: "hiro.film",
    password: "I·HiroFilm5044",
    category: "social_media" as const,
    isFavorite: false,
    isActive: true
  }
];

interface ImportResult {
  platformName: string;
  success: boolean;
  error?: string;
}

export function BulkAddPlatformAccesses() {
  const { addAccess } = usePlatformAccesses();
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);

  const handleImport = async () => {
    setIsImporting(true);
    setProgress(0);
    setResults([]);
    
    const newResults: ImportResult[] = [];

    for (let i = 0; i < accessesToAdd.length; i++) {
      const access = accessesToAdd[i];
      
      try {
        await addAccess(access);
        newResults.push({
          platformName: access.platformName,
          success: true
        });
      } catch (error) {
        newResults.push({
          platformName: access.platformName,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
      
      setProgress(i + 1);
      setResults([...newResults]);
    }

    setIsImporting(false);
  };

  return (
    <Card className="p-6 mb-6 bg-primary/5 border-primary/20">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Importação em Massa</h3>
            <p className="text-sm text-muted-foreground">
              {accessesToAdd.length} acessos prontos para importar
            </p>
          </div>
          <Button 
            onClick={handleImport} 
            disabled={isImporting || results.length === accessesToAdd.length}
          >
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isImporting ? `Importando... ${progress}/${accessesToAdd.length}` : `Importar ${accessesToAdd.length} Acessos`}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Resultados:</p>
            <div className="space-y-1">
              {results.map((result, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  {result.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                    {result.platformName}
                  </span>
                  {result.error && (
                    <span className="text-xs text-muted-foreground">- {result.error}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
