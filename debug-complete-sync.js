// Script completo para debugar sincronização da loja e PixelBuddy
console.log('🔍 [COMPLETE SYNC DEBUG] Iniciando debug completo...');

const userId = useAuthStore.getState().user?.id;
if (!userId) {
  console.error('❌ [COMPLETE SYNC DEBUG] Usuário não autenticado');
} else {
  console.log('🔍 [COMPLETE SYNC DEBUG] UserId:', userId);
  
  // 1. Estado atual da loja
  const shopState = useShopStore.getState();
  const purchasedItems = shopState.items.filter(item => item.purchased);
  console.log('🛍️ [SHOP STATE] Itens comprados localmente:', {
    count: purchasedItems.length,
    items: purchasedItems.map(item => ({ id: item.id, name: item.name, price: item.price }))
  });
  
  // 2. Estado atual do PixelBuddy
  const pixelBuddyState = usePixelBuddyStore.getState();
  const equippedItems = Object.entries(pixelBuddyState.inventory)
    .filter(([id, item]) => item.equipped)
    .map(([id, item]) => ({ id, name: item.name, type: item.type }));
  
  console.log('🎮 [PIXELBUDDY STATE] Estado atual:', {
    body: pixelBuddyState.body,
    head: pixelBuddyState.head,
    clothes: pixelBuddyState.clothes,
    accessory: pixelBuddyState.accessory,
    hat: pixelBuddyState.hat,
    effect: pixelBuddyState.effect,
    inventoryCount: Object.keys(pixelBuddyState.inventory).length,
    equippedItems: equippedItems
  });
  
  // 3. Verificar dados no Supabase
  (async () => {
    try {
      const { db } = await import('./src/lib/database.js');
      const dbService = new db.DatabaseService();
      
      // 3.1. Verificar itens da loja no Supabase
      console.log('🔍 [SUPABASE CHECK] Verificando itens da loja...');
      const supabaseShopItems = await dbService.getShopItems(userId);
      const supabasePurchased = supabaseShopItems.filter(item => item.purchased);
      
      console.log('🛍️ [SUPABASE SHOP] Itens comprados no Supabase:', {
        count: supabasePurchased.length,
        items: supabasePurchased.map(item => ({ id: item.id, name: item.name, price: item.price }))
      });
      
      // 3.2. Verificar PixelBuddy no Supabase
      console.log('🔍 [SUPABASE CHECK] Verificando PixelBuddy...');
      const supabasePixelBuddy = await dbService.getPixelBuddyState(userId);
      
      if (supabasePixelBuddy) {
        const supabaseEquipped = Object.entries(supabasePixelBuddy.inventory || {})
          .filter(([id, item]) => item.equipped)
          .map(([id, item]) => ({ id, name: item.name, type: item.type }));
        
        console.log('🎮 [SUPABASE PIXELBUDDY] Estado no Supabase:', {
          body: supabasePixelBuddy.body,
          head: supabasePixelBuddy.head,
          clothes: supabasePixelBuddy.clothes,
          accessory: supabasePixelBuddy.accessory,
          hat: supabasePixelBuddy.hat,
          effect: supabasePixelBuddy.effect,
          inventoryCount: Object.keys(supabasePixelBuddy.inventory || {}).length,
          equippedItems: supabaseEquipped
        });
      } else {
        console.warn('⚠️ [SUPABASE PIXELBUDDY] Nenhum estado encontrado no Supabase');
      }
      
      // 4. Comparar estados
      console.log('🔍 [COMPARISON] Comparando estados...');
      
      // 4.1. Comparar loja
      const localPurchasedIds = purchasedItems.map(item => item.id).sort();
      const supabasePurchasedIds = supabasePurchased.map(item => item.id).sort();
      const shopSynced = JSON.stringify(localPurchasedIds) === JSON.stringify(supabasePurchasedIds);
      
      console.log('🛍️ [SHOP COMPARISON]', {
        synced: shopSynced,
        localIds: localPurchasedIds,
        supabaseIds: supabasePurchasedIds,
        onlyLocal: localPurchasedIds.filter(id => !supabasePurchasedIds.includes(id)),
        onlySupabase: supabasePurchasedIds.filter(id => !localPurchasedIds.includes(id))
      });
      
      // 4.2. Comparar PixelBuddy
      if (supabasePixelBuddy) {
        const pixelBuddySynced = (
          pixelBuddyState.body === supabasePixelBuddy.body &&
          pixelBuddyState.head === supabasePixelBuddy.head &&
          pixelBuddyState.clothes === supabasePixelBuddy.clothes &&
          pixelBuddyState.accessory === supabasePixelBuddy.accessory &&
          pixelBuddyState.hat === supabasePixelBuddy.hat &&
          pixelBuddyState.effect === supabasePixelBuddy.effect
        );
        
        console.log('🎮 [PIXELBUDDY COMPARISON]', {
          equipmentSynced: pixelBuddySynced,
          differences: {
            body: pixelBuddyState.body !== supabasePixelBuddy.body ? { local: pixelBuddyState.body, supabase: supabasePixelBuddy.body } : null,
            head: pixelBuddyState.head !== supabasePixelBuddy.head ? { local: pixelBuddyState.head, supabase: supabasePixelBuddy.head } : null,
            clothes: pixelBuddyState.clothes !== supabasePixelBuddy.clothes ? { local: pixelBuddyState.clothes, supabase: supabasePixelBuddy.clothes } : null,
            accessory: pixelBuddyState.accessory !== supabasePixelBuddy.accessory ? { local: pixelBuddyState.accessory, supabase: supabasePixelBuddy.accessory } : null,
            hat: pixelBuddyState.hat !== supabasePixelBuddy.hat ? { local: pixelBuddyState.hat, supabase: supabasePixelBuddy.hat } : null,
            effect: pixelBuddyState.effect !== supabasePixelBuddy.effect ? { local: pixelBuddyState.effect, supabase: supabasePixelBuddy.effect } : null
          }
        });
      }
      
      // 5. Resultado final
      if (shopSynced && (supabasePixelBuddy ? pixelBuddySynced : true)) {
        console.log('✅ [COMPLETE SYNC DEBUG] Todos os dados estão sincronizados!');
      } else {
        console.warn('⚠️ [COMPLETE SYNC DEBUG] Alguns dados não estão sincronizados');
        console.log('🔧 [COMPLETE SYNC DEBUG] Para forçar sincronização, execute:');
        console.log('dataSyncService.syncAll(useAuthStore.getState().user?.id);');
      }
      
    } catch (error) {
      console.error('❌ [COMPLETE SYNC DEBUG] Erro ao verificar Supabase:', error);
    }
  })();
}

// 6. Comandos úteis
console.log('\n🔧 [USEFUL COMMANDS]');
console.log('// Forçar sincronização completa:');
console.log('dataSyncService.syncAll(useAuthStore.getState().user?.id);');
console.log('\n// Forçar carregamento do Supabase:');
console.log('dataSyncService.loadAll(useAuthStore.getState().user?.id);');
console.log('\n// Comprar um item para teste:');
console.log('const testItem = useShopStore.getState().items.find(item => !item.purchased);');
console.log('if (testItem) useShopStore.getState().buyItem(testItem.id);');
console.log('\n// Equipar um item no PixelBuddy:');
console.log('const inventory = usePixelBuddyStore.getState().inventory;');
console.log('const unlockedItem = Object.keys(inventory).find(id => inventory[id].unlocked && !inventory[id].equipped);');
console.log('if (unlockedItem) usePixelBuddyStore.getState().equipItem(unlockedItem);');
