// Script para debugar o estado da cabeça do PixelBuddy
console.log('🎭 [HEAD STATE DEBUG] Testando estado da cabeça...');

const gamificationState = useGamificationStoreV21.getState();
const pixelBuddyState = usePixelBuddyStore.getState();
const vitalityHook = useVitalityV21();

console.log('📊 [CURRENT STATE] Estado atual:', {
  vitalityGamification: gamificationState.vitality,
  vitalitySupabase: vitalityHook.vitality,
  currentHead: pixelBuddyState.head,
  mood: gamificationState.mood
});

// Função para testar diferentes níveis de vitalidade
function testVitalityLevels() {
  console.log('\n🧪 [VITALITY TEST] Testando diferentes níveis de vitalidade:');
  
  const testCases = [
    { vitality: 0, expectedHead: 'head_sad.png', expectedMood: 'sad' },
    { vitality: 10, expectedHead: 'head_sad.png', expectedMood: 'sad' },
    { vitality: 24, expectedHead: 'head_sad.png', expectedMood: 'sad' },
    { vitality: 25, expectedHead: 'head_tired.png', expectedMood: 'tired' },
    { vitality: 35, expectedHead: 'head_tired.png', expectedMood: 'tired' },
    { vitality: 49, expectedHead: 'head_tired.png', expectedMood: 'tired' },
    { vitality: 50, expectedHead: 'head_neutral.png', expectedMood: 'neutral' },
    { vitality: 75, expectedHead: 'head_happy.png', expectedMood: 'happy' },
    { vitality: 90, expectedHead: 'head_confident.png', expectedMood: 'confident' }
  ];
  
  testCases.forEach(testCase => {
    // Simular função getMoodFromVitality
    let mood;
    if (testCase.vitality < 25) mood = 'sad';
    else if (testCase.vitality < 50) mood = 'tired';
    else if (testCase.vitality < 75) mood = 'neutral';
    else if (testCase.vitality < 90) mood = 'happy';
    else mood = 'confident';
    
    // Simular função getHeadFromVitality
    let head;
    if (testCase.vitality < 25) head = '/Nadr00J/heads/head_sad.png';
    else if (testCase.vitality < 50) head = '/Nadr00J/heads/head_tired.png';
    else if (testCase.vitality < 75) head = '/Nadr00J/heads/head_neutral.png';
    else if (testCase.vitality < 90) head = '/Nadr00J/heads/head_happy.png';
    else head = '/Nadr00J/heads/head_confident.png';
    
    const moodCorrect = mood === testCase.expectedMood;
    const headCorrect = head.includes(testCase.expectedHead);
    
    console.log(`Vitalidade ${testCase.vitality}: ${moodCorrect && headCorrect ? '✅' : '❌'} Mood: ${mood} (${testCase.expectedMood}), Head: ${head.split('/').pop()} (${testCase.expectedHead})`);
  });
}

testVitalityLevels();

// Testar com vitalidade atual
console.log('\n🔍 [CURRENT TEST] Testando com vitalidade atual:');
const currentVitality = Math.min(gamificationState.vitality, vitalityHook.vitality);
console.log(`Vitalidade atual: ${currentVitality}`);

if (currentVitality < 25) {
  console.log('✅ Deveria mostrar: head_sad.png (triste)');
  console.log(`🎭 Mostrando atualmente: ${pixelBuddyState.head}`);
  if (pixelBuddyState.head?.includes('head_sad.png')) {
    console.log('✅ CORRETO: Mostrando cabeça triste');
  } else {
    console.log('❌ INCORRETO: Deveria mostrar cabeça triste');
  }
} else if (currentVitality < 50) {
  console.log('✅ Deveria mostrar: head_tired.png (cansado)');
  console.log(`🎭 Mostrando atualmente: ${pixelBuddyState.head}`);
  if (pixelBuddyState.head?.includes('head_tired.png')) {
    console.log('✅ CORRETO: Mostrando cabeça cansada');
  } else {
    console.log('❌ INCORRETO: Deveria mostrar cabeça cansada');
  }
}

// Comandos para forçar atualização
console.log('\n🔧 [FORCE UPDATE] Para forçar atualização:');
console.log('// Sincronizar vitalidade:');
console.log('useVitalityV21().syncOnOpen();');
console.log('\n// Forçar atualização do PixelBuddy:');
console.log('usePixelBuddyStore.getState().initializeFromGamification(useGamificationStoreV21.getState().xp, useGamificationStoreV21.getState().vitality);');
console.log('\n// Definir vitalidade para 0 (teste):');
console.log('useGamificationStoreV21.getState().syncVitalityFromSupabase(0);');

console.log('\n🎭 [HEAD STATE DEBUG] Debug concluído!');
