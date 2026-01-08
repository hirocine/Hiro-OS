import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
  deleteDraft: () => Promise<void>;
  loadDraft: () => Promise<void>;
  isSaving: boolean;
  lastSavedAt: Date | null;
}

export function useWithdrawalDraft(): UseWithdrawalDraftReturn {
  const { user } = useAuth();
  const [draft, setDraft] = useState<WithdrawalDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const draftIdRef = useRef<string | null>(null);

  const loadDraft = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('withdrawal_drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.error('Error loading withdrawal draft', {
          module: 'useWithdrawalDraft',
          action: 'loadDraft',
          error
        });
        return;
      }

      if (data) {
        draftIdRef.current = data.id;
        setDraft({
          id: data.id,
          currentStep: data.current_step,
          data: data.data as unknown as WithdrawalDraftData,
          updatedAt: data.updated_at
        });
        setLastSavedAt(new Date(data.updated_at));
      } else {
        draftIdRef.current = null;
        setDraft(null);
      }
    } catch (error) {
      logger.error('Error loading withdrawal draft', {
        module: 'useWithdrawalDraft',
        action: 'loadDraft',
        error
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const saveDraft = useCallback(async (step: number, draftData: WithdrawalDraftData) => {
    if (!user?.id) return;

    try {
      setIsSaving(true);

      const payload = {
        user_id: user.id,
        current_step: step,
        data: draftData as unknown as Json,
        updated_at: new Date().toISOString()
      };

      if (draftIdRef.current) {
        // Update existing draft
        const { error } = await supabase
          .from('withdrawal_drafts')
          .update(payload)
          .eq('id', draftIdRef.current);

        if (error) throw error;
      } else {
        // Insert new draft
        const { data, error } = await supabase
          .from('withdrawal_drafts')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        
        draftIdRef.current = data.id;
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
    if (!user?.id || !draftIdRef.current) return;

    try {
      const { error } = await supabase
        .from('withdrawal_drafts')
        .delete()
        .eq('id', draftIdRef.current);

      if (error) throw error;

      draftIdRef.current = null;
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

  // Load draft on mount
  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  return {
    draft,
    isLoading,
    hasDraft: !!draft,
    saveDraft,
    deleteDraft,
    loadDraft,
    isSaving,
    lastSavedAt
  };
}
