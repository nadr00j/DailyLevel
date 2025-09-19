import { useEffect, useRef } from 'react';
import { useVitalityV21 } from '@/hooks/useVitalityV21';
import { useGamificationStoreV21 } from '@/stores/useGamificationStoreV21';
import { usePixelBuddyStore } from '@/stores/usePixelBuddyStore';
import { useHabitStore } from '@/stores/useHabitStore';
import { useTasks } from '@/hooks/useTasks';
import { useGoals } from '@/hooks/useGoals';

export const VitalityListener = () => {
  const { applyEvent, getBodyFromXp, getHeadFromVitality, vitality, mood } = useVitalityV21();
  const { xp } = useGamificationStoreV21();
  const { setBase, initializeFromGamification } = usePixelBuddyStore();
  const { habits } = useHabitStore();
  const { todayTasks } = useTasks();
  const { activeGoals } = useGoals();
  
  const prevXpRef = useRef(xp);
  const prevHabitsRef = useRef<Record<string, any>>({});
  const prevTasksRef = useRef<any[]>([]);
  const prevGoalsRef = useRef<any[]>([]);
  const processedEventsRef = useRef<Set<string>>(new Set());

  // Inicializar PixelBuddy com delay para garantir que os dados estejam carregados
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('[VitalityListener] Inicializando PixelBuddy com:', { xp, vitality });
      // Sempre inicializar, mesmo com valores 0 (usuário novo)
      initializeFromGamification(xp, vitality);
    }, 500); // 500ms de delay para garantir que os dados estejam carregados

    return () => clearTimeout(timer);
  }, []); // Executa apenas uma vez na montagem

  // Atualizar PixelBuddy quando vitalidade ou XP mudam
  useEffect(() => {
    const newBody = getBodyFromXp(xp);
    const newHead = getHeadFromVitality(vitality);
    
    console.log('[VitalityListener] Atualizando PixelBuddy:', { xp, vitality, newBody, newHead });
    
    setBase('body', newBody);
    setBase('head', newHead);
  }, [xp, vitality, getBodyFromXp, getHeadFromVitality, setBase]);

  // Detectar conclusão de hábitos
  useEffect(() => {
    const currentHabits = habits;
    const prevHabits = prevHabitsRef.current;
    
    // Verificar se algum hábito foi concluído hoje
    Object.entries(currentHabits).forEach(([habitId, habit]) => {
      const prevHabit = prevHabits[habitId];
      
      // Se o hábito não existia antes ou se foi concluído hoje
      if (!prevHabit || (habit.completedToday && !prevHabit.completedToday)) {
        const eventKey = `habit-${habitId}-${habit.completedToday}`;
        
        // Verificar se o evento já foi processado
        if (!processedEventsRef.current.has(eventKey)) {
          console.log('[VitalityListener] Hábito concluído detectado:', { habitId, habitName: habit.name });
          processedEventsRef.current.add(eventKey);
          
          applyEvent({
            type: 'HABIT_DONE',
            payload: { habitId, habitName: habit.name }
          });
        }
      }
    });
    
    prevHabitsRef.current = currentHabits;
  }, [habits, applyEvent]);

  // Detectar conclusão de tarefas
  useEffect(() => {
    const currentTasks = todayTasks || [];
    const prevTasks = prevTasksRef.current;
    
    // Verificar se alguma tarefa foi concluída
    currentTasks.forEach(task => {
      const prevTask = prevTasks.find(t => t.id === task.id);
      
      // Se a tarefa não existia antes ou se foi concluída
      if (!prevTask || (task.completed && !prevTask.completed)) {
        const eventKey = `task-${task.id}-${task.completed}`;
        
        // Verificar se o evento já foi processado
        if (!processedEventsRef.current.has(eventKey)) {
          console.log('[VitalityListener] Tarefa concluída detectada:', { taskId: task.id, taskTitle: task.title });
          processedEventsRef.current.add(eventKey);
          
          applyEvent({
            type: 'TASK_DONE',
            payload: { taskId: task.id, taskTitle: task.title }
          });
        }
      }
    });
    
    prevTasksRef.current = currentTasks;
  }, [todayTasks, applyEvent]);

  // Detectar conclusão de metas
  useEffect(() => {
    const currentGoals = activeGoals || [];
    const prevGoals = prevGoalsRef.current;
    
    // Verificar se alguma meta foi concluída
    currentGoals.forEach(goal => {
      const prevGoal = prevGoals.find(g => g.id === goal.id);
      
      // Se a meta não existia antes ou se foi concluída
      if (!prevGoal || (goal.completed && !prevGoal.completed)) {
        const eventKey = `goal-${goal.id}-${goal.completed}`;
        
        // Verificar se o evento já foi processado
        if (!processedEventsRef.current.has(eventKey)) {
          console.log('[VitalityListener] Meta concluída detectada:', { goalId: goal.id, goalTitle: goal.title });
          processedEventsRef.current.add(eventKey);
          
          applyEvent({
            type: 'GOAL_DONE',
            payload: { goalId: goal.id, goalTitle: goal.title }
          });
        }
      }
    });
    
    prevGoalsRef.current = currentGoals;
  }, [activeGoals, applyEvent]);

  // Detectar ganho de XP
  useEffect(() => {
    const currentXp = xp;
    const prevXp = prevXpRef.current;
    
    if (currentXp > prevXp) {
      const xpGained = currentXp - prevXp;
      const eventKey = `xp-${currentXp}-${Date.now()}`;
      
      // Verificar se o evento já foi processado
      if (!processedEventsRef.current.has(eventKey)) {
        console.log('[VitalityListener] Ganho de XP detectado:', { xpGained, totalXp: currentXp });
        processedEventsRef.current.add(eventKey);
        
        applyEvent({
          type: 'XP_GAIN',
          payload: { xpGained, totalXp: currentXp }
        });
      }
    }
    
    prevXpRef.current = currentXp;
  }, [xp, applyEvent]);

  // Este componente não renderiza nada, apenas escuta eventos
  return null;
};
