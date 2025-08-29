import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Task } from "@/types";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const priorityDotColors = {
  low: 'bg-yellow-400',
  medium: 'bg-orange-500',
  high: 'bg-red-500'
} as const;

interface TaskDetailSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (task: Task)=>void;
}

export const TaskDetailSheet = ({ task, open, onOpenChange, onEdit }: TaskDetailSheetProps) => {
  if (!task) return null;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="sm:max-w-lg space-y-6">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className={cn("inline-block w-3 h-3 rounded-full", priorityDotColors[task.priority])}></span>
            {task.title}
          </SheetTitle>
        </SheetHeader>

        {task.description && (
          <p className="text-sm text-muted-foreground whitespace-pre-line">{task.description}</p>
        )}

        <SheetFooter>
          <Button variant="outline" onClick={()=>onEdit(task)}>Editar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
