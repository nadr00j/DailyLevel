import { useSortable, defaultAnimateLayoutChanges } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Habit } from '@/types/habit';
import { HabitCard } from './HabitCard';

interface Props {
  habit: Habit;
  onEdit: (h: Habit)=>void;
  onView?: ()=>void;
}

export const SortableHabitCard: React.FC<Props> = ({ habit, ...handlers }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: habit.id, animateLayoutChanges: defaultAnimateLayoutChanges });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <HabitCard habit={habit} dragHandleProps={listeners} {...handlers} />
    </div>
  );
};
