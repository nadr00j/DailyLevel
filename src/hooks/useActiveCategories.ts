import { useMemo } from 'react';
import { useHabitStore } from '@/stores/useHabitStore';
import { useTasks } from '@/hooks/useTasks';
import { useGoals } from '@/hooks/useGoals';
import { useGamificationStore } from '@/stores/useGamificationStore';
import gamificationConfig from '@/config/gamificationConfig.json';

export interface ActiveCategory {
  name: string;
  displayName: string;
  icon: string;
  color: string;
  count: number; // número de itens nesta categoria
  xp30d: number; // XP dos últimos 30 dias
  streak: number; // streak atual
  target30d: number; // meta mensal calculada dinamicamente
  weight: number; // peso da categoria
  score: number; // score calculado (0-100)
}

// Mapeamento de categorias para ícones e cores
export const CATEGORY_META: Record<string, { icon: string; color: string; displayName: string }> = {
  'Arte': { icon: '🎨', color: 'text-pink-400', displayName: 'Arte' },
  'Estudo': { icon: '📚', color: 'text-indigo-400', displayName: 'Estudo' },
  'Leitura': { icon: '📖', color: 'text-indigo-400', displayName: 'Leitura' },
  'Finanças': { icon: '💰', color: 'text-yellow-300', displayName: 'Finanças' },
  'Fitness': { icon: '💪', color: 'text-lime-400', displayName: 'Fitness' },
  'Nutrição': { icon: '🍎', color: 'text-emerald-400', displayName: 'Nutrição' },
  'Saúde': { icon: '❤️', color: 'text-red-500', displayName: 'Saúde' },
  'Mente': { icon: '🧠', color: 'text-purple-500', displayName: 'Mente' },
  'Social': { icon: '👥', color: 'text-yellow-500', displayName: 'Social' },
  'Trabalho': { icon: '💼', color: 'text-green-500', displayName: 'Trabalho' },
  'Casa': { icon: '🏠', color: 'text-blue-500', displayName: 'Casa' },
  'Imagem Pessoal': { icon: '📷', color: 'text-blue-400', displayName: 'Imagem Pessoal' },
  'Hobbies': { icon: '🎮', color: 'text-orange-400', displayName: 'Hobbies' },
  'Produtividade': { icon: '⚡', color: 'text-orange-400', displayName: 'Produtividade' },
  'produtividade': { icon: '⚡', color: 'text-orange-400', displayName: 'Produtividade' },
  'Dormir': { icon: '😴', color: 'text-blue-400', displayName: 'Dormir' },
  'Pessoal': { icon: '👤', color: 'text-blue-500', displayName: 'Pessoal' },
  'Sem Categoria': { icon: '🏷️', color: 'text-gray-400', displayName: 'Sem Categoria' },
};



// Função para calcular XP potencial baseado na quantidade de itens e período
function calculatePotentialXP(
  habits: any[],
  tasks: any[],
  goals: any[],
  category: string,
  period: 'day' | 'week' | 'month' = 'month',
  selectedDaysCount: number = 1
): number {
  const config = gamificationConfig;
  
  // Contar itens por tipo na categoria
  const habitCount = habits.filter(h => 
    (h.categories && h.categories.includes(category)) ||
    (!h.categories || h.categories.length === 0) && category === 'Sem Categoria'
  ).length;
  
  const taskCount = tasks.filter(t => 
    (t.category === category) ||
    (!t.category && category === 'Sem Categoria')
  ).length;
  
  const goalCount = goals.filter(g => 
    (g.category === category) ||
    (!g.category && category === 'Sem Categoria')
  ).length;

  // Calcular XP potencial baseado no período e quantidade de dias selecionados
  let habitXP, taskXP, goalXP;
  
  switch (period) {
    case 'day':
      habitXP = habitCount * config.points.habit * selectedDaysCount; // XP por dia * dias selecionados
      taskXP = taskCount * config.points.task * (selectedDaysCount * 0.3); // 0.3x por dia em média
      goalXP = goalCount * config.points.goal * (selectedDaysCount * 0.02); // 0.02x por dia em média
      break;
    case 'week':
      habitXP = habitCount * config.points.habit * selectedDaysCount; // XP por dia * dias selecionados
      taskXP = taskCount * config.points.task * (selectedDaysCount * 0.3); // 0.3x por dia em média
      goalXP = goalCount * config.points.goal * (selectedDaysCount * 0.02); // 0.02x por dia em média
      break;
    case 'month':
    default:
      habitXP = habitCount * config.points.habit * selectedDaysCount; // XP por dia * dias selecionados
      taskXP = taskCount * config.points.task * (selectedDaysCount * 0.3); // 0.3x por dia em média
      goalXP = goalCount * config.points.goal * (selectedDaysCount * 0.02); // 0.02x por dia em média
      break;
  }
  
  return habitXP + taskXP + goalXP;
}

