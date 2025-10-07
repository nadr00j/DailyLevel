import { motion } from 'framer-motion';
import { Calendar, CheckSquare, Target, Home, CalendarCheck } from 'lucide-react';
import { TabView } from '@/types';
import { cn } from '@/lib/utils';

interface TabBarProps {
  activeTab: TabView;
  onTabChange: (tab: TabView) => void;
}

const tabs = [
  { id: 'today' as TabView, label: 'Hoje', icon: Home },
  { id: 'tasks' as TabView, label: 'Tarefas', icon: CheckSquare },
  { id: 'habits' as TabView, label: 'Hábitos', icon: CalendarCheck },
  { id: 'goals' as TabView, label: 'Metas', icon: Target },
];

export const TabBar = ({ activeTab, onTabChange }: TabBarProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 card-glass border-t nav-safe-bottom">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "relative flex-1 flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 basis-0",
                  "hover:bg-accent/50 select-none",
                  isActive && "text-primary"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30
                    }}
                  />
                )}
                
                <Icon 
                  size={20} 
                  className={cn(
                    "relative z-10 transition-all duration-200",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} 
                />
                
                <span 
                  className={cn(
                    "relative z-10 text-xs mt-1 font-medium transition-all duration-200",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};