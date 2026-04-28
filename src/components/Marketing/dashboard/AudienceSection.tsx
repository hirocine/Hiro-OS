import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MapPin, Globe } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { GenderAgeHero } from './GenderAgeHero';
import { CityRanking } from './CityRanking';
import { LocaleList } from './LocaleList';
import { formatTimeAgo, topEntries } from '@/lib/marketing-dashboard-utils';

interface Audience {
  captured_at: string;
  gender_age: Record<string, number>;
  cities: Record<string, number>;
  locales: Record<string, number>;
}

interface Props {
  audience: Audience | null;
  syncingAudience: boolean;
  onSyncAudience: () => void;
}

export function AudienceSection({ audience, syncingAudience, onSyncAudience }: Props) {
  return (
    <Card className="shadow-card overflow-hidden">
      <CardHeader className="pb-4 flex-row items-start justify-between space-y-0 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base sm:text-lg">Sobre sua audiência</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Quem te segue no Instagram
            </p>
          </div>
        </div>
        {audience && (
          <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            Atualizado {formatTimeAgo(audience.captured_at).text}
          </span>
        )}
      </CardHeader>
      <CardContent>
        {!audience ? (
          <EmptyState
            icon={Users}
            title="Sem dados de audiência ainda"
            description="A demografia é atualizada semanalmente. Você pode forçar a primeira sincronização agora."
            action={{
              label: syncingAudience ? 'Sincronizando...' : 'Sincronizar audiência agora',
              onClick: onSyncAudience,
            }}
          />
        ) : (
          <div className="space-y-6">
            <GenderAgeHero audience={audience} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-semibold">Top cidades</h4>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {topEntries(audience.cities, 100).length} cidades
                  </span>
                </div>
                <CityRanking cities={audience.cities} />
              </div>

              <div className="lg:col-span-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-semibold">Idiomas falados</h4>
                  </div>
                </div>
                <LocaleList locales={audience.locales} />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
