import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface IdeaPostLink {
  idea_id: string;
  post_id: string;
  post_status: string;
  scheduled_at: string | null;
}

/**
 * Returns Map<idea_id, IdeaPostLink> — most recent post per idea.
 */
export function useIdeasWithPosts(ideaIds: string[]) {
  const [linkMap, setLinkMap] = useState<Map<string, IdeaPostLink>>(new Map());

  // Stable key for effect dependency
  const key = ideaIds.join(',');

  useEffect(() => {
    if (ideaIds.length === 0) {
      setLinkMap(new Map());
      return;
    }

    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('marketing_posts')
        .select('id, idea_id, status, scheduled_at, created_at')
        .is('deleted_at', null)
        .in('idea_id', ideaIds)
        .order('created_at', { ascending: false });

      if (cancelled || error || !data) return;

      const map = new Map<string, IdeaPostLink>();
      for (const post of data) {
        if (post.idea_id && !map.has(post.idea_id)) {
          map.set(post.idea_id, {
            idea_id: post.idea_id,
            post_id: post.id,
            post_status: post.status,
            scheduled_at: post.scheduled_at,
          });
        }
      }
      setLinkMap(map);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return linkMap;
}
