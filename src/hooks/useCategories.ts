import { useMemo } from 'react';
import { 
  findCanonicalCategory, 
  suggestCategories, 
  areCategoriesEquivalent,
  getCategoryVariations 
} from '@/lib/categoryUtils';
import { CATEGORY_META } from '@/hooks/useActiveCategories';

export interface CategoryInfo {
  canonical: string;
  displayName: string;
  icon: string;
  color: string;
  variations: string[];
}

export const useCategories = () => {
  // Função para normalizar uma categoria
  const normalizeCategory = (category: string): string => {
    return findCanonicalCategory(category);
  };

  // Função para obter informações completas de uma categoria
  const getCategoryInfo = (category: string): CategoryInfo => {
    const canonical = findCanonicalCategory(category);
    const meta = CATEGORY_META[canonical] || {
      icon: '🏷️',
      color: 'text-gray-400',
      displayName: canonical
    };

    return {
      canonical,
      displayName: meta.displayName,
      icon: meta.icon,
      color: meta.color,
      variations: getCategoryVariations(canonical)
    };
  };

  // Função para obter sugestões de categorias
  const getSuggestions = (input: string, limit?: number): CategoryInfo[] => {
    const suggestions = suggestCategories(input, limit);
    return suggestions.map(getCategoryInfo);
  };

  // Função para verificar se duas categorias são equivalentes
  const areEquivalent = (cat1: string, cat2: string): boolean => {
    return areCategoriesEquivalent(cat1, cat2);
  };

  // Lista de todas as categorias disponíveis
  const allCategories = useMemo(() => {
    return Object.keys(CATEGORY_META).map(getCategoryInfo);
  }, []);

  // Função para validar se uma categoria existe
  const isValidCategory = (category: string): boolean => {
    const canonical = findCanonicalCategory(category);
    return canonical in CATEGORY_META;
  };

  // Função para filtrar categorias por texto
  const filterCategories = (searchText: string): CategoryInfo[] => {
    if (!searchText.trim()) return allCategories;
    
    return allCategories.filter(cat => 
      cat.canonical.toLowerCase().includes(searchText.toLowerCase()) ||
      cat.variations.some(variation => 
        variation.toLowerCase().includes(searchText.toLowerCase())
      )
    );
  };

  return {
    normalizeCategory,
    getCategoryInfo,
    getSuggestions,
    areEquivalent,
    allCategories,
    isValidCategory,
    filterCategories
  };
};
