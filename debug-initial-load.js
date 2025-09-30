// ===========================================
// 🔍 DEBUG: PROCESSO DE CARREGAMENTO INICIAL
// ===========================================

console.clear();
console.log('🔍 ===== DIAGNOSTICANDO CARREGAMENTO INICIAL =====');

// Interceptar todas as chamadas do DataSyncService
const originalConsoleLog = console.log;
let loadingLogs = [];

// Função para capturar logs específicos do carregamento
const captureLoadingLogs = () => {
  console.log = function(...args) {
    const message = args.join(' ');
    if (message.includes('DataSyncService') || message.includes('Gamification') || message.includes('syncFromSupabase')) {
      loadingLogs.push({
        timestamp: new Date().toISOString(),
        message: message,
        args: args
      });
    }
    originalConsoleLog.apply(console, args);
  };
};

// Função para parar captura e mostrar logs
const showLoadingLogs = () => {
  console.log = originalConsoleLog;
  console.log('\n📋 LOGS CAPTURADOS DO CARREGAMENTO:');
  console.log('==================================');
  
  loadingLogs.forEach((log, index) => {
    console.log(`${index + 1}. [${log.timestamp.split('T')[1].split('.')[0]}] ${log.message}`);
  });
  
  return loadingLogs;
};

// Função para verificar estado em cada etapa do carregamento
window.debugLoadingSteps = async () => {
  console.log('🔍 MONITORANDO CARREGAMENTO PASSO A PASSO');
  console.log('========================================');
  
  const authStore = window.useAuthStore.getState();
  const userId = authStore.user?.id;
  
  if (!userId) {
    console.error('❌ Usuário não autenticado');
    return;
  }
  
  // Passo 1: Estado antes de qualquer carregamento
  const initialState = window.useGamificationStoreV21.getState();
  console.log('📊 PASSO 1 - Estado inicial do store:', {
    xp: initialState.xp,
    coins: initialState.coins,
    userId: initialState.userId,
    historyLength: initialState.history?.length || 0
  });
  
  // Passo 2: Verificar dados no Supabase ANTES do carregamento
  console.log('\n📊 PASSO 2 - Consultando Supabase diretamente...');
  try {
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
        }
      };
    }
    
    if (db) {
      const supabaseData = await db.getGamificationData(userId);
      console.log('💾 Dados no Supabase user_gamification:', {
        xp: supabaseData?.xp || 0,
        coins: supabaseData?.coins || 0,
        vitality: supabaseData?.vitality || 0,
        updated_at: supabaseData?.updated_at
      });
      
      // Verificar se os dados do Supabase estão corretos
      if (supabaseData?.xp === 970 && supabaseData?.coins === 97) {
        console.log('✅ Dados corretos estão no Supabase!');
      } else {
        console.log('🚨 PROBLEMA: Dados no Supabase estão incorretos!');
        console.log('   Esperado: XP=970, Coins=97');
        console.log('   Encontrado:', { xp: supabaseData?.xp, coins: supabaseData?.coins });
      }
    }
  } catch (error) {
    console.error('❌ Erro ao consultar Supabase:', error);
  }
  
  // Passo 3: Iniciar captura de logs
  console.log('\n📊 PASSO 3 - Iniciando captura de logs...');
  captureLoadingLogs();
  loadingLogs = []; // Reset logs
  
  // Passo 4: Forçar carregamento via DataSyncService
  console.log('\n📊 PASSO 4 - Forçando carregamento via DataSyncService...');
  try {
    if (window.dataSyncService && window.dataSyncService.loadAll) {
      await window.dataSyncService.loadAll(userId);
      console.log('✅ DataSyncService.loadAll concluído');
    } else {
      console.error('❌ DataSyncService não acessível');
    }
  } catch (error) {
    console.error('❌ Erro no DataSyncService.loadAll:', error);
  }
  
  // Passo 5: Estado após carregamento
  const afterLoadState = window.useGamificationStoreV21.getState();
  console.log('\n📊 PASSO 5 - Estado após carregamento:', {
    xp: afterLoadState.xp,
    coins: afterLoadState.coins,
    userId: afterLoadState.userId,
    historyLength: afterLoadState.history?.length || 0
  });
  
  // Passo 6: Mostrar logs capturados
  console.log('\n📊 PASSO 6 - Análise dos logs...');
  const logs = showLoadingLogs();
  
  // Análise final
  console.log('\n🎯 ANÁLISE FINAL:');
  console.log('================');
  
  const wasDataLoaded = afterLoadState.xp !== initialState.xp || afterLoadState.coins !== initialState.coins;
  
  if (wasDataLoaded) {
    console.log('✅ Dados foram carregados com sucesso');
    if (afterLoadState.xp === 970 && afterLoadState.coins === 97) {
      console.log('✅ Dados carregados estão corretos');
    } else {
      console.log('⚠️ Dados carregados estão incorretos');
      console.log('   Esperado: XP=970, Coins=97');
      console.log('   Carregado:', { xp: afterLoadState.xp, coins: afterLoadState.coins });
    }
  } else {
    console.log('🚨 PROBLEMA: Nenhum dado foi carregado!');
    
    // Analisar logs para encontrar o problema
    const hasDataSyncLogs = logs.some(log => log.message.includes('DataSyncService.loadAll'));
    const hasSyncFromSupabaseLogs = logs.some(log => log.message.includes('syncFromSupabase'));
    const hasReconciledLogs = logs.some(log => log.message.includes('reconciliados'));
    
    console.log('🔍 Análise dos logs:');
    console.log('   • DataSyncService executou?', hasDataSyncLogs ? '✅' : '❌');
    console.log('   • syncFromSupabase executou?', hasSyncFromSupabaseLogs ? '✅' : '❌');
    console.log('   • Reconciliação executou?', hasReconciledLogs ? '✅' : '❌');
    
    if (!hasDataSyncLogs) {
      console.log('💡 CAUSA PROVÁVEL: DataSyncService.loadAll não foi executado');
    } else if (!hasSyncFromSupabaseLogs) {
      console.log('💡 CAUSA PROVÁVEL: syncFromSupabase não foi executado');
    } else if (!hasReconciledLogs) {
      console.log('💡 CAUSA PROVÁVEL: Dados do Supabase estão zerados, mas reconciliação falhou');
    }
  }
  
  return {
    initial: { xp: initialState.xp, coins: initialState.coins },
    final: { xp: afterLoadState.xp, coins: afterLoadState.coins },
    dataLoaded: wasDataLoaded,
    logs: logs
  };
};

console.log('\n🛠️ FUNÇÃO DISPONÍVEL:');
console.log('• debugLoadingSteps() - Monitorar processo de carregamento completo');
console.log('\n🚀 Para usar: execute debugLoadingSteps() após recarregar a página');
