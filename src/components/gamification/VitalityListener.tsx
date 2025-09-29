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
  const [hasDataLoaded, setHasDataLoaded] = useState(false);
  const { xp, vitality, mood, addXp, history } = useGamificationStoreV21();
  const { setBase, initializeFromGamification } = usePixelBuddyStore();
  const { habits } = useHabitStore();
  const habitLogs = useHabitStore(state => state.logs);
  const { todayTasks } = useTasks();
  const { activeGoals, completedGoals } = useGoals();
  
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

  // OTIMIZAÇÃO: Memoizar dados de hoje para evitar recálculos
  const todayString = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Detectar quando os dados foram carregados do Supabase
  useEffect(() => {
    // Verificar se os dados foram carregados baseado em indicadores
    const hasHabits = Object.keys(habits).length > 0;
    const hasTasks = todayTasks && todayTasks.length > 0;
    const hasHistory = history && history.length > 0;
    const hasXP = xp > 0;
    const hasGoals = (activeGoals && activeGoals.length > 0) || (completedGoals && completedGoals.length > 0);
    
    if (IS_DEBUG) {
      console.log('[VitalityListener] Verificando carregamento de dados:', {
        hasDataLoaded,
        hasHabits,
        hasTasks,
        hasHistory,
        hasXP,
        hasGoals,
        shouldLoadData: !hasDataLoaded && (hasHabits || hasTasks || hasHistory || hasXP || hasGoals)
      });
    }
    
    // Se temos pelo menos alguns dados ou após timeout, considerar carregado
    if (!hasDataLoaded && (hasHabits || hasTasks || hasHistory || hasXP || hasGoals)) {
      setHasDataLoaded(true);
      if (IS_DEBUG) {
        console.log('[VitalityListener] Dados detectados do Supabase, sincronizando refs:', {
          hasHabits,
          hasTasks,
          hasHistory,
          hasXP,
          hasGoals
        });
      }
      
      // SINCRONIZAR REFS COM DADOS CARREGADOS
      // Hábitos
      if (hasHabits) {
        const habitsWithLogs = Object.fromEntries(
          Object.entries(habits).map(([id, habit]) => [
            id, 
            { ...habit, todayLog: habitLogs[id]?.[todayString] || 0 }
          ])
        );
        prevHabitsRef.current = habitsWithLogs;
        if (IS_DEBUG) console.log('[VitalityListener] prevHabitsRef sincronizado com Supabase');
      }
      
      // Tarefas
      if (hasTasks) {
        prevTasksRef.current = [...todayTasks];
        if (IS_DEBUG) console.log('[VitalityListener] prevTasksRef sincronizado com Supabase');
      }
      
      // Metas (todas: ativas + completadas)
      const allGoals = [...(activeGoals || []), ...(completedGoals || [])];
      if (allGoals.length > 0) {
        prevGoalsRef.current = [...allGoals];
        if (IS_DEBUG) console.log('[VitalityListener] prevGoalsRef sincronizado com Supabase (ativas + completadas)');
      }
    }
  }, [habits, todayTasks, activeGoals, completedGoals, history, xp, hasDataLoaded, habitLogs, todayString]);

  // Aguardar carregamento inicial dos dados - OTIMIZADO
  useEffect(() => {
    const timer = setTimeout(() => {
      if (IS_DEBUG) {
        console.log('[VitalityListener] Carregamento inicial concluído, iniciando detecção de eventos');
        console.log('[VitalityListener] Inicializando PixelBuddy com:', { xp, vitality });
      }
      setIsInitialLoading(false);
      
      // FALLBACK: Se dados ainda não foram carregados após timeout, forçar hasDataLoaded = true
      if (!hasDataLoaded) {
        setHasDataLoaded(true);
        if (IS_DEBUG) console.log('[VitalityListener] FALLBACK: Forçando hasDataLoaded = true após timeout');
      }
      
      // Sempre inicializar, mesmo com valores 0 (usuário novo)
      initializeFromGamification(xp, vitality);
    }, 3000); // Aumentado para 3s para dar tempo dos dados carregarem

    return () => clearTimeout(timer);
  }, [hasDataLoaded, xp, vitality, initializeFromGamification]); // Adicionadas dependências

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

  // Detectar conclusão de hábitos - OTIMIZADO
  useEffect(() => {
    // Não processar durante carregamento inicial ou se dados não foram carregados
    if (isInitialLoading || !hasDataLoaded) {
      if (IS_DEBUG) console.log('[VitalityListener] Ignorando detecção de hábitos durante carregamento inicial ou dados não carregados');
      return;
    }
    
    const prevHabits = prevHabitsRef.current;
    
    // CORREÇÃO: Se prevHabits está vazio (primeira execução APÓS carregamento), inicializar com estado atual
    // para evitar detecção falsa de "novos" hábitos concluídos
    if (Object.keys(prevHabits).length === 0) {
      const habitsWithLogs = Object.fromEntries(
        Object.entries(habits).map(([id, habit]) => [
          id, 
          { ...habit, todayLog: habitLogs[id]?.[todayString] || 0 }
        ])
      );
      prevHabitsRef.current = habitsWithLogs;
      if (IS_DEBUG) console.log('[VitalityListener] Inicializando prevHabitsRef na primeira execução APÓS carregamento');
      return;
    }
    
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
              prevTodayLog,
              wasCompletedBefore,
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
  }, [habits, habitLogs, processEventSafely, isInitialLoading, hasDataLoaded, todayString]);

  // Detectar conclusão de tarefas - OTIMIZADO
  useEffect(() => {
    // Não processar durante carregamento inicial ou se dados não foram carregados
    if (isInitialLoading || !hasDataLoaded) {
      if (IS_DEBUG) console.log('[VitalityListener] Ignorando detecção de tarefas durante carregamento inicial ou dados não carregados');
      return;
    }
    
    const currentTasks = todayTasks || [];
    const prevTasks = prevTasksRef.current;
    
    // CORREÇÃO: Se prevTasks está vazio (primeira execução APÓS carregamento), inicializar com estado atual
    // para evitar detecção falsa de "novas" tarefas concluídas
    if (prevTasks.length === 0 && currentTasks.length > 0) {
      prevTasksRef.current = [...currentTasks];
      if (IS_DEBUG) console.log('[VitalityListener] Inicializando prevTasksRef na primeira execução APÓS carregamento');
      return;
    }
    
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
            completed: task.completed,
            prevCompleted: prevTask?.completed
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
  }, [todayTasks, processEventSafely, isInitialLoading, hasDataLoaded]);

  // Detectar conclusão de metas - OTIMIZADO
  useEffect(() => {
    // Combinar todas as metas (ativas + completadas)
    const allCurrentGoals = [...(activeGoals || []), ...(completedGoals || [])];
    
    if (IS_DEBUG) {
      console.log('[VitalityListener] useEffect de metas executado:', {
        isInitialLoading,
        hasDataLoaded,
        activeGoalsLength: activeGoals?.length || 0,
        completedGoalsLength: completedGoals?.length || 0,
        allCurrentGoalsLength: allCurrentGoals.length,
        prevGoalsLength: prevGoalsRef.current.length
      });
    }
    
    // Não processar durante carregamento inicial ou se dados não foram carregados
    if (isInitialLoading || !hasDataLoaded) {
      if (IS_DEBUG) console.log('[VitalityListener] Ignorando detecção de metas durante carregamento inicial ou dados não carregados');
      return;
    }
    
    const prevGoals = prevGoalsRef.current;
    
    // CORREÇÃO: Se prevGoals está vazio (primeira execução APÓS carregamento), inicializar com estado atual
    // para evitar detecção falsa de "novas" metas concluídas
    if (prevGoals.length === 0 && allCurrentGoals.length > 0) {
      prevGoalsRef.current = [...allCurrentGoals];
      if (IS_DEBUG) console.log('[VitalityListener] Inicializando prevGoalsRef na primeira execução APÓS carregamento (todas as metas)');
      return;
    }
    
    // OTIMIZAÇÃO: Usar Map para busca mais rápida de metas anteriores
    const prevGoalsMap = new Map(prevGoals.map(g => [g.id, g]));
    
    if (IS_DEBUG) {
      console.log('[VitalityListener] Verificando mudanças nas metas:', {
        allCurrentGoalsCount: allCurrentGoals.length,
        prevGoalsCount: prevGoals.length,
        allCurrentGoals: allCurrentGoals.map(g => ({ id: g.id, title: g.title, isCompleted: g.isCompleted })),
        prevGoals: prevGoals.map(g => ({ id: g.id, title: g.title, isCompleted: g.isCompleted }))
      });
    }
    
    // Verificar se alguma meta foi concluída (agora verificando TODAS as metas)
    allCurrentGoals.forEach(goal => {
      const prevGoal = prevGoalsMap.get(goal.id);
      
      if (IS_DEBUG) {
        console.log('[VitalityListener] Verificando meta:', {
          goalId: goal.id,
          goalTitle: goal.title,
          currentCompleted: goal.isCompleted,
          prevCompleted: prevGoal?.isCompleted,
          hasChanged: prevGoal && goal.isCompleted && !prevGoal.isCompleted
        });
      }
      
      // APENAS detectar conclusão real (meta existia antes E mudou para concluída)
      if (prevGoal && goal.isCompleted && !prevGoal.isCompleted) {
        // Usar ID da meta + timestamp atual para garantir unicidade
        const eventKey = `goal-${goal.id}-completed-${Date.now()}`;
        
        if (IS_DEBUG) {
          console.log('[VitalityListener] Meta concluída detectada:', { 
            goalId: goal.id, 
            goalTitle: goal.title, 
            eventKey,
            prevCompleted: prevGoal.isCompleted
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
    
    // Atualizar referência com TODAS as metas
    prevGoalsRef.current = allCurrentGoals;
  }, [activeGoals, completedGoals, processEventSafely, isInitialLoading, hasDataLoaded]);

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
