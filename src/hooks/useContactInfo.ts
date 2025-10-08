import { useState, useCallback } from 'react';
import { LoanContactInfo } from '@/types/loan';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';
import { logger } from '@/lib/logger';

export function useContactInfo() {
  const [loading, setLoading] = useState(false);
  const { isAdmin } = useUserRole();

  const getContactInfo = useCallback(async (loanId: string): Promise<LoanContactInfo | null> => {
    if (!isAdmin) {
      logger.warn('Unauthorized access attempt to contact info');
      return null;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .rpc('get_loan_contact_info', { loan_id: loanId });

      if (error) {
        logger.database('select', 'borrower_contacts', false, error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const contactData = data[0];
      return {
        loanId,
        borrowerEmail: contactData.borrower_email || undefined,
        borrowerPhone: contactData.borrower_phone || undefined,
        department: contactData.department || undefined,
      };
    } catch (error) {
      logger.error('Failed to fetch contact info');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  return {
    getContactInfo,
    loading,
  };
}
