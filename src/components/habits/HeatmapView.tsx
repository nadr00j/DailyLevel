import { motion } from 'framer-motion';
import { Habit } from '@/types';
import { useHabits } from '@/hooks/useHabits';
import { cn } from '@/lib/utils';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, getDay, addDays, startOfWeek, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HeatmapViewProps {
  habit: Habit;
  months?: number;
}

export const HeatmapView = ({ habit, months = 3 }: HeatmapViewProps) => {
  const { getHeatmapData } = useHabits();
  const heatmapData = getHeatmapData(habit, months);

  // Generate weekly calendar data for current month
  const generateWeeklyData = () => {
    const now = new Date();
    const currentMonth = startOfMonth(now);
    const endMonth = endOfMonth(now);
    
    // Começar na segunda-feira da primeira semana do mês
    const startDate = startOfWeek(currentMonth, { weekStartsOn: 1 }); // 1 = Monday
    
    const weeks = [];
    let currentWeekStart = startDate;
    
    // Gerar 4 semanas (ou até 6 se necessário para cobrir o mês)
    for (let weekIndex = 0; weekIndex < 6; weekIndex++) {
      const weekDays = [];
      
      // Gerar 7 dias da semana (seg-dom)
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const currentDay = addDays(currentWeekStart, dayIndex);
        
        // Só incluir se for do mês atual, senão null
        if (isSameMonth(currentDay, now)) {
          weekDays.push(currentDay);
        } else {
          weekDays.push(null);
        }
      }
      
      weeks.push({
        weekNumber: weekIndex + 1,
        days: weekDays
      });
      
      currentWeekStart = addDays(currentWeekStart, 7);
      
      // Parar se já passou do mês atual
      if (currentWeekStart > endMonth) {
        break;
      }
    }
    
    // Garantir que temos exatamente 4 semanas (completar com semanas vazias se necessário)
    while (weeks.length < 4) {
      weeks.push({
        weekNumber: weeks.length + 1,
        days: Array(7).fill(null)
      });
    }
    
    return weeks.slice(0, 4); // Máximo 4 semanas
  };

  const weeklyData = generateWeeklyData();

  const getDayStatus = (date: Date | null) => {
    if (!date) return null;
    const dateString = format(date, 'yyyy-MM-dd');
    const dayData = heatmapData.find(d => d.date === dateString);
    return dayData?.completed || false;
  };

  const getIntensity = (completed: boolean | null) => {
    if (completed === null) return '';
    if (completed) return 'bg-habit-complete';
    return 'bg-habit-incomplete';
  };

  return (
    <div className="card-glass p-4 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Atividade</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Menos</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-habit-incomplete" />
            <div className="w-3 h-3 rounded-sm bg-habit-complete opacity-50" />
            <div className="w-3 h-3 rounded-sm bg-habit-complete" />
          </div>
          <span>Mais</span>
        </div>
      </div>

      {/* Header com mês atual */}
      <div className="text-center mb-4">
        <h4 className="text-lg font-semibold text-foreground">
          {format(new Date(), 'MMMM yyyy', { locale: ptBR })}
        </h4>
      </div>

      {/* Labels dos dias da semana */}
      <div className="grid grid-cols-7 gap-1 mb-3">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day, index) => (
          <div
            key={index}
            className="text-xs text-muted-foreground text-center py-1 font-medium"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid 2x2 das 4 semanas */}
      <div className="grid grid-cols-2 gap-4">
        {weeklyData.map((weekData, weekIndex) => (
          <motion.div
            key={weekIndex}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: weekIndex * 0.1 }}
            className="border border-border/50 rounded-lg p-3 bg-card/30"
          >
            {/* Header da semana */}
            <div className="text-xs text-muted-foreground text-center mb-2 font-medium">
              Semana {weekData.weekNumber}
            </div>
            
            {/* Grid 7 dias da semana */}
            <div className="grid grid-cols-7 gap-1">
              {weekData.days.map((day, dayIndex) => {
                const completed = getDayStatus(day);
                const isToday = day && format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                
                return (
                  <motion.div
                    key={dayIndex}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: (weekIndex * 7 + dayIndex) * 0.02 }}
                    className={cn(
                      "w-6 h-6 rounded-md transition-all duration-200 flex items-center justify-center",
                      day ? getIntensity(completed) : 'bg-muted/30',
                      isToday && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                      !day && "opacity-30"
                    )}
                    title={day ? format(day, 'd MMM yyyy', { locale: ptBR }) : ''}
                  >
                    {day && (
                      <span className={`text-xs font-medium ${
                        completed ? 'text-black' : 'text-foreground/80'
                      }`}>
                        {format(day, 'd')}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
};