// ===========================================
// 🔍 DEBUG: PROBLEMA DE RESET NO RELOAD
// ===========================================

console.clear();
console.log('🔍 ===== DIAGNOSTICANDO RESET NO RELOAD =====');

// Função para aguardar um tempo
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Função principal de diagnóstico
async function debugReloadIssue() {
  console.log('\n📋 FASE 1: ESTADO IMEDIATAMENTE APÓS RELOAD');
  console.log('=============================================');

  // 1. Verificar estado inicial dos stores
  const gamificationStore = window.useGamificationStoreV21?.getState?.();
  const authStore = window.useAuthStore?.getState?.();

  if (!gamificationStore || !authStore) {
    console.error('❌ Stores não disponíveis ainda');
    return;
  }

  console.log('🎮 Estado inicial do Gamification Store:', {
    userId: gamificationStore.userId,
    xp: gamificationStore.xp,
    coins: gamificationStore.coins,
    vitality: gamificationStore.vitality,
    historyLength: gamificationStore.history?.length || 0
  });

  console.log('🔐 Estado do Auth Store:', {
    isAuthenticated: authStore.isAuthenticated,
    userId: authStore.user?.id,
    isLoading: authStore.isLoading
  });

  console.log('\n📋 FASE 2: VERIFICAR DADOS NO SUPABASE');
  console.log('=====================================');

  // 2. Verificar dados no Supabase ANTES de qualquer sincronização
  try {
    // Criar client Supabase
    let db = null;
    if (typeof supabase !== 'undefined') {
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
            .order('created_at', { ascending: false })
            .limit(10);
          return error ? [] : data;
        }
      };
    }

    if (db && authStore.user?.id) {
      const userId = authStore.user.id;
      
      console.log('🔍 Consultando Supabase diretamente...');
      const supabaseGamification = await db.getGamificationData(userId);
      const recentHistory = await db.getHistoryItems(userId);
      
      console.log('💾 Dados na tabela user_gamification:', {
        xp: supabaseGamification?.xp || 0,
        coins: supabaseGamification?.coins || 0,
        vitality: supabaseGamification?.vitality || 0,
        updated_at: supabaseGamification?.updated_at
      });

      console.log('📜 Últimos 3 itens do history_items:', 
        recentHistory.slice(0, 3).map(item => ({
          type: item.type,
          xp: item.xp,
          coins: item.coins,
          created_at: item.created_at,
          tags: item.tags
        }))
      );

      // Calcular XP total do histórico
      const totalXPFromHistory = recentHistory.reduce((sum, item) => sum + (item.xp || 0), 0);
      const totalCoinsFromHistory = recentHistory.reduce((sum, item) => sum + (item.coins || 0), 0);
      
      console.log('🧮 Calculado do history_items (últimos 10):', {
        totalXP: totalXPFromHistory,
        totalCoins: totalCoinsFromHistory
      });

      // Identificar discrepância
      const discrepancy = {
        localVsSupabase: {
          xp: gamificationStore.xp !== (supabaseGamification?.xp || 0),
          coins: gamificationStore.coins !== (supabaseGamification?.coins || 0)
        },
        supabaseVsHistory: {
          xp: (supabaseGamification?.xp || 0) !== totalXPFromHistory,
          coins: (supabaseGamification?.coins || 0) !== totalCoinsFromHistory
        }
      };

      console.log('⚠️ Análise de Discrepâncias:', discrepancy);

      if (discrepancy.localVsSupabase.xp || discrepancy.localVsSupabase.coins) {
        console.log('🚨 PROBLEMA 1: Local Store ≠ Supabase user_gamification');
        console.log('   → Store local pode estar carregando dados zerados');
      }

      if (discrepancy.supabaseVsHistory.xp || discrepancy.supabaseVsHistory.coins) {
        console.log('🚨 PROBLEMA 2: Supabase user_gamification ≠ history_items');
        console.log('   → addXp pode não estar salvando na user_gamification');
      }

    } else {
      console.log('⚠️ Não foi possível acessar Supabase ou usuário não autenticado');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar Supabase:', error);
  }

  console.log('\n📋 FASE 3: AGUARDAR CARREGAMENTO AUTOMÁTICO');
  console.log('============================================');

  console.log('⏳ Aguardando 5 segundos para DataSyncService.loadAll...');
  await wait(5000);

  // 3. Verificar estado após carregamento automático
  const storeAfterLoad = window.useGamificationStoreV21.getState();
  console.log('🎮 Estado após carregamento automático:', {
    userId: storeAfterLoad.userId,
    xp: storeAfterLoad.xp,
    coins: storeAfterLoad.coins,
    vitality: storeAfterLoad.vitality,
    historyLength: storeAfterLoad.history?.length || 0
  });

  // Comparar antes/depois
  const changed = {
    xp: gamificationStore.xp !== storeAfterLoad.xp,
    coins: gamificationStore.coins !== storeAfterLoad.coins,
    history: (gamificationStore.history?.length || 0) !== (storeAfterLoad.history?.length || 0)
  };

  console.log('🔄 Mudanças após carregamento:', changed);

  if (!changed.xp && !changed.coins && storeAfterLoad.xp === 0) {
    console.log('🚨 CONFIRMADO: Dados não foram carregados do Supabase!');
    console.log('💡 Possíveis causas:');
    console.log('   1. DataSyncService.loadAll não foi executado');
    console.log('   2. Dados do Supabase estão zerados');
    console.log('   3. syncFromSupabase não está funcionando');
    console.log('   4. Problema na reconciliação de dados');
  }

  console.log('\n🎯 ===== DIAGNÓSTICO CONCLUÍDO =====');
  
  return {
    initialStore: {
      xp: gamificationStore.xp,
      coins: gamificationStore.coins,
      historyLength: gamificationStore.history?.length || 0
    },
    finalStore: {
      xp: storeAfterLoad.xp,
      coins: storeAfterLoad.coins,
      historyLength: storeAfterLoad.history?.length || 0
    },
    changedAfterLoad: changed
  };
}

