

# Add Drag & Drop to Task Kanban View

## File: `src/features/tasks/components/TaskKanbanView.tsx`

Single file modification. All changes within this file only.

### Changes

1. **Add imports**: `DndContext`, `DragOverlay`, `closestCorners`, `PointerSensor`, `useSensor`, `useSensors`, `DragStartEvent`, `DragEndEvent`, `useDroppable`, `useDraggable` from `@dnd-kit/core`; `CSS` from `@dnd-kit/utilities`

2. **Add state & sensors**: `activeTask` state (`Task | null`), `sensors` with `PointerSensor` (distance: 8) to distinguish clicks from drags

3. **Add handlers**: `handleDragStart` (find task, set activeTask), `handleDragEnd` (get over target status, call existing `handleMoveTask`, clear activeTask)

4. **Create internal components**:
   - `DroppableColumn`: wraps each column div, uses `useDroppable`, adds `ring-2 ring-primary/30 bg-primary/5` when `isOver`
   - `DraggableCard`: wraps each task Card, uses `useDraggable`, applies `translate3d` transform and `opacity-30` when dragging

5. **Wrap JSX**:
   - Wrap the entire grid in `<DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>`
   - Replace each column's outer `<div>` with `<DroppableColumn id={column.status}>`
   - Wrap each task `<Card>` with `<DraggableCard task={task}>`, move `key` to DraggableCard
   - Add `<DragOverlay>` after the grid with a ghost card (shadow-lg, rotate-2, priority dot + title)

### Behavior
- Drag 8px+ → activates drag, original card fades (opacity-30), ghost follows cursor
- Drop on column → status update via existing `handleMoveTask`
- Click without dragging → navigates to `/tarefas/{id}` as before
- Hover move buttons remain as fallback for accessibility/mobile

No other files modified. No changes to `src/features/proposals/components/public/`.

