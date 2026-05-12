/**
 * ════════════════════════════════════════════════════════════════
 * /rh/wiki/novo · /rh/wiki/:slug/editar — editor de artigo
 * ════════════════════════════════════════════════════════════════
 *
 * Página única que cobre criação e edição. Distingue pelos params:
 *   - sem slug    → criar novo
 *   - com slug    → editar existente (busca artigo pelo slug)
 *
 * Acesso protegido por <RequirePermission permission="rh.wiki"> +
 * isAdmin check no render (não-admin tomba pra /rh/wiki).
 *
 * Reusa TipTapEditor do feature `policies` — mesmo HTML output.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  useWikiArticle,
  useWikiMutations,
  slugify,
  WIKI_CATEGORIES,
  WIKI_CATEGORY_LABEL,
} from '@/features/rh';
import type { WikiCategory } from '@/features/rh';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TipTapEditor } from '@/features/policies/components/TipTapEditor';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { enhancedToast } from '@/components/ui/enhanced-toast';
import { Loader2 } from 'lucide-react';

export default function RHWikiEditor() {
  const { slug: editingSlug } = useParams<{ slug: string }>();
  const isEditing = !!editingSlug;

  const navigate = useNavigate();
  const { isAdmin } = useAuthContext();
  const { article, loading } = useWikiArticle(editingSlug);
  const { create, update, creating, updating } = useWikiMutations();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<WikiCategory>('outros');
  const [tagsInput, setTagsInput] = useState('');
  const [published, setPublished] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate when editing
  useEffect(() => {
    if (isEditing && article && !hydrated) {
      setTitle(article.title);
      setSlug(article.slug);
      setExcerpt(article.excerpt ?? '');
      setBody(article.body);
      setCategory(article.category);
      setTagsInput(article.tags.join(', '));
      setPublished(article.published);
      setSlugTouched(true); // don't auto-overwrite
      setHydrated(true);
    }
  }, [isEditing, article, hydrated]);

  // Auto-slugify from title (unless user manually edited slug)
  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(title));
    }
  }, [title, slugTouched]);

  if (!isAdmin) {
    navigate('/rh/wiki', { replace: true });
    return null;
  }

  if (isEditing && loading) return <LoadingScreen />;

  if (isEditing && !loading && !article) {
    return (
      <div className="ds-shell ds-page">
        <div className="ds-page-inner">
          <p>Artigo não encontrado.</p>
        </div>
      </div>
    );
  }

  const saving = creating || updating;

  const handleSave = async (opts: { publish?: boolean } = {}) => {
    if (!title.trim()) {
      enhancedToast.error({ title: 'Título obrigatório' });
      return;
    }
    if (!slug.trim()) {
      enhancedToast.error({ title: 'Slug obrigatório' });
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const willPublish = opts.publish !== undefined ? opts.publish : published;

    try {
      if (isEditing && article) {
        await update({
          id: article.id,
          title: title.trim(),
          slug: slug.trim(),
          excerpt: excerpt.trim() || null,
          body,
          category,
          tags,
          published: willPublish,
        });
        enhancedToast.success({ title: 'Artigo atualizado' });
        navigate(`/rh/wiki/${slug.trim()}`);
      } else {
        const created = await create({
          title: title.trim(),
          slug: slug.trim(),
          excerpt: excerpt.trim() || null,
          body,
          category,
          tags,
          published: willPublish,
        });
        enhancedToast.success({ title: 'Artigo criado' });
        navigate(`/rh/wiki/${created?.slug ?? slug.trim()}`);
      }
    } catch (err) {
      enhancedToast.error({
        title: 'Erro ao salvar',
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner" style={{ maxWidth: 800 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <button
            type="button"
            className="btn"
            style={{ padding: '4px 10px', fontSize: 12 }}
            onClick={() => navigate(isEditing ? `/rh/wiki/${editingSlug}` : '/rh/wiki')}
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            <span>Voltar</span>
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn"
              onClick={() => handleSave({ publish: false })}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Salvar rascunho
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={() => handleSave({ publish: true })}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={14} strokeWidth={1.5} />}
              <span>{published ? 'Salvar e manter publicado' : 'Publicar'}</span>
            </button>
          </div>
        </div>

        <h1
          style={{
            fontFamily: 'var(--ds-font-display)',
            fontSize: 24,
            fontWeight: 600,
            margin: '0 0 24px',
          }}
        >
          {isEditing ? 'Editar artigo' : 'Novo artigo'}
        </h1>

        <div style={{ display: 'grid', gap: 16 }}>
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Onboarding de freelancer"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">
              Slug{' '}
              <span style={{ color: 'var(--ds-text-muted)', fontWeight: 400, fontSize: 11 }}>
                — usado na URL (/rh/wiki/{slug || 'meu-artigo'})
              </span>
            </Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlug(slugify(e.target.value));
                setSlugTouched(true);
              }}
              placeholder="onboarding-de-freelancer"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as WikiCategory)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WIKI_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {WIKI_CATEGORY_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">
                Tags{' '}
                <span style={{ color: 'var(--ds-text-muted)', fontWeight: 400, fontSize: 11 }}>
                  — separadas por vírgula
                </span>
              </Label>
              <Input
                id="tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="freelancer, contratacao, juridico"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">
              Resumo{' '}
              <span style={{ color: 'var(--ds-text-muted)', fontWeight: 400, fontSize: 11 }}>
                — aparece na listagem (opcional)
              </span>
            </Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              placeholder="Resumo curto, uma ou duas frases."
            />
          </div>

          <div className="space-y-2">
            <Label>Conteúdo</Label>
            <TipTapEditor
              content={body}
              onChange={setBody}
              placeholder="Escreva o conteúdo do artigo aqui…"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
