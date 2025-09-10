import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, TrendingUp, Target, BarChart3, CalendarDays, CalendarRange, CalendarCheck, SquareCheckBig, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { useActiveCategories, ActiveCategory, CATEGORY_META } from '@/hooks/useActiveCategories';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useHabitStore } from '@/stores/useHabitStore';
import { useTasks } from '@/hooks/useTasks';
import { useGoals } from '@/hooks/useGoals';
import gamificationConfig from '@/config/gamificationConfig.json';
import { db } from '@/lib/database';
import { dataSyncService } from '@/lib/DataSyncService';
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
  const userId = useAuthStore(state => state.user?.id);
  const monthRef = useRef<HTMLDivElement>(null);
  // Remove dataSyncService.loadAll useEffect

  // Performance filters state
  const [activePeriod, setActivePeriod] = useState<PeriodType>('week');
  // activeTab controls selected tab: 'performance' or 'history'
  const [activeTab, setActiveTab] = useState<'performance'|'history'>('performance');
  // All possible days for current period
  const [possibleDays, setPossibleDays] = useState<string[]>([]);
  // Currently selected days for filtering
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  // Control visibility of date selector dropdown
  const [showDateSelector, setShowDateSelector] = useState(false);
  // Hold existing settings to merge
  const settingsRef = useRef<any>(null);

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

  // Close date selector when period changes to 'day'
  useEffect(() => {
    if (activePeriod === 'day') {
      setShowDateSelector(false);
    }
  }, [activePeriod]);

  // Subscribe to specific slices to re-render on updates
  const xp = useGamificationStore(state => state.xp);
  const vitality = useGamificationStore(state => state.vitality);
  // Local history state to force updates
  const [historyList, setHistoryList] = useState(useGamificationStore.getState().history);
  
  // Subscribe to history changes
  useEffect(() => {
    const unsubscribe = useGamificationStore.subscribe((state) => {
      const newHistory = state.history;
      setHistoryList(newHistory);
    });
    
    return unsubscribe;
  }, []);
  // Memoize filtered history entries based on selectedDays
  const filteredHistory = useMemo(() => {
    if (selectedDays.length === 0) {
      return [];
    }
    
    const filtered = historyList
      .filter(item => {
        const day = new Date(item.ts).toISOString().slice(0,10);
        return selectedDays.includes(day);
      })
      .sort((a, b) => b.ts - a.ts); // Ordenar por timestamp decrescente (mais recente primeiro)
    
    // Debug para verificar filtro de dias
    console.log('[Day Filter Debug]', {
      activePeriod,
      selectedDays,
      selectedDaysLength: selectedDays.length,
      historyListLength: historyList.length,
      filteredLength: filtered.length,
      filteredDays: [...new Set(filtered.map(item => new Date(item.ts).toISOString().slice(0,10)))],
      allHistoryDays: [...new Set(historyList.map(item => new Date(item.ts).toISOString().slice(0,10)))],
      sampleHistoryItems: historyList.slice(0, 5).map(item => ({
        type: item.type,
        category: item.category,
        tags: item.tags,
        ts: new Date(item.ts).toISOString().slice(0, 10)
      }))
    });
    
    return filtered;
  }, [historyList, selectedDays, activePeriod]);

  // Removed activeCategories - using historyCategories instead for consistency

  // Get data for simple XP calculation
  const habits = useHabitStore(state => state.habits);
  const { todayTasks, weekTasks, laterTasks } = useTasks();
  const { activeGoals, completedGoals } = useGoals();
  
  // Debug para verificar se useGoals está funcionando
  console.log('[useGoals Debug]', {
    activeGoals,
    activeGoalsLength: activeGoals?.length || 0,
    completedGoals,
    completedGoalsLength: completedGoals?.length || 0,
    activeGoalsType: typeof activeGoals,
    activeGoalsIsArray: Array.isArray(activeGoals)
  });
  
  // Simple calculation: tasks/habits = 10xp, goals = 30xp
  const calculatePotentialXP = (category: string) => {
    // Normalize category to lowercase for case-insensitive comparison
    const normalizedCategory = category.toLowerCase();

    // Count items based on history (same logic as calculateRealItemCount)
    const historyItems = filteredHistory.filter(item => {
      const itemCategory = (item.category || 'Sem Categoria').toLowerCase();
      return itemCategory === normalizedCategory;
    });

    // Count unique items by type and name (from tags)
    const uniqueHabits = new Set();
    const uniqueTasks = new Set();
    const uniqueGoals = new Set();

    historyItems.forEach(item => {
      const itemName = item.tags && item.tags.length > 0 ? item.tags[0] : 'Unknown';
      
      if (item.type === 'habit') {
        uniqueHabits.add(itemName);
      } else if (item.type === 'task') {
        uniqueTasks.add(itemName);
      } else if (item.type === 'goal') {
        uniqueGoals.add(itemName);
      }
    });

    const habitCount = uniqueHabits.size;
    const taskCount = uniqueTasks.size;
    const goalCount = uniqueGoals.size;

    // Dynamic calculation based on active period
    const daysMultiplier = activePeriod === 'day' ? 1 : activePeriod === 'week' ? 7 : 31;
    
    // Correct math: 
    // - Habits: 10 XP × days (can be done every day)
    // - Tasks: 10 XP × 1 (completed only once)
    // - Goals: 30 XP × 1 (completed only once)
    const habitsXP = habitCount * 10 * daysMultiplier;
    const tasksXP = taskCount * 10 * 1; // Tasks completed only once
    const goalsXP = goalCount * 30 * 1; // Goals completed only once
    const totalXP = habitsXP + tasksXP + goalsXP;
    
    // Debug para categorias com dados
    if (historyItems.length > 0) {
      console.log(`[XP Calculation Debug] ${category}:`, {
        activePeriod,
        daysMultiplier,
        habitCount,
        taskCount,
        goalCount,
        habitsXP: `${habitCount} × 10 × ${daysMultiplier} = ${habitsXP}`,
        tasksXP: `${taskCount} × 10 × 1 = ${tasksXP}`,
        goalsXP: `${goalCount} × 30 × 1 = ${goalsXP}`,
        totalXP: `${habitsXP} + ${tasksXP} + ${goalsXP} = ${totalXP}`,
        uniqueHabits: Array.from(uniqueHabits),
        uniqueTasks: Array.from(uniqueTasks),
        uniqueGoals: Array.from(uniqueGoals),
        historyItemsCount: historyItems.length
      });
    }
    
    return totalXP;
  };

  // Calculate real item count (habits + tasks + goals) for a category
  const calculateRealItemCount = (category: string) => {
    const normalizedCategory = category.toLowerCase();

    // Count items based on history (completed items) instead of active items
    const historyItems = filteredHistory.filter(item => {
      const itemCategory = (item.category || 'Sem Categoria').toLowerCase();
      return itemCategory === normalizedCategory;
    });

    // Count unique items by type and name (from tags)
    const uniqueHabits = new Set();
    const uniqueTasks = new Set();
    const uniqueGoals = new Set();

    historyItems.forEach(item => {
      const itemName = item.tags && item.tags.length > 0 ? item.tags[0] : 'Unknown';
      
      if (item.type === 'habit') {
        uniqueHabits.add(itemName);
      } else if (item.type === 'task') {
        uniqueTasks.add(itemName);
      } else if (item.type === 'goal') {
        uniqueGoals.add(itemName);
      }
    });

    const habitCount = uniqueHabits.size;
    const taskCount = uniqueTasks.size;
    const goalCount = uniqueGoals.size;
    const totalItems = habitCount + taskCount + goalCount;

    // Debug para todas as categorias que aparecem no histórico
    const hasHistoryData = filteredHistory.some(item => 
      (item.category || 'Sem Categoria').toLowerCase() === normalizedCategory
    );
    
    if (hasHistoryData) {
      console.log(`[Item Count Debug] ${category}:`, {
        normalizedCategory,
        habitCount,
        taskCount,
        goalCount,
        totalItems,
        uniqueHabits: Array.from(uniqueHabits),
        uniqueTasks: Array.from(uniqueTasks),
        uniqueGoals: Array.from(uniqueGoals),
        historyItemsCount: historyItems.length,
        sampleHistoryItems: historyItems.slice(0, 3).map(item => ({
          type: item.type,
          name: item.tags && item.tags.length > 0 ? item.tags[0] : 'Unknown',
          category: item.category
        }))
      });
    }

    return totalItems;
  };

  // Compute categories from filteredHistory + all items (including non-completed)
  const historyCategories = useMemo(() => {
    
    // Mapping category to xp and count - normalize categories to avoid duplicates
    const map: Record<string, { xp: number; count: number; originalName: string }> = {};
    
    // First, add categories from completed items (filteredHistory)
    filteredHistory.forEach(item => {
      const originalCat = item.category || 'Sem Categoria';
      const normalizedCat = originalCat.toLowerCase();
      
      if (!map[normalizedCat]) {
        map[normalizedCat] = { xp: 0, count: 0, originalName: originalCat };
      }
      map[normalizedCat].xp += item.xp;
      map[normalizedCat].count += 1;
    });
    
    // Then, add categories from all items (habits, tasks, goals) even if not completed
    const allItems = [
      ...Object.values(habits).map(h => ({ category: (h.categories && h.categories.length > 0) ? h.categories[0] : 'Sem Categoria', type: 'habit' })),
      ...todayTasks.map(t => ({ category: t.category || 'Sem Categoria', type: 'task' })),
      ...weekTasks.map(t => ({ category: t.category || 'Sem Categoria', type: 'task' })),
      ...laterTasks.map(t => ({ category: t.category || 'Sem Categoria', type: 'task' })),
      ...activeGoals.map(g => ({ category: g.category || 'Sem Categoria', type: 'goal' }))
    ];
    
    allItems.forEach(item => {
      const originalCat = item.category;
      const normalizedCat = originalCat.toLowerCase();
      
      if (!map[normalizedCat]) {
        map[normalizedCat] = { xp: 0, count: 0, originalName: originalCat };
      }
      // Don't increment count here as it's already counted in filteredHistory
      // This ensures we have the category even with 0 XP
    });
    
    // Debug para investigar categorias incluídas
    console.log('[Category Debug]', {
      filteredHistoryLength: filteredHistory.length,
      allItemsLength: allItems.length,
      categoriesFromHistory: filteredHistory.map(item => ({
        type: item.type,
        category: item.category,
        xp: item.xp,
        ts: new Date(item.ts).toISOString().slice(0, 10)
      })),
      categoriesFromItems: allItems.map(item => ({
        type: item.type,
        category: item.category
      })),
      finalCategoryMap: map
    });
    
    const categories = Object.entries(map).map(([normalizedCat, data]) => {
      const originalName = data.originalName;
      // Capitalize first letter of category name
      const capitalizedName = originalName.charAt(0).toUpperCase() + originalName.slice(1).toLowerCase();
      
      // Try to find meta by both original and capitalized names
      let meta = CATEGORY_META[originalName] || CATEGORY_META[capitalizedName] || { 
        icon: '🏷️', 
        color: 'text-gray-400', 
        displayName: capitalizedName 
      };
      
      // Calculate potential XP based on items and selected days
      const potentialXP = calculatePotentialXP(originalName);
      // Use actual calculated XP, minimum 10 to avoid division by zero
      const target30d = Math.max(10, potentialXP);
      
      // Calculate real item count (habits + tasks + goals) for this category
      const realItemCount = calculateRealItemCount(originalName);

    return {
        name: capitalizedName,
        displayName: meta.displayName,
        icon: meta.icon,
        color: meta.color,
        count: realItemCount, // Use real item count instead of history count
        xp30d: data.xp,
        streak: 0,
        target30d: Math.round(target30d),
        weight: 1,
        score: Math.min(100, Math.round((data.xp / target30d) * 100)) // Limit to 100%
      };
    });
    
    return categories;
  }, [filteredHistory, habits, todayTasks, weekTasks, laterTasks, activeGoals, selectedDays.length]);

  // Stats will be computed directly from filteredHistory to reflect selectedDays

  // currentStats now reflects filteredHistory based on selectedDays
  const currentStats = useMemo(() => {
    const ph = filteredHistory;
    const totalXP = ph.reduce((sum, item) => sum + item.xp, 0);
    const tasksCompleted = ph.filter(item => item.type === 'task').length;
    
    // Count unique habits by name (from tags array)
    const uniqueHabits = new Set();
    ph.filter(item => item.type === 'habit').forEach(item => {
      const habitName = item.tags && item.tags.length > 0 ? item.tags[0] : 'Unknown';
      uniqueHabits.add(habitName);
    });
    const habitsMaintained = uniqueHabits.size;
    
    const goalsCompleted = ph.filter(item => item.type === 'goal').length;
    
    // Debug para investigar contagem de hábitos
    console.log('[Habit Count Debug]', {
      activePeriod,
      filteredHistoryLength: ph.length,
      habitsMaintained,
      uniqueHabitNames: Array.from(uniqueHabits),
      habitsInHistory: ph.filter(item => item.type === 'habit').map(item => ({
        name: item.tags && item.tags.length > 0 ? item.tags[0] : 'NO_NAME',
        category: item.category,
        xp: item.xp,
        ts: new Date(item.ts).toISOString().slice(0, 10)
      })),
      totalHabitsInStore: Object.keys(habits).length,
      fullHabitEntries: ph.filter(item => item.type === 'habit').slice(0, 3) // Show first 3 for structure
    });
    
    // vitality based on XP relative to configured period targets
    let vitalityPercent = 0;
    const xpPerPeriod = activePeriod === 'day' ? 20 : activePeriod === 'week' ? 100 : 500;
    vitalityPercent = Math.min(100, (totalXP / xpPerPeriod) * 100);
    return { totalXP, tasksCompleted, habitsMaintained, goalsCompleted, vitality: vitalityPercent, streak: 0 };
  }, [filteredHistory, activePeriod, habits]);

  // Load persisted filters on mount
  useEffect(() => {
    if (userId) {
      db.getUserSettings(userId).then(settings => {
        settingsRef.current = settings;
        const cfg = settings?.gamificationConfig || {};
        // Sempre usar 'week' como padrão, independente das configurações salvas
        setActivePeriod('week');
        // Don't load selectedDays from saved settings - let period change effect handle it
        // This ensures consistent behavior
      }).catch(console.error);
    }
  }, [userId]);

  // Initialize possibleDays and selectedDays when period changes
  useEffect(() => {
    const today = new Date();
    let days: string[] = [];
    if (activePeriod === 'week') {
      // Week: 7 days including today (6 days before + today)
      days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - 6 + i);
        return formatDateBrazil(d); // Use Brazil timezone
      });
    } else if (activePeriod === 'month') {
      // Month: 31 days including today (30 days before + today)
      days = Array.from({ length: 31 }).map((_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - 30 + i);
        return formatDateBrazil(d); // Use Brazil timezone
      });
      // center carousel to middle
      setTimeout(() => {
        if (monthRef.current) {
          const mid = monthRef.current.scrollWidth / 2 - monthRef.current.clientWidth / 2;
          monthRef.current.scrollTo({ left: mid, behavior: 'smooth' });
        }
      }, 0);
    } else {
      days = [getBrazilToday()]; // Use Brazil timezone for today
    }
    
    console.log('[Period Debug]', {
      activePeriod,
      daysLength: days.length,
      days,
      today: getBrazilToday(), // Use Brazil timezone
      todayDate: new Date().getDate(),
      firstDay: days[0],
      lastDay: days[days.length - 1],
      calculation: activePeriod === 'week' ? 'today - 6 to today' : activePeriod === 'month' ? 'today - 30 to today' : 'today only',
      dayNumbers: days.map(day => parseInt(day.split('-')[2], 10))
    });
    
    setPossibleDays(days);
    
    // Always set selectedDays to the full period when period changes
    // This ensures filtering works correctly
    setSelectedDays(days);
  }, [activePeriod]);

  // Persist filters on change
  useEffect(() => {
    if (!userId) return;
    const conf = settingsRef.current || {};
    const newSettings = {
      ...conf,
      userId,
      gamificationConfig: {
        ...conf.gamificationConfig,
        activePeriod
        // Don't save selectedDays - they should always be based on current period
      }
    };
    db.saveUserSettings(newSettings).catch(console.error);
  }, [userId, activePeriod]);

  // Removed getStatsForPeriod; stats computed inline via filteredHistory

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
            <SquareCheckBig className="h-4 w-4 text-blue-500" />
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
            <Target className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">Metas</span>
          </div>
          <div className="text-2xl font-bold">{stats.goalsCompleted}</div>
        </CardContent>
      </Card>
    </div>
  );

  const PeriodNavigation = () => (
    <div className="mb-6" style={{ marginLeft: activePeriod === 'day' ? '33px' : '0px' }}>
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {(['day', 'week', 'month'] as PeriodType[]).map((period) => (
            <Button
              key={period}
              variant={activePeriod === period ? 'default' : 'outline'}
              onClick={() => setActivePeriod(period)}
              className="text-xs"
              style={ period === 'day'
                ? { padding: '22px', marginRight: '10px' }
                : period === 'week'
                ? { padding: '22px', marginRight: '10px' }
                : { padding: '22px', marginRight: '10px' }
              }
            >
              {period === 'day' && 'Hoje'}
              {period === 'week' && 'Semana'}
              {period === 'month' && 'Mês'}
            </Button>
          ))}
        </div>

        {/* Animated round button for date selector */}
        {(activePeriod === 'week' || activePeriod === 'month') && (
          <button
            onClick={() => setShowDateSelector(!showDateSelector)}
            className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 transition-all duration-200 flex items-center justify-center group"
          >
            <motion.div
              animate={{ rotate: showDateSelector ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {showDateSelector ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              ) : (
                <Calendar className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              )}
            </motion.div>
          </button>
        )}
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
          
          {/* Date carousel for week/month */}
          {(activePeriod === 'week' || activePeriod === 'month') && (
            <motion.div
              initial={false}
              animate={{ 
                height: showDateSelector ? 'auto' : 0,
                opacity: showDateSelector ? 1 : 0
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{ overflow: 'hidden' }}
            >
              <div
                ref={activePeriod === 'month' ? monthRef : undefined}
                className={activePeriod === 'week' ? 'flex justify-between' : 'flex overflow-x-auto gap-2'}
                style={{ marginBottom: '25px' }}
              >
              {possibleDays.map(dateStr => {
                const isSelected = selectedDays.includes(dateStr);
                // Extract day number directly from dateStr to avoid timezone issues
                const dayNumber = parseInt(dateStr.split('-')[2], 10).toString();
                
                // Debug para verificar renderização dos botões
                if (activePeriod === 'week') {
                  console.log('[Button Render Debug]', {
                    dateStr,
                    dayNumber,
                    possibleDaysLength: possibleDays.length,
                    possibleDays: possibleDays
                  });
                }
                
                return (
                  <button
                    key={dateStr}
                    className={`px-2 py-1 min-w-[32px] text-center text-xs font-medium transition-colors ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                    style={{ borderRadius: '5px' }}
                    onClick={() => {
                      setSelectedDays(prev => prev.includes(dateStr)
                        ? prev.filter(d => d !== dateStr)
                        : [...prev, dateStr]);
                    }}
                  >
                    {dayNumber}
                  </button>
                );
              })}
              </div>
            </motion.div>
          )}
          <Tabs value={activeTab} onValueChange={val => setActiveTab(val as 'performance'|'history')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>
            {/* Performance Tab: Radar + Estatísticas + Detalhes por Categoria */}
            <TabsContent value="performance" className="mt-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Radar de Habilidades</h3>
                  <Badge variant="outline">{historyCategories.length} categorias</Badge>
                </div>
                <div className="flex justify-center mb-8 overflow-hidden">
                  <div className="w-full max-w-md">
                    <RadarChart 
                      key={`radar-${activePeriod}-${selectedDays.length}`} 
                      categories={historyCategories} 
                      size={240} 
                    />
                  </div>
                </div>
                <div className="space-y-8">
                  <h4 className="text-lg font-semibold">Estatísticas Gerais</h4>
                <GeneralStats stats={currentStats} />
                  <Card><CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="h-4 w-4 text-red-500" fill="#ef4444" />
                      <span className="text-sm font-medium">Vitalidade</span>
                    </div>
                    <Progress value={currentStats.vitality} className="h-3" />
                    <div className="text-sm text-muted-foreground mt-1">
                      {currentStats.vitality}% - {currentStats.vitality >= 80 ? 'Excelente' : currentStats.vitality >= 60 ? 'Boa' : currentStats.vitality >= 40 ? 'Regular' : 'Baixa'}
                    </div>
                  </CardContent></Card>
                </div>
                {/* Detalhes por Categoria abaixo das estatísticas */}
                <div className="mt-8">
                  <h4 className="text-md font-medium mb-4">Detalhes por Categoria</h4>
                  <CategoryList categories={historyCategories} />
                </div>
              </div>
            </TabsContent>
            {/* History Tab: list of actions */}
            <TabsContent value="history" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Histórico de Ações</h3>
                <div className="divide-y divide-border max-h-96 overflow-y-auto">
                  {filteredHistory.map((item, idx) => (
                    <div key={`${item.ts}-${item.type}-${idx}`} className="flex items-center justify-between py-2 text-sm">
                      <div>
                        {/* Title */}
                        {item.tags && item.tags[0] && (
                          <span className="font-medium">{item.tags[0]}</span>
                        )}
                        {/* Badge Category */}
                        <div className="mt-1">
                          <Badge variant="outline" className="text-xs px-1" style={{ marginLeft: '-5px' }}>{item.type === 'task' ? 'Tarefa' : item.type === 'habit' ? 'Hábito' : item.type === 'goal' ? 'Meta' : item.type}{' - '}{item.category || 'Sem Categoria'}</Badge>
                        </div>
                        {/* Timestamp */}
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(new Date(item.ts), 'Pp', { locale: ptBR })}
                        </div>
                      </div>
                      {/* XP and Coins */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-green-500">
                          <span>+{item.xp}</span>
                          <img src="/xp.png" alt="XP" className="w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-1 text-yellow-400">
                          <span>+{item.coins}</span>
                          <span role="img" aria-label="moeda">🪙</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};
