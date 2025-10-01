import React, { useState } from 'react';
import { 
  findCanonicalCategory, 
  suggestCategories, 
  areCategoriesEquivalent,
  getCategoryVariations 
} from '@/lib/categoryUtils';
import { CATEGORY_META } from '@/hooks/useActiveCategories';
import { CategoryPicker } from '@/components/pickers/CategoryPicker';
import { Button } from '@/components/ui/button';

export const CategoryNormalizationTest: React.FC = () => {
  const [testInput, setTestInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [pickerValue, setPickerValue] = useState<string>('');
  const [multiPickerValue, setMultiPickerValue] = useState<string[]>([]);

  const handleInputChange = (value: string) => {
    setTestInput(value);
    setSuggestions(suggestCategories(value));
  };

  const canonical = findCanonicalCategory(testInput);
  const meta = CATEGORY_META[canonical] || { icon: '🏷️', color: 'text-gray-400', displayName: canonical };

  // Exemplos de teste - incluindo casos problemáticos mencionados
  const testCases = [
    // Casos problemáticos específicos
    'Saude', // deve virar "Saúde"
    'saude', // deve virar "Saúde"
    'imagem-pessoal', // deve virar "Imagem Pessoal"
    'imagem pessoal', // deve virar "Imagem Pessoal"
    
    // Outros casos de teste
    'produtividade',
    'PRODUTIVIDADE', 
    'Produtividade',
    'produção',
    'eficiencia',
    'organizacao',
    'financas',
    'FINANÇAS',
    'dinheiro',
    'investimento',
    'exercicio',
    'musculacao',
    'treino',
    'academia',
    'nutricao',
    'alimentacao',
    'dieta',
    'saúde',
    'bem estar',
    'meditacao',
    'mindfulness',
    'arte',
    'criatividade',
    'estudo',
    'educacao',
    'aprendizado',
    'curso'
  ];

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Teste de Normalização de Categorias
      </h2>
      
      {/* Input de teste */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Digite uma categoria para testar:
        </label>
        <input
          type="text"
          value={testInput}
          onChange={(e) => handleInputChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Ex: produtividade, financas, exercicio..."
        />
      </div>

      {/* Resultado da normalização */}
      {testInput && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Resultado:</h3>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{meta.icon}</span>
            <span className={`font-medium ${meta.color}`}>{meta.displayName}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              (normalizado de: "{testInput}")
            </span>
          </div>
        </div>
      )}

      {/* Sugestões */}
      {suggestions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Sugestões:</h3>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => {
              const suggestionMeta = CATEGORY_META[suggestion];
              return (
                <button
                  key={suggestion}
                  onClick={() => setTestInput(suggestion)}
                  className="flex items-center space-x-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  <span>{suggestionMeta?.icon}</span>
                  <span>{suggestion}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Casos problemáticos em destaque */}
      <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <h3 className="text-lg font-semibold mb-4 text-red-900 dark:text-red-100">
          🔧 Casos Problemáticos Corrigidos:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {['Saude', 'saude', 'imagem-pessoal', 'imagem pessoal'].map((testCase) => {
            const result = findCanonicalCategory(testCase);
            const resultMeta = CATEGORY_META[result] || { icon: '🏷️', color: 'text-gray-400', displayName: result };
            
            return (
              <div
                key={testCase}
                className="p-3 border border-red-200 dark:border-red-700 rounded-lg bg-white dark:bg-red-900/10"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-600 dark:text-red-400 font-mono">"{testCase}"</span>
                  <span className="text-xs text-red-500">→</span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-lg">{resultMeta.icon}</span>
                  <span className={`text-sm font-medium ${resultMeta.color}`}>
                    {resultMeta.displayName}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Casos de teste */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Todos os Casos de Teste:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {testCases.map((testCase) => {
            const result = findCanonicalCategory(testCase);
            const resultMeta = CATEGORY_META[result] || { icon: '🏷️', color: 'text-gray-400', displayName: result };
            
            return (
              <div
                key={testCase}
                className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                onClick={() => setTestInput(testCase)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">"{testCase}"</span>
                  <span className="text-xs text-gray-500">→</span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-lg">{resultMeta.icon}</span>
                  <span className={`text-sm font-medium ${resultMeta.color}`}>
                    {resultMeta.displayName}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Informações sobre variações */}
      {testInput && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
            Variações aceitas para "{canonical}":
          </h3>
          <div className="flex flex-wrap gap-2">
            {getCategoryVariations(canonical).map((variation) => (
              <span
                key={variation}
                className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-sm"
              >
                {variation}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Demonstração do CategoryPicker */}
      <div className="mt-8 p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Demonstração do CategoryPicker
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Seleção única */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">Seleção Única:</h4>
            <CategoryPicker
              value={pickerValue}
              onChange={(value) => setPickerValue(Array.isArray(value) ? value[0] || '' : value)}
              placeholder="Escolha uma categoria"
            />
            {pickerValue && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Selecionado: <strong>{pickerValue}</strong>
              </div>
            )}
          </div>

          {/* Seleção múltipla */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">Seleção Múltipla:</h4>
            <CategoryPicker
              value={multiPickerValue}
              onChange={(value) => setMultiPickerValue(Array.isArray(value) ? value : [value].filter(Boolean))}
              multiple={true}
              placeholder="Escolha categorias"
            />
            {multiPickerValue.length > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Selecionadas: <strong>{multiPickerValue.join(', ')}</strong>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setPickerValue('');
              setMultiPickerValue([]);
            }}
          >
            Limpar Seleções
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setPickerValue('produtividade');
              setMultiPickerValue(['financas', 'exercicio', 'nutricao']);
            }}
          >
            Testar Normalização
          </Button>
        </div>
      </div>
    </div>
  );
};
