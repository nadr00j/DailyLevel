// 🧪 TESTE COMPLETO DO SISTEMA DE VITALIDADE V2.1
// Execute este script no console do navegador para verificar se tudo está funcionando

console.log('🧪 INICIANDO TESTE DO SISTEMA DE VITALIDADE V2.1');
console.log('='.repeat(60));

// Função para aguardar um tempo
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Função para verificar estado atual
function checkVitalityState() {
  console.log('\n📊 ESTADO ATUAL DA VITALIDADE:');
  
  // Verificar useVitalityV21
  try {
    const vitalityHook = window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.ReactCurrentOwner?.current;
    console.log('⚠️ useVitalityV21 não pode ser acessado diretamente do console');
  } catch (error) {
    console.log('⚠️ useVitalityV21 não acessível:', error.message);
  }
  
  // Verificar useGamificationStoreV21
  try {
    const gamificationStore = useGamificationStoreV21?.getState();
    if (gamificationStore) {
      console.log('✅ useGamificationStoreV21:', {
        xp: gamificationStore.xp,
        coins: gamificationStore.coins,
        vitality: gamificationStore.vitality,
        mood: gamificationStore.mood,
        userId: gamificationStore.userId
      });
    } else {
      console.log('❌ useGamificationStoreV21 não encontrado');
    }
  } catch (error) {
    console.log('❌ Erro ao acessar useGamificationStoreV21:', error.message);
  }
  
  // Verificar localStorage
  try {
    const quickStats = localStorage.getItem('dl-quick-stats');
    if (quickStats) {
      const data = JSON.parse(quickStats);
      console.log('✅ localStorage (dl-quick-stats):', data);
    } else {
      console.log('⚠️ localStorage (dl-quick-stats) vazio');
    }
  } catch (error) {
    console.log('❌ Erro ao acessar localStorage:', error.message);
  }
}

// Função para testar Supabase
async function checkSupabaseVitality() {
  console.log('\n🔍 VERIFICANDO SUPABASE:');
  
  try {
    // Tentar acessar db
    let db = window.db;
    if (!db && window.supabase) {
      console.log('⚠️ window.db não encontrado, tentando window.supabase...');
      db = {
        async getGamificationData(userId) {
          const { data, error } = await window.supabase
            .from('user_gamification')
            .select('*')
            .eq('user_id', userId)
            .single();
          return { data, error };
        }
      };
    }
    
    if (!db) {
      console.log('❌ Nem window.db nem window.supabase encontrados');
      return;
    }
    
    // Obter userId
    const authStore = useAuthStore?.getState();
    const userId = authStore?.user?.id;
    
    if (!userId) {
      console.log('❌ userId não encontrado');
      return;
    }
    
    console.log('✅ userId encontrado:', userId);
    
    // Verificar user_gamification
    const gamificationResult = await db.getGamificationData(userId);
    if (gamificationResult.error) {
      console.log('❌ Erro ao buscar user_gamification:', gamificationResult.error);
    } else {
      console.log('✅ user_gamification:', gamificationResult.data);
    }
    
    // Verificar user_vitality_state
    if (window.supabase) {
      const { data: vitalityData, error: vitalityError } = await window.supabase
        .from('user_vitality_state')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (vitalityError) {
        console.log('❌ Erro ao buscar user_vitality_state:', vitalityError);
      } else {
        console.log('✅ user_vitality_state:', vitalityData);
      }
      
      // Verificar vitality_event_log (últimos 5 eventos)
      const { data: eventData, error: eventError } = await window.supabase
        .from('vitality_event_log')
        .select('*')
        .eq('user_id', userId)
        .order('applied_at', { ascending: false })
        .limit(5);
        
      if (eventError) {
        console.log('❌ Erro ao buscar vitality_event_log:', eventError);
      } else {
        console.log('✅ vitality_event_log (últimos 5):', eventData);
      }
    }
    
  } catch (error) {
    console.log('❌ Erro ao verificar Supabase:', error);
  }
}

// Função para testar aplicação de evento
async function testVitalityEvent() {
  console.log('\n🧪 TESTANDO APLICAÇÃO DE EVENTO DE VITALIDADE:');
  
  try {
    // Verificar se há RPC disponível
    if (!window.supabase) {
      console.log('❌ window.supabase não disponível');
      return;
    }
    
    const authStore = useAuthStore?.getState();
    const userId = authStore?.user?.id;
    
    if (!userId) {
      console.log('❌ userId não encontrado');
      return;
    }
    
    // Gerar evento único
    const eventId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('🔄 Aplicando evento de teste:', eventId);
    
    // Chamar RPC vitality_apply_event
    const { data, error } = await window.supabase.rpc('vitality_apply_event', {
      p_user: userId,
      p_event_id: eventId,
      p_type: 'HABIT_DONE',
      p_payload: JSON.stringify({
        type: 'habit',
        habitId: 'test-habit',
        habitName: 'Teste de Vitalidade'
      }),
      p_expected_version: 0 // Usar 0 para ignorar verificação de versão no teste
    });
    
    if (error) {
      console.log('❌ Erro ao aplicar evento:', error);
    } else {
      console.log('✅ Evento aplicado com sucesso:', data);
      
      // Aguardar um pouco e verificar novamente
      await wait(1000);
      await checkSupabaseVitality();
    }
    
  } catch (error) {
    console.log('❌ Erro ao testar evento:', error);
  }
}

// Função principal de teste
async function runVitalityTest() {
  console.log('🚀 EXECUTANDO TESTE COMPLETO...\n');
  
  // Fase 1: Estado atual
  console.log('📋 FASE 1: VERIFICAÇÃO DO ESTADO ATUAL');
  checkVitalityState();
  
  await wait(2000);
  
  // Fase 2: Supabase
  console.log('\n📋 FASE 2: VERIFICAÇÃO DO SUPABASE');
  await checkSupabaseVitality();
  
  await wait(2000);
  
  // Fase 3: Teste de evento
  console.log('\n📋 FASE 3: TESTE DE APLICAÇÃO DE EVENTO');
  await testVitalityEvent();
  
  console.log('\n✅ TESTE COMPLETO FINALIZADO!');
  console.log('='.repeat(60));
}

// Funções auxiliares para uso manual
window.checkVitalityState = checkVitalityState;
window.checkSupabaseVitality = checkSupabaseVitality;
window.testVitalityEvent = testVitalityEvent;
window.runVitalityTest = runVitalityTest;

console.log('\n🎯 FUNÇÕES DISPONÍVEIS:');
console.log('- checkVitalityState() - Verificar estado atual');
console.log('- checkSupabaseVitality() - Verificar dados no Supabase');
console.log('- testVitalityEvent() - Testar aplicação de evento');
console.log('- runVitalityTest() - Executar teste completo');

console.log('\n🚀 Para executar o teste completo, digite: runVitalityTest()');
