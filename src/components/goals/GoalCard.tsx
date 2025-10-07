import { motion } from 'framer-motion';
import { MoreVertical, Calendar, Target, Trophy, ArrowLeft, GripVertical } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import React, { useState } from 'react';
import { fireVictoryConfetti } from '@/lib/confetti';
import { Goal } from '@/types';
import { useGoals } from '@/hooks/useGoals';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface GoalCardProps {
  goal: Goal;
  onOptions?: () => void;
  onToggle?: () => void;
  onDelete?: () => void;
  onMove?: (to: 'active' | 'future') => void;
  onEdit?: () => void;
  onView?: () => void;
  dragHandleProps?: any;
}

const categoryColors = {
  health: 'border-l-green-500',
  career: 'border-l-blue-500',
  finance: 'border-l-yellow-500',
  learning: 'border-l-purple-500',
  personal: 'border-l-pink-500'
};

function blendWithDark(hex: string, factor: number): string {
  const h = hex?.replace('#','') || 'ffffff';
  const r = parseInt(h.substring(0,2),16)||255;
  const g = parseInt(h.substring(2,4),16)||255;
  const b = parseInt(h.substring(4,6),16)||255;
  const toHex=(v:number)=>v.toString(16).padStart(2,'0');
  const dR=28,dG=28,dB=30;
  return `#${toHex(Math.round(r*factor + dR*(1-factor)))}${toHex(Math.round(g*factor + dG*(1-factor)))}${toHex(Math.round(b*factor + dB*(1-factor)))}`;
}

export const GoalCard = ({ goal, onOptions, onToggle, onDelete, onMove, onEdit, onView, dragHandleProps }: GoalCardProps) => {
  const { getGoalProgress, getNextMilestone } = useGoals();
  const progress = getGoalProgress(goal);
  const nextMilestone = getNextMilestone(goal);
  const isOverdue = goal.deadline && new Date(goal.deadline) < new Date() && !goal.isCompleted;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "p-4 rounded-xl transition-all duration-200 space-y-2 relative select-none",
        goal.isCompleted && "opacity-75"
      )}
      style={{backgroundColor: goal.color ? blendWithDark(goal.color,0.25) : '#1c1c1e'}}
    >
      <div className="flex items-center justify-between">
        {/* Drag handle */}
        {dragHandleProps && (
          <button
            {...dragHandleProps}
            className="mr-2 mt-1 cursor-grab text-muted-foreground hover:text-foreground flex-shrink-0 touch-none"
            style={{ touchAction: 'none' }}
            onClick={(e)=>e.stopPropagation()}
          >
            <GripVertical size={14} />
          </button>
        )}
        <div className={cn("flex-1", onView && "cursor-pointer")} onClick={onView}>
          <div className="flex items-center gap-2 mb-1 mt-2">
            { (onMove || onDelete || onEdit) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground flex-shrink-0"
                    onClick={(e)=>e.stopPropagation()}
                  >
                    <MoreVertical size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="ml-8">
                  {onEdit && (
                    <DropdownMenuItem
                      onClick={(e)=>{ e.stopPropagation(); onEdit(); }}
                    >
                      Editar
                    </DropdownMenuItem>
                  )}
                  {onMove && !goal.isFuture && !goal.isCompleted && (
                    <DropdownMenuItem onClick={(e)=>{e.stopPropagation(); onMove('future');}}>Mover para Futuras</DropdownMenuItem>
                  )}
                  {onMove && goal.isFuture && (
                    <DropdownMenuItem onClick={(e)=>{e.stopPropagation(); onMove('active');}}>Mover para Ativas</DropdownMenuItem>
                  )}
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e)=>{e.stopPropagation(); onDelete();}} className="text-destructive">Excluir</DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {/* Icon */}
            {goal.iconValue && (
              <div className="w-10 h-10 flex items-center justify-center rounded-lg text-xl flex-shrink-0" style={{backgroundColor: goal.color ? blendWithDark(goal.color,0.4): '#2a2a2c'}}>
                {goal.iconType==='emoji' ? goal.iconValue : React.createElement((LucideIcons as any)[goal.iconValue] || (LucideIcons as any).HelpCircle, { size:22 })}
              </div>
            )}
            {/* Title & Description */}
            <div className="flex flex-col ml-[5px]">
              <h3 className={cn(
                "font-semibold",
                goal.isCompleted ? "text-muted-foreground line-through" : "text-foreground"
              )}>
                {goal.title}
              </h3>
              {goal.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {goal.description.length > 30
                    ? `${goal.description.slice(0, 30)}...`
                    : goal.description}
                </p>
              )}
            </div>
          </div>
          

        </div>
        
        {(goal.isFuture && onMove) ? (
          <button
            onClick={(e)=>{e.stopPropagation(); onMove('active');}}
            className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-muted-foreground/60 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
        ) : onToggle ? (
          (()=>{
            const [isAnimating, setAnimating] = useState(false);

            const handleClick = (e: React.MouseEvent) => {
              e.stopPropagation();
              if(goal.isCompleted){
                onToggle();
                return;
              }
              if(isAnimating) return;
              setAnimating(true);
              setTimeout(()=>{
                onToggle();
                // confetti
                fireVictoryConfetti();
                setAnimating(false);
              }, 700); // delay antes de mover
            };

            return (
              <button
                onClick={handleClick}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 flex-shrink-0",
                  goal.isCompleted ? 'mt-5' : 'mt-0',
                  goal.isCompleted || isAnimating
                    ? "bg-yellow-400 text-background shadow-md"
                    : "border-2 border-muted-foreground/60 text-muted-foreground hover:border-yellow-400 hover:text-yellow-400"
                )}
              >
                <motion.div
                  animate={goal.isCompleted || isAnimating ? { scale: [1,1.2,1], rotate:[0,15,-10,0] } : { scale:1, rotate:0 }}
                  transition={{ duration: 0.6, ease:'easeInOut' }}
                >
                  <Trophy size={14} />
                </motion.div>
              </button>
            );
          })()
        ) : null}
      </div>

      {/* Milestones and deadline remain */}
      {/* Next milestone or deadline */}
      <div className="flex items-center justify-between text-sm">
        {nextMilestone && (
          <div className="flex items-center gap-1 text-goal-milestone">
            <Target size={12} />
            <span>Próximo: {nextMilestone.title}</span>
          </div>
        )}
        
        {goal.deadline && (
          <div className="flex items-center gap-1">
            <Calendar size={12} className={isOverdue ? "text-destructive" : "text-muted-foreground"} />
            <span className={cn(
              "text-xs",
              isOverdue ? "text-destructive font-medium" : "text-muted-foreground"
            )}>
              {format(new Date(goal.deadline), 'MMM d, yyyy')}
            </span>
          </div>
        )}
      </div>

      {/* Milestones preview */}
      {goal.milestones && goal.milestones.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Marcos:</span>
            <div className="flex gap-1">
              {goal.milestones.slice(0, 5).map((milestone) => (
                <div
                  key={milestone.id}
                  className={cn(
                    "w-2 h-2 rounded-full",
                    milestone.completed ? "bg-goal-milestone" : "bg-muted"
                  )}
                  title={`${milestone.title} (${milestone.value} ${goal.unit})`}
                />
              ))}
              {goal.milestones.length > 5 && (
                <span className="text-xs text-muted-foreground ml-1">
                  +{goal.milestones.length - 5}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {goal.isCompleted && (
        <div className="absolute top-0 right-2 px-2 py-1 bg-success/10 text-success text-xs rounded-full font-medium z-10 pointer-events-none">
          Concluído
        </div>
      )}
    </motion.div>
  );
};