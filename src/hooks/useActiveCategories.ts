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
const CATEGORY_META: Record<string, { icon: string; color: string; displayName: string }> = {
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
  period: 'day' | 'week' | 'month' = 'month'
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

  // Calcular XP potencial baseado no período
  let habitXP, taskXP, goalXP;
  
  switch (period) {
    case 'day':
      habitXP = habitCount * config.points.habit * 1; // 1 dia
      taskXP = taskCount * config.points.task * 0.3; // 0.3x por dia em média
      goalXP = goalCount * config.points.goal * 0.02; // 0.02x por dia em média
      break;
    case 'week':
      habitXP = habitCount * config.points.habit * 7; // 7 dias
      taskXP = taskCount * config.points.task * 2; // 2x por semana
      goalXP = goalCount * config.points.goal * 0.1; // 0.1x por semana em média
      break;
    case 'month':
    default:
      habitXP = habitCount * config.points.habit * 30; // 30 dias
      taskXP = taskCount * config.points.task * 8; // 8x por mês em média
      goalXP = goalCount * config.points.goal * 0.5; // 0.5x por mês em média
      break;
  }
  
  return habitXP + taskXP + goalXP;
}

export const useActiveCategories = (period: 'day' | 'week' | 'month' = 'month') => {
  const habits = useHabitStore(state => state.habits);
  const { todayTasks, weekTasks, laterTasks } = useTasks();
  const { activeGoals } = useGoals();
  const { history } = useGamificationStore();

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

    // Processar hábitos
    allHabits.forEach(habit => {
      // console.log(`[ActiveCategories Debug] Processando hábito: ${habit.name}`, { categories: habit.categories });
      if (habit.categories && habit.categories.length > 0) {
        habit.categories.forEach(cat => {
          if (cat && cat.trim()) {
            // console.log(`[ActiveCategories Debug] Adicionando hábito à categoria: ${cat}`);
            if (!categoryData[cat]) {
              categoryData[cat] = { count: 0, xp30d: 0, habitCount: 0, taskCount: 0, goalCount: 0 };
            }
            categoryData[cat].count += 1;
            categoryData[cat].habitCount += 1;
          }
        });
      } else {
        // Hábitos sem categoria - só criar se houver hábitos sem categoria
        // console.log(`[ActiveCategories Debug] Hábito sem categoria: ${habit.name}`);
        if (!categoryData['Sem Categoria']) {
          categoryData['Sem Categoria'] = { count: 0, xp30d: 0, habitCount: 0, taskCount: 0, goalCount: 0 };
        }
        categoryData['Sem Categoria'].count += 1;
        categoryData['Sem Categoria'].habitCount += 1;
      }
    });

    // console.log('[ActiveCategories Debug] Após processar hábitos:', categoryData);

    // Processar tarefas
    allTasks.forEach(task => {
      // console.log(`[ActiveCategories Debug] Processando tarefa: ${task.title}`, { category: task.category });
      if (task.category && task.category.trim()) {
        // console.log(`[ActiveCategories Debug] Adicionando tarefa à categoria: ${task.category}`);
        if (!categoryData[task.category]) {
          categoryData[task.category] = { count: 0, xp30d: 0, habitCount: 0, taskCount: 0, goalCount: 0 };
        }
        categoryData[task.category].count += 1;
        categoryData[task.category].taskCount += 1;
      } else {
        // Tarefas sem categoria - só criar se houver tarefas sem categoria
        // console.log(`[ActiveCategories Debug] Tarefa sem categoria: ${task.title}`);
        if (!categoryData['Sem Categoria']) {
          categoryData['Sem Categoria'] = { count: 0, xp30d: 0, habitCount: 0, taskCount: 0, goalCount: 0 };
        }
        categoryData['Sem Categoria'].count += 1;
        categoryData['Sem Categoria'].taskCount += 1;
      }
    });

    // console.log('[ActiveCategories Debug] Após processar tarefas:', categoryData);

    // Processar metas
    activeGoals.forEach(goal => {
      // console.log(`[ActiveCategories Debug] Processando meta: ${goal.title}`, { category: goal.category });
      if (goal.category && goal.category.trim()) {
        // console.log(`[ActiveCategories Debug] Adicionando meta à categoria: ${goal.category}`);
        if (!categoryData[goal.category]) {
          categoryData[goal.category] = { count: 0, xp30d: 0, habitCount: 0, taskCount: 0, goalCount: 0 };
        }
        categoryData[goal.category].count += 1;
        categoryData[goal.category].goalCount += 1;
      } else {
        // Metas sem categoria - só criar se houver metas sem categoria
        // console.log(`[ActiveCategories Debug] Meta sem categoria: ${goal.title}`);
        if (!categoryData['Sem Categoria']) {
          categoryData['Sem Categoria'] = { count: 0, xp30d: 0, habitCount: 0, taskCount: 0, goalCount: 0 };
        }
        categoryData['Sem Categoria'].count += 1;
        categoryData['Sem Categoria'].goalCount += 1;
      }
    });

    // console.log('[ActiveCategories Debug] Após processar metas:', categoryData);

    // Calcular XP dos últimos 30 dias por categoria
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    history.forEach(item => {
      if (item.ts >= thirtyDaysAgo && item.category) {
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
        const meta = CATEGORY_META[cat] || CATEGORY_META['Sem Categoria'];
        const config = gamificationConfig.categories[meta.displayName] || gamificationConfig.categories['Pessoal'];
        const data = categoryData[cat];
        
        // Calcular target dinâmico baseado na quantidade de itens e período
        const potentialXP = calculatePotentialXP(allHabits, allTasks, activeGoals, cat, period);
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
  }, [habits, todayTasks, weekTasks, laterTasks, activeGoals, history, period]);

  return activeCategories;
};
