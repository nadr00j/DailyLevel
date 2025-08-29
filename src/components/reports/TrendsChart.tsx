import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Calendar, Target, Zap } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TrendsChartProps {
  history: Array<{
    ts: number;
    type: string;
    xp: number;
    category?: string;
  }>;
  period: 'day' | 'week' | 'month';
}

interface TrendData {
  date: string;
  xp: number;
  vitality: number;
  tasks: number;
  habits: number;
}

export const TrendsChart: React.FC<TrendsChartProps> = ({ history, period }) => {
  // Calcular dados de tendência baseados no período
  const getTrendData = (): TrendData[] => {
    const now = new Date();
    const data: TrendData[] = [];
    
    let daysToShow = 7;
    let dateFunction = (date: Date) => subDays(date, 1);
    
    switch (period) {
      case 'day':
        daysToShow = 7; // Últimos 7 dias
        break;
      case 'week':
        daysToShow = 4; // Últimas 4 semanas
        dateFunction = (date: Date) => subDays(date, 7);
        break;
      case 'month':
        daysToShow = 6; // Últimos 6 meses
        dateFunction = (date: Date) => subDays(date, 30);
        break;
    }
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const currentDate = dateFunction(now);
      const startOfPeriod = period === 'day' 
        ? new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
        : period === 'week'
        ? startOfWeek(currentDate, { locale: ptBR })
        : startOfMonth(currentDate);
        
      const endOfPeriod = period === 'day'
        ? new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59)
        : period === 'week'
        ? endOfWeek(currentDate, { locale: ptBR })
        : endOfMonth(currentDate);
      
      const periodHistory = history.filter(item => {
        const itemDate = new Date(item.ts);
        return itemDate >= startOfPeriod && itemDate <= endOfPeriod;
      });
      
      const xp = periodHistory.reduce((sum, item) => sum + item.xp, 0);
      const tasks = periodHistory.filter(item => item.type === 'task').length;
      const habits = periodHistory.filter(item => item.type === 'habit').length;
      
      // Calcular vitalidade baseada no XP do período
      // Para períodos passados, aplicar decaimento baseado na distância temporal
      const daysSincePeriod = Math.floor((now - endOfPeriod.getTime()) / (24 * 60 * 60 * 1000));
      
      // Calcular vitalidade base baseada no XP do período
      let baseVitality = 0;
      if (period === 'day') {
        baseVitality = Math.min(100, (xp / 20) * 100); // Meta diária de 20 XP
      } else if (period === 'week') {
        baseVitality = Math.min(100, (xp / 100) * 100); // Meta semanal de 100 XP
      } else {
        baseVitality = Math.min(100, (xp / 500) * 100); // Meta mensal de 500 XP
      }
      
      // Aplicar decaimento baseado na distância temporal
      const decay = daysSincePeriod * 5; // 5 pontos por dia
      const vitality = Math.max(0, baseVitality - decay);
      
      data.push({
        date: format(currentDate, period === 'day' ? 'dd/MM' : period === 'week' ? 'dd/MM' : 'MM/yy'),
        xp,
        vitality,
        tasks,
        habits
      });
    }
    
    return data;
  };
  
  const trendData = getTrendData();
  
  // Calcular estatísticas de tendência
  const totalXp = trendData.reduce((sum, item) => sum + item.xp, 0);
  const avgXp = Math.round(totalXp / trendData.length);
  const totalTasks = trendData.reduce((sum, item) => sum + item.tasks, 0);
  const totalHabits = trendData.reduce((sum, item) => sum + item.habits, 0);
  
  // Calcular tendência (crescimento/declínio)
  const firstHalf = trendData.slice(0, Math.floor(trendData.length / 2));
  const secondHalf = trendData.slice(Math.floor(trendData.length / 2));
  
  const firstHalfAvg = firstHalf.reduce((sum, item) => sum + item.xp, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, item) => sum + item.xp, 0) / secondHalf.length;
  
  const trendDirection = secondHalfAvg > firstHalfAvg ? 'up' : secondHalfAvg < firstHalfAvg ? 'down' : 'stable';
  const trendPercentage = Math.abs(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100);
  
  return (
    <div className="space-y-6">
             {/* Estatísticas de Evolução */}
       <div className="grid grid-cols-1 gap-4">
         <Card>
           <CardContent className="p-4">
             <div className="flex items-center gap-2 mb-2">
               <Zap className="h-4 w-4 text-yellow-500" />
               <span className="text-sm font-medium">XP Médio</span>
             </div>
             <div className="text-2xl font-bold">{avgXp}</div>
             <div className="text-xs text-muted-foreground">
               por {period === 'day' ? 'dia' : period === 'week' ? 'semana' : 'mês'}
             </div>
           </CardContent>
         </Card>
       </div>
      
             {/* Gráfico Simples de Barras */}
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Calendar className="h-5 w-5" />
             Evolução do XP
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="space-y-4">
             {trendData.map((item, index) => {
               const maxXp = Math.max(...trendData.map(d => d.xp));
               const height = maxXp > 0 ? (item.xp / maxXp) * 100 : 0;
               
               return (
                 <div key={index} className="flex items-end gap-2">
                   <div className="w-12 text-xs text-muted-foreground text-right">
                     {item.date}
                   </div>
                   <div className="flex-1 flex items-end gap-1">
                     <div 
                       className="bg-primary rounded-t-sm min-h-[4px] transition-all duration-300"
                       style={{ height: `${Math.max(height, 4)}%` }}
                     />
                     <div className="text-xs text-muted-foreground">
                       {item.xp}
                     </div>
                   </div>
                 </div>
               );
             })}
           </div>
         </CardContent>
       </Card>
       
       {/* Gráfico de Vitalidade */}
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <TrendingUp className="h-5 w-5" />
             Evolução da Vitalidade
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="space-y-4">
             {trendData.map((item, index) => {
               const vitalityColor = item.vitality >= 80 ? 'bg-green-500' : 
                                   item.vitality >= 60 ? 'bg-yellow-500' : 
                                   item.vitality >= 40 ? 'bg-orange-500' : 'bg-red-500';
               
               return (
                 <div key={index} className="flex items-end gap-2">
                   <div className="w-12 text-xs text-muted-foreground text-right">
                     {item.date}
                   </div>
                   <div className="flex-1 flex items-end gap-1">
                     <div 
                       className={`${vitalityColor} rounded-t-sm min-h-[4px] transition-all duration-300`}
                       style={{ height: `${Math.max(item.vitality, 4)}%` }}
                     />
                     <div className="text-xs text-muted-foreground">
                       {Math.round(item.vitality)}%
                     </div>
                   </div>
                 </div>
               );
             })}
           </div>
         </CardContent>
       </Card>
      
      {/* Resumo de Atividades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Resumo de Atividades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{totalTasks}</div>
              <div className="text-sm text-muted-foreground">Tarefas Concluídas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{totalHabits}</div>
              <div className="text-sm text-muted-foreground">Hábitos Mantidos</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
