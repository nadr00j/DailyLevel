import { useEffect } from 'react';
import { useGamificationStore } from '@/stores/useGamificationStore';

export const useVitalityUpdate = () => {
  const init = useGamificationStore(state => state.init);

  useEffect(() => {
    // Recalcular vitalidade ao montar o componente
    init();

    // Recalcular vitalidade a cada hora
    const interval = setInterval(() => {
      init();
    }, 60 * 60 * 1000); // 1 hora

    return () => clearInterval(interval);
  }, [init]);
};
