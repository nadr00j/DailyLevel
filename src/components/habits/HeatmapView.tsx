import { motion } from 'framer-motion';
import { Habit } from '@/types';
import { useHabits } from '@/hooks/useHabits';
import { cn } from '@/lib/utils';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, getDay } from 'date-fns';

interface HeatmapViewProps {
  habit: Habit;
  months?: number;
}

export const HeatmapView = ({ habit, months = 3 }: HeatmapViewProps) => {
  const { getHeatmapData } = useHabits();
  const heatmapData = getHeatmapData(habit, months);

  // Generate calendar grid
  const generateCalendarData = () => {
    const now = new Date();
    const monthsData = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const days = eachDayOfInterval({ start, end });

      // Add empty cells for proper alignment (Sunday = 0)
      const firstDayOfWeek = getDay(start);
      const emptyCells = Array(firstDayOfWeek).fill(null);

      monthsData.push({
        month: format(monthDate, 'MMM'),
        days: [...emptyCells, ...days]
      });
    }

    return monthsData;
  };

  const calendarData = generateCalendarData();

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
        <h3 className="font-semibold">Activity</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-habit-incomplete" />
            <div className="w-3 h-3 rounded-sm bg-habit-complete opacity-50" />
            <div className="w-3 h-3 rounded-sm bg-habit-complete" />
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="space-y-3">
        {calendarData.map((monthData, monthIndex) => (
          <div key={monthIndex}>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              {monthData.month}
            </h4>
            
            <div className="grid grid-cols-7 gap-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <div
                  key={index}
                  className="text-xs text-muted-foreground text-center py-1"
                >
                  {day}
                </div>
              ))}
              
              {monthData.days.map((day, dayIndex) => {
                const completed = getDayStatus(day);
                const isToday = day && format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                
                return (
                  <motion.div
                    key={dayIndex}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: (monthIndex * 31 + dayIndex) * 0.01 }}
                    className={cn(
                      "w-8 h-8 rounded-md transition-all duration-200",
                      day ? getIntensity(completed) : '',
                      isToday && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                      !day && "opacity-0"
                    )}
                    title={day ? format(day, 'MMM d, yyyy') : ''}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-border">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-primary">{habit.streak}</div>
            <div className="text-xs text-muted-foreground">Current Streak</div>
          </div>
          <div>
            <div className="text-lg font-bold text-warning">{habit.longestStreak}</div>
            <div className="text-xs text-muted-foreground">Best Streak</div>
          </div>
          <div>
            <div className="text-lg font-bold text-foreground">
              {Math.round((heatmapData.filter(d => d.completed).length / heatmapData.length) * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">Completion Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};