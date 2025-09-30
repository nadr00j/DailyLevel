import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, TrendingUp, Target, BarChart3, CalendarDays, CalendarRange, CalendarCheck, SquareCheckBig, ChevronDown, ChevronUp } from 'lucide-react';
import { useActiveCategories, ActiveCategory, CATEGORY_META } from '@/hooks/useActiveCategories';
import { useGamificationStoreV21 } from '@/stores/useGamificationStoreV21';
import { useAuthStore } from '@/stores/useAuthStore';
import { useHabitStore } from '@/stores/useHabitStore';
import { useHabitCategories } from '@/hooks/useHabitCategories';
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
  streak: number;
}

// Debug flag - set to false to reduce console spam
const IS_DEBUG = false;

export const PerformanceReports = () => {
  const userId = useAuthStore(state => state.user?.id);
  const monthRef = useRef<HTMLDivElement>(null);
  
  // Dados são carregados pelo App.tsx, não precisamos carregar aqui
  // useEffect removido para evitar conflitos de sincronização

  // Performance filters state
  const [activePeriod, setActivePeriod] = useState<PeriodType>('week');
  // activeTab controls selected tab: 'performance' or 'history'
  const [activeTab, setActiveTab] = useState<'performance'|'history'>('performance');
  // Force re-render key
  const [renderKey, setRenderKey] = useState(0);
  // All possible days for current period
  const [possibleDays, setPossibleDays] = useState<string[]>([]);
  // Currently selected days for filtering
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  // Control visibility of date selector dropdown
  const [showDateSelector, setShowDateSelector] = useState(false);
  // Hold existing settings to merge
  const settingsRef = useRef<any>(null);

  // Function to get current date in Brazil timezone (UTC-3) - memoized
  const getBrazilToday = useCallback(() => {
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
  }, []);

  // Function to get date string in Brazil timezone - memoized
  const formatDateBrazil = useCallback((date: Date) => {
    const brazilOffset = -3 * 60; // -3 hours in minutes
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const brazilTime = new Date(utc + (brazilOffset * 60000));
    
    const year = brazilTime.getFullYear();
    const month = String(brazilTime.getMonth() + 1).padStart(2, '0');
    const day = String(brazilTime.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }, []);

  // Close date selector when period changes to 'day'
  useEffect(() => {
    if (activePeriod === 'day') {
      setShowDateSelector(false);
    }
  }, [activePeriod]);

  // Subscribe to specific slices to re-render on updates
  const xp = useGamificationStoreV21(state => state.xp);
  const history = useGamificationStoreV21(state => state.history);
  
  // Use history directly from store instead of local state - memoized
  const historyList = useMemo(() => history, [history]);
  
  // Force re-render when history changes significantly - optimized
  useEffect(() => {
    setRenderKey(prev => prev + 1);
  }, [historyList.length]);
  // Memoize filtered history entries based on selectedDays
  const filteredHistory = useMemo(() => {
    if (selectedDays.length === 0) {
      return [];
    }
    
    const filtered = historyList
      .filter(item => {
        // Verificar se timestamp é válido
        if (!item.ts || isNaN(item.ts)) {
          console.warn('[PerformanceReports] Item com timestamp inválido:', item);
          return false;
        }
        const day = new Date(item.ts).toISOString().slice(0,10);
        return selectedDays.includes(day);
      })
      .sort((a, b) => b.ts - a.ts); // Ordenar por timestamp decrescente (mais recente primeiro)
    
    // Debug para verificar filtro de dias
    if (IS_DEBUG) {
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
    }
    
    return filtered;
  }, [historyList, selectedDays, activePeriod]);

  // Removed activeCategories - using historyCategories instead for consistency

  // Get data for simple XP calculation - memoized with stable references
  const habitData = useHabitCategories();
  const taskData = useTasks();
  const goalData = useGoals();
  
  const { all: allHabits, active: activeHabits, inactive: inactiveHabits } = useMemo(() => habitData, [habitData]);
  const { todayTasks, weekTasks, laterTasks } = useMemo(() => taskData, [taskData]);
  const { activeGoals, completedGoals, futureGoals } = useMemo(() => goalData, [goalData]);
  
  // Cache para categorias com debounce agressivo
  const categoryCache = useRef<{
    key: string;
    data: ActiveCategory[];
    timestamp: number;
  } | null>(null);
  
  // Create stable cache key for category calculation - com hash do conteúdo
  const categoryCacheKey = useMemo(() => {
    // Criar hash mais inteligente baseado no conteúdo relevante
    const historyHash = filteredHistory.slice(0, 5).map(h => `${h.type}-${h.xp}-${h.category}`).join('|');
    const habitsHash = allHabits.slice(0, 3).map(h => `${h.name}-${h.categories?.[0] || 'none'}`).join('|');
    const tasksHash = `${todayTasks.length}-${weekTasks.length}-${laterTasks.length}`;
    const goalsHash = `${activeGoals.length}-${futureGoals.length}`;
    
    return `${activePeriod}-${selectedDays.length}-${historyHash}-${habitsHash}-${tasksHash}-${goalsHash}`;
  }, [
    allHabits,
    todayTasks.length, 
    weekTasks.length,
    laterTasks.length,
    activeGoals.length,
    futureGoals.length,
    filteredHistory,
    selectedDays.length,
    activePeriod
  ]);
  
    // Debug para verificar se useGoals está funcionando
    if (IS_DEBUG) console.log('[useGoals Debug]', {
      activeGoals,
      activeGoalsLength: activeGoals?.length || 0,
      completedGoals,
      completedGoalsLength: completedGoals?.length || 0,
      futureGoals,
      futureGoalsLength: futureGoals?.length || 0,
      activeGoalsType: typeof activeGoals,
      activeGoalsIsArray: Array.isArray(activeGoals),
      activeGoalsCategories: activeGoals?.map(g => ({ title: g.title, category: g.category })) || [],
      futureGoalsCategories: futureGoals?.map(g => ({ title: g.title, category: g.category })) || []
    });

    // Debug para verificar hábitos ativos vs inativos
    if (IS_DEBUG) console.log('[Habits Debug]', {
      allHabits: allHabits.length,
      activeHabits: activeHabits.length,
      inactiveHabits: inactiveHabits.length,
      activeHabitsCategories: activeHabits.map(h => ({ name: h.name, category: h.categories?.[0] })),
      inactiveHabitsCategories: inactiveHabits.map(h => ({ name: h.name, category: h.categories?.[0] }))
    });
  
  // Simple calculation: tasks/habits = 10xp, goals = 30xp
  const calculatePotentialXP = (category: string) => {
    // Normalize category to lowercase for case-insensitive comparison
    const normalizedCategory = category.toLowerCase();

    // Count items based on ALL ACTIVE ITEMS (not just completed ones)
    const allActiveItems = [
      ...allHabits.map(h => ({ 
        type: 'habit', 
        name: h.name, 
        category: (h.categories && h.categories.length > 0) ? h.categories[0] : 'Sem Categoria' 
      })),
      ...todayTasks.map(t => ({ type: 'task', name: t.title, category: t.category || 'Sem Categoria' })),
      ...weekTasks.map(t => ({ type: 'task', name: t.title, category: t.category || 'Sem Categoria' })),
      ...laterTasks.map(t => ({ type: 'task', name: t.title, category: t.category || 'Sem Categoria' })),
      ...activeGoals.map(g => ({ type: 'goal', name: g.title, category: g.category || 'Sem Categoria' })),
      ...futureGoals.map(g => ({ type: 'goal', name: g.title, category: g.category || 'Sem Categoria' }))
    ];

    const categoryItems = allActiveItems.filter(item => {
      const itemCategory = (item.category || 'Sem Categoria').toLowerCase();
      return itemCategory === normalizedCategory;
    });

    // Count unique items by type and name
    const uniqueHabits = new Set();
    const uniqueTasks = new Set();
    const uniqueGoals = new Set();

    categoryItems.forEach(item => {
      if (item.type === 'habit') {
        uniqueHabits.add(item.name);
      } else if (item.type === 'task') {
        uniqueTasks.add(item.name);
      } else if (item.type === 'goal') {
        uniqueGoals.add(item.name);
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
    if (categoryItems.length > 0) {
      if (IS_DEBUG) console.log(`[XP Calculation Debug] ${category}:`, {
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
        categoryItemsCount: categoryItems.length
      });
    }
    
    return totalXP;
  };

  // Calculate real item count (habits + tasks + goals) for a category
  const calculateRealItemCount = (category: string) => {
    const normalizedCategory = category.toLowerCase();

    // Count items based on ALL ACTIVE ITEMS (not just completed ones)
    const allActiveItems = [
      ...allHabits.map(h => ({ 
        type: 'habit', 
        name: h.name, 
        category: (h.categories && h.categories.length > 0) ? h.categories[0] : 'Sem Categoria' 
      })),
      ...todayTasks.map(t => ({ type: 'task', name: t.title, category: t.category || 'Sem Categoria' })),
      ...weekTasks.map(t => ({ type: 'task', name: t.title, category: t.category || 'Sem Categoria' })),
      ...laterTasks.map(t => ({ type: 'task', name: t.title, category: t.category || 'Sem Categoria' })),
      ...activeGoals.map(g => ({ type: 'goal', name: g.title, category: g.category || 'Sem Categoria' })),
      ...futureGoals.map(g => ({ type: 'goal', name: g.title, category: g.category || 'Sem Categoria' }))
    ];

    const categoryItems = allActiveItems.filter(item => {
      const itemCategory = (item.category || 'Sem Categoria').toLowerCase();
      return itemCategory === normalizedCategory;
    });

    // Count unique items by type and name
    const uniqueHabits = new Set();
    const uniqueTasks = new Set();
    const uniqueGoals = new Set();

    categoryItems.forEach(item => {
      if (item.type === 'habit') {
        uniqueHabits.add(item.name);
      } else if (item.type === 'task') {
        uniqueTasks.add(item.name);
      } else if (item.type === 'goal') {
        uniqueGoals.add(item.name);
      }
    });

    const habitCount = uniqueHabits.size;
    const taskCount = uniqueTasks.size;
    const goalCount = uniqueGoals.size;
    const totalItems = habitCount + taskCount + goalCount;

    // Debug para todas as categorias que têm itens ativos
    if (totalItems > 0) {
      if (IS_DEBUG) console.log(`[Item Count Debug] ${category}:`, {
        normalizedCategory,
        habitCount,
        taskCount,
        goalCount,
        totalItems,
        uniqueHabits: Array.from(uniqueHabits),
        uniqueTasks: Array.from(uniqueTasks),
        uniqueGoals: Array.from(uniqueGoals),
        categoryItemsCount: categoryItems.length,
        sampleCategoryItems: categoryItems.slice(0, 3).map(item => ({
          type: item.type,
          name: item.name,
          category: item.category
        }))
      });
    }

    return totalItems;
  };

  // Compute categories from filteredHistory + all items (including non-completed) - com cache agressivo
  const historyCategories = useMemo(() => {
    const now = Date.now();
    const CACHE_TIMEOUT = 5000; // 5 segundos de cache mínimo
    
    // Verificar se temos cache válido
    if (categoryCache.current && 
        categoryCache.current.key === categoryCacheKey &&
        (now - categoryCache.current.timestamp) < CACHE_TIMEOUT) {
      const timeLeft = Math.round((CACHE_TIMEOUT - (now - categoryCache.current.timestamp)) / 1000);
      if (IS_DEBUG) console.log(`🔄 [Category Cache] Usando cache válido (${timeLeft}s restantes), evitando recálculo`);
      return categoryCache.current.data;
    }
    
    if (IS_DEBUG) console.log('🔄 [Category Cache] Cache inválido ou expirado, recalculando categorias...');
    
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
      ...allHabits.map(h => ({ category: (h.categories && h.categories.length > 0) ? h.categories[0] : 'Sem Categoria', type: 'habit' })),
      ...todayTasks.map(t => ({ category: t.category || 'Sem Categoria', type: 'task' })),
      ...weekTasks.map(t => ({ category: t.category || 'Sem Categoria', type: 'task' })),
      ...laterTasks.map(t => ({ category: t.category || 'Sem Categoria', type: 'task' })),
      ...activeGoals.map(g => ({ category: g.category || 'Sem Categoria', type: 'goal' })),
      ...futureGoals.map(g => ({ category: g.category || 'Sem Categoria', type: 'goal' }))
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
    if (IS_DEBUG) console.log('[Category Debug]', {
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
    
    // Atualizar cache
    categoryCache.current = {
      key: categoryCacheKey,
      data: categories,
      timestamp: now
    };
    
    if (IS_DEBUG) console.log('✅ [Category Cache] Cache atualizado com', categories.length, 'categorias');
    return categories;
  }, [categoryCacheKey]);

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
    if (IS_DEBUG) console.log('[Habit Count Debug]', {
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
      totalHabitsInStore: allHabits.length,
      fullHabitEntries: ph.filter(item => item.type === 'habit').slice(0, 3) // Show first 3 for structure
    });
    
    return { totalXP, tasksCompleted, habitsMaintained, goalsCompleted, streak: 0 };
  }, [filteredHistory, activePeriod, allHabits]);

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
    
    if (IS_DEBUG) console.log('[Period Debug]', {
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
  }, [activePeriod, getBrazilToday, formatDateBrazil]);

  // Persist filters on change - memoized
  const saveSettings = useCallback(async () => {
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
    try {
      await db.saveUserSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [userId, activePeriod]);

  useEffect(() => {
    saveSettings();
  }, [saveSettings]);

  // Removed getStatsForPeriod; stats computed inline via filteredHistory

  const CategoryList = React.memo(({ categories }: { categories: ActiveCategory[] }) => {
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
          <div
            key={category.name}
            className="flex items-center gap-4 p-3 rounded-lg border bg-card opacity-100"
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
          </div>
        ))}
      </div>
    );
  });

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
      key={renderKey}
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
                  if (IS_DEBUG) console.log('[Button Render Debug]', {
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
                          <img src="/moeda.png" alt="Moeda" className="w-4 h-4" />
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
