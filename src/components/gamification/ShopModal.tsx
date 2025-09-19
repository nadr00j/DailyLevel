import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Package, Zap, ShoppingBag } from 'lucide-react';
import { useShopStore } from '@/stores/useShopStore';
import type { ShopItem } from '@/types';
import { useGamificationStoreV21 } from '@/stores/useGamificationStoreV21';
import { usePixelBuddyStore } from '@/stores/usePixelBuddyStore';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

type TabType = 'items' | 'vantagens' | 'inventory';

const ShopItemCard = ({ item }: { item: ShopItem }) => {
  const { buyItem, openSellConfirmation } = useShopStore();
  const { coins } = useGamificationStoreV21();
  const canAfford = coins >= item.price;
  const isPurchased = item.purchased;

  const handleBuy = () => {
    if (isPurchased) {
      toast({
        title: "Item já comprado!",
        description: "Você já possui este item.",
        duration: 2000
      });
      return;
    }

    if (!canAfford) {
      toast({
        title: "Moedas insuficientes!",
        description: `Você precisa de ${item.price} moedas para comprar este item.`,
        duration: 3000
      });
      return;
    }

    const success = buyItem(item.id);
    if (success) {
      toast({
        title: "Compra realizada!",
        description: `${item.name} foi adicionado ao seu inventário.`,
        duration: 2000
      });
    }
  };

  const handleSellClick = () => {
    openSellConfirmation(item);
  };

  // Verificar se o ícone é uma imagem (caminho) ou emoji (string)
  const isImageIcon = item.icon.startsWith('/');

  return (
    <div
      className={`relative p-4 rounded-lg border transition-all ${
        isPurchased
          ? 'bg-green-900/20 border-green-500/30 cursor-default'
          : canAfford
            ? 'bg-secondary/50 border-border hover:bg-secondary/70 cursor-pointer'
            : 'bg-muted/50 border-muted-foreground/30 opacity-60'
      }`}
      onClick={isPurchased ? undefined : handleBuy}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {isImageIcon ? (
            <img 
              src={item.icon} 
              alt={item.name}
              className="w-12 h-12 object-contain rounded-lg border border-border"
              onError={(e) => {
                // Fallback para emoji se a imagem não carregar
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = document.createElement('span');
                fallback.className = 'text-2xl';
                fallback.textContent = '🎁'; // Emoji fallback
                target.parentNode?.appendChild(fallback);
              }}
            />
          ) : (
            <span className="text-2xl w-12 h-12 flex items-center justify-center">
              {item.icon}
            </span>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{item.name}</h3>
          <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
          {isPurchased ? (
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                Comprado
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs font-medium">{item.price}</span>
              <span className="text-xs">🪙</span>
            </div>
          )}
        </div>
      </div>

      {isPurchased && (
        <div className="mt-3 pt-3 border-t border-green-500/30">
          <button
            onClick={handleSellClick}
            className="w-full text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-md transition-colors"
          >
            Vender no Mercado Negro
          </button>
        </div>
      )}
    </div>
  );
};

const InventoryTab = () => {
  const { inventory, equipItem, unequipItem, unlockItem } = usePixelBuddyStore();
  const { items } = useShopStore();

  // Filtrar itens comprados que são do tipo PixelBuddy
  const purchasedItems = items.filter(item => 
    item.purchased && item.category === 'cosmetic'
  );

  // Garantir que todos os itens comprados estejam no inventário do PixelBuddy
  useEffect(() => {
    purchasedItems.forEach(item => {
      if (item.pixelBuddyData && !inventory[item.id]) {
        unlockItem({
          id: item.id,
          name: item.name,
          description: item.description,
          type: item.pixelBuddyData.type,
          rarity: item.pixelBuddyData.rarity || 'common',
          price: item.price,
          unlocked: true,
          equipped: false,
          spritePath: item.pixelBuddyData.spritePath
        });
      }
    });
  }, [purchasedItems, inventory, unlockItem]);

  // Agrupar itens por tipo
  const itemsByType = purchasedItems.reduce((acc, item) => {
    const type = item.id.split('_')[0]; // clothes_, hat_, accessory_
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {} as Record<string, typeof purchasedItems>);

  const handleEquip = (itemId: string) => {
    const item = purchasedItems.find(i => i.id === itemId);
    if (item) {
      equipItem(itemId);
    }
  };

  const handleUnequip = (layer: string) => {
    unequipItem(layer as any);
  };

  const layerLabels = {
    clothes: 'Roupas',
    accessory: 'Acessórios',
    hat: 'Chapéus',
    effect: 'Efeitos'
  };

  if (Object.keys(itemsByType).length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Inventário Vazio</h3>
        <p className="text-sm text-muted-foreground">
          Compre itens na aba "Itens" para personalizar seu PixelBuddy!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(itemsByType).map(([type, items]) => (
        <Card key={type}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {layerLabels[type as keyof typeof layerLabels] || type}
              <Badge variant="secondary">{items.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`relative p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50 ${
                    inventory[item.id]?.equipped 
                      ? 'bg-green-900/20 border-green-500/50' 
                      : 'bg-card border-border'
                  }`}
                  onClick={() => handleEquip(item.id)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {item.icon.startsWith('/') ? (
                      <img 
                        src={item.icon} 
                        alt={item.name}
                        className="w-8 h-8 object-contain rounded border border-border"
                        onError={(e) => {
                          // Fallback para emoji se a imagem não carregar
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = document.createElement('span');
                          fallback.className = 'text-lg';
                          fallback.textContent = '🎁'; // Emoji fallback
                          target.parentNode?.appendChild(fallback);
                        }}
                      />
                    ) : (
                      <span className="text-lg w-8 h-8 flex items-center justify-center">
                        {item.icon}
                      </span>
                    )}
                    {inventory[item.id]?.equipped && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <h4 className="font-medium text-sm mb-1">{item.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                  
                  {inventory[item.id]?.equipped && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 w-full text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnequip(type);
                      }}
                    >
                      Desequipar
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const SellConfirmationDialog = () => {
  const { sellConfirmation, closeSellConfirmation, sellItem } = useShopStore();

  if (!sellConfirmation.open || !sellConfirmation.item) return null;

  const { item, sellPrice } = sellConfirmation;

  const handleConfirmSell = () => {
    const success = sellItem(item.id);
    if (success) {
      toast({
        title: "Item vendido!",
        description: `Você recebeu ${sellPrice} moedas.`,
        duration: 2000
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0"
        onClick={closeSellConfirmation}
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-background border rounded-lg max-w-sm w-full mx-4 p-6 relative"
      >
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img src="/black-market.png" alt="Mercado Negro" className="w-16 h-16" />
          </div>
          <h3 className="text-lg font-semibold">Mercado Negro</h3>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja vender <strong>{item.name}</strong>?
          </p>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Valor original:</span>
              <span className="font-medium">{item.price} 🪙</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Valor de venda:</span>
              <span className="font-medium text-red-500">{sellPrice} 🪙</span>
            </div>
            <div className="text-xs text-muted-foreground">
              (50% do valor original)
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={closeSellConfirmation}
              className="flex-1 px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmSell}
              className="flex-1 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
            >
              Vender
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const ShopModal = () => {
  const { open, closeShop, items } = useShopStore();
  const { coins } = useGamificationStoreV21();
  const [activeTab, setActiveTab] = useState<TabType>('items');

  if (!open) return null;

  const tabs = [
    { id: 'items' as TabType, label: 'Itens', icon: ShoppingBag },
    { id: 'vantagens' as TabType, label: 'Vantagens', icon: Zap },
    { id: 'inventory' as TabType, label: 'Inventário', icon: Package }
  ];

  const getTabContent = () => {
    const cosmeticItems = items.filter(item => item.category === 'cosmetic');
    const vantagensItems = items.filter(item => item.category === 'vantagens');
    
    switch (activeTab) {
      case 'items':
        return (
          <div>
            {cosmeticItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.4, 
                  delay: 0.3 + (index * 0.1),
                  ease: "easeOut"
                }}
              >
                <ShopItemCard item={item} />
              </motion.div>
            ))}
          </div>
        );
      
      case 'vantagens':
        return (
          <div>
            {vantagensItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.4, 
                  delay: 0.3 + (index * 0.1),
                  ease: "easeOut"
                }}
              >
                <ShopItemCard item={item} />
              </motion.div>
            ))}
          </div>
        );
      
      case 'inventory':
        return <InventoryTab />;
      
      default:
        return null;
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-background border rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Loja e Inventário</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{coins}</span>
              <span className="text-sm">🪙</span>
              <button onClick={closeShop} className="ml-2 p-1 hover:bg-muted rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-3"
            >
              {getTabContent()}
            </motion.div>
          </div>
        </motion.div>
      </div>
      <SellConfirmationDialog />
    </>
  );
};
