import { useState, useMemo, useEffect } from 'react';
import { Project, ProjectFilters, ProjectStats, ProjectStep, StepChange, ProjectStatus } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { handleLegacyError, DatabaseError, ValidationError, wrapAsync } from '@/lib/errors';
import type { Result } from '@/types/common';
import type { ProjectDbRow, ProjectDbInsert, ProjectDbUpdate } from '@/types/database';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filters, setFilters] = useState<ProjectFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects from Supabase
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    logger.apiCall('GET', '/projects');
    
    const result = await wrapAsync(async () => {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.database('select', 'projects', false, error);
        throw new DatabaseError(`Failed to fetch projects: ${error.message}`, 'select', 'projects');
      }

      // Transform database data to match Project interface
      const projectData = (data as ProjectDbRow[] || []).map((item): Project => ({
        ...item,
        startDate: item.start_date,
        expectedEndDate: item.expected_end_date,
        actualEndDate: item.actual_end_date,
        responsibleName: item.responsible_name,
        responsibleEmail: item.responsible_email,
        equipmentCount: item.equipment_count || 0,
        loanIds: item.loan_ids || [],
        stepHistory: Array.isArray(item.step_history) ? (item.step_history as unknown) as StepChange[] : [],
      }));
      
      logger.database('select', 'projects', true);
      logger.apiResponse('GET', '/projects', true, { count: projectData.length });
      
      setProjects(projectData);
      return projectData;
    });

    if (result.error) {
      setError(result.error.message);
    }
    
    setLoading(false);
  };

  // Projects without client-side auto-updates to prevent inconsistencies
  const updatedProjects = useMemo(() => {
    return projects;
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return updatedProjects.filter((project) => {
      if (filters.status && project.status !== filters.status) return false;
      if (filters.responsible) {
        const searchTerm = filters.responsible.toLowerCase();
        if (!project.responsibleName.toLowerCase().includes(searchTerm)) return false;
      }
      if (filters.name) {
        const searchTerm = filters.name.toLowerCase();
        if (!project.name.toLowerCase().includes(searchTerm)) return false;
      }
      return true;
    });
  }, [updatedProjects, filters]);

  const stats: ProjectStats = useMemo(() => {
    const total = updatedProjects.length;
    const active = updatedProjects.filter(project => project.status === 'active').length;
    const completed = updatedProjects.filter(project => project.status === 'completed').length;
    const archived = updatedProjects.filter(project => project.status === 'archived').length;
    const totalEquipmentOut = updatedProjects
      .filter(project => project.status === 'active')
      .reduce((sum, project) => sum + project.equipmentCount, 0);

    const byStep = {
      pending_separation: updatedProjects.filter(p => p.step === 'pending_separation').length,
      ready_for_pickup: updatedProjects.filter(p => p.step === 'ready_for_pickup').length,
      in_use: updatedProjects.filter(p => p.step === 'in_use').length,
      pending_verification: updatedProjects.filter(p => p.step === 'pending_verification').length,
      office_receipt: updatedProjects.filter(p => p.step === 'office_receipt').length,
      verified: updatedProjects.filter(p => p.step === 'verified').length,
    };

    return {
      total,
      active,
      completed,
      archived,
      totalEquipmentOut,
      byStep
    };
  }, [updatedProjects]);

  const addProject = async (newProject: Omit<Project, 'id' | 'step' | 'stepHistory'>, selectedEquipment?: unknown[]): Promise<Result<Project>> => {
    logger.userAction('create_project', undefined, { projectName: newProject.name });
    
    const result = await wrapAsync(async () => {
      // Validate required fields
      if (!newProject.name || !newProject.startDate || !newProject.expectedEndDate || !newProject.responsibleName) {
        logger.warn('Project creation attempted with missing required fields', {
          module: 'projects',
          data: { 
            name: !!newProject.name, 
            startDate: !!newProject.startDate, 
            expectedEndDate: !!newProject.expectedEndDate, 
            responsibleName: !!newProject.responsibleName 
          }
        });
        throw new ValidationError('Required fields are missing: name, startDate, expectedEndDate, responsibleName');
      }

      // Transform to database format
      const dbProject: ProjectDbInsert = {
        name: newProject.name,
        description: newProject.description,
        start_date: newProject.startDate,
        expected_end_date: newProject.expectedEndDate,
        responsible_name: newProject.responsibleName,
        responsible_email: newProject.responsibleEmail,
        department: newProject.department,
        status: newProject.status,
        equipment_count: Array.isArray(selectedEquipment) ? selectedEquipment.length : (newProject.equipmentCount || 0),
        notes: newProject.notes,
        loan_ids: [],
        step: 'pending_separation',
        step_history: JSON.stringify([
          {
            step: 'pending_separation',
            timestamp: new Date().toISOString()
          }
        ]),
        project_number: (newProject as Record<string, unknown>).projectNumber as string,
        company: (newProject as Record<string, unknown>).company as string,
        project_name: (newProject as Record<string, unknown>).projectName as string,
        responsible_user_id: (newProject as Record<string, unknown>).responsibleUserId as string,
        withdrawal_date: (newProject as Record<string, unknown>).withdrawalDate as string,
        separation_date: (newProject as Record<string, unknown>).separationDate as string,
        recording_type: (newProject as Record<string, unknown>).recordingType as string
      };

      logger.apiCall('POST', '/projects', dbProject);

      const { data, error } = await supabase
        .from('projects')
        .insert([dbProject])
        .select()
        .single();

      if (error) {
        logger.database('insert', 'projects', false, error);
        throw new DatabaseError(`Failed to create project: ${error.message}`, 'insert', 'projects');
      }

      if (data) {
        logger.database('insert', 'projects', true);
        
        // Create loans for selected equipment
        if (Array.isArray(selectedEquipment) && selectedEquipment.length > 0) {
          logger.debug('Creating loans for selected equipment', {
            module: 'projects',
            data: { projectId: data.id, equipmentCount: selectedEquipment.length }
          });
          
          const loanPromises = selectedEquipment.map((equipment: Record<string, unknown>) => {
            return supabase
              .from('loans')
              .insert({
                equipment_id: equipment.id as string,
                equipment_name: equipment.name as string,
                borrower_name: newProject.responsibleName,
                borrower_email: newProject.responsibleEmail,
                department: newProject.department,
                project: data.name,
                loan_date: newProject.startDate,
                expected_return_date: newProject.expectedEndDate,
                status: 'active'
              })
              .select()
              .single();
          });

          await Promise.all(loanPromises);
          logger.debug('All loans created successfully', { module: 'projects' });
          
          // Wait for triggers to update the project
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Re-fetch updated project
          const { data: updatedData } = await supabase
            .from('projects')
            .select('*')
            .eq('id', data.id)
            .single();
            
          if (updatedData) {
            Object.assign(data, updatedData);
          }
        }
        
        const projectData: Project = {
          id: data.id,
          name: data.name,
          description: data.description,
          startDate: data.start_date,
          expectedEndDate: data.expected_end_date,
          actualEndDate: data.actual_end_date,
          status: data.status as ProjectStatus,
          step: data.step as ProjectStep,
          responsibleName: data.responsible_name,
          responsibleEmail: data.responsible_email,
          department: data.department,
          equipmentCount: data.equipment_count || 0,
          loanIds: data.loan_ids || [],
          stepHistory: Array.isArray(data.step_history) ? (data.step_history as unknown) as StepChange[] : [],
          notes: data.notes,
          projectNumber: data.project_number,
          company: data.company,
          projectName: data.project_name,
          responsibleUserId: data.responsible_user_id,
          withdrawalDate: data.withdrawal_date,
          separationDate: data.separation_date,
          recordingType: data.recording_type,
          withdrawalUserId: data.withdrawal_user_id,
          withdrawalUserName: data.withdrawal_user_name,
          withdrawalTime: data.withdrawal_time
        };
        
        setProjects(prev => [...prev, projectData]);
        
        logger.apiResponse('POST', '/projects', true, { projectId: data.id });
        
        return projectData;
      }

      throw new DatabaseError('Project creation returned no data', 'insert', 'projects');
    });

    return result.error 
      ? { success: false, error: result.error.message }
      : { success: true, data: result.data! };
  };

  const updateProject = async (id: string, updates: Partial<Project>): Promise<Result<void>> => {
    logger.userAction('update_project', undefined, { projectId: id, updates });
    
    const result = await wrapAsync(async () => {
      // Transform updates to database format
      const dbUpdates: Partial<ProjectDbUpdate> = {};
      if (updates.startDate) dbUpdates.start_date = updates.startDate;
      if (updates.expectedEndDate) dbUpdates.expected_end_date = updates.expectedEndDate;
      if (updates.actualEndDate) dbUpdates.actual_end_date = updates.actualEndDate;
      if (updates.responsibleName) dbUpdates.responsible_name = updates.responsibleName;
      if (updates.responsibleEmail !== undefined) dbUpdates.responsible_email = updates.responsibleEmail;
      if (updates.equipmentCount !== undefined) dbUpdates.equipment_count = updates.equipmentCount;
      if (updates.loanIds) dbUpdates.loan_ids = updates.loanIds;
      if (updates.stepHistory) dbUpdates.step_history = JSON.stringify(updates.stepHistory);
      
      // Direct mappings
      const directFields = ['name', 'description', 'department', 'status', 'notes', 'step'] as const;
      directFields.forEach(field => {
        if (updates[field] !== undefined) {
          (dbUpdates as Record<string, unknown>)[field] = updates[field];
        }
      });

      const { error } = await supabase
        .from('projects')
        .update(dbUpdates)
        .eq('id', id);

      if (error) {
        logger.database('update', 'projects', false, error);
        throw new DatabaseError(`Failed to update project: ${error.message}`, 'update', 'projects');
      }

      setProjects(prev =>
        prev.map(project => project.id === id ? { ...project, ...updates } : project)
      );
      
      logger.database('update', 'projects', true);
    });

    return result.error 
      ? { success: false, error: result.error.message }
      : { success: true, data: undefined };
  };

  const completeProject = (projectId: string, notes?: string) => {
    const completionDate = new Date().toISOString().split('T')[0];
    updateProject(projectId, {
      status: 'completed',
      actualEndDate: completionDate,
      notes: notes
    });
  };

  const archiveProject = (projectId: string) => {
    updateProject(projectId, {
      status: 'archived'
    });
  };

  const updateProjectStep = (projectId: string, newStep: ProjectStep, notes?: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const stepChange = {
      step: newStep,
      timestamp: new Date().toISOString(),
      notes
    };

    const updates: Partial<Project> = {
      step: newStep,
      stepHistory: [...project.stepHistory, stepChange]
    };

    // If step is "verified", automatically complete the project
    if (newStep === 'verified') {
      updates.status = 'completed';
      updates.actualEndDate = new Date().toISOString().split('T')[0];
    }

    updateProject(projectId, updates);
  };

  return {
    projects: filteredProjects,
    allProjects: updatedProjects,
    filters,
    setFilters,
    stats,
    loading,
    error,
    addProject,
    updateProject,
    updateProjectStep,
    completeProject,
    archiveProject,
    fetchProjects
  };
}