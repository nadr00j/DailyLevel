import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useGamificationStoreV21 } from '@/stores/useGamificationStoreV21';
import { usePixelBuddyStore } from '@/stores/usePixelBuddyStore';
import { useHabitStore } from '@/stores/useHabitStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTasks } from '@/hooks/useTasks';
import { useGoals } from '@/hooks/useGoals';

// Flag para controlar logs de debug em produção
const IS_DEBUG = process.env.NODE_ENV === 'development';

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
  
  // ✅ Função auxiliar para processar eventos de forma segura (useCallback) - OTIMIZADA
  const processEventSafely = useCallback(async (eventKey: string, eventType: string, eventData: any) => {
    if (IS_DEBUG) {
      console.log('⚡ [VitalityListener] Processando evento:', { eventType, eventData: { type: eventData.type, tags: eventData.tags } });
    }
    
    // Evitar processamento simultâneo
    if (isProcessingRef.current) {
      if (IS_DEBUG) console.log('[VitalityListener] Já processando evento, ignorando:', eventKey);
      return;
    }

    // Evitar processamento muito frequente (mínimo 100ms entre eventos) - OTIMIZADO
    const now = Date.now();
    if (now - lastProcessedTimeRef.current < 100) {
      if (IS_DEBUG) console.log('[VitalityListener] Processamento muito frequente, ignorando:', eventKey);
      return;
    }

    // Verificar se o evento já foi processado
    if (processedEventsRef.current.has(eventKey)) {
      if (IS_DEBUG) console.log('[VitalityListener] Evento já processado, ignorando:', eventKey);
      return;
    }

    try {
      isProcessingRef.current = true;
      lastProcessedTimeRef.current = now;
      processedEventsRef.current.add(eventKey);

      if (IS_DEBUG) {
        console.log('[VitalityListener] Processando evento:', { eventKey, eventType, eventData });
      }

      // OTIMIZAÇÃO: Remover verificação Supabase desnecessária
      // O addXp já tem lógica de prevenção de duplicação
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        if (IS_DEBUG) console.warn('⚠️ [VitalityListener] Usuário não autenticado, ignorando evento');
        return;
      }

      // Verificar se há tags válidas antes de chamar addXp
      if (eventData.tags && eventData.tags.length > 0) {
        if (IS_DEBUG) {
          console.log('🎯 [VitalityListener] Chamando addXp com:', {
            type: eventData.type || 'task',
            tags: eventData.tags,
            explicitCategory: eventData.category
          });
        }
        
        // Passar categoria explícita para addXp
        addXp(eventData.type || 'task', eventData.tags, eventData.category);
      } else {
        if (IS_DEBUG) {
          console.warn('⚠️ [VitalityListener] Evento sem tags válidas ignorado:', { eventType, eventData });
        }
      }
    } catch (error) {
      console.error('[VitalityListener] Erro ao processar evento:', eventKey, error);
      // Remover da lista de processados em caso de erro para permitir retry
      processedEventsRef.current.delete(eventKey);
    } finally {
      isProcessingRef.current = false;
    }
  }, [addXp]);
  
  // Limpar cache de eventos processados - OTIMIZADO
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const currentSize = processedEventsRef.current.size;
      // OTIMIZAÇÃO: Só limpar se há mais de 50 eventos no cache
      if (currentSize > 50) {
        if (IS_DEBUG) {
          console.log(`[VitalityListener] Limpando cache de eventos processados (${currentSize} itens)`);
        }
        processedEventsRef.current.clear();
      }
    }, 5 * 60 * 1000); // OTIMIZADO: Reduzido de 10min para 5min
    
    return () => clearInterval(cleanupInterval);
  }, []);

  // Aguardar carregamento inicial dos dados - OTIMIZADO
  useEffect(() => {
    const timer = setTimeout(() => {
      if (IS_DEBUG) {
        console.log('[VitalityListener] Carregamento inicial concluído, iniciando detecção de eventos');
        console.log('[VitalityListener] Inicializando PixelBuddy com:', { xp, vitality });
      }
      setIsInitialLoading(false);
      
      // Sempre inicializar, mesmo com valores 0 (usuário novo)
      initializeFromGamification(xp, vitality);
    }, 2000); // OTIMIZADO: Reduzido de 5s para 2s

    return () => clearTimeout(timer);
  }, []); // Executa apenas uma vez na montagem

  // OTIMIZAÇÃO: Memoizar cálculo do PixelBuddy para evitar recálculos desnecessários
  const pixelBuddyAssets = useMemo(() => {
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
    
    return { newBody, newHead };
  }, [vitality]); // Apenas recalcula quando vitality muda

  // Atualizar PixelBuddy quando assets mudam
  useEffect(() => {
    if (IS_DEBUG) {
      console.log('[VitalityListener] Atualizando PixelBuddy:', { 
        xp, 
        vitality, 
        ...pixelBuddyAssets 
      });
    }
    
    setBase('body', pixelBuddyAssets.newBody);
    setBase('head', pixelBuddyAssets.newHead);
  }, [pixelBuddyAssets, setBase]);

  // OTIMIZAÇÃO: Memoizar dados de hoje para evitar recálculos
  const todayString = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Detectar conclusão de hábitos - OTIMIZADO
  useEffect(() => {
    // Não processar durante carregamento inicial
    if (isInitialLoading) {
      if (IS_DEBUG) console.log('[VitalityListener] Ignorando detecção de hábitos durante carregamento inicial');
      return;
    }
    
    const prevHabits = prevHabitsRef.current;
    
    // OTIMIZAÇÃO: Processar apenas hábitos que mudaram
    let hasChanges = false;
    
    // Verificar se algum hábito foi concluído hoje
    Object.entries(habits).forEach(([habitId, habit]) => {
      const todayLog = habitLogs[habitId]?.[todayString] || 0;
      const prevTodayLog = prevHabits[habitId]?.todayLog || 0;
      
      // OTIMIZAÇÃO: Só processar se houve mudança real
      if (todayLog !== prevTodayLog) {
        hasChanges = true;
        const isCompletedToday = todayLog >= habit.targetCount;
        const wasCompletedBefore = prevTodayLog >= habit.targetCount;
        
        // Se o hábito foi recém concluído (não estava completo antes e agora está)
        if (isCompletedToday && !wasCompletedBefore) {
          // Usar ID do hábito + data + timestamp para garantir unicidade
          const eventKey = `habit-${habitId}-completed-${todayString}-${Date.now()}`;
          
          if (IS_DEBUG) {
            console.log('[VitalityListener] Hábito concluído detectado:', { 
              habitId, 
              habitName: habit.name, 
              todayLog, 
              targetCount: habit.targetCount,
              eventKey 
            });
          }
          
          processEventSafely(eventKey, 'HABIT_DONE', {
            habitId,
            habitName: habit.name,
            type: 'habit',
            tags: [habit.name],
            category: habit.categories?.[0]
          });
        }
      }
    });
    
    // OTIMIZAÇÃO: Só atualizar referência se houve mudanças
    if (hasChanges) {
      const habitsWithLogs = Object.fromEntries(
        Object.entries(habits).map(([id, habit]) => [
          id, 
          { ...habit, todayLog: habitLogs[id]?.[todayString] || 0 }
        ])
      );
      prevHabitsRef.current = habitsWithLogs;
    }
  }, [habits, habitLogs, processEventSafely, isInitialLoading, todayString]);

  // Detectar conclusão de tarefas - OTIMIZADO
  useEffect(() => {
    // Não processar durante carregamento inicial
    if (isInitialLoading) {
      if (IS_DEBUG) console.log('[VitalityListener] Ignorando detecção de tarefas durante carregamento inicial');
      return;
    }
    
    const currentTasks = todayTasks || [];
    const prevTasks = prevTasksRef.current;
    
    // OTIMIZAÇÃO: Log reduzido - apenas quando há mudanças significativas
    if (IS_DEBUG && currentTasks.length !== prevTasks.length) {
      console.log('[VitalityListener] Número de tarefas mudou:', { 
        currentTasksLength: currentTasks.length, 
        prevTasksLength: prevTasks.length
      });
    }
    
    // OTIMIZAÇÃO: Usar Map para busca mais rápida de tarefas anteriores
    const prevTasksMap = new Map(prevTasks.map(t => [t.id, t]));
    
    // Verificar se alguma tarefa foi concluída
    currentTasks.forEach(task => {
      const prevTask = prevTasksMap.get(task.id);
      
      // OTIMIZAÇÃO: Só processar se houve mudança real no estado
      const isTaskCompleted = task.completed && !prevTask?.completed;
      
      if (isTaskCompleted) {
        // Usar ID da tarefa + timestamp atual para garantir unicidade
        const eventKey = `task-${task.id}-completed-${Date.now()}`;
        
        if (IS_DEBUG) {
          console.log('🎯 [VitalityListener] Tarefa concluída detectada:', { 
            taskId: task.id, 
            taskTitle: task.title,
            eventKey,
            completed: task.completed
          });
        }
        
        processEventSafely(eventKey, 'TASK_DONE', {
          taskId: task.id,
          taskTitle: task.title,
          type: 'task',
          tags: [task.title],
          category: task.category
        });
      }
    });
    
    prevTasksRef.current = currentTasks;
  }, [todayTasks, processEventSafely, isInitialLoading]);

  // Detectar conclusão de metas - OTIMIZADO
  useEffect(() => {
    // Não processar durante carregamento inicial
    if (isInitialLoading) {
      if (IS_DEBUG) console.log('[VitalityListener] Ignorando detecção de metas durante carregamento inicial');
      return;
    }
    
    const currentGoals = activeGoals || [];
    const prevGoals = prevGoalsRef.current;
    
    // OTIMIZAÇÃO: Usar Map para busca mais rápida de metas anteriores
    const prevGoalsMap = new Map(prevGoals.map(g => [g.id, g]));
    
    // Verificar se alguma meta foi concluída
    currentGoals.forEach(goal => {
      const prevGoal = prevGoalsMap.get(goal.id);
      
      // APENAS detectar conclusão real (meta existia antes E mudou para concluída)
      if (prevGoal && goal.isCompleted && !prevGoal.isCompleted) {
        // Usar ID da meta + timestamp atual para garantir unicidade
        const eventKey = `goal-${goal.id}-completed-${Date.now()}`;
        
        if (IS_DEBUG) {
          console.log('[VitalityListener] Meta concluída detectada:', { 
            goalId: goal.id, 
            goalTitle: goal.title, 
            eventKey 
          });
        }
        
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

  // OTIMIZAÇÃO: Removido useEffect de detecção de XP
  // O XP é atualizado diretamente pelo addXp, não precisamos detectar mudanças
  // Isso evita loops infinitos e processamento desnecessário

  // ✅ Early return DEPOIS de todos os hooks
  if (!isAuthenticated || !user?.id) {
    return null;
  }

  // Este componente não renderiza nada, apenas escuta eventos
  return null;
};
