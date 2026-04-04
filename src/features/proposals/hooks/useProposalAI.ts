import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { DiagnosticoDor, EntregavelItem } from '../types';

interface TranscriptResult {
  client_name?: string;
  project_name?: string;
  client_responsible?: string;
  objetivo?: string;
  diagnostico_dores?: DiagnosticoDor[];
  entregaveis?: EntregavelItem[];
}

export interface AnalyzeQuestion {
  id: string;
  emoji: string;
  text: string;
  type: 'single_select';
  options: Array<{ id: string; label: string; description?: string }>;
}

export interface AnalyzeResult {
  confirmed: {
    client_name: string;
    project_name: string;
    contacts: string[];
    summary: string;
  };
  questions: AnalyzeQuestion[];
}

export function useProposalAI() {
  const [isEnriching, setIsEnriching] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const enrichClient = async (clientName: string): Promise<string> => {
    setIsEnriching(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-proposal-assistant', {
        body: { action: 'enrich_client', client_name: clientName },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.company_description || '';
    } finally {
      setIsEnriching(false);
    }
  };

  const parseTranscript = async (transcript: string): Promise<TranscriptResult> => {
    setIsParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-proposal-assistant', {
        body: { action: 'parse_transcript', transcript },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as TranscriptResult;
    } finally {
      setIsParsing(false);
    }
  };

  const suggestPainPoints = async (
    clientName: string,
    projectName: string,
    objetivo: string
  ): Promise<DiagnosticoDor[]> => {
    setIsSuggesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-proposal-assistant', {
        body: { action: 'suggest_pain_points', client_name: clientName, project_name: projectName, objetivo },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.diagnostico_dores || [];
    } finally {
      setIsSuggesting(false);
    }
  };

  const analyzeTranscript = async (transcript: string): Promise<AnalyzeResult> => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-proposal-assistant', {
        body: { action: 'analyze_transcript', transcript },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as AnalyzeResult;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const finalizeTranscript = async (
    transcript: string,
    answers: Record<string, string>
  ): Promise<TranscriptResult> => {
    setIsFinalizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-proposal-assistant', {
        body: { action: 'finalize_transcript', transcript, answers },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as TranscriptResult;
    } finally {
      setIsFinalizing(false);
    }
  };

  return {
    enrichClient,
    parseTranscript,
    suggestPainPoints,
    analyzeTranscript,
    finalizeTranscript,
    isEnriching,
    isParsing,
    isSuggesting,
    isAnalyzing,
    isFinalizing,
  };
}
