// ===========================================
// 🧪 TESTE ABRANGENTE DO SISTEMA DE GAMIFICAÇÃO
// ===========================================

console.clear();
console.log('🎯 ===== INICIANDO TESTE DO SISTEMA DE GAMIFICAÇÃO =====');

// Função para aguardar um tempo
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Função para verificar se store existe
const checkStore = (storeName, store) => {
  if (!store) {
    console.error(`❌ Store ${storeName} não encontrado!`);
    return false;
  }
  console.log(`✅ Store ${storeName} encontrado`);
  return true;
};

// Função principal de teste
async function runComprehensiveTest() {
  console.log('\n📋 FASE 1: VERIFICAÇÃO DOS STORES');
  console.log('=====================================');

  // 1. Verificar se todos os stores existem
  const authStore = window.useAuthStore?.getState?.();
  const gamificationStore = window.useGamificationStoreV21?.getState?.();
  const taskStore = window.useTaskStore?.getState?.();
  const habitStore = window.useHabitStore?.getState?.();
  const goalStore = window.useGoalStore?.getState?.();
  const pixelBuddyStore = window.usePixelBuddyStore?.getState?.();

  const storesOk = {
    auth: checkStore('useAuthStore', authStore),
    gamification: checkStore('useGamificationStoreV21', gamificationStore),
    task: checkStore('useTaskStore', taskStore),
    habit: checkStore('useHabitStore', habitStore),
    goal: checkStore('useGoalStore', goalStore),
    pixelBuddy: checkStore('usePixelBuddyStore', pixelBuddyStore)
  };

  // Só parar se stores críticos não existirem
  if (!storesOk.auth || !storesOk.gamification) {
    console.error('❌ Stores críticos não encontrados! Parando teste.');
    return;
  }

  if (!storesOk.pixelBuddy) {
    console.warn('⚠️ PixelBuddyStore não acessível via window, tentando acesso direto...');
    try {
      // Tentar acessar via import direto
      const pixelBuddyState = document.querySelector('[data-pixelbuddy]');
      console.log('🔍 Elemento PixelBuddy encontrado:', !!pixelBuddyState);
    } catch (e) {
      console.warn('⚠️ Não foi possível acessar PixelBuddy diretamente');
    }
  }

  console.log('\n🔍 FASE 2: ESTADO INICIAL DOS STORES');
  console.log('=====================================');

  // 2. Estado atual dos stores
  console.log('🔐 Auth Store:', {
    isAuthenticated: authStore.isAuthenticated,
    userId: authStore.user?.id,
    userEmail: authStore.user?.email
  });

  console.log('🎮 Gamification Store:', {
    userId: gamificationStore.userId,
    xp: gamificationStore.xp,
    coins: gamificationStore.coins,
    vitality: gamificationStore.vitality,
    mood: gamificationStore.mood,
    historyLength: gamificationStore.history?.length || 0
  });

  console.log('📋 Task Store:', {
    tasksLength: taskStore.tasks?.length || 0,
    todayTasks: taskStore.todayTasks?.length || 0
  });

  console.log('🔄 Habit Store:', {
    habitsLength: habitStore.habits?.length || 0,
    logsLength: Object.keys(habitStore.logs || {}).length
  });

  console.log('🎯 Goal Store:', {
    goalsLength: goalStore.goals?.length || 0
  });

  if (pixelBuddyStore) {
    console.log('🤖 PixelBuddy Store:', {
      body: pixelBuddyStore.body,
      head: pixelBuddyStore.head
    });
  } else {
    console.log('🤖 PixelBuddy Store: ❌ Não acessível');
  }

  console.log('\n🔄 FASE 3: TESTE DE SUPABASE');
  console.log('=====================================');

  // 3. Teste de conectividade com Supabase
  try {
    const userId = authStore.user?.id;
    if (!userId) {
      console.error('❌ Usuário não autenticado!');
      return;
    }

    console.log('🔍 Testando consulta ao Supabase...');
    // Tentar diferentes formas de acessar db
    let db = window.db;
    if (!db) {
      console.log('⚠️ window.db não encontrado, tentando outras formas...');
      // Tentar via import ou outros caminhos
      try {
        // Verificar se existe no contexto global
        if (typeof supabase !== 'undefined') {
          console.log('✅ Supabase client encontrado diretamente');
          db = { 
            getGamificationData: async (userId) => {
              const { data, error } = await supabase
                .from('user_gamification')
                .select('*')
                .eq('user_id', userId)
                .single();
              return error ? null : data;
            },
            getHistoryItems: async (userId) => {
              const { data, error } = await supabase
                .from('history_items')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
              return error ? [] : data;
            }
          };
        } else {
          console.log('⚠️ Supabase não acessível, pulando testes de BD');
          db = null;
        }
      } catch (e) {
        console.log('⚠️ Erro ao tentar acessar Supabase:', e.message);
        db = null;
      }
    }
    
    if (!db) {
      console.log('⚠️ Pulando testes de Supabase - BD não acessível');
    }

    if (db) {
      // Testar getGamificationData
      console.log('📊 Buscando dados de gamificação...');
      const gamificationData = await db.getGamificationData(userId);
      console.log('✅ Dados de gamificação do Supabase:', gamificationData);

      // Testar getHistoryItems
      console.log('📜 Buscando histórico de itens...');
      const historyItems = await db.getHistoryItems(userId);
      console.log('✅ Histórico de itens do Supabase:', {
        length: historyItems?.length || 0,
        first3: historyItems?.slice(0, 3) || []
      });
    }

  } catch (error) {
    console.error('❌ Erro no teste do Supabase:', error);
  }

  console.log('\n🧪 FASE 4: TESTE DE FUNCIONALIDADES');
  console.log('=====================================');

  // 4. Teste de funcionalidades básicas
  const initialXP = gamificationStore.xp;
  const initialCoins = gamificationStore.coins;
  
  console.log('💰 Estado antes do teste:', { xp: initialXP, coins: initialCoins });

  try {
    console.log('🔥 Testando addXp...');
    gamificationStore.addXp('task', ['Teste'], 'Teste');
    
    await wait(1000); // Aguardar 1 segundo
    
    const afterXP = window.useGamificationStoreV21.getState().xp;
    const afterCoins = window.useGamificationStoreV21.getState().coins;
    
    console.log('💰 Estado depois do addXp:', { xp: afterXP, coins: afterCoins });
    
    if (afterXP > initialXP) {
      console.log('✅ XP aumentou corretamente!');
    } else {
      console.log('❌ XP não aumentou');
    }
    
    if (afterCoins > initialCoins) {
      console.log('✅ Coins aumentaram corretamente!');
    } else {
      console.log('❌ Coins não aumentaram');
    }

  } catch (error) {
    console.error('❌ Erro no teste de addXp:', error);
  }

  console.log('\n🔄 FASE 5: TESTE DE SINCRONIZAÇÃO');
  console.log('=====================================');

  // 5. Teste de sincronização
  try {
    console.log('🔄 Testando sincronização...');
    const dataSyncService = window.dataSyncService;
    if (dataSyncService && authStore.user?.id) {
      await dataSyncService.syncAll(authStore.user.id);
      console.log('✅ Sincronização concluída!');
    } else {
      console.log('❌ DataSyncService não encontrado ou usuário não autenticado');
    }
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
  }

  console.log('\n🔍 FASE 6: DIAGNÓSTICO DE PERSISTÊNCIA');
  console.log('=====================================');

  // 6. Teste específico de persistência
  try {
    console.log('🔄 Aguardando 3 segundos para sincronização...');
    await wait(3000);

    console.log('📊 Verificando se dados foram salvos no Supabase...');
    const userId = authStore.user?.id;
    
    // Tentar acessar db
    let db = window.db;
    if (!db && typeof supabase !== 'undefined') {
      db = { 
        getGamificationData: async (userId) => {
          const { data, error } = await supabase
            .from('user_gamification')
            .select('*')
            .eq('user_id', userId)
            .single();
          return error ? null : data;
        }
      };
    }
    
    if (!db) {
      console.log('⚠️ DB não acessível, pulando verificação do Supabase');
      return;
    }
    
    const latestGamificationData = await db.getGamificationData(userId);
    
    console.log('💾 Dados atuais no Supabase:', {
      xp: latestGamificationData?.xp || 0,
      coins: latestGamificationData?.coins || 0,
      vitality: latestGamificationData?.vitality || 0
    });

    const currentLocalState = window.useGamificationStoreV21.getState();
    console.log('💻 Dados atuais no Local Store:', {
      xp: currentLocalState.xp,
      coins: currentLocalState.coins,
      vitality: currentLocalState.vitality
    });

    // Verificar se há discrepância
    const discrepancy = {
      xp: currentLocalState.xp !== (latestGamificationData?.xp || 0),
      coins: currentLocalState.coins !== (latestGamificationData?.coins || 0),
      vitality: currentLocalState.vitality !== (latestGamificationData?.vitality || 0)
    };

    console.log('⚠️ Discrepâncias encontradas:', discrepancy);

    if (discrepancy.xp || discrepancy.coins) {
      console.log('🚨 PROBLEMA: Local e Supabase estão dessincronizados!');
      console.log('💡 Isso explica porque dados resetam no reload');
    } else {
      console.log('✅ Local e Supabase estão sincronizados');
    }

  } catch (error) {
    console.error('❌ Erro no diagnóstico de persistência:', error);
  }

  console.log('\n📊 FASE 7: VERIFICAÇÃO FINAL');
  console.log('=====================================');

  // 7. Estado final
  const finalGamificationStore = window.useGamificationStoreV21.getState();
  console.log('🎮 Estado final do Gamification Store:', {
    userId: finalGamificationStore.userId,
    xp: finalGamificationStore.xp,
    coins: finalGamificationStore.coins,
    vitality: finalGamificationStore.vitality,
    mood: finalGamificationStore.mood,
    historyLength: finalGamificationStore.history?.length || 0
  });

  console.log('\n🎯 ===== TESTE CONCLUÍDO =====');
  
  // Retornar resumo
  return {
    stores: {
      auth: !!authStore,
      gamification: !!gamificationStore,
      task: !!taskStore,
      habit: !!habitStore,
      goal: !!goalStore,
      pixelBuddy: !!pixelBuddyStore
    },
    userId: authStore?.user?.id,
    initialState: { xp: initialXP, coins: initialCoins },
    finalState: { 
      xp: finalGamificationStore.xp, 
      coins: finalGamificationStore.coins 
    },
    xpChanged: finalGamificationStore.xp !== initialXP,
    coinsChanged: finalGamificationStore.coins !== initialCoins
  };
}

