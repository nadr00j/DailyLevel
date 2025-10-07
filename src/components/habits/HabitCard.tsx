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

// Function to get current date in Brazil timezone (UTC-3)
const getBrazilToday = () => {
  const now = new Date();
  // Convert to Brazil timezone (UTC-3)
  const brazilOffset = -3 * 60; // -3 hours in minutes
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const brazilTime = new Date(utc + (brazilOffset * 60000));
  
  // Format as YYYY-MM-DD
  const year = brazilTime.getFullYear();
  const month = String(brazilTime.getMonth() + 1).padStart(2, '0');
  const day = String(brazilTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// Function to get date string in Brazil timezone
const formatDateBrazil = (date: Date) => {
  const brazilOffset = -3 * 60; // -3 hours in minutes
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const brazilTime = new Date(utc + (brazilOffset * 60000));
  
  const year = brazilTime.getFullYear();
  const month = String(brazilTime.getMonth() + 1).padStart(2, '0');
  const day = String(brazilTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

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

  const todayStr = getBrazilToday(); // Use Brazil timezone

  // Gerar semanas dinâmicas baseado no mês atual
  const generateWeeklyData = () => {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Começar na segunda-feira da primeira semana do mês
    const startDate = new Date(currentMonth);
    startDate.setDate(currentMonth.getDate() - ((currentMonth.getDay() + 6) % 7)); // Ajustar para segunda-feira
    
    const weeks = [];
    let currentWeekStart = new Date(startDate);
    
    // Gerar semanas até cobrir todo o mês
    let weekIndex = 0;
    while (weekIndex < 6) { // Máximo 6 semanas para qualquer mês
      const weekDays = [];
      
      // Gerar 7 dias da semana (seg-dom)
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const currentDay = new Date(currentWeekStart);
        currentDay.setDate(currentWeekStart.getDate() + dayIndex);
        
        // Incluir todos os dias (mesmo de outros meses)
        weekDays.push(formatDateBrazil(currentDay));
      }
      
      weeks.push(weekDays);
      
      // Verificar se já cobrimos todo o mês
      const weekEndDate = new Date(currentWeekStart);
      weekEndDate.setDate(currentWeekStart.getDate() + 6);
      
      if (weekEndDate >= endOfMonth && weekIndex >= 3) { // Mínimo 4 semanas
        break;
      }
      
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      weekIndex++;
    }
    
    return weeks;
  };

  const weeklyData = generateWeeklyData();
  const days = weeklyData.flat(); // Achatar para array linear

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
    <div className={clsx('p-4 rounded-xl select-none', hasDescription ? 'space-y-3' : 'space-y-1')} style={{backgroundColor:'#131315'}}>
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

      {/* heatmap dinâmico baseado no número de semanas */}
      <div className="w-full">
        <div className={`grid gap-2 ${
          weeklyData.length === 4 ? 'grid-cols-2' : 
          weeklyData.length === 5 ? 'grid-cols-2' : 
          'grid-cols-3'
        }`}>
          {/* Reorganizar ordem dinamicamente */}
          {weeklyData.length === 4 ? 
            // 4 semanas: SEM1 SEM2 / SEM3 SEM4
            weeklyData.map((weekDays, weekIndex) => (
            <div key={weekIndex} className="border border-border/30 rounded-lg bg-card/20" style={{ padding: '0.2rem' }}>
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((dateStr) => {
                  const progress = getProgress(habit.id, dateStr);
                  const ratio = progress ? progress.ratio : 0;
                  let color = useHeatmapColor(habit.color, ratio);
                  if(ratio===0){
                    // Variação pseudo-aleatória, mistura com cor escura
                    const variance = (dateStr.charCodeAt(8)%3)*0.1; // 0,0.1,0.2
                    color = blendWithDark(habit.color, 0.1 + variance); // fator 0.3-0.5, ligeiramente mais claro
                  }
                  
                  // Verificar se é do mês atual
                  const dayDate = new Date(dateStr + 'T00:00:00');
                  const currentMonth = new Date().getMonth();
                  const dayMonth = dayDate.getMonth();
                  const isCurrentMonth = dayMonth === currentMonth;
                  
                  // Se não é do mês atual, mostrar espaço vazio
                  if (!isCurrentMonth) {
                    return (
                      <div
                        key={dateStr}
                        className="h-4 w-4"
                        style={{ opacity: 0 }}
                      />
                    );
                  }
                  
                  return (
                    <div
                      key={dateStr}
                      className="h-4 w-4 rounded"
                      style={{
                        backgroundColor: color,
                        opacity: ratio > 0 ? 1 : 0.35,
                        borderRadius: '4px',
                        transition: 'border-radius 0.2s, box-shadow 0.2s',
                        boxShadow: ratio > 0 ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                        border: ratio > 0.8 ? `2px solid ${habit.color}` : '1px solid rgba(255,255,255,0.08)',
                      }}
                      onClick={() => handleToggle(dateStr)}
                      title={dateStr}
                    />
                  );
                })}
              </div>
            </div>
            )) :
            // Para 5 ou 6 semanas: ordem sequencial
            weeklyData.map((weekDays, weekIndex) => (
            <div key={weekIndex} className="border border-border/30 rounded-lg bg-card/20" style={{ padding: '0.2rem' }}>
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((dateStr) => {
                  const progress = getProgress(habit.id, dateStr);
                  const ratio = progress ? progress.ratio : 0;
                  let color = useHeatmapColor(habit.color, ratio);
                  if(ratio===0){
                    // Variação pseudo-aleatória, mistura com cor escura
                    const variance = (dateStr.charCodeAt(8)%3)*0.1; // 0,0.1,0.2
                    color = blendWithDark(habit.color, 0.1 + variance); // fator 0.3-0.5, ligeiramente mais claro
                  }
                  
                  // Verificar se é do mês atual
                  const dayDate = new Date(dateStr + 'T00:00:00');
                  const currentMonth = new Date().getMonth();
                  const dayMonth = dayDate.getMonth();
                  const isCurrentMonth = dayMonth === currentMonth;
                  
                  // Se não é do mês atual, mostrar espaço vazio
                  if (!isCurrentMonth) {
                    return (
                      <div
                        key={dateStr}
                        className="h-4 w-4"
                        style={{ opacity: 0 }}
                      />
                    );
                  }
                  
                  return (
                    <div
                      key={dateStr}
                      className="h-4 w-4 rounded"
                      style={{
                        backgroundColor: color,
                        opacity: ratio > 0 ? 1 : 0.35,
                        borderRadius: '4px',
                        transition: 'border-radius 0.2s, box-shadow 0.2s',
                        boxShadow: ratio > 0 ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                        border: ratio > 0.8 ? `2px solid ${habit.color}` : '1px solid rgba(255,255,255,0.08)',
                      }}
                      onClick={() => handleToggle(dateStr)}
                      title={dateStr}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
