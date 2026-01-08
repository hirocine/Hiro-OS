import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { Json } from '@/integrations/supabase/types';

export interface WithdrawalDraftData {
  projectNumber: string;
  company: string;
  projectName: string;
  responsibleUserId: string;
  withdrawalDate: string | null;
  returnDate: string | null;
  separationDate: string | null;
  recordingType: string;
  selectedEquipment: string[];
}

interface WithdrawalDraft {
  id: string;
  currentStep: number;
  data: WithdrawalDraftData;
  updatedAt: string;
}

interface UseWithdrawalDraftReturn {
  draft: WithdrawalDraft | null;
  isLoading: boolean;
  hasDraft: boolean;
  saveDraft: (step: number, data: WithdrawalDraftData) => Promise<void>;
  saveDraftImmediate: (step: number, data: WithdrawalDraftData) => void;
  deleteDraft: () => Promise<void>;
  loadDraft: () => Promise<void>;
  isSaving: boolean;
  lastSavedAt: Date | null;
}

export function useWithdrawalDraft(): UseWithdrawalDraftReturn {
  // Use AuthContext instead of separate useAuth hook
  const { user, loading: authLoading } = useAuthContext();
  const [draft, setDraft] = useState<WithdrawalDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const hasLoadedRef = useRef(false);

  const loadDraft = useCallback(async () => {
    // Wait for auth to be ready
    if (authLoading) {
      return;
    }
    
    if (!user?.id) {
      setIsLoading(false);
      setDraft(null);
      return;
    }

    try {
      setIsLoading(true);
      
      // With unique constraint, we can use maybeSingle directly
      const { data, error } = await supabase
        .from('withdrawal_drafts')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        logger.error('Error loading withdrawal draft', {
          module: 'useWithdrawalDraft',
          action: 'loadDraft',
          error
        });
        setDraft(null);
        return;
      }

      if (data) {
        setDraft({
          id: data.id,
          currentStep: data.current_step,
          data: data.data as unknown as WithdrawalDraftData,
          updatedAt: data.updated_at
        });
        setLastSavedAt(new Date(data.updated_at));
      } else {
        setDraft(null);
      }
    } catch (error) {
      logger.error('Error loading withdrawal draft', {
        module: 'useWithdrawalDraft',
        action: 'loadDraft',
        error
      });
      setDraft(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, authLoading]);

  // Use UPSERT for saving (works with unique constraint on user_id)
  const saveDraft = useCallback(async (step: number, draftData: WithdrawalDraftData) => {
    if (!user?.id) return;

    try {
      setIsSaving(true);
      const now = new Date().toISOString();

      const payload = {
        user_id: user.id,
        current_step: step,
        data: draftData as unknown as Json,
        updated_at: now
      };

      // UPSERT: insert or update based on user_id unique constraint
      const { data, error } = await supabase
        .from('withdrawal_drafts')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      
      // Update local state with new draft data
      if (data) {
        setDraft({
          id: data.id,
          currentStep: step,
          data: draftData,
          updatedAt: data.updated_at
        });
      }
      
      setLastSavedAt(new Date());
      
      logger.info('Draft saved successfully', {
        module: 'useWithdrawalDraft',
        action: 'saveDraft'
      });
    } catch (error) {
      logger.error('Error saving withdrawal draft', {
        module: 'useWithdrawalDraft',
        action: 'saveDraft',
        error
      });
    } finally {
      setIsSaving(false);
    }
  }, [user?.id]);

  const deleteDraft = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Delete by user_id (unique constraint ensures only one)
      const { error } = await supabase
        .from('withdrawal_drafts')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setDraft(null);
      setLastSavedAt(null);
      
      logger.info('Draft deleted successfully', {
        module: 'useWithdrawalDraft',
        action: 'deleteDraft'
      });
    } catch (error) {
      logger.error('Error deleting withdrawal draft', {
        module: 'useWithdrawalDraft',
        action: 'deleteDraft',
        error
      });
    }
  }, [user?.id]);

  // Synchronous version for cleanup functions (fire-and-forget)
  const saveDraftImmediate = useCallback((step: number, draftData: WithdrawalDraftData) => {
    if (!user?.id) return;

    const payload = {
      user_id: user.id,
      current_step: step,
      data: draftData as unknown as Json,
      updated_at: new Date().toISOString()
    };

    // UPSERT fire-and-forget
    supabase
      .from('withdrawal_drafts')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          logger.error('Error saving draft on unmount', { error });
        } else if (data) {
          // Update local state (component might be unmounted, but state update is safe)
          setDraft({
            id: data.id,
            currentStep: step,
            data: draftData,
            updatedAt: data.updated_at
          });
        }
      });
  }, [user?.id]);

  // Load draft when auth is ready
  useEffect(() => {
    // Only load once when auth becomes ready
    if (authLoading) {
      return;
    }
    
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadDraft();
    }
  }, [authLoading, loadDraft]);

  // Reset hasLoadedRef if user changes
  useEffect(() => {
    hasLoadedRef.current = false;
  }, [user?.id]);

  return {
    draft,
    isLoading: isLoading || authLoading,
    hasDraft: !!draft,
    saveDraft,
    saveDraftImmediate,
    deleteDraft,
    loadDraft,
    isSaving,
    lastSavedAt
  };
}
