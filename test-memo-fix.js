// Script para testar se React.memo() corrigiu os re-renders
// Execute no console do navegador

console.log('🎯 TESTANDO CORREÇÃO COM REACT.MEMO()');
console.log('===================================');

let renderCount = 0;
let startTime = Date.now();

// Interceptar console.log para contar renders
const originalLog = console.log;

console.log = function(...args) {
  const message = args.join(' ');
  
  if (message.includes('[PERFORMANCE RENDER]')) {
    renderCount++;
  }
  
  // Chamar original
  originalLog.apply(console, args);
};

console.log('\n🔍 MONITORANDO POR 10 SEGUNDOS...');
console.log('Fique na aba "Relatórios" e observe se parou de renderizar');

setTimeout(() => {
  console.log = originalLog;
  
  const elapsed = (Date.now() - startTime) / 1000;
  const rendersPerSecond = (renderCount / elapsed).toFixed(1);
  
  console.log('\n🎯 RESULTADO DO TESTE:');
  console.log('=====================');
  console.log(`⏱️ Tempo: ${elapsed}s`);
  console.log(`📊 Re-renders: ${renderCount}`);
  console.log(`📈 Re-renders/segundo: ${rendersPerSecond}`);
  
  if (renderCount === 0) {
    console.log('\n🎉 SUCESSO TOTAL! React.memo() funcionou perfeitamente!');
    console.log('✅ Zero re-renders detectados');
    console.log('✅ Página deve estar responsiva agora');
  } else if (renderCount < 5) {
    console.log('\n👍 GRANDE MELHORIA! Re-renders drasticamente reduzidos');
    console.log('✅ De ~100 re-renders para apenas ' + renderCount);
    console.log('✅ Página deve estar muito mais responsiva');
  } else if (renderCount < 20) {
    console.log('\n⚠️ MELHORIA PARCIAL: Ainda há alguns re-renders');
    console.log('🔧 Pode precisar de otimizações adicionais');
  } else {
    console.log('\n❌ PROBLEMA PERSISTE: Muitos re-renders ainda');
    console.log('🔧 React.memo() não foi suficiente');
    console.log('🔧 Problema pode ser no componente pai');
  }
  
  // Teste de responsividade
  console.log('\n🖱️ TESTE DE RESPONSIVIDADE:');
  console.log('Clique em alguns botões na página');
  console.log('Se responderem rapidamente, o problema foi resolvido!');
  
}, 10000);

console.log('✨ Teste iniciado! Aguarde 10 segundos...');
