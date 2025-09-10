import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { db } from '@/lib/database';
import type { CategorySettingsGroup } from '@/types/CategorySettings';

interface CategorySettings {
  habitCategoryOrder: string[];
  habitCategoryCollapsed: Record<string, boolean>;
  goalCategoryOrder: string[];
  goalCategoryCollapsed: Record<string, boolean>;
}

export const useCategorySettings = () => {
  const userId = useAuthStore(state => state.user?.id);
  const [settings, setSettings] = useState<CategorySettings>(() => {
    // Initialize with localStorage cache for immediate UI response
    return {
      habitCategoryOrder: JSON.parse(localStorage.getItem('dl.habitCategoryOrder') || '[]'),
      habitCategoryCollapsed: JSON.parse(localStorage.getItem('dl.habitCategoryCollapsed') || '{}'),
      goalCategoryOrder: JSON.parse(localStorage.getItem('dl.goalCategoryOrder') || '[]'),
      goalCategoryCollapsed: JSON.parse(localStorage.getItem('dl.goalCategoryCollapsed') || '{}')
    };
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from Supabase
  const loadSettings = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      // Load from Supabase first
      const [habitSettings, goalSettings] = await Promise.all([
        db.getCategorySettings(userId, 'habits'),
        db.getCategorySettings(userId, 'goals')
      ]);
      
      // Convert Supabase data to our format
      const habitOrder = Object.entries(habitSettings)
        .sort(([,a], [,b]) => a.order - b.order)
        .map(([name]) => name);
      const habitCollapsed = Object.fromEntries(
        Object.entries(habitSettings).map(([name, config]) => [name, config.isCollapsed])
      );

      const goalOrder = Object.entries(goalSettings)
        .sort(([,a], [,b]) => a.order - b.order)
        .map(([name]) => name);
      const goalCollapsed = Object.fromEntries(
        Object.entries(goalSettings).map(([name, config]) => [name, config.isCollapsed])
      );

      // Get current localStorage data
      const currentHabitOrder = JSON.parse(localStorage.getItem('dl.habitCategoryOrder') || '[]');
      const currentHabitCollapsed = JSON.parse(localStorage.getItem('dl.habitCategoryCollapsed') || '{}');
      const currentGoalOrder = JSON.parse(localStorage.getItem('dl.goalCategoryOrder') || '[]');
      const currentGoalCollapsed = JSON.parse(localStorage.getItem('dl.goalCategoryCollapsed') || '{}');

      // Only update state if Supabase data is different from localStorage
      const hasChanges = 
        JSON.stringify(habitOrder) !== JSON.stringify(currentHabitOrder) ||
        JSON.stringify(habitCollapsed) !== JSON.stringify(currentHabitCollapsed) ||
        JSON.stringify(goalOrder) !== JSON.stringify(currentGoalOrder) ||
        JSON.stringify(goalCollapsed) !== JSON.stringify(currentGoalCollapsed);

      if (hasChanges) {
        console.log('🔄 [DEBUG] Supabase data differs from localStorage, updating...');
        
        // Update state with Supabase data
        setSettings({
          habitCategoryOrder: habitOrder,
          habitCategoryCollapsed: habitCollapsed,
          goalCategoryOrder: goalOrder,
          goalCategoryCollapsed: goalCollapsed
        });
        
        // Update localStorage as cache
        localStorage.setItem('dl.habitCategoryOrder', JSON.stringify(habitOrder));
        localStorage.setItem('dl.habitCategoryCollapsed', JSON.stringify(habitCollapsed));
        localStorage.setItem('dl.goalCategoryOrder', JSON.stringify(goalOrder));
        localStorage.setItem('dl.goalCategoryCollapsed', JSON.stringify(goalCollapsed));
      } else {
        console.log('✅ [DEBUG] Supabase data matches localStorage, no update needed');
      }
      
    } catch (error) {
      console.error('Erro ao carregar configurações de categorias:', error);
      
      // Fallback to localStorage if Supabase fails
      setSettings({
        habitCategoryOrder: JSON.parse(localStorage.getItem('dl.habitCategoryOrder') || '[]'),
        habitCategoryCollapsed: JSON.parse(localStorage.getItem('dl.habitCategoryCollapsed') || '{}'),
        goalCategoryOrder: JSON.parse(localStorage.getItem('dl.goalCategoryOrder') || '[]'),
        goalCategoryCollapsed: JSON.parse(localStorage.getItem('dl.goalCategoryCollapsed') || '{}')
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Save habit category order
  const saveHabitCategoryOrder = useCallback(async (order: string[]) => {
    if (!userId) return;
    
    console.log('🔄 [DEBUG] saveHabitCategoryOrder called with:', order);
    
    try {
      // Update state immediately for UI responsiveness
      setSettings(prev => {
        // Prepare settings for Supabase using current state
        const settings: CategorySettingsGroup = {};
        order.forEach((categoryName, index) => {
          settings[categoryName] = {
            order: index,
            isCollapsed: prev.habitCategoryCollapsed[categoryName] || false
          };
        });
        
        console.log('🔄 [DEBUG] Saving to Supabase:', settings);
        
        // Save to Supabase
        db.saveCategorySettings(userId, 'habits', settings).then(() => {
          console.log('✅ [DEBUG] Successfully saved to Supabase');
        }).catch(error => {
          console.error('❌ [DEBUG] Erro ao salvar no Supabase:', error);
        });
        
        return { ...prev, habitCategoryOrder: order };
      });
      
      // Update localStorage as cache
      localStorage.setItem('dl.habitCategoryOrder', JSON.stringify(order));
      
    } catch (error) {
      console.error('❌ [DEBUG] Erro ao salvar ordem das categorias de hábitos:', error);
      // Revert state on error
      setSettings(prev => ({ ...prev, habitCategoryOrder: prev.habitCategoryOrder }));
    }
  }, [userId]);

  // Save goal category order
  const saveGoalCategoryOrder = useCallback(async (order: string[]) => {
    if (!userId) return;
    
    console.log('🔄 [DEBUG] saveGoalCategoryOrder called with:', order);
    
    try {
      // Update state immediately for UI responsiveness
      setSettings(prev => {
        // Prepare settings for Supabase using current state
        const settings: CategorySettingsGroup = {};
        order.forEach((categoryName, index) => {
          settings[categoryName] = {
            order: index,
            isCollapsed: prev.goalCategoryCollapsed[categoryName] || false
          };
        });
        
        console.log('🔄 [DEBUG] Saving to Supabase:', settings);
        
        // Save to Supabase
        db.saveCategorySettings(userId, 'goals', settings).then(() => {
          console.log('✅ [DEBUG] Successfully saved to Supabase');
        }).catch(error => {
          console.error('❌ [DEBUG] Erro ao salvar no Supabase:', error);
        });
        
        return { ...prev, goalCategoryOrder: order };
      });
      
      // Update localStorage as cache
      localStorage.setItem('dl.goalCategoryOrder', JSON.stringify(order));
      
    } catch (error) {
      console.error('❌ [DEBUG] Erro ao salvar ordem das categorias de metas:', error);
      // Revert state on error
      setSettings(prev => ({ ...prev, goalCategoryOrder: prev.goalCategoryOrder }));
    }
  }, [userId]);

  // Toggle habit category collapsed state
  const toggleHabitCategory = useCallback(async (categoryName: string) => {
    if (!userId) return;
    
    const newCollapsed = !settings.habitCategoryCollapsed[categoryName];
    
    try {
      // Update state immediately for UI responsiveness
      setSettings(prev => ({
        ...prev,
        habitCategoryCollapsed: { ...prev.habitCategoryCollapsed, [categoryName]: newCollapsed }
      }));
      
      // Save to Supabase
      await db.updateCategorySetting(userId, 'habits', categoryName, {
        isCollapsed: newCollapsed,
        order: settings.habitCategoryOrder.indexOf(categoryName)
      });
      
      // Update localStorage as cache
      localStorage.setItem('dl.habitCategoryCollapsed', JSON.stringify({
        ...settings.habitCategoryCollapsed,
        [categoryName]: newCollapsed
      }));
      
    } catch (error) {
      console.error('Erro ao salvar estado da categoria de hábito:', error);
      // Revert state on error
      setSettings(prev => ({
        ...prev,
        habitCategoryCollapsed: { ...prev.habitCategoryCollapsed, [categoryName]: !newCollapsed }
      }));
    }
  }, [userId, settings]);

  // Toggle goal category collapsed state
  const toggleGoalCategory = useCallback(async (categoryName: string) => {
    if (!userId) return;
    
    const newCollapsed = !settings.goalCategoryCollapsed[categoryName];
    
    try {
      // Update state immediately for UI responsiveness
      setSettings(prev => ({
        ...prev,
        goalCategoryCollapsed: { ...prev.goalCategoryCollapsed, [categoryName]: newCollapsed }
      }));
      
      // Save to Supabase
      await db.updateCategorySetting(userId, 'goals', categoryName, {
        isCollapsed: newCollapsed,
        order: settings.goalCategoryOrder.indexOf(categoryName)
      });
      
      // Update localStorage as cache
      localStorage.setItem('dl.goalCategoryCollapsed', JSON.stringify({
        ...settings.goalCategoryCollapsed,
        [categoryName]: newCollapsed
      }));
      
    } catch (error) {
      console.error('Erro ao salvar estado da categoria de meta:', error);
      // Revert state on error
      setSettings(prev => ({
        ...prev,
        goalCategoryCollapsed: { ...prev.goalCategoryCollapsed, [categoryName]: !newCollapsed }
      }));
    }
  }, [userId, settings]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    isLoading,
    loadSettings,
    saveHabitCategoryOrder,
    saveGoalCategoryOrder,
    toggleHabitCategory,
    toggleGoalCategory
  };
};