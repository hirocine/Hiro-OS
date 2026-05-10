import { useState } from 'react';
import { Star, ExternalLink, Copy, Pencil, Eye, EyeOff, Loader2 } from 'lucide-react';
import type { PlatformAccess } from '../types';
import { CATEGORY_LABELS } from '../types';

interface PlatformAccessCardProps {
  access: PlatformAccess;
  onEdit: (access: PlatformAccess) => void;
  onToggleFavorite: (id: string) => void;
  onCopyPassword: (id: string) => void;
  onCopyUsername: (username: string) => void;
  onGetPassword: (id: string) => Promise<string | null>;
}

const eyebrowStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};

const fieldChrome: React.CSSProperties = {
  flex: 1,
  fontSize: 13,
  border: '1px solid hsl(var(--ds-line-1))',
  background: 'hsl(var(--ds-line-2) / 0.3)',
  padding: '8px 12px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
};

export function PlatformAccessCard({
  access,
  onEdit,
  onToggleFavorite,
  onCopyPassword,
  onCopyUsername,
  onGetPassword,
}: PlatformAccessCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [decryptedPassword, setDecryptedPassword] = useState<string>('');
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);

  const handleOpenUrl = () => {
    window.open(access.platform_url, '_blank', 'noopener,noreferrer');
  };

  const handleTogglePasswordVisibility = async () => {
    if (!showPassword && !decryptedPassword) {
      setIsLoadingPassword(true);
      const password = await onGetPassword(access.id);
      setIsLoadingPassword(false);

      if (password) {
        setDecryptedPassword(password);
        setShowPassword(true);
      }
    } else {
      setShowPassword(!showPassword);
    }
  };

  const isInactive = !access.is_active;
  const borderColor = isInactive ? 'hsl(var(--ds-danger) / 0.4)' : 'hsl(var(--ds-line-1))';
  const cardBg = isInactive ? 'hsl(var(--ds-danger) / 0.04)' : 'hsl(var(--ds-surface))';

  const CredentialField = ({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) => (
    <div>
      <label style={eyebrowStyle}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={fieldChrome}>{value}</div>
        <button
          type="button"
          className="btn"
          onClick={onCopy}
          style={{ width: 36, height: 36, padding: 0, justifyContent: 'center', flexShrink: 0 }}
          aria-label="Copiar"
        >
          <Copy size={13} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );

  const SecretField = ({ label }: { label: string }) => (
    <div>
      <label style={eyebrowStyle}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: 13,
              border: '1px solid hsl(var(--ds-line-1))',
              background: 'hsl(var(--ds-line-2) / 0.3)',
              padding: '8px 36px 8px 12px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {showPassword && decryptedPassword ? decryptedPassword : '••••••••••••'}
          </div>
          <button
            type="button"
            onClick={handleTogglePasswordVisibility}
            disabled={isLoadingPassword}
            style={{
              position: 'absolute',
              right: 6,
              top: '50%',
              transform: 'translateY(-50%)',
              padding: 6,
              background: 'transparent',
              border: 0,
              cursor: 'pointer',
              color: 'hsl(var(--ds-fg-3))',
              opacity: isLoadingPassword ? 0.5 : 1,
            }}
            aria-label={showPassword ? 'Esconder' : 'Mostrar'}
          >
            {isLoadingPassword ? (
              <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />
            ) : showPassword ? (
              <EyeOff size={13} strokeWidth={1.5} />
            ) : (
              <Eye size={13} strokeWidth={1.5} />
            )}
          </button>
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => onCopyPassword(access.id)}
          style={{ width: 36, height: 36, padding: 0, justifyContent: 'center', flexShrink: 0 }}
          aria-label="Copiar"
        >
          <Copy size={13} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );

  return (
    <div
      style={{
        padding: 22,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 380,
        border: `1px solid ${borderColor}`,
        background: cardBg,
        transition: 'border-color 0.2s',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className="btn"
            onClick={() => onToggleFavorite(access.id)}
            style={{ width: 28, height: 28, padding: 0, justifyContent: 'center' }}
            aria-label="Favoritar"
          >
            <Star
              size={13}
              strokeWidth={1.5}
              style={{
                fill: access.is_favorite ? 'hsl(48 96% 53%)' : 'transparent',
                color: access.is_favorite ? 'hsl(48 96% 53%)' : 'hsl(var(--ds-fg-3))',
              }}
            />
          </button>
          <span className="pill muted">{CATEGORY_LABELS[access.category]}</span>
        </div>
        <span
          className="pill"
          style={{
            color: access.is_active ? 'hsl(var(--ds-success))' : 'hsl(var(--ds-danger))',
            borderColor: access.is_active ? 'hsl(var(--ds-success) / 0.3)' : 'hsl(var(--ds-danger) / 0.3)',
            background: access.is_active ? 'hsl(var(--ds-success) / 0.08)' : 'hsl(var(--ds-danger) / 0.08)',
          }}
        >
          {access.is_active ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      {/* Logo + Nome */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        {access.platform_icon_url ? (
          <div
            style={{
              width: 44,
              height: 44,
              display: 'grid',
              placeItems: 'center',
              overflow: 'hidden',
              background: 'hsl(var(--ds-surface))',
              border: `1px solid ${isInactive ? 'hsl(var(--ds-danger))' : 'hsl(var(--ds-line-1))'}`,
              flexShrink: 0,
            }}
          >
            <img
              src={access.platform_icon_url}
              alt={access.platform_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div
            style={{
              width: 44,
              height: 44,
              display: 'grid',
              placeItems: 'center',
              background: isInactive ? 'hsl(var(--ds-danger) / 0.1)' : 'hsl(var(--ds-accent) / 0.1)',
              border: `1px solid ${isInactive ? 'hsl(var(--ds-danger))' : 'hsl(var(--ds-accent) / 0.25)'}`,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: '"HN Display", sans-serif',
                fontSize: 18,
                fontWeight: 700,
                color: isInactive ? 'hsl(var(--ds-danger))' : 'hsl(var(--ds-accent))',
              }}
            >
              {access.platform_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontFamily: '"HN Display", sans-serif',
              fontSize: 16,
              fontWeight: 600,
              color: 'hsl(var(--ds-fg-1))',
            }}
          >
            {access.platform_name}
          </h3>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Credenciais */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
        {access.category === 'software' ? (
          <>
            {access.username && (
              <CredentialField label="Usuário/E-mail" value={access.username} onCopy={() => onCopyUsername(access.username)} />
            )}
            <SecretField label="License Key" />
          </>
        ) : (
          <>
            <CredentialField label="Usuário/E-mail" value={access.username} onCopy={() => onCopyUsername(access.username)} />
            <SecretField label="Senha" />
          </>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
        {access.platform_url && (
          <button
            type="button"
            className="btn"
            onClick={handleOpenUrl}
            style={{
              flex: 1,
              justifyContent: 'center',
              ...(isInactive
                ? {
                    color: 'hsl(var(--ds-danger))',
                    borderColor: 'hsl(var(--ds-danger) / 0.3)',
                  }
                : {}),
            }}
          >
            <ExternalLink size={13} strokeWidth={1.5} />
            <span>Link</span>
          </button>
        )}
        <button
          type="button"
          className="btn"
          onClick={() => onEdit(access)}
          style={{
            flex: 1,
            justifyContent: 'center',
            ...(isInactive
              ? {
                  color: 'hsl(var(--ds-danger))',
                  borderColor: 'hsl(var(--ds-danger) / 0.3)',
                }
              : {}),
          }}
        >
          <Pencil size={13} strokeWidth={1.5} />
          <span>Editar</span>
        </button>
      </div>
    </div>
  );
}