export const useActiveCategories = (period: 'day' | 'week' | 'month' = 'month', filteredHistory?: any[], selectedDaysCount: number = 1) => {
  const habits = useHabitStore(state => state.habits);
  const { todayTasks, weekTasks, laterTasks } = useTasks();
  const { activeGoals } = useGoals();
  const { history } = useGamificationStore();
  
  // Use filteredHistory if provided, otherwise use full history
  const historyToUse = filteredHistory || history;

  const activeCategories = useMemo(() => {
    const categoryData: Record<string, {
      count: number;
      xp30d: number;
      habitCount: number;
      taskCount: number;
      goalCount: number;
    }> = {};

    const allTasks = [...todayTasks, ...weekTasks, ...laterTasks];
    const allHabits = Object.values(habits);

    // console.log('[ActiveCategories Debug] Dados iniciais:', {
    //   habitsCount: allHabits.length,
    //   tasksCount: allTasks.length,
    //   goalsCount: activeGoals.length,
    //   habits: allHabits.map(h => ({ id: h.id, name: h.name, categories: h.categories })),
    //   tasks: allTasks.map(t => ({ id: t.id, title: t.title, category: t.category })),
    //   goals: activeGoals.map(g => ({ id: g.id, title: g.title, category: g.category }))
    // });

    // Debug: verificar se hábitos realmente têm essas categorias
    // console.log('[ActiveCategories Debug] Hábitos por categoria:');
    // allHabits.forEach(habit => {
    //   console.log(`  - ${habit.name}: categorias =`, habit.categories);
    // });

    // Helper to normalize category names
    const normalize = (raw?: string) => {
      const cat = raw?.trim();
      if (!cat) return 'Sem Categoria';
      // Find canonical key in CATEGORY_META case-insensitive
      const key = Object.keys(CATEGORY_META).find(k => k.toLowerCase() === cat.toLowerCase());
      return key || cat;
    };
    // Processar hábitos
    allHabits.forEach(habit => {
      const cats = Array.isArray(habit.categories) && habit.categories.length > 0
        ? habit.categories.map(normalize)
        : ['Sem Categoria'];
      cats.forEach(cat => {
        if (!categoryData[cat]) categoryData[cat] = { count: 0, xp30d: 0, habitCount: 0, taskCount: 0, goalCount: 0 };
        categoryData[cat].count += 1;
        categoryData[cat].habitCount += 1;
      });
    });

    // console.log('[ActiveCategories Debug] Após processar hábitos:', categoryData);

    // Processar tarefas
    allTasks.forEach(task => {
      const cat = normalize(task.category);
      if (!categoryData[cat]) categoryData[cat] = { count: 0, xp30d: 0, habitCount: 0, taskCount: 0, goalCount: 0 };
      categoryData[cat].count += 1;
      categoryData[cat].taskCount += 1;
    });

    // console.log('[ActiveCategories Debug] Após processar tarefas:', categoryData);

    // Processar metas
    activeGoals.forEach(goal => {
      const cat = normalize(goal.category);
      if (!categoryData[cat]) categoryData[cat] = { count: 0, xp30d: 0, habitCount: 0, taskCount: 0, goalCount: 0 };
      categoryData[cat].count += 1;
      categoryData[cat].goalCount += 1;
    });

    // console.log('[ActiveCategories Debug] Após processar metas:', categoryData);

    // Calcular XP do período filtrado por categoria
    historyToUse.forEach(item => {
      if (item.category) {
        if (!categoryData[item.category]) {
          categoryData[item.category] = { count: 0, xp30d: 0, habitCount: 0, taskCount: 0, goalCount: 0 };
        }
        categoryData[item.category].xp30d += item.xp;
      }
    });

    // console.log('[ActiveCategories Debug] Dados finais antes de criar categorias:', categoryData);

    // Criar array de categorias ativas
    const activeCats: ActiveCategory[] = Object.keys(categoryData)
      .filter(cat => categoryData[cat].count > 0)
      .map(cat => {
        // Use static meta if exists, otherwise dynamic meta for custom category
        const formattedName = cat.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const meta = CATEGORY_META[cat] || { icon: '🏷️', color: 'text-gray-400', displayName: formattedName };
        const config = gamificationConfig.categories[meta.displayName] || gamificationConfig.categories['Pessoal'];
        const data = categoryData[cat];
        
        // Calcular target dinâmico baseado na quantidade de itens e período
        const potentialXP = calculatePotentialXP(allHabits, allTasks, activeGoals, cat, period, selectedDaysCount);
        const targetMultiplier = period === 'day' ? 0.1 : period === 'week' ? 0.2 : 0.3;
        const target30d = Math.max(100, potentialXP * targetMultiplier);
        
        // Calcular score baseado no XP dos últimos 30 dias
        const xp30d = data.xp30d;
        const score = Math.min(100, (xp30d / target30d) * 100);
        
        // console.log(`[ActiveCategories Debug] Categoria ${cat} (${period}):`, {
        //   potentialXP,
        //   targetMultiplier,
        //   target30d: Math.round(target30d),
        //   xp30d,
        //   score: Math.round(score),
        //   data
        // });
        
        return {
          name: cat,
          displayName: meta.displayName,
          icon: meta.icon,
          color: meta.color,
          count: data.count,
          xp30d,
          streak: 0, // TODO: implementar streak por categoria
          target30d: Math.round(target30d),
          weight: config.weight,
          score: Math.round(score)
        };
      })
      .sort((a, b) => b.count - a.count); // Ordenar por número de itens

    // console.log('[ActiveCategories Debug] Categorias finais:', activeCats);
    return activeCats;
  }, [habits, todayTasks, weekTasks, laterTasks, activeGoals, historyToUse, period]);

  return activeCategories;
};
