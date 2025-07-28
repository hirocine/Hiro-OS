import { useState, useMemo } from 'react';
import { Project, ProjectFilters, ProjectStats } from '@/types/project';
import { mockProjects } from '@/data/mockProjects';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [filters, setFilters] = useState<ProjectFilters>({});

  // Update project status based on current date and completion
  const updatedProjects = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return projects.map(project => {
      if (project.status === 'active' && project.expectedEndDate < today && !project.actualEndDate) {
        return { ...project, status: 'active' }; // Keep as active even if overdue
      }
      return project;
    }) as Project[];
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

    return {
      total,
      active,
      completed,
      archived,
      totalEquipmentOut
    };
  }, [updatedProjects]);

  const addProject = (newProject: Omit<Project, 'id'>) => {
    const id = 'proj-' + Math.random().toString(36).substr(2, 9);
    setProjects(prev => [...prev, { ...newProject, id }]);
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

  return {
    projects: filteredProjects,
    allProjects: updatedProjects,
    filters,
    setFilters,
    stats,
    addProject,
    updateProject,
    completeProject,
    archiveProject
  };
}