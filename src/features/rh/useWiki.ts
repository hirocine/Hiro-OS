/**
 * ════════════════════════════════════════════════════════════════
 * useWiki — Wiki/FAQ interna
 * ════════════════════════════════════════════════════════════════
 *
 * `useWikiList()` — lista de artigos (com filtro opcional por
 * categoria e busca). Não-admins só veem `published = true`; admins
 * veem tudo (RLS resolve do lado do banco).
 *
 * `useWikiArticle(slug)` — fetch single article pra view.
 *
 * `useWikiMutations()` — create / update / delete. Admin only por
 * RLS; UI esconde os botões pros outros.
 */

import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { WikiArticle, WikiCategory } from './types';

const LIST_KEY = ['rh', 'wiki', 'list'] as const;
const ARTICLE_KEY = ['rh', 'wiki', 'article'] as const;

interface DbWikiRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  category: WikiCategory;
  tags: string[];
  published: boolean;
  author_id: string | null;
  last_edited_by: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

function rowToArticle(row: DbWikiRow): WikiArticle {
  return { ...row };
}

async function fetchArticles(): Promise<WikiArticle[]> {
  const { data, error } = await supabase
    .from('wiki_articles')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data as DbWikiRow[]).map(rowToArticle);
}

async function fetchArticleBySlug(slug: string): Promise<WikiArticle | null> {
  const { data, error } = await supabase
    .from('wiki_articles')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToArticle(data as DbWikiRow) : null;
}

export function useWikiList() {
  const query = useQuery({
    queryKey: LIST_KEY,
    queryFn: fetchArticles,
    staleTime: 60_000,
  });

  return {
    items: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
  };
}

export function useWikiArticle(slug: string | undefined) {
  const query = useQuery({
    queryKey: [...ARTICLE_KEY, slug],
    queryFn: () => fetchArticleBySlug(slug!),
    enabled: !!slug,
    staleTime: 30_000,
  });

  return {
    article: query.data ?? null,
    loading: query.isLoading,
    error: query.error,
  };
}

// ─── Mutations ──────────────────────────────────────────────────

export interface WikiArticleInput {
  slug: string;
  title: string;
  excerpt?: string | null;
  body: string;
  category: WikiCategory;
  tags?: string[];
  published?: boolean;
}

export function useWikiMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: LIST_KEY });
    queryClient.invalidateQueries({ queryKey: ARTICLE_KEY });
  };

  const createMut = useMutation({
    mutationFn: async (input: WikiArticleInput) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      const { data, error } = await supabase
        .from('wiki_articles')
        .insert({
          slug: input.slug,
          title: input.title,
          excerpt: input.excerpt ?? null,
          body: input.body,
          category: input.category,
          tags: input.tags ?? [],
          published: input.published ?? false,
          author_id: userId ?? null,
          last_edited_by: userId ?? null,
        })
        .select('slug')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const updateMut = useMutation({
    mutationFn: async (input: { id: string } & Partial<WikiArticleInput>) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      const { id, ...patch } = input;
      const { error } = await supabase
        .from('wiki_articles')
        .update({ ...patch, last_edited_by: userId ?? null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('wiki_articles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    create: createMut.mutateAsync,
    update: updateMut.mutateAsync,
    remove: deleteMut.mutateAsync,
    creating: createMut.isPending,
    updating: updateMut.isPending,
  };
}

export function useWikiRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('wiki_articles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wiki_articles' },
        () => {
          queryClient.invalidateQueries({ queryKey: LIST_KEY });
          queryClient.invalidateQueries({ queryKey: ARTICLE_KEY });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

// ─── Helpers ────────────────────────────────────────────────────

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

export function useFilteredArticles(
  items: WikiArticle[],
  options: { category?: WikiCategory | 'all'; search?: string },
): WikiArticle[] {
  return useMemo(() => {
    return items.filter((a) => {
      if (options.category && options.category !== 'all' && a.category !== options.category)
        return false;
      if (options.search) {
        const q = options.search.toLowerCase();
        const haystack = [
          a.title,
          a.excerpt ?? '',
          a.body,
          a.tags.join(' '),
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [items, options.category, options.search]);
}
