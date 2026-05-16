import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Project, ProjectStep, ProjectStatus, StepChange } from '@/types/project';
import { useAuthContext } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { handleLegacyError, DatabaseError, NotFoundError, wrapAsync } from '@/lib/errors';
import type { Result } from '@/types/common';
import type { ProjectDbRow, ProjectDbUpdate } from '@/types/database';

export function useProjectDetails(projectId: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { logAuditEntry } = useAuthContext();

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: fetch helper closes over the listed deps; missing deps are stable refs/setters
  }, [projectId]);

  const fetchProject = async () => {
    logger.apiCall('GET', `/projects/${projectId}`);
    
    const result = await wrapAsync(async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (fetchError) {
        logger.database('select', 'projects', false, fetchError);
        if (fetchError.code === 'PGRST116') {
          throw new NotFoundError(`Project with id ${projectId} not found`);
        }
        throw new DatabaseError(`Failed to fetch project: ${fetchError.message}`, 'select', 'projects');
      }

      if (data) {
        const projectData: Project = {
          id: data.id,
          name: data.name,
          description: data.description,
          startDate: data.start_date,
          expectedEndDate: data.expected_end_date,
          actualEndDate: data.actual_end_date,
          status: data.status as ProjectStatus,
          step: data.step as ProjectStep,
          stepHistory: (() => {
            try {
              if (typeof data.step_history === 'string') {
                return JSON.parse(data.step_history) || [];
              }
              return Array.isArray(data.step_history) ? data.step_history : [];
            } catch (parseError) {
              logger.warn('Error parsing step_history', { 
                module: 'projects', 
                data: { projectId, stepHistory: data.step_history } 
              });
              return [];
            }
          })(),
          responsibleName: data.responsible_name,
          responsibleEmail: data.responsible_email,
          department: data.department,
          equipmentCount: data.equipment_count || 0,
          loanIds: data.loan_ids || [],
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
          withdrawalTime: data.withdrawal_time,
          createdAt: data.created_at,
          createdByUserId: data.created_by_user_id,
          createdByUserName: data.created_by_user_name,
          separationUserId: data.separation_user_id,
          separationUserName: data.separation_user_name,
          separationTime: data.separation_time,
          verificationUserId: data.verification_user_id,
          verificationUserName: data.verification_user_name,
          verificationTime: data.verification_time,
          officeReceiptUserId: data.office_receipt_user_id,
          officeReceiptUserName: data.office_receipt_user_name,
          officeReceiptTime: data.office_receipt_time,
          completedByUserId: data.completed_by_user_id,
          completedByUserName: data.completed_by_user_name,
          completedTime: data.completed_time
        };

        logger.database('select', 'projects', true);
        logger.apiResponse('GET', `/projects/${projectId}`, true, { projectName: projectData.name });
        
        setProject(projectData);
        return projectData;
      }

      throw new NotFoundError(`Project with id ${projectId} not found`);
    });

    if (result.error) {
      setError(result.error.message);
    }
    
    setLoading(false);
  };

  const updateProject = async (updates: Partial<Project>) => {
    if (!project) return;

    try {
      // Transform to database format
      const dbUpdates: Record<string, any> = {};
      
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.startDate) dbUpdates.start_date = updates.startDate;
      if (updates.expectedEndDate) dbUpdates.expected_end_date = updates.expectedEndDate;
      if (updates.actualEndDate !== undefined) dbUpdates.actual_end_date = updates.actualEndDate;
      if (updates.responsibleName) dbUpdates.responsible_name = updates.responsibleName;
      if (updates.responsibleEmail !== undefined) dbUpdates.responsible_email = updates.responsibleEmail;
      if (updates.department !== undefined) dbUpdates.department = updates.department;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.status) dbUpdates.status = updates.status;
      
      // Add timestamp
      dbUpdates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('projects')
        .update(dbUpdates)
        .eq('id', project.id);

      if (error) {
        logger.error('Failed to update project in database', {
          module: 'project-details',
          action: 'update_project',
          data: { projectId: project.id, updates },
          error
        });
        throw error;
      }

      // Update local state
      setProject(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      logger.error('Unexpected error updating project', {
        module: 'project-details',
        action: 'update_project',
        data: { updates },
        error: error instanceof Error ? error : String(error)
      });
      throw error;
    }
  };

  const updateProjectStep = async (newStep: ProjectStep, notes?: string, userData?: {
    userId: string;
    userName: string;
    timestamp: string;
  }) => {
    if (!project) return;

    try {
      const stepChange = {
        step: newStep,
        timestamp: new Date().toISOString(),
        notes,
        userId: userData?.userId,
        userName: userData?.userName
      };

      const updatedStepHistory = [...project.stepHistory, stepChange];
      
      // Check if project should be completed automatically
      const shouldComplete = newStep === 'verified' && project.status === 'active';
      
      const updates: Record<string, any> = {
        step: newStep,
        step_history: JSON.stringify(updatedStepHistory),
        updated_at: new Date().toISOString()
      };

      // Add user data based on step
      if (userData) {
        const timestamp = userData.timestamp;
        
        switch(newStep) {
          case 'ready_for_pickup': // Separação concluída
            updates.separation_user_id = userData.userId;
            updates.separation_user_name = userData.userName;
            updates.separation_time = timestamp;
            break;
            
          case 'in_use': // Retirada
            updates.withdrawal_user_id = userData.userId;
            updates.withdrawal_user_name = userData.userName;
            updates.withdrawal_time = timestamp;
            break;
            
          case 'pending_verification': // Check de desmontagem
            updates.verification_user_id = userData.userId;
            updates.verification_user_name = userData.userName;
            updates.verification_time = timestamp;
            break;
            
          case 'office_receipt': // Devolução no escritório
            updates.office_receipt_user_id = userData.userId;
            updates.office_receipt_user_name = userData.userName;
            updates.office_receipt_time = timestamp;
            break;
            
          case 'verified': // Finalização
            updates.completed_by_user_id = userData.userId;
            updates.completed_by_user_name = userData.userName;
            updates.completed_time = timestamp;
            break;
        }
      }

      if (shouldComplete) {
        updates.status = 'completed';
        updates.actual_end_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', project.id);

      if (error) {
        logger.error('Failed to update project step in database', {
          module: 'project-details',
          action: 'update_project_step',
          data: { projectId: project.id, newStep, notes },
          error
        });
        throw error;
      }

      // Update local state
      setProject(prev => {
        if (!prev) return null;
        const updated: Project = {
          ...prev,
          step: newStep,
          stepHistory: updatedStepHistory
        };

        // Update user data based on step
        if (userData) {
          switch(newStep) {
            case 'ready_for_pickup':
              updated.separationUserId = userData.userId;
              updated.separationUserName = userData.userName;
              updated.separationTime = userData.timestamp;
              break;
            case 'in_use':
              updated.withdrawalUserId = userData.userId;
              updated.withdrawalUserName = userData.userName;
              updated.withdrawalTime = userData.timestamp;
              break;
            case 'pending_verification':
              updated.verificationUserId = userData.userId;
              updated.verificationUserName = userData.userName;
              updated.verificationTime = userData.timestamp;
              break;
            case 'office_receipt':
              updated.officeReceiptUserId = userData.userId;
              updated.officeReceiptUserName = userData.userName;
              updated.officeReceiptTime = userData.timestamp;
              break;
            case 'verified':
              updated.completedByUserId = userData.userId;
              updated.completedByUserName = userData.userName;
              updated.completedTime = userData.timestamp;
              break;
          }
        }
        
        if (shouldComplete) {
          updated.status = 'completed';
          updated.actualEndDate = new Date().toISOString().split('T')[0];
        }
        
        return updated;
      });
    } catch (error) {
      logger.error('Unexpected error updating project step', {
        module: 'project-details',
        action: 'update_project_step',
        data: { newStep, notes },
        error: error instanceof Error ? error : String(error)
      });
      throw error;
    }
  };

  const completeProject = async (notes?: string) => {
    if (!project) return;

    try {
      const stepChange = {
        step: 'verified' as ProjectStep,
        timestamp: new Date().toISOString(),
        notes: notes || 'Projeto finalizado'
      };

      const updatedStepHistory = [...project.stepHistory, stepChange];
      
      const { error } = await supabase
        .from('projects')
        .update({
          status: 'completed',
          step: 'verified',
          step_history: JSON.stringify(updatedStepHistory),
          actual_end_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id);

      if (error) {
        logger.error('Failed to complete project in database', {
          module: 'project-details',
          action: 'complete_project',
          data: { projectId: project.id, notes },
          error
        });
        throw error;
      }

      // Update local state
      setProject(prev => prev ? {
        ...prev,
        status: 'completed',
        step: 'verified' as ProjectStep,
        stepHistory: updatedStepHistory,
        actualEndDate: new Date().toISOString().split('T')[0]
      } : null);
    } catch (error) {
      logger.error('Unexpected error completing project', {
        module: 'project-details',
        action: 'complete_project',
        data: { notes },
        error: error instanceof Error ? error : String(error)
      });
      throw error;
    }
  };

  const archiveProject = async () => {
    if (!project) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          status: 'archived',
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id);

      if (error) {
        logger.error('Failed to archive project in database', {
          module: 'project-details',
          action: 'archive_project',
          data: { projectId: project.id },
          error
        });
        throw error;
      }

      // Update local state
      setProject(prev => prev ? { ...prev, status: 'archived' } : null);
    } catch (error) {
      logger.error('Unexpected error archiving project', {
        module: 'project-details',
        action: 'archive_project',
        error: error instanceof Error ? error : String(error)
      });
      throw error;
    }
  };

  const deleteProject = async () => {
    if (!project) return false;

    try {
      // Log audit entry before deletion
      await logAuditEntry(
        'delete_project',
        'projects',
        project.id,
        { 
          id: project.id,
          name: project.name,
          status: project.status,
          step: project.step 
        } as Record<string, unknown>,
        null
      );

      // Delete from database
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);

      if (error) {
        logger.error('Failed to delete project from database', {
          module: 'project-details',
          action: 'delete_project',
          data: { projectId: project.id },
          error
        });
        throw error;
      }

      return true;
    } catch (error) {
      logger.error('Unexpected error deleting project', {
        module: 'project-details',
        action: 'delete_project',
        error: error instanceof Error ? error : String(error)
      });
      throw error;
    }
  };

  return {
    project,
    loading,
    error,
    updateProject,
    updateProjectStep,
    completeProject,
    archiveProject,
    deleteProject,
    refetch: fetchProject
  };
}