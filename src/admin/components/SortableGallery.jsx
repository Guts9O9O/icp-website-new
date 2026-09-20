import { DndContext, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// One tile: drag to reorder, buttons to make it the thumbnail or remove it.
function Tile({ item, index, onRemove, onMakeThumb, isThumb }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.key });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="group relative overflow-hidden rounded-md border border-icp-mist/70 bg-white">
      <div
        {...attributes}
        {...listeners}
        className="aspect-[4/3] cursor-grab touch-none bg-[#efece8] active:cursor-grabbing"
        title="Drag to reorder"
      >
        <img src={item.preview} alt="" className="h-full w-full object-cover" draggable={false} />
      </div>
      <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[11px] text-white">{index + 1}</span>
      {isThumb && <span className="absolute right-2 top-2 rounded bg-icp-red px-1.5 py-0.5 text-[11px] text-white">Thumbnail</span>}
      {item.pending && <span className="absolute bottom-9 left-2 rounded bg-amber-500 px-1.5 py-0.5 text-[11px] text-white">Not saved yet</span>}
      <div className="flex divide-x divide-icp-mist/60 border-t border-icp-mist/60 text-[12px]">
        <button type="button" onClick={() => onMakeThumb(item)} className="flex-1 py-1.5 text-icp-slate hover:bg-[#f5f3f0]">
          Use as thumbnail
        </button>
        <button type="button" onClick={() => onRemove(item)} className="flex-1 py-1.5 text-red-700 hover:bg-red-50">
          Remove
        </button>
      </div>
    </div>
  );
}

// items: [{ key, preview, path?, file?, pending? }]
export default function SortableGallery({ items, onChange, onRemove, onMakeThumb, thumbKey }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.key === active.id);
    const to = items.findIndex((i) => i.key === over.id);
    onChange(arrayMove(items, from, to));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.key)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {items.map((item, index) => (
            <Tile key={item.key} item={item} index={index} onRemove={onRemove} onMakeThumb={onMakeThumb} isThumb={item.key === thumbKey} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
