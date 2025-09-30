// ===========================================
// 🔧 CORRIGIR HISTÓRICO CORROMPIDO
// ===========================================

console.clear();
console.log('🔧 ===== CORRIGINDO HISTÓRICO CORROMPIDO =====');

// Função para corrigir dados do histórico
window.fixCorruptedHistory = () => {
  console.log('🔧 INICIANDO CORREÇÃO DO HISTÓRICO');
  console.log('==================================');
  
  const gamificationStore = window.useGamificationStoreV21.getState();
  const history = gamificationStore.history || [];
  
  console.log('📊 Estado atual do histórico:', {
    totalItems: history.length,
    itemsWithNaN: history.filter(item => isNaN(item.ts)).length,
    first3Items: history.slice(0, 3)
  });
  
  // Filtrar itens corrompidos
  const validHistory = history.filter(item => {
    const hasValidTimestamp = item.ts && !isNaN(item.ts) && item.ts > 0;
    if (!hasValidTimestamp) {
      console.warn('🗑️ Removendo item corrompido:', item);
    }
    return hasValidTimestamp;
  });
  
  console.log('✅ Histórico filtrado:', {
    originalLength: history.length,
    validLength: validHistory.length,
    removedItems: history.length - validHistory.length
  });
  
  // Atualizar store
  if (validHistory.length !== history.length) {
    window.useGamificationStoreV21.setState({ history: validHistory });
    console.log('✅ Store atualizado com histórico limpo');
  } else {
    console.log('ℹ️ Nenhum item corrompido encontrado');
  }
  
  return {
    original: history.length,
    valid: validHistory.length,
    removed: history.length - validHistory.length
  };
};

// Função para forçar reload de dados limpos
window.forceCleanReload = async () => {
  console.log('🔄 FORÇANDO RELOAD LIMPO');
  console.log('========================');
  
  try {
    const authStore = window.useAuthStore.getState();
    const userId = authStore.user?.id;
    
    if (!userId) {
      console.error('❌ Usuário não autenticado');
      return;
    }
    
    console.log('🧹 Limpando store local...');
    window.useGamificationStoreV21.setState({ 
      history: [],
      xp: 0,
      coins: 0 
    });
    
    console.log('🔄 Recarregando dados do Supabase...');
    if (window.dataSyncService && window.dataSyncService.loadAll) {
      await window.dataSyncService.loadAll(userId);
      console.log('✅ Dados recarregados');
    } else {
      console.error('❌ DataSyncService não acessível');
    }
    
  } catch (error) {
    console.error('❌ Erro no reload limpo:', error);
  }
};

// Executar correção automaticamente
console.log('🚀 Executando correção automática...');
const result = window.fixCorruptedHistory();

console.log('\n📊 RESULTADO DA CORREÇÃO:', result);

if (result.removed > 0) {
  console.log('⚠️ Itens corrompidos foram removidos do store local');
  console.log('💡 Para uma limpeza completa, execute: forceCleanReload()');
} else {
  console.log('✅ Histórico estava limpo');
}

console.log('\n🛠️ FUNÇÕES DISPONÍVEIS:');
console.log('• fixCorruptedHistory() - Limpar itens corrompidos do store');
console.log('• forceCleanReload() - Recarregar dados limpos do Supabase');
