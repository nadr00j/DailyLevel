import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { HeatmapView } from '@/components/habits/HeatmapView';
import type { Habit } from '@/types/habit';
import React from 'react';

interface Props {
  habit: Habit | null;
  open: boolean;
  onOpenChange: (open:boolean)=>void;
  onEdit: (h: Habit)=>void;
}

export const HabitDetailSheet: React.FC<Props> = ({ habit, open, onOpenChange, onEdit }) => {
  if(!habit) return null;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{habit.name}</SheetTitle>
        </SheetHeader>

        <div className="py-4 space-y-4">
          {habit.description && <p className="text-sm text-muted-foreground whitespace-pre-line">{habit.description}</p>}
          <div className="flex gap-2 text-sm">
            <span className="font-semibold">Meta:</span>
            <span>{habit.targetInterval==='daily'?'Diário': habit.targetInterval==='weekly'?'Semanal':'Mensal'} - {habit.targetCount}x</span>
          </div>
          
          {/* Heatmap View */}
          <div className="mt-6">
            <HeatmapView habit={habit} />
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={()=>{ onOpenChange(false); onEdit(habit); }}>Editar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
