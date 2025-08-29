import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { Goal } from "@/types";

interface GoalDetailSheetProps {
  goal: Goal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (goal: Goal) => void;
}

export const GoalDetailSheet = ({ goal, open, onOpenChange, onEdit }: GoalDetailSheetProps) => {
  if (!goal) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="sm:max-w-lg space-y-6">
        <SheetHeader>
          <SheetTitle>{goal.title}</SheetTitle>
        </SheetHeader>

        {goal.description && (
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {goal.description}
          </p>
        )}

        {onEdit && (
          <SheetFooter>
            <Button variant="outline" onClick={() => onEdit(goal)}>Editar</Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
};
