// Script de monitoramento MASSIVO para encontrar a causa raiz da "epilepsia"
// Execute no console do navegador

console.log('🚨 MONITORAMENTO MASSIVO ATIVADO - RASTREANDO TUDO!');
console.log('==================================================');

let logCount = 0;
let renderCount = 0;
let syncCount = 0;
let dropdownCount = 0;
let vitalityCount = 0;
let categoryCount = 0;

// Interceptar TODOS os console.log para análise
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

console.log = function(...args) {
  const message = args.join(' ');
  logCount++;
  
  // Categorizar logs
  if (message.includes('[DROPDOWN DEBUG]')) {
    dropdownCount++;
    console.error(`🔴 DROPDOWN #${dropdownCount}: ${message}`);
  } else if (message.includes('[RENDER DEBUG]')) {
    renderCount++;
    console.error(`🔴 RENDER #${renderCount}: ${message}`);
  } else if (message.includes('[SYNC DEBUG]') || message.includes('[AUTOSYNC DEBUG]')) {
    syncCount++;
    console.error(`🔴 SYNC #${syncCount}: ${message}`);
  } else if (message.includes('[VITALITY DEBUG]')) {
    vitalityCount++;
    console.error(`🔴 VITALITY #${vitalityCount}: ${message}`);
  } else if (message.includes('[Category Cache]') || message.includes('[Category Debug]')) {
    categoryCount++;
    console.error(`🔴 CATEGORY #${categoryCount}: ${message}`);
  } else if (message.includes('[DAYS DEBUG]') || message.includes('[SETTINGS DEBUG]')) {
    console.warn(`⚠️ DAYS/SETTINGS: ${message}`);
  }
  
  // Chamar console.log original
  originalLog.apply(console, args);
};

// Interceptar warnings e errors
console.warn = function(...args) {
  const message = args.join(' ');
  console.error(`⚠️ WARNING: ${message}`);
  originalWarn.apply(console, args);
};

console.error = function(...args) {
  const message = args.join(' ');
  console.error(`❌ ERROR: ${message}`);
  originalError.apply(console, args);
};

// Monitorar cliques em botões
let buttonClicks = 0;
let buttonDelays = [];

document.addEventListener('click', (event) => {
  if (event.target.tagName === 'BUTTON' || event.target.closest('button')) {
    buttonClicks++;
    const clickTime = Date.now();
    
    console.error(`🖱️ BOTÃO CLICADO #${buttonClicks} em ${clickTime}`);
    
    // Medir delay de resposta
    setTimeout(() => {
      const delay = Date.now() - clickTime;
      buttonDelays.push(delay);
      console.error(`⏱️ DELAY DO BOTÃO #${buttonClicks}: ${delay}ms`);
    }, 50);
  }
});

// Monitorar mudanças de estado específicas
let stateChanges = 0;

// Interceptar setState calls (se possível)
const originalSetState = React.Component.prototype.setState;
if (originalSetState) {
  React.Component.prototype.setState = function(updater, callback) {
    stateChanges++;
    console.error(`🔄 STATE CHANGE #${stateChanges}:`, {
      component: this.constructor.name,
      updater: typeof updater === 'function' ? 'function' : updater,
      timestamp: Date.now()
    });
    return originalSetState.call(this, updater, callback);
  };
}

// Monitorar por 30 segundos
console.log('\n🔍 MONITORANDO POR 30 SEGUNDOS...');
console.log('1. Vá para a aba "Relatórios"');
console.log('2. Clique no botão do dropdown de datas');
console.log('3. Observe os logs que aparecem');
console.log('4. Tente clicar em outros botões');

let intervalId = setInterval(() => {
  console.error(`📊 STATUS (${Math.floor((Date.now() - startTime) / 1000)}s):`, {
    totalLogs: logCount,
    renders: renderCount,
    syncs: syncCount,
    dropdowns: dropdownCount,
    vitality: vitalityCount,
    categories: categoryCount,
    buttonClicks: buttonClicks,
    avgButtonDelay: buttonDelays.length > 0 ? Math.round(buttonDelays.reduce((a, b) => a + b, 0) / buttonDelays.length) : 0
  });
}, 2000);

const startTime = Date.now();

setTimeout(() => {
  clearInterval(intervalId);
  
  // Restaurar console
  console.log = originalLog;
  console.warn = originalWarn;
  console.error = originalError;
  
  console.log('\n🎯 ANÁLISE FINAL - CAUSA RAIZ IDENTIFICADA:');
  console.log('==========================================');
  
  console.log(`📊 ESTATÍSTICAS FINAIS:`);
  console.log(`Total de logs: ${logCount}`);
  console.log(`Re-renders: ${renderCount}`);
  console.log(`Sincronizações: ${syncCount}`);
  console.log(`Eventos de dropdown: ${dropdownCount}`);
  console.log(`Eventos de vitalidade: ${vitalityCount}`);
  console.log(`Eventos de categoria: ${categoryCount}`);
  console.log(`Cliques em botões: ${buttonClicks}`);
  console.log(`Delay médio dos botões: ${buttonDelays.length > 0 ? Math.round(buttonDelays.reduce((a, b) => a + b, 0) / buttonDelays.length) : 0}ms`);
  
  // Análise automática
  console.log('\n🔍 DIAGNÓSTICO AUTOMÁTICO:');
  
  if (dropdownCount > 20) {
    console.error('❌ PROBLEMA CRÍTICO: Dropdown com eventos excessivos!');
    console.error('🔧 CAUSA: useEffect ou state mudando constantemente');
  }
  
  if (renderCount > 30) {
    console.error('❌ PROBLEMA CRÍTICO: Re-renders excessivos!');
    console.error('🔧 CAUSA: historyList ou renderKey mudando constantemente');
  }
  
  if (syncCount > 15) {
    console.error('❌ PROBLEMA CRÍTICO: Sincronizações excessivas!');
    console.error('🔧 CAUSA: Store de gamificação mudando constantemente');
  }
  
  if (categoryCount > 25) {
    console.error('❌ PROBLEMA CRÍTICO: Categorias recalculando constantemente!');
    console.error('🔧 CAUSA: Arrays não memoizadas ou cache não funcionando');
  }
  
  if (vitalityCount > 10) {
    console.error('❌ PROBLEMA CRÍTICO: Vitalidade sincronizando constantemente!');
    console.error('🔧 CAUSA: Loop entre useVitalityV21 e useGamificationStoreV21');
  }
  
  const avgDelay = buttonDelays.length > 0 ? Math.round(buttonDelays.reduce((a, b) => a + b, 0) / buttonDelays.length) : 0;
  if (avgDelay > 200) {
    console.error(`❌ PROBLEMA CRÍTICO: Botões lentos (${avgDelay}ms)!`);
    console.error('🔧 CAUSA: Aplicação sobrecarregada com re-renders/syncs');
  }
  
  // Recomendações
  console.log('\n💡 PRÓXIMOS PASSOS:');
  console.log('1. Identifique o componente/hook com mais logs');
  console.log('2. Verifique dependências de useEffect instáveis');
  console.log('3. Confirme se memoização está funcionando');
  console.log('4. Procure loops entre stores/hooks');
  
}, 30000);

console.log('✨ Monitoramento massivo iniciado! Aguarde 30 segundos...');
