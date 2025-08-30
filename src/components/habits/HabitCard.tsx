import React from 'react';
import { Habit } from '@/types/habit';
import { useHabitStore } from '@/stores/useHabitStore';
import { useHeatmapColor } from '@/hooks/useHeatmapColor';
import { subDays, addDays, startOfWeek } from 'date-fns';
import * as LucideIcons from 'lucide-react';
import { Plus, Check, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import clsx from 'clsx';

interface Props {
  habit: Habit;
  onEdit?: (h: Habit) => void;
  onView?: () => void;
  dragHandleProps?: any;
}

// util para lighten cor rapidamente (0..1)
function blendWithDark(hex: string | undefined, factor: number): string {
  // Se hex for undefined ou inválido, usar cor padrão
  if (!hex || typeof hex !== 'string') {
    hex = '#3B82F6'; // Cor padrão azul
  }
  
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const toHex = (v:number)=>v.toString(16).padStart(2,'0');
  // target dark color #1c1c1e => 28,28,30
  const dR = 28, dG = 28, dB = 30;
  const newR = Math.round(r * factor + dR * (1 - factor));
  const newG = Math.round(g * factor + dG * (1 - factor));
  const newB = Math.round(b * factor + dB * (1 - factor));
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

export const HabitCard: React.FC<Props> = ({ habit, onEdit, onView, dragHandleProps }) => {
  const logCompletion = useHabitStore(s=>s.logCompletion);
  const decrementCompletion = useHabitStore(s=>s.decrementCompletion);
  const deleteHabit = useHabitStore(s=>s.deleteHabit);
  const getProgress = useHabitStore(s=>s.getProgressForDate);

  const todayStr = new Date().toISOString().slice(0,10);

  // Últimas 12 semanas alinhadas ao calendário (semana começa na segunda)
  const days: string[] = [];
  const todayDate = new Date();
  const start = startOfWeek(subDays(todayDate, 77), { weekStartsOn: 1 });
  for (let i = 0; i < 84; i++) {
    days.push(addDays(start, i).toISOString().slice(0,10));
  }

  // progresso de hoje
  const todayProgress = getProgress(habit.id, todayStr);
  const isCompletedToday = todayProgress ? todayProgress.count >= habit.targetCount : false;

  const hasDescription = !!habit.description?.trim();

  const handleToggle = (dateStr: string) => {
    console.log('[HabitCard Debug] handleToggle chamado:', { dateStr, todayStr, habitId: habit.id, habitName: habit.name });
    
    if (dateStr !== todayStr) {
      console.log('[HabitCard Debug] Data não é hoje, retornando');
      return;
    }

    const progress = getProgress(habit.id, dateStr);
    if (!progress) return;

    if (progress.count < habit.targetCount) {
      // incrementa
      console.log('[HabitCard Debug] Incrementando hábito');
      logCompletion(habit.id, dateStr);
    } else {
      // já completo: reset para 0
      console.log('[HabitCard Debug] Resetando hábito');
      for (let i = 0; i < progress.count; i++) {
        decrementCompletion(habit.id, dateStr);
      }
    }
  };

  return (
    <div className={clsx('p-4 rounded-xl', hasDescription ? 'space-y-3' : 'space-y-1')} style={{backgroundColor:'#131315'}}>
      {/* Header */}
      <div className={clsx('flex gap-2', hasDescription ? 'items-start' : 'items-center')}>
        {/* Drag handle */}
        {dragHandleProps && (
          <button
            {...dragHandleProps}
            className="mt-2 mb-1 cursor-grab text-muted-foreground hover:text-foreground flex-shrink-0"
            onClick={(e)=>e.stopPropagation()}
          >
            <LucideIcons.GripVertical size={16} />
          </button>
        )}
        {/* Options dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 p-0 mt-1 text-muted-foreground hover:text-foreground flex-shrink-0">
              <MoreVertical size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="ml-8">
            <DropdownMenuItem onClick={()=>{ if(onEdit) onEdit(habit); }}>Editar</DropdownMenuItem>
            <DropdownMenuItem onClick={()=>{ deleteHabit(habit.id); }} className="text-destructive">Remover</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Icon */}
        <div className="w-10 h-10 flex items-center justify-center rounded-lg text-xl flex-shrink-0" style={{backgroundColor:blendWithDark(habit.color,0.4)}}>
          {habit.iconValue && (
            habit.iconType === 'emoji'
              ? habit.iconValue
              : React.createElement((LucideIcons as any)[habit.iconValue] || (LucideIcons as any).Heart, { size: 20 })
          )}
        </div>

        {/* Title & description */}
        <div className={clsx('flex-1 min-w-0', onView && 'cursor-pointer')} onClick={onView}>
          <p className={clsx('font-medium', hasDescription ? '' : 'truncate')}>{habit.name}</p>
          {hasDescription && <p className="text-xs text-muted-foreground truncate">{habit.description}</p>}
        </div>

        {/* Completion button com anel segmentado via CSS gradients */}
        <button
          onClick={() => handleToggle(todayStr)}
          className="relative w-10 h-10 flex-shrink-0 rounded-lg"
        >
          {/* ring layer */}
          <span
            className="absolute inset-0 rounded-lg pointer-events-none z-0"
            style={(() => {
              const segments = habit.targetCount;
              const completed = todayProgress?.count || 0;
              const segAngle = 360 / segments;
              const gapAngle = segments === 1 ? 0 : segAngle * 0.3; // sem gap se apenas 1 segmento
              const filledSegmentsAngle = completed * segAngle;

              const baseRing = `repeating-conic-gradient(${blendWithDark(habit.color, 0.3)} 0deg ${segAngle - gapAngle}deg, transparent ${segAngle - gapAngle}deg ${segAngle}deg)`;
              const progressRing = `conic-gradient(${habit.color} 0deg ${filledSegmentsAngle}deg, transparent ${filledSegmentsAngle}deg 360deg)`;

              return {
                backgroundImage: `${progressRing}, ${baseRing}`,
                mask: 'radial-gradient(transparent 55%, black 58%)',
                WebkitMask: 'radial-gradient(transparent 55%, black 58%)',
                transition: 'background-image 0.3s linear'
              } as React.CSSProperties;
            })()}
          />

          {/* icon layer */}
          <span className="absolute inset-2 flex items-center justify-center rounded-md z-10" style={{backgroundColor:'#1c1c1e'}}>
            {isCompletedToday ? <Check size={18} className="text-white" /> : <Plus size={18} className="text-white" />}
          </span>
        </button>
      </div>

      {/* Divider colorido */}
      <div className="mt-2 mb-2 h-[3px] w-full rounded-full" style={{backgroundColor: habit.color, opacity:0.7}} />

      {/* heatmap 7×12 alinhado a calendário */}
      <div className="flex justify-center w-full overflow-x-auto">
        <div className="grid grid-flow-col grid-rows-7 auto-cols-max gap-1">
        {days.map((dateStr) => {
          const progress = getProgress(habit.id, dateStr);
          const ratio = progress ? progress.ratio : 0;
          let color = useHeatmapColor(habit.color, ratio);
          if(ratio===0){
            // Variação pseudo-aleatória, mistura com cor escura
            const variance = (dateStr.charCodeAt(8)%3)*0.1; // 0,0.1,0.2
            color = blendWithDark(habit.color, 0.1 + variance); // fator 0.3-0.5, ligeiramente mais claro
          }
          return (
            <div
              key={dateStr}
              className="h-5 w-5 rounded"
              style={{
                backgroundColor: color,
                opacity: ratio === 0 ? 0.35 : 1,
                borderRadius: '7px',
                transition: 'border-radius 0.2s, box-shadow 0.2s',
                boxShadow: ratio > 0 ? '0 1px 4px 0 rgba(0,0,0,0.10)' : 'none',
                border: ratio > 0.8 ? `2px solid ${habit.color}` : '1px solid rgba(255,255,255,0.08)',
                marginLeft: '5px' // aumenta um pouco o espaçamento entre os quadrados
              }}
              onClick={() => handleToggle(dateStr)}
              title={dateStr}
            ></div>
          );
        })}
        </div>
      </div>
    </div>
  );
};
