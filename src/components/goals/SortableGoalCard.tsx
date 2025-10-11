import { useSortable, defaultAnimateLayoutChanges } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Goal } from '@/types';
import { GoalCard } from './GoalCard';

interface Props {
  goal: Goal;
  onToggle: () => void;
  onMove: (to: 'active'|'future') => void;
  onDelete: () => void;
  onEdit: () => void;
  onView: () => void;
}

export const SortableGoalCard: React.FC<Props> = ({ goal, ...handlers }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: `goal-${goal.id}`,
    animateLayoutChanges: defaultAnimateLayoutChanges,
    data: {
      type: 'goal-card',
      id: goal.id
    }
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  } as React.CSSProperties;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes}
      data-sortable-type="goal-card"
    >
      <GoalCard goal={goal} dragHandleProps={listeners} {...handlers} />
    </div>
  );
};
