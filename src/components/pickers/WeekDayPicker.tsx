import { addDays, format, startOfWeek, isAfter, isBefore, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import React from 'react';

interface WeekDayPickerProps {
  start?: string; // ISO date (segunda)
  end?: string;   // ISO date (sexta ou outro)
  onChange: (start: string | undefined, end: string | undefined) => void;
  className?: string;
}

export const WeekDayPicker: React.FC<WeekDayPickerProps> = ({ start, end, onChange, className }) => {
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  const isSelected = (dIso: string) => {
    if (!start) return false;
    if (start && !end) return dIso === start;
    return !isBefore(parseISO(dIso), parseISO(start)) && !isAfter(parseISO(dIso), parseISO(end!));
  };

  const handleClick = (date: Date) => {
    const iso = format(date, 'yyyy-MM-dd');
    if (!start) {
      // primeiro clique define somente o início
      onChange(iso, undefined);
    } else if (start && !end) {
      // segundo clique define o fim (garantindo ordem)
      if (isBefore(parseISO(iso), parseISO(start))) {
        onChange(iso, start);
      } else if (iso === start) {
        // clique no mesmo dia reinicia
        onChange(undefined, undefined);
      } else {
        onChange(start, iso);
      }
    } else {
      // seleção completa já existente: reinicia com novo início
      onChange(iso, undefined);
    }
  };

  return (
    <div className={cn('grid grid-cols-7 gap-1', className)}>
      {weekDates.map((date) => {
        const iso = format(date, 'yyyy-MM-dd');
        const selected = isSelected(iso);
        return (
          <button
            key={iso}
            type="button"
            onClick={() => handleClick(date)}
            className={cn(
              'w-8 h-8 rounded-md text-xs flex items-center justify-center transition-colors',
              selected ? 'bg-success text-[#09090b]' : 'hover:bg-accent'
            )}
          >
            {format(date, 'd')}
          </button>
        );
      })}
    </div>
  );
};