// Executar teste
runComprehensiveTest()
  .then(result => {
    console.log('\n📋 RESUMO DO TESTE:', result);
  })
  .catch(error => {
    console.error('❌ ERRO GERAL NO TESTE:', error);
  });

// ===========================================
// 🛠️ FUNÇÕES AUXILIARES PARA TESTES MANUAIS
// ===========================================

// Função para testar XP manualmente
window.testAddXP = (amount = 10) => {
  const store = window.useGamificationStoreV21.getState();
  console.log('💰 Antes:', { xp: store.xp, coins: store.coins });
  store.addXp('task', ['Teste Manual'], 'Teste');
  setTimeout(() => {
    const newStore = window.useGamificationStoreV21.getState();
    console.log('💰 Depois:', { xp: newStore.xp, coins: newStore.coins });
  }, 1000);
};

// Função para verificar estado atual
window.checkCurrentState = () => {
  const stores = {
    auth: window.useAuthStore?.getState?.(),
    gamification: window.useGamificationStoreV21?.getState?.(),
    task: window.useTaskStore?.getState?.(),
    habit: window.useHabitStore?.getState?.(),
    goal: window.useGoalStore?.getState?.(),
    pixelBuddy: window.usePixelBuddyStore?.getState?.()
  };
  
  console.log('📊 ESTADO ATUAL DOS STORES:');
  Object.entries(stores).forEach(([name, store]) => {
    if (store) {
      console.log(`✅ ${name}:`, store);
    } else {
      console.log(`❌ ${name}: não encontrado`);
    }
  });
  
  return stores;
};

