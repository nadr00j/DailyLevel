import { useSortable, defaultAnimateLayoutChanges } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';

interface Props {
  id: string;
  children: ((props: { categoryDragHandleProps: any; isDraggingCategory: boolean }) => React.ReactNode) | React.ReactNode;
}

export const SortableCategory: React.FC<Props> = ({ id, children }) => {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ 
    id: `category-${id}`,
    animateLayoutChanges: defaultAnimateLayoutChanges,
    data: {
      type: 'category',
      id
    }
  });
  
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: '100%',
    opacity: isDragging ? 0.5 : 1,
  };

  const categoryDragHandleProps = { ...attributes, ...listeners };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {typeof children === 'function' 
        ? children({ categoryDragHandleProps, isDraggingCategory: isDragging })
        : children
      }
    </div>
  );
};
