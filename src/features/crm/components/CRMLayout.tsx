import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PipelineBoard } from './pipeline/PipelineBoard';
import { ContactsList } from './contacts/ContactsList';
import { ActivitiesList } from './activities/ActivitiesList';
import { CRMDashboard } from './CRMDashboard';
import { Kanban, Users, Activity, BarChart3 } from 'lucide-react';

export function CRMLayout() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="pipeline" className="gap-1.5">
            <Kanban className="h-4 w-4" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="contatos" className="gap-1.5">
            <Users className="h-4 w-4" />
            Contatos
          </TabsTrigger>
          <TabsTrigger value="atividades" className="gap-1.5">
            <Activity className="h-4 w-4" />
            Atividades
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-6">
          <PipelineBoard />
        </TabsContent>
        <TabsContent value="contatos" className="mt-6">
          <ContactsList />
        </TabsContent>
        <TabsContent value="atividades" className="mt-6">
          <ActivitiesList />
        </TabsContent>
        <TabsContent value="dashboard" className="mt-6">
          <CRMDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
