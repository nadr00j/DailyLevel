import React from 'react';
import { ActiveCategory } from '@/hooks/useActiveCategories';

interface RadarChartProps {
  categories: ActiveCategory[];
  size?: number;
  className?: string;
}

export const RadarChart: React.FC<RadarChartProps> = ({ 
  categories, 
  size = 300,
  className = ""
}) => {
  // Aumentar o tamanho do container para acomodar os labels
  const containerSize = size + 80; // +80px para os labels (reduzido para não quebrar layout)
  
  if (categories.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width: containerSize, height: containerSize }}>
        <div className="text-center text-muted-foreground">
          <p>Nenhuma categoria ativa</p>
          <p className="text-sm">Crie hábitos, tarefas ou metas para ver seu radar</p>
        </div>
      </div>
    );
  }

  // Limitar a 10 categorias para melhor visualização
  const displayCategories = categories.slice(0, 10);
  const numCategories = displayCategories.length;
  
  // Configurações do radar - ajustar para o novo tamanho
  const centerX = containerSize / 2;
  const centerY = containerSize / 2;
  const radius = Math.min(centerX, centerY) * 0.6; // Reduzir para dar mais espaço aos labels
  const levels = 5; // 5 níveis como na imagem
  
  // Calcular ângulos para cada categoria
  const angleStep = (2 * Math.PI) / numCategories;
  const startAngle = -Math.PI / 2; // Começar do topo
  
  // Gerar pontos para o grid (círculos concêntricos)
  const generateGridPoints = () => {
    const points = [];
    for (let level = 1; level <= levels; level++) {
      const currentRadius = (radius * level) / levels;
      const levelPoints = [];
      
      for (let i = 0; i < numCategories; i++) {
        const angle = startAngle + i * angleStep;
        const x = centerX + currentRadius * Math.cos(angle);
        const y = centerY + currentRadius * Math.sin(angle);
        levelPoints.push({ x, y });
      }
      
      points.push(levelPoints);
    }
    return points;
  };
  
  // Gerar pontos para os dados (polígono azul)
  const generateDataPoints = () => {
    return displayCategories.map((category, i) => {
      const angle = startAngle + i * angleStep;
      const normalizedScore = category.score / 100; // Normalizar para 0-1
      const currentRadius = radius * normalizedScore;
      const x = centerX + currentRadius * Math.cos(angle);
      const y = centerY + currentRadius * Math.sin(angle);
      return { x, y, category };
    });
  };
  
  // Gerar linhas radiais (eixos)
  const generateRadialLines = () => {
    return displayCategories.map((category, i) => {
      const angle = startAngle + i * angleStep;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return { x, y, category, angle };
    });
  };
  
  // Gerar posições dos labels
  const generateLabels = () => {
    return displayCategories.map((category, i) => {
      const angle = startAngle + i * angleStep;
      const labelRadius = radius + 20; // Labels mais próximos do radar
      const x = centerX + labelRadius * Math.cos(angle);
      const y = centerY + labelRadius * Math.sin(angle);
      return { x, y, category, angle };
    });
  };
  
  const gridPoints = generateGridPoints();
  const dataPoints = generateDataPoints();
  const radialLines = generateRadialLines();
  const labels = generateLabels();
  
  // Criar path para o polígono de dados
  const dataPath = dataPoints.length > 0 
    ? `M ${dataPoints.map(p => `${p.x} ${p.y}`).join(' L ')} Z`
    : '';
  
  // Criar paths para os círculos do grid
  const gridPaths = gridPoints.map(levelPoints => {
    if (levelPoints.length === 0) return '';
    return `M ${levelPoints.map(p => `${p.x} ${p.y}`).join(' L ')} Z`;
  });
  
  // Criar paths para as linhas radiais
  const radialPaths = radialLines.map(line => 
    `M ${centerX} ${centerY} L ${line.x} ${line.y}`
  );

  return (
    <div className={`relative mx-auto ${className}`} style={{ width: containerSize, height: containerSize }}>
      <svg
        width={containerSize}
        height={containerSize}
        viewBox={`0 0 ${containerSize} ${containerSize}`}
        className="absolute inset-0"
      >
        {/* Grid - círculos concêntricos */}
        {gridPaths.map((path, index) => (
          <path
            key={`grid-${index}`}
            d={path}
            fill="none"
            stroke="#374151"
            strokeWidth="1"
            opacity="0.3"
          />
        ))}
        
        {/* Linhas radiais */}
        {radialPaths.map((path, index) => (
          <path
            key={`radial-${index}`}
            d={path}
            fill="none"
            stroke="#374151"
            strokeWidth="1"
            opacity="0.3"
          />
        ))}
        
        {/* Polígono de dados - preenchimento */}
        <path
          d={dataPath}
          fill="rgba(34, 197, 94, 0.3)"
          stroke="rgb(34, 197, 94)"
          strokeWidth="2"
        />
        
        {/* Pontos de dados */}
        {dataPoints.map((point, index) => (
          <circle
            key={`point-${index}`}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="rgb(34, 197, 94)"
            stroke="white"
            strokeWidth="2"
          />
        ))}
        
        {/* Labels das categorias */}
        {labels.map((label, index) => {
          const textAnchor = Math.abs(Math.cos(label.angle)) < 0.1 ? 'middle' : 
                           Math.cos(label.angle) > 0 ? 'start' : 'end';
          const dominantBaseline = Math.abs(Math.sin(label.angle)) < 0.1 ? 'middle' : 
                                 Math.sin(label.angle) > 0 ? 'hanging' : 'auto';
          
          return (
            <text
              key={`label-${index}`}
              x={label.x}
              y={label.y}
              textAnchor={textAnchor}
              dominantBaseline={dominantBaseline}
              className="text-xs font-medium fill-foreground"
              style={{ fontSize: '10px', letterSpacing: '-0.5px' }}
            >
              {label.category.displayName}
            </text>
          );
        })}
      </svg>
      
      
    </div>
  );
};
