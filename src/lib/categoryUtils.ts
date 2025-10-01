/**
 * Utilitários para normalização e mapeamento de categorias
 */

// Função para remover acentos e caracteres especiais
export function removeAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .trim();
}

// Função para normalizar texto (lowercase, sem acentos, sem espaços extras)
export function normalizeText(text: string): string {
  return removeAccents(text)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// Mapeamento de categorias com suas variações possíveis
export const CATEGORY_ALIASES: Record<string, string[]> = {
  'Arte': ['arte', 'artes', 'artistica', 'artísticas', 'criatividade', 'criativo'],
  'Estudo': ['estudo', 'estudos', 'educacao', 'educação', 'aprendizado', 'aprender', 'curso', 'cursos'],
  'Leitura': ['leitura', 'ler', 'livro', 'livros', 'literatura'],
  'Finanças': ['financas', 'finanças', 'dinheiro', 'economia', 'economico', 'econômico', 'investimento', 'investimentos'],
  'Fitness': ['fitness', 'exercicio', 'exercício', 'exercicios', 'exercícios', 'academia', 'treino', 'musculacao', 'musculação'],
  'Nutrição': ['nutricao', 'nutrição', 'alimentacao', 'alimentação', 'dieta', 'comida', 'saude alimentar', 'saúde alimentar'],
  'Saúde': ['saude', 'saúde', 'medico', 'médico', 'medicina', 'bem estar', 'bem-estar', 'Saude'],
  'Mente': ['mente', 'mental', 'psicologia', 'psicológico', 'meditacao', 'meditação', 'mindfulness'],
  'Social': ['social', 'amigos', 'familia', 'família', 'relacionamentos', 'networking'],
  'Trabalho': ['trabalho', 'profissional', 'carreira', 'emprego', 'job', 'office'],
  'Casa': ['casa', 'lar', 'domestico', 'doméstico', 'limpeza', 'organizacao', 'organização'],
  'Imagem Pessoal': ['imagem pessoal', 'imagem-pessoal', 'aparencia', 'aparência', 'beleza', 'estilo', 'moda', 'cuidados pessoais'],
  'Hobbies': ['hobbies', 'hobby', 'lazer', 'diversao', 'diversão', 'entretenimento', 'passatempo'],
  'Produtividade': ['produtividade', 'produtivo', 'eficiencia', 'eficiência', 'organizacao', 'organização', 'gestao', 'gestão'],
  'Dormir': ['dormir', 'sono', 'descanso', 'descansar', 'sleep'],
  'Pessoal': ['pessoal', 'individual', 'proprio', 'próprio', 'desenvolvimento pessoal'],
  'Sem Categoria': ['sem categoria', 'sem categorias', 'outros', 'geral', 'diversos', 'variados']
};

// Função para encontrar a categoria canônica baseada em aliases
export function findCanonicalCategory(input: string): string {
  if (!input || typeof input !== 'string') {
    return 'Sem Categoria';
  }

  const normalized = normalizeText(input);
  
  // Primeiro, tenta match exato com as chaves principais
  for (const [canonical, aliases] of Object.entries(CATEGORY_ALIASES)) {
    if (normalizeText(canonical) === normalized) {
      return canonical;
    }
  }
  
  // Depois, procura nos aliases
  for (const [canonical, aliases] of Object.entries(CATEGORY_ALIASES)) {
    if (aliases.some(alias => normalizeText(alias) === normalized)) {
      return canonical;
    }
  }
  
  // Se não encontrou, retorna o input formatado
  return input.trim().replace(/\b\w/g, c => c.toUpperCase());
}

// Função para verificar se duas categorias são equivalentes
export function areCategoriesEquivalent(cat1: string, cat2: string): boolean {
  const canonical1 = findCanonicalCategory(cat1);
  const canonical2 = findCanonicalCategory(cat2);
  return canonical1 === canonical2;
}

// Função para obter todas as variações de uma categoria
export function getCategoryVariations(category: string): string[] {
  const canonical = findCanonicalCategory(category);
  return CATEGORY_ALIASES[canonical] || [category];
}

// Função para sugerir categorias baseada em texto parcial
export function suggestCategories(partialText: string, limit: number = 5): string[] {
  if (!partialText || partialText.length < 2) {
    return [];
  }

  const normalized = normalizeText(partialText);
  const suggestions: string[] = [];

  // Procura em todas as categorias e aliases
  for (const [canonical, aliases] of Object.entries(CATEGORY_ALIASES)) {
    // Verifica se a categoria canônica contém o texto
    if (normalizeText(canonical).includes(normalized)) {
      suggestions.push(canonical);
      continue;
    }

    // Verifica se algum alias contém o texto
    const matchingAlias = aliases.find(alias => 
      normalizeText(alias).includes(normalized)
    );
    
    if (matchingAlias && !suggestions.includes(canonical)) {
      suggestions.push(canonical);
    }
  }

  return suggestions.slice(0, limit);
}
