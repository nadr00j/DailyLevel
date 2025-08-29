import React, { useEffect, useState } from 'react';
import { TodayViewContent } from '@/components/today/TodayViewContent';
import { PixelBuddyCard } from '@/components/gamification/PixelBuddyCard';
import { AssetPreloader } from '@/lib/assetPreloader';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const TodayView = () => {
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    const preloadAssets = async () => {
      try {
        // Pré-carregar sprites essenciais primeiro
        await AssetPreloader.preloadEssentialSprites();
        setAssetsLoaded(true);
        
        // Continuar carregando o resto em background
        AssetPreloader.preloadAllSprites();
      } catch (error) {
        console.error('[TodayView] Error preloading assets:', error);
        setAssetsLoaded(true); // Continuar mesmo com erro
      }
    };

    preloadAssets();
  }, []);

  // Monitorar progresso do carregamento
  useEffect(() => {
    if (!assetsLoaded) return;

    const interval = setInterval(() => {
      const progress = AssetPreloader.getLoadingProgress();
      setLoadingProgress(progress);
    }, 100);

    return () => clearInterval(interval);
  }, [assetsLoaded]);

  // Formatar data atual
  const currentDate = new Date();
  const dayOfWeek = format(currentDate, 'EEEE', { locale: ptBR }).replace(/^\w/, c => c.toUpperCase());
  const dayMonth = format(currentDate, "dd/MM");

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header com Logo e Data */}
      <div className="flex items-center justify-between mb-6">
        <img 
          src="/logo-daily-level.png" 
          alt="DailyLevel Logo" 
          className="h-12 w-auto"
        />
        <div className="inline-flex flex-col items-center bg-muted/30 rounded-lg px-4 py-2 border border-border/50">
          <div className="text-base font-medium text-foreground mb-1">
            {dayOfWeek}
          </div>
          <div className="text-sm text-muted-foreground">
            Dia {dayMonth}
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {!assetsLoaded && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Carregando PixelBuddy...</p>
          </div>
        </div>
      )}

      {/* PixelBuddy Card */}
      {assetsLoaded && <PixelBuddyCard />}

      {/* Today Content */}
      <TodayViewContent />
    </div>
  );
};