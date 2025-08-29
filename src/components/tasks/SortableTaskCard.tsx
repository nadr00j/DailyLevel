import { useSortable, defaultAnimateLayoutChanges } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types';
import { TaskCard } from './TaskCard';

interface SortableTaskCardProps {
  task: Task;
  onToggle: () => void;
  onMove: (bucket: Task['bucket']) => void;
  onDelete: () => void;
  onEdit: () => void;
  onView: () => void;
}

export const SortableTaskCard = ({ task, onToggle, onMove, onDelete, onEdit, onView }: SortableTaskCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id, animateLayoutChanges: defaultAnimateLayoutChanges });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        onToggle={onToggle}
        onMove={onMove}
        onDelete={onDelete}
        onEdit={onEdit}
        onView={onView}
      />
    </div>
  );
};
