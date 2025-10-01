// Script para identificar EXATAMENTE qual hook está causando re-renders
// Execute no console do navegador

console.log('🎯 IDENTIFICANDO O HOOK CULPADO');
console.log('==============================');

let renderCount = 0;
let hookChanges = {};
let suspiciousHookChanges = {};

// Interceptar console.log para capturar logs específicos
const originalLog = console.log;

console.log = function(...args) {
  const message = args.join(' ');
  
  // Contar re-renders do PerformanceReports
  if (message.includes('[PERFORMANCE RENDER]')) {
    renderCount++;
    if (renderCount <= 5) {
      console.error(`🔴 RENDER #${renderCount}: ${message}`);
    }
  }
  
  // Contar mudanças nos hooks principais
  if (message.includes('[HOOK CHANGE]')) {
    const hookName = message.match(/\[HOOK CHANGE\] (\w+) mudou:/)?.[1];
    if (hookName) {
      hookChanges[hookName] = (hookChanges[hookName] || 0) + 1;
      if (hookChanges[hookName] <= 3) {
        console.error(`🔴 HOOK CHANGE: ${hookName} mudou ${hookChanges[hookName]}x - ${message}`);
      }
    }
  }
  
  // Contar mudanças nos hooks suspeitos
  if (message.includes('[SUSPICIOUS HOOK]')) {
    const hookName = message.match(/\[SUSPICIOUS HOOK\] (\w+) mudou:/)?.[1];
    if (hookName) {
      suspiciousHookChanges[hookName] = (suspiciousHookChanges[hookName] || 0) + 1;
      if (suspiciousHookChanges[hookName] <= 3) {
        console.error(`🔴 SUSPICIOUS HOOK: ${hookName} mudou ${suspiciousHookChanges[hookName]}x - ${message}`);
      }
    }
  }
  
  // Chamar console.log original
  originalLog.apply(console, args);
};

// Monitorar por 5 segundos
console.log('\n🔍 MONITORANDO POR 5 SEGUNDOS...');
console.log('Fique na aba "Relatórios" e observe os logs');

setTimeout(() => {
  // Restaurar console
  console.log = originalLog;
  
  console.log('\n🎯 RESULTADO DA INVESTIGAÇÃO:');
  console.log('=============================');
  
  console.log(`📊 CONTADORES:`);
  console.log(`Total de Re-renders: ${renderCount}`);
  console.log(`Mudanças em Hooks Principais:`, hookChanges);
  console.log(`Mudanças em Hooks Suspeitos:`, suspiciousHookChanges);
  
  // Análise detalhada
  console.log('\n🔍 ANÁLISE DO CULPADO:');
  
  // Identificar o hook que mais muda
  const allHookChanges = { ...hookChanges, ...suspiciousHookChanges };
  const sortedHooks = Object.entries(allHookChanges)
    .sort(([,a], [,b]) => b - a);
  
  if (sortedHooks.length > 0) {
    const [culpritHook, changeCount] = sortedHooks[0];
    console.log(`🎯 HOOK CULPADO: "${culpritHook}" mudou ${changeCount} vezes!`);
    
    if (culpritHook.includes('Length')) {
      console.log(`🔧 SOLUÇÃO: O hook "${culpritHook}" está retornando arrays com novas referências`);
      console.log(`   → Verificar se o hook está usando useMemo() corretamente`);
      console.log(`   → Verificar se as dependências do useMemo() são estáveis`);
    } else if (culpritHook === 'renderKey') {
      console.log(`🔧 SOLUÇÃO: O "renderKey" está mudando constantemente`);
      console.log(`   → Remover ou corrigir o useEffect que força re-renders`);
    } else if (culpritHook === 'activePeriod' || culpritHook === 'activeTab') {
      console.log(`🔧 SOLUÇÃO: State "${culpritHook}" está mudando constantemente`);
      console.log(`   → Verificar se algum useEffect está alterando este state em loop`);
    } else {
      console.log(`🔧 SOLUÇÃO: Investigar por que "${culpritHook}" está mudando`);
    }
  } else {
    console.log(`❓ NENHUM HOOK ESPECÍFICO IDENTIFICADO`);
    console.log(`🔧 POSSÍVEIS CAUSAS:`);
    console.log(`   → Algum useEffect sem dependências corretas`);
    console.log(`   → Componente pai re-renderizando constantemente`);
    console.log(`   → Context provider mudando constantemente`);
  }
  
  // Recomendações
  console.log('\n💡 PRÓXIMOS PASSOS:');
  
  if (renderCount > 20) {
    console.log('1. 🚨 URGENTE: Aplicar React.memo() ao PerformanceReports');
    console.log('2. 🔧 Corrigir o hook culpado identificado acima');
    console.log('3. 🔍 Verificar se o componente pai está causando re-renders');
  } else {
    console.log('✅ Re-renders controlados, problema pode estar resolvido');
  }
  
  // Teste de navegação
  console.log('\n🧪 TESTE DE NAVEGAÇÃO:');
  console.log('Agora navegue para outra página (ex: Tarefas)');
  console.log('Se os re-renders pararem, o problema é específico do PerformanceReports');
  
}, 5000);

console.log('✨ Investigação iniciada! Aguarde 5 segundos...');
