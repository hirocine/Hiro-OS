import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface EquipmentProjectInfo {
  equipmentId: string;
  projectCount: number;
  activeProjects: Array<{
    id: string;
    name: string;
    status: string;
  }>;
}

export function useEquipmentProjects(equipmentIds: string[]) {
  const [projectInfo, setProjectInfo] = useState<Map<string, EquipmentProjectInfo>>(new Map());
  const [loading, setLoading] = useState(false);

  const fetchProjectCounts = async () => {
    if (!equipmentIds.length) return;

    try {
      setLoading(true);
      const projectCountPromises = equipmentIds.map(async (equipmentId) => {
        // Get project count using the database function
        const { data: count, error: countError } = await supabase
          .rpc('get_equipment_project_count', { equipment_id: equipmentId });

        if (countError) {
          logger.error('Failed to get project count for equipment', {
            module: 'equipment-projects',
            action: 'get_project_count',
            data: { equipmentId },
            error: countError
          });
          return { equipmentId, projectCount: 0, activeProjects: [] };
        }

        // Get active project details by matching project names/IDs
        const { data: loans, error: loansError } = await supabase
          .from('loans')
          .select('id, project')
          .eq('equipment_id', equipmentId)
          .eq('status', 'active');

        if (loansError) {
          logger.error('Failed to get active loans for equipment', {
            module: 'equipment-projects',
            action: 'get_active_loans',
            data: { equipmentId },
            error: loansError
          });
          return { equipmentId, projectCount: count || 0, activeProjects: [] };
        }

        // Get project details for active loans
        const projectPromises = (loans || []).map(async (loan) => {
          // Try to find project by name first, then by ID
          const { data: projectByName, error: nameError } = await supabase
            .from('projects')
            .select('id, name, status')
            .eq('name', loan.project)
            .eq('status', 'active')
            .single();

          if (!nameError && projectByName) {
            return projectByName;
          }

          // Try by ID if name lookup fails
          const { data: projectById, error: idError } = await supabase
            .from('projects')
            .select('id, name, status')
            .eq('id', loan.project)
            .eq('status', 'active')
            .single();

          return projectById || null;
        });

        const projectResults = await Promise.all(projectPromises);
        const activeProjects = projectResults.filter(Boolean) as Array<{ id: string; name: string; status: string }>;

        return {
          equipmentId,
          projectCount: count || 0,
          activeProjects
        };
      });

      const results = await Promise.all(projectCountPromises);
      
      const newProjectInfo = new Map<string, EquipmentProjectInfo>();
      results.forEach(result => {
        newProjectInfo.set(result.equipmentId, result);
      });

      setProjectInfo(newProjectInfo);
    } catch (error) {
      logger.error('Failed to fetch project counts', {
        module: 'equipment-projects',
        action: 'fetch_project_counts',
        data: { equipmentIds },
        error: error instanceof Error ? error : String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  // Key on the contents of the array, not its identity, so re-renders that
  // produce a new array with the same ids don't re-fetch.
  const equipmentIdsKey = equipmentIds.join(',');
  useEffect(() => {
    fetchProjectCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchProjectCounts is recreated each render but closes over equipmentIds, which is what equipmentIdsKey already tracks.
  }, [equipmentIdsKey]);

  const getProjectCount = (equipmentId: string): number => {
    return projectInfo.get(equipmentId)?.projectCount || 0;
  };

  const getActiveProjects = (equipmentId: string) => {
    return projectInfo.get(equipmentId)?.activeProjects || [];
  };

  const refetch = () => {
    fetchProjectCounts();
  };

  return {
    projectInfo,
    loading,
    getProjectCount,
    getActiveProjects,
    refetch
  };
}