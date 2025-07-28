import { useState, useMemo, useEffect } from 'react';
import { Project, ProjectFilters, ProjectStats, ProjectStep } from '@/types/project';
import { mockProjects } from '@/data/mockProjects';
import { shouldAutoUpdateToInUse } from '@/lib/projectSteps';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [filters, setFilters] = useState<ProjectFilters>({});

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

  const addProject = (newProject: Omit<Project, 'id' | 'step' | 'stepHistory'>) => {
    const id = 'proj-' + Math.random().toString(36).substr(2, 9);
    const projectWithDefaults = {
      ...newProject,
      id,
      step: 'pending_separation' as const,
      stepHistory: [
        {
          step: 'pending_separation' as const,
          timestamp: new Date().toISOString()
        }
      ]
    };
    setProjects(prev => [...prev, projectWithDefaults]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev =>
      prev.map(project => project.id === id ? { ...project, ...updates } : project)
    );
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
    addProject,
    updateProject,
    updateProjectStep,
    completeProject,
    archiveProject
  };
}