// Script para debugar a "epilepsia" das categorias
// Execute no console do navegador

console.log('🔍 DIAGNÓSTICO DA EPILEPSIA DAS CATEGORIAS');
console.log('==========================================');

let renderCount = 0;
let lastCacheKey = null;
let cacheKeyChanges = 0;

// Interceptar console.log para capturar logs de categoria
const originalLog = console.log;
console.log = function(...args) {
  const message = args.join(' ');
  
  // Detectar logs de categoria
  if (message.includes('[Category Cache]') || message.includes('[Category Debug]')) {
    renderCount++;
    
    if (message.includes('recalculando categorias')) {
      console.error(`❌ EPILEPSIA DETECTADA! Recálculo #${renderCount}: ${message}`);
    }
    
    if (message.includes('Cache inválido')) {
      cacheKeyChanges++;
      console.warn(`⚠️ Cache Key mudou #${cacheKeyChanges}: ${message}`);
    }
  }
  
  // Chamar console.log original
  originalLog.apply(console, args);
};

// Monitorar por 15 segundos
console.log('🔍 Monitorando por 15 segundos...');
console.log('Vá para a aba "Relatórios" e observe a seção "Detalhes por Categoria"');

setTimeout(() => {
  // Restaurar console.log
  console.log = originalLog;
  
  console.log('\n📊 RESULTADO DO DIAGNÓSTICO:');
  console.log(`Total de recálculos: ${renderCount}`);
  console.log(`Mudanças de cache key: ${cacheKeyChanges}`);
  
  if (renderCount > 50) {
    console.error('❌ EPILEPSIA CONFIRMADA! Mais de 50 recálculos em 15s');
    console.error('🔧 CAUSA: Arrays sendo recriadas constantemente (allHabits, todayTasks, etc.)');
    console.error('💡 SOLUÇÃO: Memoizar essas arrays nos hooks');
  } else if (renderCount > 10) {
    console.warn('⚠️ Re-renders excessivos detectados');
  } else {
    console.log('✅ Performance normal');
  }
  
  // Testar se arrays estão mudando
  console.log('\n🔬 TESTANDO ESTABILIDADE DAS ARRAYS:');
  
  try {
    const { useHabitCategories } = window;
    const { useTasks } = window;
    const { useGoals } = window;
    
    if (useHabitCategories && useTasks && useGoals) {
      let prevHabits = null;
      let prevTasks = null;
      let prevGoals = null;
      let arrayChanges = 0;
      
      const checkArrays = () => {
        const habits = useHabitCategories().all;
        const tasks = useTasks().todayTasks;
        const goals = useGoals().activeGoals;
        
        if (prevHabits && prevTasks && prevGoals) {
          if (habits !== prevHabits || tasks !== prevTasks || goals !== prevGoals) {
            arrayChanges++;
            console.warn(`⚠️ Arrays mudaram #${arrayChanges} (novas referências)`);
          }
        }
        
        prevHabits = habits;
        prevTasks = tasks;
        prevGoals = goals;
      };
      
      // Verificar a cada 100ms por 3 segundos
      const interval = setInterval(checkArrays, 100);
      setTimeout(() => {
        clearInterval(interval);
        console.log(`📊 Mudanças de array em 3s: ${arrayChanges}`);
        
        if (arrayChanges > 10) {
          console.error('❌ CONFIRMADO: Arrays estão mudando constantemente!');
          console.error('🔧 NECESSÁRIO: Memoizar arrays nos hooks useHabitCategories, useTasks, useGoals');
        } else {
          console.log('✅ Arrays estáveis');
        }
      }, 3000);
    } else {
      console.warn('⚠️ Não foi possível acessar os hooks para teste');
    }
  } catch (error) {
    console.error('❌ Erro no teste de arrays:', error);
  }
  
}, 15000);

console.log('✨ Diagnóstico iniciado! Aguarde 15 segundos...');
