// Script para debugar o CategoryPicker
// Execute no console do navegador

console.log('🔍 DEBUG DO CATEGORY PICKER');
console.log('===========================');

// Verificar se o CategoryPicker está sendo usado
const categoryPickers = document.querySelectorAll('[class*="CategoryPicker"], button:contains("Selecione uma categoria")');
console.log('CategoryPickers encontrados:', categoryPickers.length);

// Verificar se há botões de categoria antigos
const oldCategoryButtons = document.querySelectorAll('button:contains("Arte"), button:contains("Estudo"), button:contains("Fitness")');
console.log('Botões de categoria antigos encontrados:', oldCategoryButtons.length);

// Verificar o conteúdo do modal de criação de tarefas
const taskSheets = document.querySelectorAll('[role="dialog"] h2:contains("Nova Tarefa")');
console.log('Modais de "Nova Tarefa" encontrados:', taskSheets.length);

// Verificar se há elementos com "Opções avançadas"
const advancedOptions = document.querySelectorAll('button:contains("Opções avançadas")');
console.log('Botões "Opções avançadas" encontrados:', advancedOptions.length);

// Verificar se há dropdowns de categoria
const categoryDropdowns = document.querySelectorAll('button:contains("Selecione uma categoria")');
console.log('Dropdowns de categoria encontrados:', categoryDropdowns.length);

// Verificar se há elementos com texto "Categoria"
const categoryLabels = document.querySelectorAll('label:contains("Categoria"), span:contains("Categoria")');
console.log('Labels de "Categoria" encontrados:', categoryLabels.length);

// Função para encontrar elementos por texto
function findElementsByText(text) {
  const elements = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let node;
  while (node = walker.nextNode()) {
    if (node.textContent.includes(text)) {
      elements.push(node.parentElement);
    }
  }
  return elements;
}

// Procurar por elementos específicos
const newTaskElements = findElementsByText('Nova Tarefa');
console.log('Elementos com "Nova Tarefa":', newTaskElements.length);

const categoryElements = findElementsByText('Categoria');
console.log('Elementos com "Categoria":', categoryElements.length);

const selectCategoryElements = findElementsByText('Selecione uma categoria');
console.log('Elementos com "Selecione uma categoria":', selectCategoryElements.length);

// Verificar se há erros no console relacionados ao CategoryPicker
console.log('\n🔍 INSTRUÇÕES:');
console.log('1. Abra o modal de criar nova tarefa');
console.log('2. Clique em "Opções avançadas"');
console.log('3. Verifique se aparece um dropdown "Selecione uma categoria"');
console.log('4. Se aparecer botões individuais (Arte, Estudo, etc.), há um problema');
console.log('5. Verifique se há erros no console (aba Console)');

// Verificar se o CategoryPicker está importado corretamente
console.log('\n🔍 VERIFICAÇÕES ADICIONAIS:');
console.log('- Recarregue a página (Ctrl+F5) para limpar cache');
console.log('- Verifique se não há erros JavaScript no console');
console.log('- Confirme que está na aba "Tarefas" e não "Metas"');

console.log('\n✨ Debug concluído!');
