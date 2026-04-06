

# Add drag-and-drop to PPKanban

## Changes in `src/features/post-production/components/PPKanban.tsx`

### Imports
Add `useState` and dnd-kit imports:
```tsx
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
```

### DraggableCard wrapper
Create a `DraggableCard` component that wraps `KanbanCard` with `useDraggable({ id: item.id, data: { item } })`. Apply `opacity-50 scale-95 cursor-grabbing` when `isDragging`, otherwise `cursor-grab transition-all duration-200`.

### DroppableColumn wrapper
Create a `DroppableColumn` component using `useDroppable({ id: status })`. When `isOver`, apply `ring-2 ring-primary/30 bg-primary/5` to the column container.

### DndContext + DragOverlay
- Wrap the columns flex container with `DndContext` using `closestCenter` collision detection
- Track `activeItem` state via `onDragStart`
- `onDragEnd`: extract `over.id` as the new `PPStatus`, if different from the item's current status, call `updateItem.mutate({ id, updates: { status } })`
- Render `DragOverlay` with a clone of the active card for the ghost effect

### No other files changed

