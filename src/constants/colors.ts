// Paleta de 20 cores inspirada no HabitKit
// Ordem pensada para oferecer variedade e acessibilidade de cores.
export const HABIT_COLORS: string[] = [
  // Vermelhos / Laranjas / Amarelos
  '#EF4444', '#F97316', '#FF9E00', '#FFB703', '#F59E0B',
  // Verdes
  '#84CC16', '#22C55E', '#10B981',
  // Azuis esverdeados / Ciano
  '#14B8A6', '#06B6D4', '#0EA5E9',
  // Azuis / Roxos
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#5B21B6', '#D946EF',
  // Rosas
  '#EC4899', '#F43F5E',
  // Branco
  '#F5F5F5',
  // Neutros
  '#9CA3AF', '#6B7280', '#374151'
];

// Utilitário interno: converte um valor (0-255) para string hexadecimal de 2 dígitos
const toHex = (v: number) => v.toString(16).padStart(2, '0');

// Aplica um blend simples entre a cor base e branco para gerar tonalidades mais claras.
function lighten(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);

  const newR = Math.round(r + (255 - r) * amount);
  const newG = Math.round(g + (255 - g) * amount);
  const newB = Math.round(b + (255 - b) * amount);

  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

/**
 * Retorna um array de 4 cores para heatmap do mais claro (nenhum progresso)
 * ao mais intenso (progresso completo).
 * @param baseColor Cor base do hábito (hex)
 */
export function getHeatmapScale(baseColor: string): [string, string, string, string] {
  // Intensidades: 0%, 33%, 66%, 100% de blend com branco
  return [
    lighten(baseColor, 0.8),
    lighten(baseColor, 0.5),
    lighten(baseColor, 0.25),
    baseColor
  ];
}
