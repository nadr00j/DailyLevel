import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, TrendingUp, Target, BarChart3, CalendarDays, CalendarRange, CalendarCheck } from 'lucide-react';
import { useActiveCategories, ActiveCategory } from '@/hooks/useActiveCategories';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RadarChart } from './RadarChart';
import { TrendsChart } from './TrendsChart';

type PeriodType = 'day' | 'week' | 'month';

interface PerformanceStats {
  totalXP: number;
  tasksCompleted: number;
  habitsMaintained: number;
  goalsCompleted: number;
  vitality: number;
  streak: number;
}

export const PerformanceReports = () => {
  const [activePeriod, setActivePeriod] = useState<PeriodType>('day');
  const activeCategories = useActiveCategories(activePeriod);
  const { xp, vitality, history } = useGamificationStore();

  // Calcular estatísticas baseadas no período
  const getStatsForPeriod = (period: PeriodType): PerformanceStats => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'week':
        startDate = startOfWeek(now, { locale: ptBR });
        endDate = endOfWeek(now, { locale: ptBR });
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
    }

    const periodHistory = history.filter(item => {
      const itemDate = new Date(item.ts);
      return itemDate >= startDate && itemDate <= endDate;
    });

    const totalXP = periodHistory.reduce((sum, item) => sum + item.xp, 0);
    const tasksCompleted = periodHistory.filter(item => item.type === 'task').length;
    const habitsMaintained = periodHistory.filter(item => item.type === 'habit').length;

    // Calcular quantidade de metas completadas
    const goalsCompleted = periodHistory.filter(item => item.type === 'goal').length;

    // Calcular vitalidade baseada no período
    let periodVitality = vitality; // Usar vitalidade global como base
    if (period === 'day') {
      // Para o dia, mostrar vitalidade baseada no XP do dia
      periodVitality = Math.min(100, (totalXP / 20) * 100);
    } else if (period === 'week') {
      // Para a semana, mostrar vitalidade baseada no XP da semana
      periodVitality = Math.min(100, (totalXP / 100) * 100);
    } else if (period === 'month') {
      // Para o mês, mostrar vitalidade baseada no XP do mês
      periodVitality = Math.min(100, (totalXP / 500) * 100);
    }

    return {
      totalXP,
      tasksCompleted,
      habitsMaintained,
      goalsCompleted,
      vitality: periodVitality,
      streak: 0 // TODO: implementar streak global
    };
  };

  const currentStats = getStatsForPeriod(activePeriod);

  const CategoryList = ({ categories }: { categories: ActiveCategory[] }) => {
    if (categories.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-2" />
            <p>Nenhuma categoria ativa encontrada</p>
            <p className="text-sm">Crie hábitos, tarefas ou metas para ver seu radar de performance</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {categories.map((category, index) => (
          <motion.div
            key={category.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-4 p-3 rounded-lg border bg-card"
          >
            <div className="flex-shrink-0">
              <span className="text-2xl">{category.icon}</span>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-sm truncate">{category.displayName}</h4>
                <Badge variant="secondary" className="text-xs">
                  {category.count} itens
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <Progress value={category.score} className="flex-1 h-2" />
                <span className="text-xs font-medium w-8 text-right">{category.score}%</span>
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{category.xp30d} XP / {category.target30d}</span>
                <span>Streak: {category.streak}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const GeneralStats = ({ stats }: { stats: PerformanceStats }) => (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">XP Total</span>
          </div>
          <div className="text-2xl font-bold">{stats.totalXP}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Tarefas</span>
          </div>
          <div className="text-2xl font-bold">{stats.tasksCompleted}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarCheck className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">Hábitos</span>
          </div>
          <div className="text-2xl font-bold">{stats.habitsMaintained}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-medium">Metas</span>
          </div>
          <div className="text-2xl font-bold">{stats.goalsCompleted}</div>
        </CardContent>
      </Card>
    </div>
  );

  const PeriodNavigation = () => (
    <div className="flex items-center gap-2 mb-6">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium">Período:</span>
      
      <div className="flex gap-1">
        {(['day', 'week', 'month'] as PeriodType[]).map((period) => (
          <Button
            key={period}
            variant={activePeriod === period ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActivePeriod(period)}
            className="text-xs"
          >
            {period === 'day' && 'Dia'}
            {period === 'week' && 'Semana'}
            {period === 'month' && 'Mês'}
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatórios de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PeriodNavigation />
          
          <Tabs defaultValue="radar" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="radar">Radar</TabsTrigger>
              <TabsTrigger value="stats">Estatísticas</TabsTrigger>
              <TabsTrigger value="trends">Tendências</TabsTrigger>
            </TabsList>

            <TabsContent value="radar" className="mt-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Radar de Habilidades</h3>
                  <Badge variant="outline">
                    {activeCategories.length} categorias
                  </Badge>
                </div>
                
                {/* Radar Chart Visual */}
                <div className="flex justify-center mb-12 overflow-hidden">
                  <div className="w-full max-w-md">
                    <RadarChart categories={activeCategories} size={240} />
                  </div>
                </div>
                
                {/* Lista Detalhada */}
                <div className="mt-8">
                  <h4 className="text-md font-medium mb-4">Detalhes por Categoria</h4>
                  <CategoryList categories={activeCategories} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stats" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Estatísticas Gerais</h3>
                <GeneralStats stats={currentStats} />
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-4 w-4 rounded-full bg-red-500" />
                      <span className="text-sm font-medium">Vitalidade</span>
                    </div>
                    <Progress value={currentStats.vitality} className="h-3" />
                    <div className="text-sm text-muted-foreground mt-1">
                      {currentStats.vitality}% - {currentStats.vitality >= 80 ? 'Excelente' : 
                        currentStats.vitality >= 60 ? 'Boa' : 
                        currentStats.vitality >= 40 ? 'Regular' : 'Baixa'}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Evolução</h3>
                <TrendsChart history={history} period={activePeriod} />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};
