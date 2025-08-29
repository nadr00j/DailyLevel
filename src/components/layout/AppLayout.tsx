import { ReactNode } from 'react';
import { TabBar } from './TabBar';
import { VictoryDialog } from '@/components/ui/VictoryDialog';
import { ShopModal } from '@/components/gamification/ShopModal';
import { GamificationListener } from '@/components/gamification/GamificationListener';
import { useTabStore } from '@/stores/useTabStore';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { activeTab, setActiveTab } = useTabStore();

  return (
    <div className="min-h-screen bg-background pb-20 safe-area-top">
      <GamificationListener />
      <main className="max-w-md mx-auto">
        {children}
      </main>
      <VictoryDialog />
      <ShopModal />
      
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};