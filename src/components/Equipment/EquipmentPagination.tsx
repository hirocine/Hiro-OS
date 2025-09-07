import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface EquipmentPaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

export function EquipmentPagination({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
}: EquipmentPaginationProps) {
  const isMobile = useIsMobile();

  // Mobile: Design ultra-simplificado - evita overflow
  if (isMobile) {
    return (
      <div className="bg-background border-t px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* Info da página atual - pode comprimir */}
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            Página {currentPage} de {totalPages}
          </div>
          
          {/* Navegação Previous/Next - flexível */}
          <div className="flex items-center gap-2 flex-1 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-2 text-xs"
            >
              Anterior
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-2 text-xs"
            >
              Próxima
            </Button>
          </div>
          
          {/* Info dos itens - compacta e pode esconder */}
          <div className="text-xs text-muted-foreground whitespace-nowrap hidden xs:block">
            {((currentPage - 1) * itemsPerPage + 1)}-{Math.min(currentPage * itemsPerPage, totalItems)}
          </div>
        </div>
      </div>
    );
  }

  // Desktop: Layout horizontal limpo e espaçoso
  return (
    <div className="bg-background border-t">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Info e controles à esquerda */}
        <div className="flex items-center gap-6">
          <div className="text-sm text-muted-foreground">
            Exibindo <span className="font-medium text-foreground">{((currentPage - 1) * itemsPerPage + 1)}</span> a{' '}
            <span className="font-medium text-foreground">{Math.min(currentPage * itemsPerPage, totalItems)}</span> de{' '}
            <span className="font-medium text-foreground">{totalItems}</span> itens
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Mostrar:</span>
            <Select 
              value={itemsPerPage.toString()} 
              onValueChange={(value) => onItemsPerPageChange(Number(value))}
            >
              <SelectTrigger className="w-20 h-9">
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

        {/* Navegação à direita */}
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            
            {/* Páginas visíveis com lógica inteligente */}
            {(() => {
              const pages = [];
              const showEllipsis = totalPages > 7;
              
              if (!showEllipsis) {
                // Mostrar todas as páginas
                for (let i = 1; i <= totalPages; i++) {
                  pages.push(
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => onPageChange(i)}
                        isActive={currentPage === i}
                        className="cursor-pointer"
                      >
                        {i}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
              } else {
                // Lógica para muitas páginas
                if (currentPage <= 4) {
                  // Início: 1,2,3,4,5...n
                  for (let i = 1; i <= 5; i++) {
                    pages.push(
                      <PaginationItem key={i}>
                        <PaginationLink
                          onClick={() => onPageChange(i)}
                          isActive={currentPage === i}
                          className="cursor-pointer"
                        >
                          {i}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  pages.push(
                    <PaginationItem key="end-ellipsis">
                      <span className="px-2 text-muted-foreground">...</span>
                    </PaginationItem>
                  );
                  pages.push(
                    <PaginationItem key={totalPages}>
                      <PaginationLink
                        onClick={() => onPageChange(totalPages)}
                        className="cursor-pointer"
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (currentPage >= totalPages - 3) {
                  // Final: 1...n-4,n-3,n-2,n-1,n
                  pages.push(
                    <PaginationItem key={1}>
                      <PaginationLink
                        onClick={() => onPageChange(1)}
                        className="cursor-pointer"
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>
                  );
                  pages.push(
                    <PaginationItem key="start-ellipsis">
                      <span className="px-2 text-muted-foreground">...</span>
                    </PaginationItem>
                  );
                  for (let i = totalPages - 4; i <= totalPages; i++) {
                    pages.push(
                      <PaginationItem key={i}>
                        <PaginationLink
                          onClick={() => onPageChange(i)}
                          isActive={currentPage === i}
                          className="cursor-pointer"
                        >
                          {i}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                } else {
                  // Meio: 1...current-1,current,current+1...n
                  pages.push(
                    <PaginationItem key={1}>
                      <PaginationLink
                        onClick={() => onPageChange(1)}
                        className="cursor-pointer"
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>
                  );
                  pages.push(
                    <PaginationItem key="start-ellipsis">
                      <span className="px-2 text-muted-foreground">...</span>
                    </PaginationItem>
                  );
                  for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(
                      <PaginationItem key={i}>
                        <PaginationLink
                          onClick={() => onPageChange(i)}
                          isActive={currentPage === i}
                          className="cursor-pointer"
                        >
                          {i}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  pages.push(
                    <PaginationItem key="end-ellipsis">
                      <span className="px-2 text-muted-foreground">...</span>
                    </PaginationItem>
                  );
                  pages.push(
                    <PaginationItem key={totalPages}>
                      <PaginationLink
                        onClick={() => onPageChange(totalPages)}
                        className="cursor-pointer"
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
              }
              
              return pages;
            })()}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}