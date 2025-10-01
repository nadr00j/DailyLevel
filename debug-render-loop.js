// Script para identificar EXATAMENTE o que está causando re-renders constantes
// Execute no console do navegador

console.log('🎯 DEBUG DE RE-RENDERS CONSTANTES');
console.log('=================================');

let renderCount = 0;
let hookChanges = 0;
let performanceRenders = 0;

// Interceptar console.log para capturar logs específicos
const originalLog = console.log;

console.log = function(...args) {
  const message = args.join(' ');
  
  // Contar re-renders do PerformanceReports
  if (message.includes('[PERFORMANCE RENDER]')) {
    performanceRenders++;
    console.error(`🔴 PERFORMANCE RENDER #${performanceRenders}: ${message}`);
  }
  
  // Contar mudanças nos hooks
  if (message.includes('[HOOK CHANGES]')) {
    hookChanges++;
    console.error(`🔴 HOOK CHANGE #${hookChanges}: ${message}`);
  }
  
  // Contar outros re-renders
  if (message.includes('[RENDER DEBUG]') || message.includes('[DROPDOWN DEBUG]') || message.includes('[DAYS DEBUG]')) {
    renderCount++;
    console.error(`🔴 OTHER RENDER #${renderCount}: ${message}`);
  }
  
  // Chamar console.log original
  originalLog.apply(console, args);
};

// Monitorar por 10 segundos
console.log('\n🔍 MONITORANDO POR 10 SEGUNDOS...');
console.log('Vá para a aba "Relatórios" e observe os logs');

const startTime = Date.now();

setTimeout(() => {
  // Restaurar console
  console.log = originalLog;
  
  console.log('\n🎯 RESULTADO DA ANÁLISE:');
  console.log('========================');
  
  console.log(`📊 CONTADORES:`);
  console.log(`Performance Renders: ${performanceRenders}`);
  console.log(`Hook Changes: ${hookChanges}`);
  console.log(`Other Renders: ${renderCount}`);
  
  // Análise detalhada
  console.log('\n🔍 DIAGNÓSTICO:');
  
  if (performanceRenders > 20) {
    console.error('❌ PROBLEMA CRÍTICO: PerformanceReports re-renderizando constantemente!');
    console.error('🔧 CAUSA PROVÁVEL: Algum hook ou state mudando constantemente');
    
    if (hookChanges > 15) {
      console.error('❌ CONFIRMADO: Hooks (xp/history) mudando constantemente');
      console.error('🔧 SOLUÇÃO: Verificar por que xp ou history estão mudando');
    } else {
      console.error('❌ OUTRO PROBLEMA: Re-renders sem mudanças nos hooks principais');
      console.error('🔧 SOLUÇÃO: Verificar outros hooks (useGoals, useTasks, useHabits)');
    }
  } else if (performanceRenders > 5) {
    console.warn('⚠️ Re-renders moderados detectados');
  } else {
    console.log('✅ Re-renders controlados');
  }
  
  // Próximos passos
  console.log('\n💡 PRÓXIMOS PASSOS:');
  
  if (performanceRenders > 20) {
    console.log('1. 🔍 Verificar se algum useEffect tem dependências instáveis');
    console.log('2. 🔍 Verificar se hooks estão retornando novas referências');
    console.log('3. 🔍 Verificar se stores estão mudando constantemente');
    console.log('4. 🔧 Adicionar React.memo() ao PerformanceReports');
  }
  
  // Teste adicional: verificar se é específico da página de relatórios
  console.log('\n🧪 TESTE ADICIONAL:');
  console.log('Navegue para outra página e veja se os re-renders param');
  console.log('Se pararem, o problema é específico do PerformanceReports');
  console.log('Se continuarem, o problema é global (stores/hooks)');
  
}, 10000);

console.log('✨ Análise iniciada! Aguarde 10 segundos...');
