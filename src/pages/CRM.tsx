import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { CRMLayout } from '@/features/crm/components/CRMLayout';

export default function CRM() {
  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[{ label: 'CRM' }]} />
      <CRMLayout />
    </div>
  );
}