// Executar diagnóstico
debugReloadIssue()
  .then(result => {
    console.log('\n📊 RESUMO DO DIAGNÓSTICO:', result);
  })
  .catch(error => {
    console.error('❌ ERRO NO DIAGNÓSTICO:', error);
  });

// ===========================================
// 🛠️ FUNÇÕES AUXILIARES PARA INVESTIGAÇÃO
// ===========================================

// Função para forçar reconciliação
window.forceReconciliation = async () => {
  console.log('🔧 FORÇANDO RECONCILIAÇÃO');
  console.log('=========================');
  
  const authStore = window.useAuthStore.getState();
  const userId = authStore.user?.id;
  
  if (!userId) {
    console.error('❌ Usuário não autenticado');
    return;
  }

  try {
    console.log('🔄 Chamando DataSyncService.reconcileFromHistory...');
    // Tentar acessar o método diretamente
    if (window.dataSyncService && window.dataSyncService.reconcileFromHistory) {
      await window.dataSyncService.reconcileFromHistory(userId);
      console.log('✅ Reconciliação concluída');
      
      // Verificar resultado
      const store = window.useGamificationStoreV21.getState();
      console.log('📊 Estado após reconciliação:', {
        xp: store.xp,
        coins: store.coins
      });
    } else {
      console.error('❌ DataSyncService.reconcileFromHistory não acessível');
    }
  } catch (error) {
    console.error('❌ Erro na reconciliação forçada:', error);
  }
};

// Função para verificar se DataSyncService foi executado
window.checkDataSyncExecution = () => {
  console.log('🔍 VERIFICANDO EXECUÇÃO DO DATASYNCSERVICE');
  console.log('==========================================');
  
  // Verificar logs recentes no console
  console.log('💡 Procure nos logs do console por:');
  console.log('   • "[App] Chamando dataSyncService.loadAll"');
  console.log('   • "DataSyncService.loadAll - Iniciando carregamento"');
  console.log('   • "DataSyncService.loadAll - Dados reconciliados"');
  console.log('   • "Gamification] Sincronizando dados do Supabase"');
  
  // Verificar estado atual
  const authStore = window.useAuthStore.getState();
  console.log('🔐 Condições para DataSync:', {
    isAuthenticated: authStore.isAuthenticated,
    hasUserId: !!authStore.user?.id,
    userIdValid: authStore.user?.id && authStore.user.id !== 'undefined',
    isLoading: authStore.isLoading
  });
};

console.log('\n🛠️ FUNÇÕES ADICIONAIS:');
console.log('• forceReconciliation() - Forçar reconciliação dos dados');
console.log('• checkDataSyncExecution() - Verificar se DataSync foi executado');
