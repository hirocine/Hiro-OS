import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';

interface EquipmentPaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

const PageBtn = ({ children, active, disabled, onClick }: { children: React.ReactNode; active?: boolean; disabled?: boolean; onClick?: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    style={{
      minWidth: 30,
      height: 30,
      padding: '0 8px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 12,
      fontVariantNumeric: 'tabular-nums',
      border: active ? '1px solid hsl(var(--ds-accent))' : '1px solid hsl(var(--ds-line-1))',
      background: active ? 'hsl(var(--ds-accent) / 0.1)' : 'hsl(var(--ds-surface))',
      color: active ? 'hsl(var(--ds-accent))' : 'hsl(var(--ds-fg-1))',
      fontWeight: active ? 600 : 400,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      transition: 'background 0.15s, border-color 0.15s',
    }}
  >
    {children}
  </button>
);

export function EquipmentPagination({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
}: EquipmentPaginationProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          borderTop: '1px solid hsl(var(--ds-line-1))',
        }}
      >
        <div style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
          Página {currentPage} de {totalPages}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' }}>
          <PageBtn onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
            Anterior
          </PageBtn>
          <PageBtn onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            Próxima
          </PageBtn>
        </div>
      </div>
    );
  }

  const renderPages = () => {
    const pages: React.ReactNode[] = [];
    const showEllipsis = totalPages > 7;

    const Ellipsis = ({ k }: { k: string }) => (
      <span key={k} style={{ padding: '0 6px', color: 'hsl(var(--ds-fg-4))', fontSize: 12 }}>
        …
      </span>
    );

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <PageBtn key={i} active={currentPage === i} onClick={() => onPageChange(i)}>
            {i}
          </PageBtn>
        );
      }
    } else if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(
          <PageBtn key={i} active={currentPage === i} onClick={() => onPageChange(i)}>
            {i}
          </PageBtn>
        );
      }
      pages.push(<Ellipsis key="end-ell" k="end-ell" />);
      pages.push(
        <PageBtn key={totalPages} onClick={() => onPageChange(totalPages)}>
          {totalPages}
        </PageBtn>
      );
    } else if (currentPage >= totalPages - 3) {
      pages.push(
        <PageBtn key={1} onClick={() => onPageChange(1)}>
          1
        </PageBtn>
      );
      pages.push(<Ellipsis key="start-ell" k="start-ell" />);
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(
          <PageBtn key={i} active={currentPage === i} onClick={() => onPageChange(i)}>
            {i}
          </PageBtn>
        );
      }
    } else {
      pages.push(
        <PageBtn key={1} onClick={() => onPageChange(1)}>
          1
        </PageBtn>
      );
      pages.push(<Ellipsis key="start-ell" k="start-ell" />);
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(
          <PageBtn key={i} active={currentPage === i} onClick={() => onPageChange(i)}>
            {i}
          </PageBtn>
        );
      }
      pages.push(<Ellipsis key="end-ell" k="end-ell" />);
      pages.push(
        <PageBtn key={totalPages} onClick={() => onPageChange(totalPages)}>
          {totalPages}
        </PageBtn>
      );
    }
    return pages;
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        borderTop: '1px solid hsl(var(--ds-line-1))',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums' }}>
          Exibindo{' '}
          <span style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
            {(currentPage - 1) * itemsPerPage + 1}
          </span>
          {' '}a{' '}
          <span style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
            {Math.min(currentPage * itemsPerPage, totalItems)}
          </span>
          {' '}de{' '}
          <span style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>{totalItems}</span> itens
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>Mostrar:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => onItemsPerPageChange(Number(value))}
          >
            <SelectTrigger style={{ width: 80, height: 30 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <PageBtn onClick={() => currentPage > 1 && onPageChange(currentPage - 1)} disabled={currentPage === 1}>
          <ChevronLeft size={13} strokeWidth={1.5} />
        </PageBtn>
        {renderPages()}
        <PageBtn
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight size={13} strokeWidth={1.5} />
        </PageBtn>
      </div>
    </div>
  );
}
