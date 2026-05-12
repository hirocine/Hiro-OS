/**
 * ════════════════════════════════════════════════════════════════
 * /rh/wiki/:slug — visualização de um artigo
 * ════════════════════════════════════════════════════════════════
 *
 * Renderiza o body HTML (vindo do TipTap). Admin vê botões pra
 * editar e voltar. Rascunho mostra um aviso no topo.
 */

import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useWikiArticle, useWikiMutations, WIKI_CATEGORY_LABEL } from '@/features/rh';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { EmptyState } from '@/ds/components/EmptyState';
import { BookOpen } from 'lucide-react';
import { enhancedToast } from '@/components/ui/enhanced-toast';

export default function RHWikiArticle() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuthContext();
  const { article, loading } = useWikiArticle(slug);
  const { remove } = useWikiMutations();

  if (loading) return <LoadingScreen />;

  if (!article) {
    return (
      <div className="ds-shell ds-page">
        <div className="ds-page-inner">
          <EmptyState
            icon={BookOpen}
            title="Artigo não encontrado"
            description="Esse artigo não existe ou ainda não foi publicado."
            action={
              <Link to="/rh/wiki" className="btn">
                <ArrowLeft size={14} strokeWidth={1.5} />
                <span>Voltar pra Wiki</span>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!confirm(`Apagar definitivamente o artigo "${article.title}"?`)) return;
    try {
      await remove(article.id);
      enhancedToast.success({ title: 'Artigo removido' });
      navigate('/rh/wiki');
    } catch (err) {
      enhancedToast.error({
        title: 'Erro ao remover',
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <div style={{ marginBottom: 16 }}>
          <Link
            to="/rh/wiki"
            className="btn"
            style={{ padding: '4px 10px', fontSize: 12 }}
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            <span>Wiki</span>
          </Link>
        </div>

        {!article.published ? (
          <div
            style={{
              padding: '10px 14px',
              border: '1px solid var(--ds-border)',
              background: 'var(--ds-surface)',
              fontSize: 12,
              color: 'var(--ds-text-muted)',
              marginBottom: 16,
            }}
          >
            <strong style={{ color: 'var(--ds-text)' }}>Rascunho.</strong>{' '}
            Esse artigo só é visível para admins.
          </div>
        ) : null}

        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 4,
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--ds-font-display)',
              fontSize: 28,
              fontWeight: 600,
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            {article.title}
          </h1>
          {isAdmin ? (
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <Link
                to={`/rh/wiki/${article.slug}/editar`}
                className="btn"
              >
                <Pencil size={14} strokeWidth={1.5} />
                <span>Editar</span>
              </Link>
              <button className="btn" type="button" onClick={handleDelete}>
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            </div>
          ) : null}
        </div>

        <div
          style={{
            color: 'var(--ds-text-muted)',
            fontSize: 12,
            display: 'flex',
            gap: 12,
            marginBottom: 24,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span>{WIKI_CATEGORY_LABEL[article.category]}</span>
          {publishedDate ? (
            <>
              <span>·</span>
              <span>Publicado em {publishedDate}</span>
            </>
          ) : null}
          {article.tags.length > 0 ? (
            <>
              <span>·</span>
              <span>{article.tags.map((t) => `#${t}`).join(' ')}</span>
            </>
          ) : null}
        </div>

        {article.excerpt ? (
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.6,
              color: 'var(--ds-text-muted)',
              borderLeft: '2px solid var(--ds-border)',
              paddingLeft: 12,
              margin: '0 0 24px',
            }}
          >
            {article.excerpt}
          </p>
        ) : null}

        <article
          className="prose-content"
          style={{
            fontSize: 14,
            lineHeight: 1.7,
            color: 'var(--ds-text)',
          }}
          dangerouslySetInnerHTML={{ __html: article.body }}
        />
      </div>
    </div>
  );
}
