// Script para debugar sincronização da loja
console.log('🛍️ [SHOP DEBUG] Iniciando debug da sincronização da loja...');

// 1. Verificar estado atual da loja
const shopState = useShopStore.getState();
console.log('🛍️ [SHOP DEBUG] Estado atual da loja:', {
  totalItems: shopState.items.length,
  purchasedItems: shopState.items.filter(item => item.purchased).length,
  items: shopState.items.map(item => ({
    id: item.id,
    name: item.name,
    purchased: item.purchased,
    price: item.price
  }))
});

// 2. Verificar dados no Supabase
const userId = useAuthStore.getState().user?.id;
if (!userId) {
  console.error('❌ [SHOP DEBUG] Usuário não autenticado');
} else {
  console.log('🛍️ [SHOP DEBUG] UserId:', userId);
  
  // Buscar dados do Supabase
  (async () => {
    try {
      const { db } = await import('./src/lib/database.js');
      const dbService = new db.DatabaseService();
      
      console.log('🛍️ [SHOP DEBUG] Buscando itens do Supabase...');
      const shopItems = await dbService.getShopItems(userId);
      console.log('🛍️ [SHOP DEBUG] Itens do Supabase:', {
        totalItems: shopItems.length,
        items: shopItems.map(item => ({
          id: item.id,
          name: item.name,
          purchased: item.purchased,
          price: item.price
        }))
      });
      
      // Comparar com estado local
      const localPurchased = shopState.items.filter(item => item.purchased);
      const supabasePurchased = shopItems.filter(item => item.purchased);
      
      console.log('🛍️ [SHOP DEBUG] Comparação:', {
        localPurchasedCount: localPurchased.length,
        supabasePurchasedCount: supabasePurchased.length,
        localPurchasedIds: localPurchased.map(item => item.id),
        supabasePurchasedIds: supabasePurchased.map(item => item.id)
      });
      
      // Verificar se há diferenças
      const onlyInLocal = localPurchased.filter(local => 
        !supabasePurchased.find(sb => sb.id === local.id)
      );
      const onlyInSupabase = supabasePurchased.filter(sb => 
        !localPurchased.find(local => local.id === sb.id)
      );
      
      if (onlyInLocal.length > 0) {
        console.warn('⚠️ [SHOP DEBUG] Itens comprados apenas localmente:', onlyInLocal.map(item => item.name));
      }
      
      if (onlyInSupabase.length > 0) {
        console.warn('⚠️ [SHOP DEBUG] Itens comprados apenas no Supabase:', onlyInSupabase.map(item => item.name));
      }
      
      if (onlyInLocal.length === 0 && onlyInSupabase.length === 0) {
        console.log('✅ [SHOP DEBUG] Estados local e Supabase estão sincronizados!');
      }
      
    } catch (error) {
      console.error('❌ [SHOP DEBUG] Erro ao buscar dados do Supabase:', error);
    }
  })();
}

// 3. Testar sincronização manual
console.log('🛍️ [SHOP DEBUG] Para forçar sincronização do Supabase, execute:');
console.log('dataSyncService.loadAll(useAuthStore.getState().user?.id);');

// 4. Testar compra de um item
console.log('🛍️ [SHOP DEBUG] Para testar uma compra, execute:');
console.log('const testItem = useShopStore.getState().items.find(item => !item.purchased);');
console.log('if (testItem) { console.log("Comprando:", testItem.name); useShopStore.getState().buyItem(testItem.id); }');

// 5. Verificar se dados foram salvos no Supabase após compra
console.log('🛍️ [SHOP DEBUG] Após comprar, aguarde alguns segundos e execute novamente este script para verificar se foi salvo no Supabase.');
