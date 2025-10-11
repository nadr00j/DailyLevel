import { motion } from 'framer-motion';
import { MoreVertical, Calendar, AlertCircle } from 'lucide-react';
import { Task } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format, parseISO } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onToggle: () => void;
  onMove?: (bucket: Task['bucket']) => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onView?: () => void;
}

const bucketColors = {
  today: 'border-l-task-today',
  week: 'border-l-task-week',
  later: 'border-l-task-later'
};

const priorityColors = {
  low: 'text-green-500',
  medium: 'text-yellow-400',
  high: 'text-red-500'
};

const priorityBorder = {
  low: 'border-l-green-500',
  medium: 'border-l-yellow-400',
  high: 'border-l-red-500'
};

export const TaskCard = ({ task, onToggle, onMove, onDelete, onEdit, onView }: TaskCardProps) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
  const weeklyOverdue = task.weekStart && task.overdue && !task.completed;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "card-glass p-4 rounded-xl border-l-4 transition-all duration-200 select-none",
        priorityBorder[task.priority],
        task.completed && "opacity-60"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Menu agora à esquerda */}
        { (onMove || onDelete || onEdit) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground flex-shrink-0">
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="ml-8">
              {['today','week','later'].filter(b=>b!==task.bucket).map((b)=> (
                <DropdownMenuItem key={b} onSelect={()=>onMove && onMove(b as Task['bucket'])}>
                  Mover para {b==='today'?'Hoje': b==='week'?'Semana':'Depois'}
                </DropdownMenuItem>
              ))}
              {onEdit && (
                <>
                  <DropdownMenuItem onSelect={onEdit}>Editar</DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={()=>onDelete && onDelete()} className="text-destructive">Excluir</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {/* Conteúdo + checkbox aligned right */}
        <div className="flex items-center gap-3 flex-1 justify-between">
          <div className="flex-1 min-w-0" onClick={onView}>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={cn(
                "font-medium transition-all duration-200 mt-1",
                task.completed ? "text-muted-foreground line-through" : "text-foreground"
              )}>
                {task.title}
              </h3>
              
              {/* Badge overdue para outras tarefas (não semanais) - mantém junto ao título */}
              {!task.weekStart && isOverdue && (
                <span className="text-[10px] px-2 py-0.5 bg-warning text-warning-foreground rounded-full mt-1 ml-2">Atrasada</span>
              )}
              
              {/* Intervalo semana próximo ao título quando NÃO há descrição */}
              {task.weekStart && !task.description && (
                <span className={cn(
                  "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium mt-1",
                  weeklyOverdue ? 'bg-red-500/60 text-white' : 'bg-green-500/60 text-white'
                )}
                style={{ marginLeft: '0.35rem' }}>
                  <Calendar size={10} className="text-white" />
                  {(() => {
                    const startDay = format(parseISO(task.weekStart), 'd');
                    const endDay = task.weekEnd ? format(parseISO(task.weekEnd), 'd') : startDay;
                    
                    // Se início e fim são iguais, mostrar apenas um dia
                    if (startDay === endDay) {
                      return startDay;
                    }
                    
                    // Se diferentes, mostrar intervalo
                    return `${startDay}-${endDay}`;
                  })()}
                </span>
              )}
              
              {/* Data de vencimento próxima ao título quando NÃO há descrição */}
              {task.dueDate && !task.description && (
                <div className="flex items-center gap-1 mt-1" style={{ marginLeft: '0.35rem' }}>
                  <Calendar size={12} className={isOverdue ? "text-destructive" : "text-muted-foreground"} />
                  <span className={cn(
                    "text-xs",
                    isOverdue ? "text-destructive font-medium" : "text-muted-foreground"
                  )}>
                    {format(new Date(task.dueDate), 'MMM d')}
                  </span>
                </div>
              )}
            </div>
            
            {task.description && (
              <p className="text-xs text-muted-foreground truncate max-w-[220px] mt-1">{task.description}</p>
            )}
            
            {/* Intervalo semana abaixo quando HÁ descrição */}
            {task.weekStart && task.description && (
              <div className="flex items-center gap-2 mt-2">
                <span className={cn(
                  "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium",
                  weeklyOverdue ? 'bg-red-500/60 text-white' : 'bg-green-500/60 text-white'
                )}>
                  <Calendar size={10} className="text-white" />
                  {(() => {
                    const startDay = format(parseISO(task.weekStart), 'd');
                    const endDay = task.weekEnd ? format(parseISO(task.weekEnd), 'd') : startDay;
                    
                    // Se início e fim são iguais, mostrar apenas um dia
                    if (startDay === endDay) {
                      return startDay;
                    }
                    
                    // Se diferentes, mostrar intervalo
                    return `${startDay}-${endDay}`;
                  })()}
                </span>
              </div>
            )}
            {/* Aviso de atraso para tarefas semanais */}
            {weeklyOverdue && (
              <div className="flex items-center gap-1 mt-1">
                <AlertCircle size={12} className="text-red-500" />
                <span className="text-[10px] text-red-500 mt-0.5">Tarefa atrasada</span>
              </div>
            )}
            {/* Data de vencimento abaixo quando HÁ descrição */}
            {task.dueDate && task.description && (
              <div className="flex items-center gap-1 mt-2">
                <Calendar size={12} className={isOverdue ? "text-destructive" : "text-muted-foreground"} />
                <span className={cn(
                  "text-xs",
                  isOverdue ? "text-destructive font-medium" : "text-muted-foreground"
                )}>
                  {format(new Date(task.dueDate), 'MMM d')}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggle}
            className={cn(
              "w-6 h-6 mt-0 rounded-md border-2 transition-all duration-200 flex items-center justify-center flex-shrink-0",
              task.completed
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground hover:border-primary"
            )}
          >
            {task.completed && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                ✓
              </motion.div>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};