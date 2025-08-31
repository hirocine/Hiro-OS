import { useState, useMemo, useEffect } from 'react';
import { Project, ProjectFilters, ProjectStats, ProjectStep } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';

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
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        setError('Erro ao carregar projetos');
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
      setError('Erro ao carregar projetos');
    } finally {
      setLoading(false);
    }
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
      separated: updatedProjects.filter(p => p.step === 'separated').length,
      ready_for_pickup: updatedProjects.filter(p => p.step === 'ready_for_pickup').length,
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

  const addProject = async (newProject: Omit<Project, 'id' | 'step' | 'stepHistory'>, selectedEquipment?: any[]) => {
    console.log('🚀 Adding new project:', newProject);
    
    try {
      // Validate required fields
      if (!newProject.name || !newProject.startDate || !newProject.expectedEndDate || !newProject.responsibleName) {
        console.error('❌ Missing required fields:', { 
          name: !!newProject.name, 
          startDate: !!newProject.startDate, 
          expectedEndDate: !!newProject.expectedEndDate, 
          responsibleName: !!newProject.responsibleName 
        });
        throw new Error('Campos obrigatórios estão faltando');
      }

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
        equipment_count: selectedEquipment?.length || newProject.equipmentCount || 0,
        notes: newProject.notes,
        step: 'pending_separation' as const,
        step_history: JSON.stringify([
          {
            step: 'pending_separation' as const,
            timestamp: new Date().toISOString()
          }
        ]),
        // Add new fields for structured project creation
        project_number: (newProject as any).projectNumber,
        company: (newProject as any).company,
        project_name: (newProject as any).projectName,
        responsible_user_id: (newProject as any).responsibleUserId,
        withdrawal_date: (newProject as any).withdrawalDate,
        separation_date: (newProject as any).separationDate,
        recording_type: (newProject as any).recordingType
      };

      console.log('📤 Sending to database:', dbProject);

      const { data, error } = await supabase
        .from('projects')
        .insert([dbProject])
        .select()
        .single();

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      if (data) {
        console.log('✅ Project created successfully:', data);
        
        // Se há equipamentos selecionados, criar os empréstimos
        if (selectedEquipment && selectedEquipment.length > 0) {
          console.log('📦 Creating loans for selected equipment:', selectedEquipment.length);
          
          const loanPromises = selectedEquipment.map(equipment => {
            return supabase
              .from('loans')
              .insert({
                equipment_id: equipment.id,
                equipment_name: equipment.name,
                borrower_name: newProject.responsibleName,
                borrower_email: newProject.responsibleEmail,
                department: newProject.department,
                project: data.name, // Usar o nome do projeto
                loan_date: newProject.startDate,
                expected_return_date: newProject.expectedEndDate,
                status: 'active'
              })
              .select()
              .single();
          });

          await Promise.all(loanPromises);
          console.log('✅ All loans created successfully');
          
          // Aguardar um pouco para que os triggers atualizem o projeto
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Re-buscar o projeto atualizado
          const { data: updatedData } = await supabase
            .from('projects')
            .select('*')
            .eq('id', data.id)
            .single();
            
          if (updatedData) {
            console.log('📄 Project updated with loan info:', updatedData);
            Object.assign(data, updatedData);
          }
        }
        
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
        
        setProjects(prev => {
          console.log('📝 Updating local state with new project');
          return [...prev, projectData];
        });
        
        return projectData;
      }
    } catch (error) {
      console.error('❌ Error adding project:', error);
      throw error;
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
    error,
    addProject,
    updateProject,
    updateProjectStep,
    completeProject,
    archiveProject,
    fetchProjects
  };
}