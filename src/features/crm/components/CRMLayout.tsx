import { useLocation } from 'react-router-dom';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { PipelineBoard } from './pipeline/PipelineBoard';
import { ContactsList } from './contacts/ContactsList';
import { ActivitiesList } from './activities/ActivitiesList';
import { CRMDashboard } from './CRMDashboard';

type CRMTab = 'pipeline' | 'contatos' | 'atividades' | 'dashboard';

export function CRMLayout() {
  const location = useLocation();
  const segment = location.pathname.split('/')[2] as CRMTab | undefined;
  const tab: CRMTab = (['pipeline', 'contatos', 'atividades', 'dashboard'] as CRMTab[]).includes(
    segment as CRMTab
  )
    ? (segment as CRMTab)
    : 'pipeline';

  return (
    <Tabs value={tab}>
      <TabsContent value="pipeline">
        <PipelineBoard />
      </TabsContent>
      <TabsContent value="contatos">
        <ContactsList />
      </TabsContent>
      <TabsContent value="atividades">
        <ActivitiesList />
      </TabsContent>
      <TabsContent value="dashboard">
        <CRMDashboard />
      </TabsContent>
    </Tabs>
  );
}
