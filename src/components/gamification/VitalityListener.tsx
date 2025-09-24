import { useEffect, useRef, useCallback, useState } from 'react';
import { useGamificationStoreV21 } from '@/stores/useGamificationStoreV21';
import { usePixelBuddyStore } from '@/stores/usePixelBuddyStore';
import { useHabitStore } from '@/stores/useHabitStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTasks } from '@/hooks/useTasks';
import { useGoals } from '@/hooks/useGoals';

export const VitalityListener = () => {
  // ✅ TODOS OS HOOKS NO INÍCIO (antes de qualquer early return)
  const { user, isAuthenticated } = useAuthStore();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { xp, vitality, mood, addXp } = useGamificationStoreV21();
  const { setBase, initializeFromGamification } = usePixelBuddyStore();
  const { habits } = useHabitStore();
  const habitLogs = useHabitStore(state => state.logs);
  const { todayTasks } = useTasks();
  const { activeGoals } = useGoals();
  
  // ✅ TODOS OS useRef TAMBÉM NO INÍCIO
  const prevXpRef = useRef(xp);
  const prevHabitsRef = useRef<Record<string, any>>({});
  const prevTasksRef = useRef<any[]>([]);
  const prevGoalsRef = useRef<any[]>([]);
  const processedEventsRef = useRef<Set<string>>(new Set());
  const isProcessingRef = useRef<boolean>(false);
  const lastProcessedTimeRef = useRef<number>(0);
  
  // ✅ Função auxiliar para processar eventos de forma segura (useCallback)
  const processEventSafely = useCallback(async (eventKey: string, eventType: string, eventData: any) => {
    console.log('⚡ [VitalityListener] Processando evento:', { eventType, eventData: { type: eventData.type, tags: eventData.tags } });
    
    // Evitar processamento simultâneo
    if (isProcessingRef.current) {
      console.log('[VitalityListener] Já processando evento, ignorando:', eventKey);
      return;
    }

    // Evitar processamento muito frequente (mínimo 200ms entre eventos)
    const now = Date.now();
    if (now - lastProcessedTimeRef.current < 200) {
      console.log('[VitalityListener] Processamento muito frequente, ignorando:', eventKey);
      return;
    }

    // Verificar se o evento já foi processado
    if (processedEventsRef.current.has(eventKey)) {
      console.log('[VitalityListener] Evento já processado, ignorando:', eventKey);
      return;
    }

    try {
      isProcessingRef.current = true;
      lastProcessedTimeRef.current = now;
      processedEventsRef.current.add(eventKey);

      console.log('[VitalityListener] Processando evento:', { eventKey, eventType, eventData });

      // NOVO: Verificar se evento já existe no Supabase antes de processar
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        console.warn('⚠️ [VitalityListener] Usuário não autenticado, ignorando evento');
        return;
      }

      // Verificar se já existe um evento similar no Supabase (últimas 24h)
      const { supabase } = await import('@/lib/supabase');
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: existingEvents, error: checkError } = await supabase
        .from('history_items')
        .select('id, tags, type')
        .eq('user_id', userId)
        .eq('type', eventData.type)
        .gte('ts', yesterday)
        .limit(100); // Limitar busca para performance

      if (checkError) {
        console.error('❌ [VitalityListener] Erro ao verificar eventos existentes:', checkError);
      } else {
        // Verificar se existe um evento com as mesmas tags
        const duplicateEvent = existingEvents?.find(event => 
          event.tags && eventData.tags && 
          event.tags.length === eventData.tags.length &&
          event.tags.every((tag: string) => eventData.tags.includes(tag))
        );
        
        if (duplicateEvent) {
          console.log('⚠️ [VitalityListener] Evento duplicado encontrado no Supabase, ignorando:', {
            eventKey,
            existingEvent: duplicateEvent,
            newEventData: eventData
          });
          return;
        }
      }

      // Adicionar XP para gamificação (addXp já salva no histórico com categoria)
      const xpType = eventData.type || 'task';
      
      // Verificar se há tags válidas antes de chamar addXp
      if (eventData.tags && eventData.tags.length > 0) {
        console.log('🎯 [VitalityListener] Chamando addXp com:', {
          type: xpType,
          tags: eventData.tags,
          explicitCategory: eventData.category
        });
        
        // Passar categoria explícita para addXp
        addXp(xpType, eventData.tags, eventData.category);
      } else {
        console.warn('⚠️ [VitalityListener] Evento sem tags válidas ignorado:', { eventType, eventData });
      }
      
      // Logs removidos para reduzir spam
    } catch (error) {
      console.error('[VitalityListener] Erro ao processar evento:', eventKey, error);
      // Remover da lista de processados em caso de erro para permitir retry
      processedEventsRef.current.delete(eventKey);
    } finally {
      isProcessingRef.current = false;
    }
  }, [addXp]);
  
  // ✅ Early return DEPOIS de todos os hooks
  if (!isAuthenticated || !user?.id) {
    return null;
  }
  
  // Limpar cache de eventos processados a cada 10 minutos
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const currentSize = processedEventsRef.current.size;
      if (currentSize > 0) {
        console.log(`[VitalityListener] Limpando cache de eventos processados (${currentSize} itens)`);
        processedEventsRef.current.clear();
      }
    }, 10 * 60 * 1000); // 10 minutos
    
    return () => clearInterval(cleanupInterval);
  }, []);

  // Aguardar carregamento inicial dos dados antes de começar a detectar eventos
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('[VitalityListener] Carregamento inicial concluído, iniciando detecção de eventos');
      setIsInitialLoading(false);
      
      console.log('[VitalityListener] Inicializando PixelBuddy com:', { xp, vitality });
      // Sempre inicializar, mesmo com valores 0 (usuário novo)
      initializeFromGamification(xp, vitality);
    }, 5000); // 5 segundos para garantir que todos os dados foram carregados

    return () => clearTimeout(timer);
  }, []); // Executa apenas uma vez na montagem

  // Atualizar PixelBuddy quando vitalidade ou XP mudam
  useEffect(() => {
    // Atualizar body baseado na vitalidade
    let newBody: string;
    if (vitality < 25) {
      newBody = '/Nadr00J/bodies/body_lvl1.png';
    } else if (vitality < 50) {
      newBody = '/Nadr00J/bodies/body_lvl2.png';
    } else {
      newBody = '/Nadr00J/bodies/body_lvl3.png';
    }
    
    // Atualizar head baseado na vitalidade
    let newHead: string;
    if (vitality < 25) {
      newHead = '/Nadr00J/heads/head_tired.png';
    } else if (vitality < 50) {
      newHead = '/Nadr00J/heads/head_sad.png';
    } else if (vitality < 75) {
      newHead = '/Nadr00J/heads/head_neutral.png';
    } else if (vitality < 90) {
      newHead = '/Nadr00J/heads/head_happy.png';
    } else {
      newHead = '/Nadr00J/heads/head_confident.png';
    }
    
    console.log('[VitalityListener] Atualizando PixelBuddy:', { xp, vitality, newBody, newHead });
    
    setBase('body', newBody);
    setBase('head', newHead);
  }, [xp, vitality, setBase]);

  // Detectar conclusão de hábitos
  useEffect(() => {
    // Não processar durante carregamento inicial
    if (isInitialLoading) {
      console.log('[VitalityListener] Ignorando detecção de hábitos durante carregamento inicial');
      return;
    }
    
    // Obter dados dos hábitos do useHabitStore
    const currentHabits = habits;
    const logs = habitLogs;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD formato
    
    const prevHabits = prevHabitsRef.current;
    
    // Verificar se algum hábito foi concluído hoje
    Object.entries(currentHabits).forEach(([habitId, habit]) => {
      const prevHabit = prevHabits[habitId];
      
      // Verificar se o hábito foi concluído hoje
      const todayLog = logs[habitId]?.[today] || 0;
      const prevTodayLog = prevHabits[habitId]?.todayLog || 0;
      const isCompletedToday = todayLog >= habit.targetCount;
      const wasCompletedBefore = prevTodayLog >= habit.targetCount;
      
      // Se o hábito foi recém concluído (não estava completo antes e agora está)
      if (isCompletedToday && !wasCompletedBefore) {
        // Usar ID do hábito + data + timestamp para garantir unicidade
        const eventKey = `habit-${habitId}-completed-${today}-${Date.now()}`;
        
        console.log('[VitalityListener] Hábito concluído detectado:', { 
          habitId, 
          habitName: habit.name, 
          todayLog, 
          targetCount: habit.targetCount,
          eventKey 
        });
        
        processEventSafely(eventKey, 'HABIT_DONE', {
          habitId,
          habitName: habit.name,
          type: 'habit',
          tags: habit.categories || []
        });
      }
    });
    
    // Atualizar referência com logs atuais
    const habitsWithLogs = Object.fromEntries(
      Object.entries(currentHabits).map(([id, habit]) => [
        id, 
        { ...habit, todayLog: logs[id]?.[today] || 0 }
      ])
    );
    prevHabitsRef.current = habitsWithLogs;
  }, [habits, habitLogs, processEventSafely, isInitialLoading]);

  // Detectar conclusão de tarefas
  useEffect(() => {
    // Não processar durante carregamento inicial
    if (isInitialLoading) {
      console.log('[VitalityListener] Ignorando detecção de tarefas durante carregamento inicial');
      return;
    }
    
    const currentTasks = todayTasks || [];
    const prevTasks = prevTasksRef.current;
    
    // Log reduzido - apenas quando há mudanças
    if (currentTasks.length !== prevTasks.length) {
      console.log('[VitalityListener] Número de tarefas mudou:', { 
        currentTasksLength: currentTasks.length, 
        prevTasksLength: prevTasks.length
      });
    }
    
    // Verificar se alguma tarefa foi concluída
    currentTasks.forEach(task => {
      const prevTask = prevTasks.find(t => t.id === task.id);
      
      // Log apenas para tarefas que mudaram de estado
      if (!prevTask || task.completed !== prevTask.completed) {
        console.log('[VitalityListener] Tarefa mudou de estado:', { 
          taskId: task.id, 
          taskTitle: task.title, 
          taskCompleted: task.completed,
          taskCategory: task.category,
          prevCompleted: prevTask?.completed
        });
      }
      
      // Se a tarefa não existia antes ou se foi concluída
      const isNewTask = !prevTask;
      const isTaskCompleted = task.completed && !prevTask?.completed;
      
      // Log apenas se deve processar
      if (isNewTask || isTaskCompleted) {
        console.log('[VitalityListener] Análise da tarefa:', {
          taskId: task.id,
          taskTitle: task.title,
          isNewTask,
          isTaskCompleted,
          currentCompleted: task.completed,
          prevCompleted: prevTask?.completed,
          shouldProcess: true
        });
      }
      
      // APENAS processar se a tarefa foi realmente CONCLUÍDA
      if (isTaskCompleted && task.completed) {
        // Usar ID da tarefa + timestamp atual para garantir unicidade
        const eventKey = `task-${task.id}-completed-${Date.now()}`;
        
      console.log('🎯 [VitalityListener] Tarefa concluída detectada:', { 
        taskId: task.id, 
        taskTitle: task.title,
        eventKey,
        completed: task.completed
      });
        
        processEventSafely(eventKey, 'TASK_DONE', {
          taskId: task.id,
          taskTitle: task.title,
          type: 'task',
          tags: [task.title, ...(task.category ? [task.category] : [])]
        });
      }
    });
    
    prevTasksRef.current = currentTasks;
  }, [todayTasks, processEventSafely, isInitialLoading]);

  // Detectar conclusão de metas
  useEffect(() => {
    // Não processar durante carregamento inicial
    if (isInitialLoading) {
      console.log('[VitalityListener] Ignorando detecção de metas durante carregamento inicial');
      return;
    }
    
    const currentGoals = activeGoals || [];
    const prevGoals = prevGoalsRef.current;
    
    // Verificar se alguma meta foi concluída
    currentGoals.forEach(goal => {
      const prevGoal = prevGoals.find(g => g.id === goal.id);
      
      // APENAS detectar conclusão real (meta existia antes E mudou para concluída)
      if (prevGoal && goal.isCompleted && !prevGoal.isCompleted) {
        // Usar ID da meta + timestamp atual para garantir unicidade
        const eventKey = `goal-${goal.id}-completed-${Date.now()}`;
        
        console.log('[VitalityListener] Meta concluída detectada:', { goalId: goal.id, goalTitle: goal.title, eventKey });
        
        processEventSafely(eventKey, 'GOAL_DONE', {
          goalId: goal.id,
          goalTitle: goal.title,
          type: 'goal',
          tags: [goal.title], // Nome da meta nas tags
          category: goal.category // Incluir categoria para salvar corretamente
        });
      }
    });
    
    prevGoalsRef.current = currentGoals;
  }, [activeGoals, processEventSafely, isInitialLoading]);

  // Detectar ganho de XP
  useEffect(() => {
    const currentXp = xp;
    const prevXp = prevXpRef.current;
    
    if (currentXp > prevXp) {
      const xpGained = currentXp - prevXp;
      const eventKey = `xp-${currentXp}-${Date.now()}`;
      
      console.log('[VitalityListener] Ganho de XP detectado:', { xpGained, totalXp: currentXp, eventKey });
      
      processEventSafely(eventKey, 'XP_GAIN', {
        xpGained,
        totalXp: currentXp,
        type: 'xp',
        tags: []
      });
    }
    
    prevXpRef.current = currentXp;
  }, [xp, processEventSafely]);

  // Este componente não renderiza nada, apenas escuta eventos
  return null;
};
