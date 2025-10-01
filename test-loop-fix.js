// Script para testar se o loop infinito foi corrigido
// Execute no console do navegador

console.log('🎯 TESTE DE CORREÇÃO DO LOOP INFINITO');
console.log('====================================');

let vitalityLogs = 0;
let renderLogs = 0;
let syncLogs = 0;
let totalLogs = 0;

// Interceptar console.log para contar logs específicos
const originalLog = console.log;
const originalError = console.error;

console.log = function(...args) {
  const message = args.join(' ');
  totalLogs++;
  
  // Contar logs específicos
  if (message.includes('[VITALITY DEBUG]')) {
    vitalityLogs++;
    console.error(`🔴 VITALITY LOG #${vitalityLogs}: ${message}`);
  } else if (message.includes('[RENDER DEBUG]')) {
    renderLogs++;
    console.error(`🔴 RENDER LOG #${renderLogs}: ${message}`);
  } else if (message.includes('[AUTOSYNC DEBUG]') || message.includes('[SYNC DEBUG]')) {
    syncLogs++;
    console.error(`🔴 SYNC LOG #${syncLogs}: ${message}`);
  }
  
  // Chamar console.log original
  originalLog.apply(console, args);
};

// Monitorar por 15 segundos
console.log('\n🔍 MONITORANDO POR 15 SEGUNDOS...');
console.log('Vá para a aba "Relatórios" e observe se os logs pararam');

const startTime = Date.now();
let intervalId = setInterval(() => {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  console.error(`📊 STATUS (${elapsed}s): Vitality: ${vitalityLogs}, Renders: ${renderLogs}, Syncs: ${syncLogs}, Total: ${totalLogs}`);
  
  // Alertar se ainda há loop
  if (vitalityLogs > 10) {
    console.error('❌ LOOP AINDA PRESENTE! Vitalidade ainda sincronizando constantemente');
  }
  
  if (renderLogs > 20) {
    console.error('❌ RE-RENDERS EXCESSIVOS! PerformanceReports ainda renderizando demais');
  }
  
  if (syncLogs > 15) {
    console.error('❌ SINCRONIZAÇÕES EXCESSIVAS! AutoSync ainda disparando demais');
  }
}, 2000);

setTimeout(() => {
  clearInterval(intervalId);
  
  // Restaurar console
  console.log = originalLog;
  console.error = originalError;
  
  console.log('\n🎯 RESULTADO DO TESTE:');
  console.log('=====================');
  
  console.log(`📊 CONTADORES FINAIS:`);
  console.log(`Logs de Vitalidade: ${vitalityLogs}`);
  console.log(`Logs de Render: ${renderLogs}`);
  console.log(`Logs de Sync: ${syncLogs}`);
  console.log(`Total de logs: ${totalLogs}`);
  
  // Análise dos resultados
  console.log('\n🔍 ANÁLISE:');
  
  if (vitalityLogs <= 2) {
    console.log('✅ LOOP DE VITALIDADE CORRIGIDO! Poucos logs de sincronização.');
  } else if (vitalityLogs <= 5) {
    console.warn('⚠️ MELHORIA PARCIAL: Ainda há algumas sincronizações de vitalidade.');
  } else {
    console.error('❌ LOOP AINDA PRESENTE: Muitas sincronizações de vitalidade.');
  }
  
  if (renderLogs <= 5) {
    console.log('✅ RE-RENDERS CONTROLADOS! Poucos re-renders detectados.');
  } else if (renderLogs <= 15) {
    console.warn('⚠️ RE-RENDERS MODERADOS: Ainda há alguns re-renders.');
  } else {
    console.error('❌ RE-RENDERS EXCESSIVOS: Muitos re-renders ainda ocorrendo.');
  }
  
  if (syncLogs <= 3) {
    console.log('✅ SINCRONIZAÇÕES CONTROLADAS! Poucas sincronizações detectadas.');
  } else if (syncLogs <= 8) {
    console.warn('⚠️ SINCRONIZAÇÕES MODERADAS: Ainda há algumas sincronizações.');
  } else {
    console.error('❌ SINCRONIZAÇÕES EXCESSIVAS: Muitas sincronizações ainda ocorrendo.');
  }
  
  // Teste de responsividade
  console.log('\n🖱️ TESTE DE RESPONSIVIDADE:');
  console.log('Agora clique em alguns botões na página e veja se respondem rapidamente');
  
  let buttonClicks = 0;
  let buttonResponses = 0;
  
  document.addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON' || event.target.closest('button')) {
      buttonClicks++;
      const clickTime = Date.now();
      console.log(`🖱️ Clique #${buttonClicks} detectado`);
      
      setTimeout(() => {
        buttonResponses++;
        const delay = Date.now() - clickTime;
        if (delay < 100) {
          console.log(`✅ Botão respondeu rapidamente (${delay}ms)`);
        } else {
          console.warn(`⚠️ Botão demorou para responder (${delay}ms)`);
        }
      }, 50);
    }
  });
  
  // Resultado final após 10 segundos adicionais
  setTimeout(() => {
    console.log('\n🏁 TESTE COMPLETO!');
    
    if (vitalityLogs <= 2 && renderLogs <= 5 && syncLogs <= 3) {
      console.log('🎉 SUCESSO! Loop infinito corrigido e performance melhorada!');
    } else if (vitalityLogs <= 5 && renderLogs <= 15 && syncLogs <= 8) {
      console.log('👍 MELHORIA SIGNIFICATIVA! Ainda pode ser otimizado mais.');
    } else {
      console.log('😞 PROBLEMA PERSISTE: Mais correções necessárias.');
    }
    
    if (buttonClicks > 0) {
      const responsiveness = (buttonResponses / buttonClicks) * 100;
      console.log(`🖱️ Responsividade dos botões: ${responsiveness.toFixed(1)}%`);
    }
  }, 10000);
  
}, 15000);

console.log('✨ Teste iniciado! Aguarde os resultados...');
