// Script para debugar problemas de performance e loops
// Execute no console do navegador

console.log('🔍 DIAGNÓSTICO DE PERFORMANCE - DailyLevel V2');
console.log('================================================');

// 1. Verificar se o erro de UUID foi corrigido
console.log('\n1️⃣ TESTANDO CORREÇÃO DE UUID VAZIO:');
try {
  const gamificationStore = useGamificationStoreV21.getState();
  console.log('✅ UserId no store:', gamificationStore.userId);
  
  if (!gamificationStore.userId || gamificationStore.userId === 'undefined') {
    console.error('❌ PROBLEMA: userId ainda está inválido!');
  } else {
    console.log('✅ UserId válido encontrado');
  }
} catch (error) {
  console.error('❌ Erro ao acessar gamification store:', error);
}

// 2. Verificar se valores decimais estão sendo convertidos para integer
console.log('\n2️⃣ TESTANDO CONVERSÃO DE DECIMAIS:');
try {
  const testData = {
    userId: 'test-user',
    xp: 123.7,
    coins: 45.3,
    vitality: 57.5, // Este era o problema!
    xp30d: 89.2,
    str: 12.8,
    int: 15.4,
    cre: 8.9,
    soc: 11.1
  };
  
  console.log('Dados originais:', testData);
  console.log('Vitality original (problemático):', testData.vitality, typeof testData.vitality);
  
  // Simular a conversão que agora acontece em toGamificationDb
  const convertedData = {
    ...testData,
    xp: Math.round(testData.xp),
    coins: Math.round(testData.coins),
    vitality: Math.round(testData.vitality), // CORRIGIDO
    xp30d: Math.round(testData.xp30d),
    str: Math.round(testData.str),
    int: Math.round(testData.int),
    cre: Math.round(testData.cre),
    soc: Math.round(testData.soc)
  };
  
  console.log('✅ Dados convertidos:', convertedData);
  console.log('✅ Vitality convertido:', convertedData.vitality, typeof convertedData.vitality);
  
} catch (error) {
  console.error('❌ Erro no teste de conversão:', error);
}

// 3. Monitorar re-renders por 10 segundos
console.log('\n3️⃣ MONITORANDO RE-RENDERS (10 segundos):');
let renderCount = 0;
let lastHistoryLength = 0;
let lastXP = 0;

const gamificationStore = useGamificationStoreV21;
const initialState = gamificationStore.getState();
lastHistoryLength = initialState.history.length;
lastXP = initialState.xp;

console.log('Estado inicial:', {
  xp: initialState.xp,
  coins: initialState.coins,
  vitality: initialState.vitality,
  historyLength: initialState.history.length
});

const unsubscribe = gamificationStore.subscribe((state) => {
  renderCount++;
  
  const hasRealChanges = (
    state.xp !== lastXP || 
    state.history.length !== lastHistoryLength
  );
  
  if (hasRealChanges) {
    console.log(`🔄 Mudança REAL detectada (render #${renderCount}):`, {
      xp: `${lastXP} → ${state.xp}`,
      historyLength: `${lastHistoryLength} → ${state.history.length}`
    });
    
    lastXP = state.xp;
    lastHistoryLength = state.history.length;
  } else {
    console.warn(`⚠️ Re-render SEM mudanças reais (render #${renderCount})`);
  }
});

// Parar monitoramento após 10 segundos
setTimeout(() => {
  unsubscribe();
  console.log(`\n📊 RESULTADO DO MONITORAMENTO:`);
  console.log(`Total de re-renders em 10s: ${renderCount}`);
  
  if (renderCount > 20) {
    console.error('❌ PROBLEMA: Muitos re-renders detectados! Ainda há loops.');
  } else if (renderCount > 5) {
    console.warn('⚠️ ATENÇÃO: Re-renders moderados. Pode ser normal dependendo da atividade.');
  } else {
    console.log('✅ ÓTIMO: Poucos re-renders. Performance melhorada!');
  }
}, 10000);

// 4. Verificar se há erros no console
console.log('\n4️⃣ VERIFICANDO ERROS RECENTES:');
console.log('Monitore o console por 30 segundos para ver se aparecem erros de:');
console.log('- "invalid input syntax for type uuid"');
console.log('- "invalid input syntax for type integer"');
console.log('- Loops de sincronização');
console.log('- Re-renders excessivos');

console.log('\n✨ DIAGNÓSTICO INICIADO - Monitore os logs acima!');
