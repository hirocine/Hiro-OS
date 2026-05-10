import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  meta?: string;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, subtitle, meta, actions }: Props) {
  return (
    <div className="ph">
      <div>
        <div className="ph-eyebrow">
          <span className="acc-mark" />
          {eyebrow}
        </div>
        <h1 className="ph-title">{title}</h1>
        {(subtitle || meta) && (
          <p className="ph-sub">
            {subtitle}
            {meta && <span className="meta">{meta}</span>}
          </p>
        )}
      </div>
      {actions && <div className="ph-actions">{actions}</div>}
    </div>
  );
}
