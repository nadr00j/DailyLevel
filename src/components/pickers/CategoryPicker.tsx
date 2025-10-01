import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, Plus, Search, X } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import clsx from 'clsx';
import * as LucideIcons from 'lucide-react';

interface CategoryPickerProps {
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
  allowCustom?: boolean;
  showSearch?: boolean;
}

export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  value,
  onChange,
  multiple = false,
  placeholder = "Selecione uma categoria",
  className,
  allowCustom = true,
  showSearch = true
}) => {
  const { allCategories, getSuggestions, getCategoryInfo, normalizeCategory } = useCategories();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');

  // Normalizar valores selecionados
  const selectedValues = useMemo(() => {
    if (!value) return [];
    const values = Array.isArray(value) ? value : [value];
    return values.map(normalizeCategory);
  }, [value, normalizeCategory]);

  // Filtrar categorias baseado na busca
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return allCategories;
    
    const suggestions = getSuggestions(searchTerm, 10);
    return suggestions.length > 0 ? suggestions : allCategories.filter(cat =>
      cat.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.variations.some(variation => 
        variation.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, allCategories, getSuggestions]);

  const handleCategorySelect = (categoryName: string) => {
    const canonical = normalizeCategory(categoryName);
    
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : (value ? [value] : []);
      const normalizedCurrent = currentValues.map(normalizeCategory);
      
      if (normalizedCurrent.includes(canonical)) {
        // Remove se já está selecionado
        const newValues = currentValues.filter(v => normalizeCategory(v) !== canonical);
        onChange(newValues);
      } else {
        // Adiciona se não está selecionado
        onChange([...currentValues, canonical]);
      }
    } else {
      onChange(canonical);
      setIsOpen(false);
    }
    
    setSearchTerm('');
  };

  const handleCustomAdd = () => {
    if (!customValue.trim()) return;
    
    const canonical = normalizeCategory(customValue.trim());
    handleCategorySelect(canonical);
    setCustomValue('');
    setShowCustomInput(false);
  };

  const handleRemove = (categoryToRemove: string) => {
    const canonical = normalizeCategory(categoryToRemove);
    
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : (value ? [value] : []);
      const newValues = currentValues.filter(v => normalizeCategory(v) !== canonical);
      onChange(newValues);
    } else {
      onChange('');
    }
  };

  const getDisplayText = () => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return placeholder;
    }
    
    if (multiple && Array.isArray(value)) {
      return `${value.length} categoria${value.length !== 1 ? 's' : ''} selecionada${value.length !== 1 ? 's' : ''}`;
    }
    
    const categoryInfo = getCategoryInfo(Array.isArray(value) ? value[0] : value);
    return categoryInfo.displayName;
  };

  return (
    <div className={clsx('relative', className)}>
      {/* Botão principal */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <span className="truncate">{getDisplayText()}</span>
        <ChevronDown size={16} className={clsx('transition-transform', { 'rotate-180': isOpen })} />
      </Button>

      {/* Tags selecionadas (modo múltiplo) */}
      {multiple && selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedValues.map((categoryName) => {
            const categoryInfo = getCategoryInfo(categoryName);
            return (
              <div
                key={categoryName}
                className="flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
              >
                <span>{categoryInfo.icon}</span>
                <span>{categoryInfo.displayName}</span>
                <button
                  onClick={() => handleRemove(categoryName)}
                  className="hover:bg-secondary-foreground/20 rounded p-0.5"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-80 overflow-hidden">
          {/* Campo de busca */}
          {showSearch && (
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8"
                />
              </div>
            </div>
          )}

          {/* Lista de categorias */}
          <div className="max-h-60 overflow-y-auto">
            {filteredCategories.map((category) => {
              const isSelected = selectedValues.includes(category.canonical);
              
              return (
                <button
                  key={category.canonical}
                  onClick={() => handleCategorySelect(category.canonical)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent transition-colors',
                    isSelected && 'bg-accent'
                  )}
                >
                  <span className="text-lg">{category.icon}</span>
                  <div className="flex-1">
                    <div className={clsx('font-medium', category.color)}>
                      {category.displayName}
                    </div>
                    {searchTerm && category.variations.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Também: {category.variations.slice(0, 3).join(', ')}
                        {category.variations.length > 3 && '...'}
                      </div>
                    )}
                  </div>
                  {isSelected && multiple && (
                    <div className="w-4 h-4 bg-primary rounded-sm flex items-center justify-center">
                      <div className="w-2 h-2 bg-primary-foreground rounded-sm" />
                    </div>
                  )}
                </button>
              );
            })}

            {/* Opção de categoria personalizada */}
            {allowCustom && (
              <>
                {!showCustomInput ? (
                  <button
                    onClick={() => setShowCustomInput(true)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent transition-colors border-t border-border"
                  >
                    <Plus size={16} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Criar categoria personalizada</span>
                  </button>
                ) : (
                  <div className="p-2 border-t border-border">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nome da categoria"
                        value={customValue}
                        onChange={(e) => setCustomValue(e.target.value)}
                        className="flex-1 h-8"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCustomAdd();
                          }
                          if (e.key === 'Escape') {
                            setShowCustomInput(false);
                            setCustomValue('');
                          }
                        }}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={handleCustomAdd}
                        disabled={!customValue.trim()}
                      >
                        Adicionar
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {filteredCategories.length === 0 && !allowCustom && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Nenhuma categoria encontrada
            </div>
          )}
        </div>
      )}

      {/* Overlay para fechar o dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false);
            setShowCustomInput(false);
            setCustomValue('');
            setSearchTerm('');
          }}
        />
      )}
    </div>
  );
};
