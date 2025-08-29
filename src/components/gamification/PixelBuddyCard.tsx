import { motion } from 'framer-motion'
import { useGamificationStore } from '@/stores/useGamificationStore'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useShopStore } from '@/stores/useShopStore'
import { ShoppingBag } from 'lucide-react'
import { PixelBuddyRenderer } from '@/components/gamification/PixelBuddyRenderer'

function tierFromVitality(v: number) {
  if (v < 26) return 'seedling'
  if (v < 61) return 'runner'
  if (v < 91) return 'strong'
  return 'epic'
}

export const PixelBuddyCard = () => {
  const vitality = useGamificationStore(s=>s.vitality)
  const aspect   = useGamificationStore(s=>s.aspect)
  const mood     = useGamificationStore(s=>s.mood)
  const rankIdx  = useGamificationStore(s=>s.rankIdx)
  const coins    = useGamificationStore(s=>s.coins)
  const xp       = useGamificationStore(s=>s.xp)
  const rankTier = useGamificationStore(s=>s.rankTier)
  const rankDiv  = useGamificationStore(s=>s.rankDiv)
  const roman = ['I','II','III']
  const divLabel = rankDiv===0?'' : roman[(rankDiv as number)-1]
  const nextRankXp = (rankIdx + 1) * 200
  const xpPercent = (xp / nextRankXp) * 100

  const sprite = `/sprites/buddy/v1/${aspect}/${tierFromVitality(vitality)}_${mood}.png`

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="flex items-start gap-4 p-4">
        {/* PixelBuddy à esquerda */}
        <div className="flex flex-col items-center">
          <PixelBuddyRenderer size={128} />
        </div>

        {/* Stats à direita */}
        <div className="flex-1 space-y-1" style={{ marginTop: '10px' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
            {rankTier && <img src={`/ranks/${rankTier.toUpperCase()} ${divLabel}.png`} alt={rankTier} className="w-7 h-7" />}
            <span className="font-semibold">{rankTier} {divLabel}</span>
            </div>
            <div 
              className="flex items-center gap-1"
              style={{
                backgroundColor: '#e8b71e59',
                padding: '1px 5px 1px 8px',
                borderRadius: '10px',
                border: 'solid',
                borderWidth: '2px',
                borderColor: '#fdc14e'
              }}
            >
              <span className="font-semibold">{coins}</span>
              <span className="text-lg">🪙</span>
            </div>
          </div>
          {/* Vitalidade em corações SVG */}
          <div className="flex gap-[0.225rem]" style={{ marginTop: '10px', marginBottom: '10px' }}>
            {Array.from({ length: 10 }).map((_, i) => {
              const filled = i < Math.round(vitality / 10);
              return (
                <svg
                  key={i}
                  width="14" height="14" viewBox="0 0 24 24"
                  fill={filled ? '#ef4444' : 'none'}
                  stroke={filled ? '#ef4444' : '#555'}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d="M12 21C12 21 4 13.5 4 8.5C4 5.42 6.42 3 9.5 3C11.24 3 12.91 3.81 14 5.08C15.09 3.81 16.76 3 18.5 3C21.58 3 24 5.42 24 8.5C24 13.5 16 21 16 21H12Z" />
                </svg>
              );
            })}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <img src="/xp.png" alt="xp" className="w-6 h-6" />
            {xp}/{nextRankXp}
          </div>
          <Progress value={xpPercent} className="h-1 bg-muted" />
        </div>
      </CardContent>
      {/* Botão da Loja na parte inferior */}
      <div className="p-4 pt-0">
        <button
          onClick={() => useShopStore.getState().openShop()}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-all duration-200 hover:scale-[1.02] shadow-lg"
          style={{
            background: 'linear-gradient(119deg, rgb(34, 197, 94) 0%, rgb(22 153 70) 50%, rgb(12 255 103) 100%)',
            color: 'white',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
          }}
          title="Abrir Loja e Inventário"
        >
          <ShoppingBag className="h-4 w-4" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
          <span className="font-medium">Loja e Inventário</span>
        </button>
      </div>
    </Card>
  )
}
