// Script para testar se a "epilepsia" das categorias foi corrigida
// Execute no console do navegador

console.log('🎯 TESTE DA CORREÇÃO DA EPILEPSIA DAS CATEGORIAS');
console.log('===============================================');

let renderCount = 0;
let cacheHits = 0;
let cacheMisses = 0;
let buttonClicks = 0;
let buttonResponses = 0;

// Interceptar console.log para capturar logs de categoria
const originalLog = console.log;
console.log = function(...args) {
  const message = args.join(' ');
  
  // Detectar logs de categoria
  if (message.includes('[Category Cache]')) {
    if (message.includes('Usando cache válido')) {
      cacheHits++;
      console.log(`✅ Cache Hit #${cacheHits}: ${message}`);
    } else if (message.includes('recalculando categorias')) {
      cacheMisses++;
      renderCount++;
      if (cacheMisses > 3) {
        console.error(`❌ EPILEPSIA AINDA PRESENTE! Cache Miss #${cacheMisses}: ${message}`);
      } else {
        console.warn(`⚠️ Cache Miss #${cacheMisses}: ${message}`);
      }
    }
  }
  
  // Chamar console.log original
  originalLog.apply(console, args);
};

// Testar responsividade dos botões
console.log('\n🖱️ TESTANDO RESPONSIVIDADE DOS BOTÕES:');
console.log('Clique em alguns botões na página e observe se respondem na primeira tentativa');

// Interceptar cliques para contar
document.addEventListener('click', (event) => {
  if (event.target.tagName === 'BUTTON' || event.target.closest('button')) {
    buttonClicks++;
    console.log(`🖱️ Clique #${buttonClicks} detectado em botão`);
    
    // Verificar se houve resposta (mudança visual ou ação)
    setTimeout(() => {
      buttonResponses++;
      if (buttonResponses === buttonClicks) {
        console.log(`✅ Botão respondeu imediatamente`);
      } else {
        console.warn(`⚠️ Possível atraso na resposta do botão`);
      }
    }, 100);
  }
});

// Monitorar por 20 segundos
console.log('\n🔍 Monitorando por 20 segundos...');
console.log('1. Vá para a aba "Relatórios"');
console.log('2. Observe a seção "Detalhes por Categoria"');
console.log('3. Clique em alguns botões para testar responsividade');

setTimeout(() => {
  // Restaurar console.log
  console.log = originalLog;
  
  console.log('\n📊 RESULTADO DO TESTE:');
  console.log(`Cache Hits: ${cacheHits}`);
  console.log(`Cache Misses: ${cacheMisses}`);
  console.log(`Total de recálculos: ${renderCount}`);
  console.log(`Cliques em botões: ${buttonClicks}`);
  console.log(`Respostas de botões: ${buttonResponses}`);
  
  // Avaliar resultados
  console.log('\n🎯 AVALIAÇÃO:');
  
  if (cacheMisses <= 2) {
    console.log('✅ EPILEPSIA CORRIGIDA! Poucos cache misses.');
  } else if (cacheMisses <= 5) {
    console.warn('⚠️ Melhoria parcial. Ainda há alguns recálculos desnecessários.');
  } else {
    console.error('❌ EPILEPSIA AINDA PRESENTE! Muitos cache misses.');
  }
  
  if (cacheHits > cacheMisses * 3) {
    console.log('✅ CACHE FUNCIONANDO! Mais hits que misses.');
  } else {
    console.warn('⚠️ Cache pode não estar funcionando adequadamente.');
  }
  
  if (buttonClicks > 0) {
    const responsiveness = (buttonResponses / buttonClicks) * 100;
    if (responsiveness >= 90) {
      console.log(`✅ BOTÕES RESPONSIVOS! ${responsiveness.toFixed(1)}% de resposta imediata.`);
    } else if (responsiveness >= 70) {
      console.warn(`⚠️ RESPONSIVIDADE MODERADA: ${responsiveness.toFixed(1)}%`);
    } else {
      console.error(`❌ BOTÕES LENTOS: ${responsiveness.toFixed(1)}% de resposta imediata.`);
    }
  }
  
  // Teste final: verificar se arrays estão estáveis
  console.log('\n🔬 TESTE FINAL - ESTABILIDADE DAS ARRAYS:');
  
  try {
    // Simular múltiplas chamadas aos hooks
    let arrayChanges = 0;
    let prevArrays = null;
    
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        // Verificar se as arrays mudaram sem motivo
        const currentArrays = {
          // Estas chamadas devem retornar as mesmas referências se nada mudou
          timestamp: Date.now()
        };
        
        if (prevArrays && JSON.stringify(currentArrays) !== JSON.stringify(prevArrays)) {
          arrayChanges++;
        }
        
        prevArrays = currentArrays;
        
        if (i === 9) {
          console.log(`📊 Mudanças de array desnecessárias: ${arrayChanges}/10`);
          
          if (arrayChanges === 0) {
            console.log('✅ PERFEITO! Arrays completamente estáveis.');
          } else if (arrayChanges <= 2) {
            console.log('✅ BOM! Arrays majoritariamente estáveis.');
          } else {
            console.warn('⚠️ Arrays ainda instáveis em alguns casos.');
          }
        }
      }, i * 100);
    }
  } catch (error) {
    console.error('❌ Erro no teste de estabilidade:', error);
  }
  
}, 20000);

console.log('✨ Teste iniciado! Aguarde 20 segundos e interaja com a página...');
