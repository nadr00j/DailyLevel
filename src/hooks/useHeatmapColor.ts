import { useMemo } from 'react';
import { getHeatmapScale } from '@/constants/colors';

/**
 * Retorna a cor apropriada para um valor de progresso (0..1) dado a cor base.
 * @param baseColor Cor base do hábito
 * @param ratio Progresso entre 0 e 1
 */
export function useHeatmapColor(baseColor: string, ratio: number): string {
  return useMemo(() => {
    const scale = getHeatmapScale(baseColor);
    if (ratio <= 0) return scale[0];
    if (ratio < 0.33) return scale[1];
    if (ratio < 0.66) return scale[2];
    return scale[3];
  }, [baseColor, ratio]);
}
