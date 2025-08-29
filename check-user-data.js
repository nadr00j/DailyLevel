// Script para verificar dados do usuário Nadr00J no localStorage/IndexedDB
// Execute este script no console do navegador

console.log('=== VERIFICANDO DADOS DO USUÁRIO NADR00J ===');

// Verificar localStorage
console.log('\n--- LocalStorage ---');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && key.includes('dl.')) {
    console.log(`${key}:`, localStorage.getItem(key));
  }
}

// Verificar sessionStorage
console.log('\n--- SessionStorage ---');
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  if (key && key.includes('dl.')) {
    console.log(`${key}:`, sessionStorage.getItem(key));
  }
}

// Verificar IndexedDB (se disponível)
if (typeof indexedDB !== 'undefined') {
  console.log('\n--- IndexedDB ---');
  
  // Listar databases
  indexedDB.databases().then(databases => {
    console.log('Databases disponíveis:', databases);
    
    databases.forEach(db => {
      if (db.name && db.name.includes('DailyLevel')) {
        console.log(`Database: ${db.name}, Version: ${db.version}`);
      }
    });
  }).catch(err => {
    console.log('Erro ao acessar IndexedDB:', err);
  });
}

console.log('\n=== FIM DA VERIFICAÇÃO ===');