// Função para forçar sincronização
window.forcSync = async () => {
  const authStore = window.useAuthStore?.getState?.();
  const userId = authStore?.user?.id;
  
  if (!userId) {
    console.error('❌ Usuário não autenticado');
    return;
  }
  
  try {
    console.log('🔄 Forçando sincronização...');
    await window.dataSyncService.syncAll(userId);
    console.log('✅ Sincronização forçada concluída!');
  } catch (error) {
    console.error('❌ Erro na sincronização forçada:', error);
  }
};

// Função para simular reload e testar persistência
window.testPersistence = async () => {
  console.log('🔄 TESTE DE PERSISTÊNCIA');
  console.log('========================');
  
  const gamificationStore = window.useGamificationStoreV21.getState();
  const authStore = window.useAuthStore.getState();
  
  console.log('📊 Estado antes do "reload":', {
    local: { xp: gamificationStore.xp, coins: gamificationStore.coins },
    userId: gamificationStore.userId
  });
  
  // Verificar dados no Supabase
  try {
    // Tentar acessar db
    let db = window.db;
    if (!db && typeof supabase !== 'undefined') {
      db = { 
        getGamificationData: async (userId) => {
          const { data, error } = await supabase
            .from('user_gamification')
            .select('*')
            .eq('user_id', userId)
            .single();
          return error ? null : data;
        }
      };
    }
    
    if (!db) {
      console.log('⚠️ DB não acessível para teste de persistência');
      return;
    }
    
    const supabaseData = await db.getGamificationData(authStore.user.id);
    console.log('💾 Dados no Supabase:', {
      xp: supabaseData?.xp || 0,
      coins: supabaseData?.coins || 0
    });
    
    // Simular carregamento do Supabase (como acontece no reload)
    console.log('🔄 Simulando carregamento do Supabase...');
    gamificationStore.syncFromSupabase({ ...supabaseData, userId: authStore.user.id });
    
    const afterSync = window.useGamificationStoreV21.getState();
    console.log('📊 Estado após "reload" simulado:', {
      xp: afterSync.xp,
      coins: afterSync.coins
    });
    
    // Verificar se houve reset
    if (afterSync.xp === 0 && afterSync.coins === 0 && gamificationStore.xp > 0) {
      console.log('🚨 PROBLEMA CONFIRMADO: Dados resetaram!');
      console.log('💡 Supabase tem dados zerados, mas local tinha dados válidos');
    } else {
      console.log('✅ Dados persistiram corretamente');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste de persistência:', error);
  }
};

// Função para verificar discrepâncias
window.checkDiscrepancies = async () => {
  console.log('🔍 VERIFICANDO DISCREPÂNCIAS');
  console.log('============================');
  
  const authStore = window.useAuthStore.getState();
  const gamificationStore = window.useGamificationStoreV21.getState();
  
  try {
    // Tentar acessar db
    let db = window.db;
    if (!db && typeof supabase !== 'undefined') {
      db = { 
        getGamificationData: async (userId) => {
          const { data, error } = await supabase
            .from('user_gamification')
            .select('*')
            .eq('user_id', userId)
            .single();
          return error ? null : data;
        },
        getHistoryItems: async (userId) => {
          const { data, error } = await supabase
            .from('history_items')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
          return error ? [] : data;
        }
      };
    }
    
    if (!db) {
      console.log('⚠️ DB não acessível para verificação de discrepâncias');
      return;
    }
    
    const supabaseData = await db.getGamificationData(authStore.user.id);
    const historyItems = await db.getHistoryItems(authStore.user.id);
    
    // Calcular XP/moedas do histórico
    const calculatedXP = historyItems.reduce((sum, item) => sum + (item.xp || 0), 0);
    const calculatedCoins = historyItems.reduce((sum, item) => sum + (item.coins || 0), 0);
    
    console.log('📊 COMPARAÇÃO DE DADOS:');
    console.log('Local Store:', { xp: gamificationStore.xp, coins: gamificationStore.coins });
    console.log('Supabase user_gamification:', { xp: supabaseData?.xp || 0, coins: supabaseData?.coins || 0 });
    console.log('Calculado do history_items:', { xp: calculatedXP, coins: calculatedCoins });
    console.log('Total de itens no histórico:', historyItems.length);
    
    // Identificar discrepâncias
    const discrepancies = [];
    if (gamificationStore.xp !== (supabaseData?.xp || 0)) {
      discrepancies.push(`XP: Local(${gamificationStore.xp}) ≠ Supabase(${supabaseData?.xp || 0})`);
    }
    if (gamificationStore.coins !== (supabaseData?.coins || 0)) {
      discrepancies.push(`Coins: Local(${gamificationStore.coins}) ≠ Supabase(${supabaseData?.coins || 0})`);
    }
    if ((supabaseData?.xp || 0) !== calculatedXP) {
      discrepancies.push(`XP Supabase(${supabaseData?.xp || 0}) ≠ Calculado(${calculatedXP})`);
    }
    
    if (discrepancies.length > 0) {
      console.log('🚨 DISCREPÂNCIAS ENCONTRADAS:');
      discrepancies.forEach(d => console.log('  • ' + d));
    } else {
      console.log('✅ Todos os dados estão consistentes');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar discrepâncias:', error);
  }
};

// Função para verificar disponibilidade do Supabase
window.checkSupabaseAccess = () => {
  console.log('🔍 VERIFICANDO ACESSO AO SUPABASE');
  console.log('=================================');
  
  console.log('window.db:', !!window.db);
  console.log('window.supabase:', !!window.supabase);
  console.log('global supabase:', typeof supabase !== 'undefined');
  
  // Tentar acessar via diferentes métodos
  const methods = [];
  if (window.db) methods.push('window.db');
  if (window.supabase) methods.push('window.supabase');
  if (typeof supabase !== 'undefined') methods.push('global supabase');
  
  console.log('✅ Métodos disponíveis:', methods);
  
  if (methods.length === 0) {
    console.log('❌ Nenhum método de acesso ao Supabase encontrado');
    console.log('💡 Tente: Object.keys(window).filter(k => k.includes("supabase") || k.includes("db"))');
  }
  
  return methods;
};

console.log('\n🛠️ FUNÇÕES DISPONÍVEIS:');
console.log('• testAddXP() - Testar adição de XP manualmente');
console.log('• checkCurrentState() - Verificar estado atual dos stores');
console.log('• forcSync() - Forçar sincronização com Supabase');
console.log('• testPersistence() - Simular reload e testar persistência');
console.log('• checkDiscrepancies() - Verificar discrepâncias entre dados');
console.log('• checkSupabaseAccess() - Verificar acesso ao Supabase');
