import { useState, useMemo, useEffect } from 'react';
import { Project, ProjectFilters, ProjectStats, ProjectStep } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { shouldAutoUpdateToInUse } from '@/lib/projectSteps';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filters, setFilters] = useState<ProjectFilters>({});
  const [loading, setLoading] = useState(true);

  // Fetch projects from Supabase
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        return;
      }

      // Transform database data to match Project interface
      const projectData = (data || []).map(item => ({
        ...item,
        startDate: item.start_date,
        expectedEndDate: item.expected_end_date,
        actualEndDate: item.actual_end_date,
        responsibleName: item.responsible_name,
        responsibleEmail: item.responsible_email,
        equipmentCount: item.equipment_count || 0,
        loanIds: item.loan_ids || [],
        stepHistory: (item.step_history as any) || []
      })) as Project[];
      setProjects(projectData);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update project status and steps based on current date and automation rules
  const updatedProjects = useMemo(() => {
    return projects.map(project => {
      let updatedProject = { ...project };
      
      // Auto-update step from "separated" to "in_use" if project start date has passed
      if (shouldAutoUpdateToInUse(project.startDate, project.step)) {
        updatedProject = {
          ...updatedProject,
          step: 'in_use',
          stepHistory: [
            ...project.stepHistory,
            {
              step: 'in_use',
              timestamp: new Date().toISOString(),
              notes: 'Auto-atualizado: projeto iniciado'
            }
          ]
        };
      }
      
      return updatedProject;
    });
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
      separated: updatedProjects.filter(p => p.step === 'separated').length,
      in_use: updatedProjects.filter(p => p.step === 'in_use').length,
      pending_verification: updatedProjects.filter(p => p.step === 'pending_verification').length,
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

  const addProject = async (newProject: Omit<Project, 'id' | 'step' | 'stepHistory'>) => {
    try {
      // Transform to database format
      const dbProject = {
        name: newProject.name,
        description: newProject.description,
        start_date: newProject.startDate,
        expected_end_date: newProject.expectedEndDate,
        responsible_name: newProject.responsibleName,
        responsible_email: newProject.responsibleEmail,
        department: newProject.department,
        status: newProject.status,
        equipment_count: newProject.equipmentCount || 0,
        notes: newProject.notes,
        step: 'pending_separation' as const,
        step_history: [
          {
            step: 'pending_separation' as const,
            timestamp: new Date().toISOString()
          }
        ]
      };

      const { data, error } = await supabase
        .from('projects')
        .insert([dbProject])
        .select()
        .single();

      if (error) {
        console.error('Error adding project:', error);
        return;
      }

      if (data) {
        const projectData = {
          ...data,
          startDate: data.start_date,
          expectedEndDate: data.expected_end_date,
          actualEndDate: data.actual_end_date,
          responsibleName: data.responsible_name,
          responsibleEmail: data.responsible_email,
          equipmentCount: data.equipment_count || 0,
          loanIds: data.loan_ids || [],
          stepHistory: (data.step_history as any) || []
        } as Project;
        setProjects(prev => [...prev, projectData]);
      }
    } catch (error) {
      console.error('Error adding project:', error);
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      // Transform updates to database format
      const dbUpdates: any = {};
      if (updates.startDate) dbUpdates.start_date = updates.startDate;
      if (updates.expectedEndDate) dbUpdates.expected_end_date = updates.expectedEndDate;
      if (updates.actualEndDate) dbUpdates.actual_end_date = updates.actualEndDate;
      if (updates.responsibleName) dbUpdates.responsible_name = updates.responsibleName;
      if (updates.responsibleEmail) dbUpdates.responsible_email = updates.responsibleEmail;
      if (updates.equipmentCount !== undefined) dbUpdates.equipment_count = updates.equipmentCount;
      if (updates.loanIds) dbUpdates.loan_ids = updates.loanIds;
      if (updates.stepHistory) dbUpdates.step_history = updates.stepHistory;
      
      // Direct mappings
      ['name', 'description', 'department', 'status', 'notes', 'step'].forEach(field => {
        if (updates[field as keyof Project] !== undefined) {
          dbUpdates[field] = updates[field as keyof Project];
        }
      });

      const { error } = await supabase
        .from('projects')
        .update(dbUpdates)
        .eq('id', id);

      if (error) {
        console.error('Error updating project:', error);
        return;
      }

      setProjects(prev =>
        prev.map(project => project.id === id ? { ...project, ...updates } : project)
      );
    } catch (error) {
      console.error('Error updating project:', error);
    }
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
    addProject,
    updateProject,
    updateProjectStep,
    completeProject,
    archiveProject
  };
}