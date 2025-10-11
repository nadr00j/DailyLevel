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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: `habit-${habit.id}`,
    animateLayoutChanges: defaultAnimateLayoutChanges,
    data: {
      type: 'habit-card',
      id: habit.id
    }
  });
  
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes}
      data-sortable-type="habit-card"
    >
      <HabitCard habit={habit} dragHandleProps={listeners} {...handlers} />
    </div>
  );
};
