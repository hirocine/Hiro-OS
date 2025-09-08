import React from 'react';
import { SortableHeader } from './SortableHeader';
import { SortableField, SortOrder } from '@/types/equipment';

interface EquipmentTableHeaderProps {
  onSort: (field: SortableField, order: SortOrder) => void;
  sortBy?: SortableField;
  sortOrder?: SortOrder;
}

export function EquipmentTableHeader({
  onSort,
  sortBy,
  sortOrder
}: EquipmentTableHeaderProps) {
  return (
    <div className="bg-muted/30 border-b border-border sticky top-0 z-10">
      <div className="grid grid-cols-[40px_60px_minmax(250px,1fr)_minmax(140px,200px)_minmax(120px,160px)_100px_120px_120px] gap-2 lg:gap-3 px-2 lg:px-4 py-3 items-center text-xs font-medium text-muted-foreground uppercase tracking-wider">

        {/* Coluna de expansão/tipo */}
        <div className="flex items-center justify-center">
          <span className="text-xs">Tipo</span>
        </div>

        {/* Coluna de imagem */}
        <div className="flex items-center justify-center">
          <span className="text-xs">Img</span>
        </div>

        {/* Nome/Modelo - Sortable */}
        <div className="min-w-0">
          <SortableHeader
            field="name"
            label="Nome / Modelo"
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
            onSort={onSort}
            className="text-xs"
          />
        </div>

        {/* Marca - Sortable */}
        <div className="min-w-0">
          <SortableHeader
            field="brand"
            label="Marca"
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
            onSort={onSort}
            className="text-xs"
          />
        </div>

        {/* Categoria - Sortable */}
        <div className="min-w-0">
          <SortableHeader
            field="category"
            label="Categoria"
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
            onSort={onSort}
            className="text-xs"
          />
        </div>

        {/* Status - Sortable */}
        <div className="min-w-0">
          <SortableHeader
            field="status"
            label="Status"
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
            onSort={onSort}
            className="text-xs"
          />
        </div>

        {/* Valor - Sortable */}
        <div className="min-w-0">
          <SortableHeader
            field="value"
            label="Valor"
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
            onSort={onSort}
            className="text-xs"
          />
        </div>

        {/* Ações */}
        <div className="flex items-center justify-center">
          <span className="text-xs">Ações</span>
        </div>
      </div>
    </div>
  );
}