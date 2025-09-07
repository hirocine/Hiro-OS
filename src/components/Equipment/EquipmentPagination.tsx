import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

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
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getVisiblePages = () => {
    const visiblePages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        visiblePages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        visiblePages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        visiblePages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        visiblePages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return visiblePages;
  };

  return (
    <div className="w-full bg-card border-t overflow-hidden">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-muted/20 border-t">
        {/* Informações dos itens - mais compacta */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            <span className="font-medium text-foreground">{startItem}-{endItem}</span> de{' '}
            <span className="font-medium text-foreground">{totalItems}</span>
          </span>
          
          <div className="flex items-center gap-2">
            <span>Mostrar:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => onItemsPerPageChange(Number(value))}
            >
              <SelectTrigger className="w-16 h-7 text-xs">
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

        {/* Navegação mais elegante */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-background rounded-md border p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className="h-7 w-7 p-0"
            >
              <ChevronsLeft className="h-3 w-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>

            <div className="flex items-center gap-0.5 mx-1">
              {getVisiblePages().map((page, index) => {
                if (page === '...') {
                  return (
                    <span key={`ellipsis-${index}`} className="px-2 text-xs text-muted-foreground">
                      ...
                    </span>
                  );
                }

                const pageNumber = page as number;
                return (
                  <Button
                    key={`page-${pageNumber}`}
                    variant={currentPage === pageNumber ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onPageChange(pageNumber)}
                    className="h-7 w-7 p-0 text-xs"
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="h-7 w-7 p-0"
            >
              <ChevronsRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}