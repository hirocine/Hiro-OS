

# Fix Kanban Drag & Drop — Remove card movement on original

## File: `src/features/tasks/components/TaskKanbanView.tsx`

### Change: Replace `DraggableCard` component (lines 66-78)

Remove `transform` and `style` logic so the original card stays in place. Only the `DragOverlay` ghost follows the cursor.

**Before:** Card applies `translate3d` transform, causing it to move with cursor alongside the overlay ghost.

**After:** Card stays put with `opacity-30 scale-[0.98]` feedback when dragging. Added `touch-none` for proper touch device support.

```typescript
function DraggableCard({ task, children }: { task: Task; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'touch-none',
        isDragging && 'opacity-30 scale-[0.98] transition-all'
      )}
    >
      {children}
    </div>
  );
}
```

No other files modified.

