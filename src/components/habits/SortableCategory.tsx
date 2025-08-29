import { useSortable, defaultAnimateLayoutChanges } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';

interface Props {
  id: string;
  children: React.ReactNode;
}

export const SortableCategory: React.FC<Props> = ({ id, children }) => {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id, animateLayoutChanges: defaultAnimateLayoutChanges });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: '100%',
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};
