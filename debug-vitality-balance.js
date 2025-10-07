// Script para testar o novo equilíbrio da vitalidade
console.log('💚 [VITALITY BALANCE] Testando novo equilíbrio da vitalidade...');

const userId = useAuthStore.getState().user?.id;
if (!userId) {
  console.error('❌ [VITALITY BALANCE] Usuário não autenticado');
} else {
  console.log('💚 [VITALITY BALANCE] UserId:', userId);
  
  // 1. Estado atual
  const gamificationState = useGamificationStoreV21.getState();
  const vitalityState = useVitalityV21();
  
  console.log('💚 [CURRENT STATE] Estado atual:', {
    vitality: gamificationState.vitality,
    vitalitySupabase: vitalityState.vitality,
    xp30d: gamificationState.xp30d,
    historyToday: gamificationState.history.filter(item => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.getTime();
      const todayEnd = todayStart + (24 * 60 * 60 * 1000) - 1;
      return item.ts >= todayStart && item.ts <= todayEnd;
    }).length
  });
  
  // 2. Configuração atual
  const config = gamificationState.config;
  console.log('⚙️ [CONFIG] Configuração atual:', {
    vitalityMonthlyTarget: config?.points?.vitalityMonthlyTarget || 'N/A',
    vitalityDecayPerMissedDay: config?.points?.vitalityDecayPerMissedDay || 'N/A',
    habitPoints: config?.points?.habit || 'N/A',
    taskPoints: config?.points?.task || 'N/A',
    goalPoints: config?.points?.goal || 'N/A'
  });
  
  // 3. Simular cálculo de vitalidade
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.getTime();
  const todayEnd = todayStart + (24 * 60 * 60 * 1000) - 1;
  
  const history = gamificationState.history;
  const xp30d = gamificationState.xp30d;
  const target = config?.points?.vitalityMonthlyTarget || 300;
  
  // Cálculo base
  const baseVitality = Math.min(100, (xp30d / target) * 100);
  
  // Atividades de hoje
  const todayActivities = history.filter(item => 
    item.ts >= todayStart && item.ts <= todayEnd
  );
  
  const habitsToday = todayActivities.filter(item => item.type === 'habit').length;
  const tasksToday = todayActivities.filter(item => item.type === 'task').length;
  const goalsToday = todayActivities.filter(item => item.type === 'goal').length;
  
  // Bônus calculados
  const goalBonus = goalsToday * 15;
  const activityBonus = todayActivities.length > 0 ? Math.min(20, 5 + (todayActivities.length * 2)) : 0;
  const completionBonus = (habitsToday * 3) + (tasksToday * 4);
  
  // Consistência (últimos 7 dias)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  });
  
  const activeDays = last7Days.filter(dayStart => {
    const dayEnd = dayStart + (24 * 60 * 60 * 1000) - 1;
    return history.some(item => item.ts >= dayStart && item.ts <= dayEnd);
  }).length;
  
  const consistencyBonus = (activeDays / 7) * 25;
  
  const calculatedVitality = Math.max(0, Math.min(100, 
    baseVitality + goalBonus + consistencyBonus + activityBonus + completionBonus
  ));
  
  console.log('🧮 [CALCULATION] Cálculo detalhado da vitalidade:', {
    baseVitality: Math.round(baseVitality * 100) / 100,
    bonuses: {
      goals: goalBonus,
      activity: activityBonus,
      completion: completionBonus,
      consistency: Math.round(consistencyBonus * 100) / 100
    },
    totalBonus: Math.round((goalBonus + activityBonus + completionBonus + consistencyBonus) * 100) / 100,
    calculatedVitality: Math.round(calculatedVitality * 100) / 100,
    currentVitality: gamificationState.vitality
  });
  
  console.log('📊 [TODAY ACTIVITIES] Atividades de hoje:', {
    habits: habitsToday,
    tasks: tasksToday,
    goals: goalsToday,
    total: todayActivities.length,
    activeDaysLast7: activeDays
  });
  
  // 4. Comparação antes/depois
  console.log('📈 [IMPROVEMENTS] Melhorias aplicadas:');
  console.log('• Meta mensal: 500 → 300 XP (mais fácil de atingir)');
  console.log('• Penalidade por dia perdido: 5 → 2 pontos (menos punição)');
  console.log('• Bônus por meta: 5 → 15 pontos (3x mais)');
  console.log('• Bônus por atividade: 2 → 5-20 pontos (progressivo)');
  console.log('• Bônus por consistência: 15 → 25 pontos máximo');
  console.log('• NOVO: Bônus por hábitos (3 pontos cada)');
  console.log('• NOVO: Bônus por tarefas (4 pontos cada)');
  
  // 5. Recomendações
  console.log('\n💡 [RECOMMENDATIONS] Para aumentar vitalidade:');
  if (habitsToday === 0) console.log('• Complete alguns hábitos hoje (+3 pontos cada)');
  if (tasksToday === 0) console.log('• Complete algumas tarefas hoje (+4 pontos cada)');
  if (goalsToday === 0) console.log('• Complete uma meta hoje (+15 pontos)');
  if (activeDays < 7) console.log(`• Use o app mais consistentemente (${activeDays}/7 dias ativos)`);
  if (xp30d < target) console.log(`• Ganhe mais XP nos próximos 30 dias (${xp30d}/${target} XP)`);
  
  // 6. Comandos úteis
  console.log('\n🔧 [USEFUL COMMANDS]');
  console.log('// Forçar sincronização da vitalidade:');
  console.log('useVitalityV21().syncOnOpen();');
  console.log('\n// Simular completar um hábito:');
  console.log('useGamificationStoreV21.getState().addXp("habit", ["teste"]);');
  console.log('\n// Simular completar uma tarefa:');
  console.log('useGamificationStoreV21.getState().addXp("task", ["teste"]);');
  console.log('\n// Simular completar uma meta:');
  console.log('useGamificationStoreV21.getState().addXp("goal", ["teste"]);');
}

console.log('\n💚 [VITALITY BALANCE] Debug concluído!');
