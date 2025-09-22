import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useGamificationStoreV21 } from '@/stores/useGamificationStoreV21'
import { useAnimationStore } from '@/stores/useAnimationStore'
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
  const { pixelBuddyAnimationCount, incrementPixelBuddyAnimation } = useAnimationStore()
  const { vitality, mood } = useGamificationStoreV21()
  const aspect   = useGamificationStoreV21(s=>s.aspect)
  const rankIdx  = useGamificationStoreV21(s=>s.rankIdx)
  const coins    = useGamificationStoreV21(s=>s.coins)
  const xp       = useGamificationStoreV21(s=>s.xp)
  const rankTier = useGamificationStoreV21(s=>s.rankTier)
  const rankDiv  = useGamificationStoreV21(s=>s.rankDiv)
  const roman = ['I','II','III']
  const divLabel = rankDiv===0?'' : roman[(rankDiv as number)-1]
  const nextRankXp = (rankIdx + 1) * 200
  const xpPercent = (xp / nextRankXp) * 100

  const sprite = `/sprites/buddy/v1/${aspect}/${tierFromVitality(vitality)}_${mood}.png`

  // Se contador = 0, é a primeira vez, então anima
  const shouldAnimate = pixelBuddyAnimationCount === 0

  // Delay para carregar o card com todas as informações (apenas na primeira vez)
  useEffect(() => {
    if (shouldAnimate) {
      const timer = setTimeout(() => {
        incrementPixelBuddyAnimation() // Incrementa o contador
      }, 800) // 800ms de delay apenas na primeira vez

      return () => clearTimeout(timer)
    }
  }, [shouldAnimate, incrementPixelBuddyAnimation])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="flex items-start gap-4 p-4">
        {/* PixelBuddy à esquerda */}
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: shouldAnimate ? 0 : 1, 
              scale: shouldAnimate ? 0.8 : 1 
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <PixelBuddyRenderer size={128} />
          </motion.div>
        </div>

        {/* Stats à direita */}
        <motion.div 
          className="flex-1 space-y-1" 
          style={{ marginTop: '10px' }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ 
            opacity: shouldAnimate ? 0 : 1, 
            x: shouldAnimate ? 20 : 0 
          }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        >
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
          <motion.div 
            className="flex gap-[0.225rem]" 
            style={{ marginTop: '10px', marginBottom: '10px' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: shouldAnimate ? 0 : 1, 
              y: shouldAnimate ? 10 : 0 
            }}
            transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
          >
            {Array.from({ length: 10 }).map((_, i) => {
              const filled = i < Math.round(vitality / 10);
              return (
                <motion.svg
                  key={i}
                  width="14" height="14" viewBox="0 0 24 24"
                  fill={filled ? '#ef4444' : 'none'}
                  stroke={filled ? '#ef4444' : '#555'}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  initial={{ scale: 0 }}
                  animate={{ scale: shouldAnimate ? 0 : 1 }}
                  transition={{ duration: 0.3, delay: 0.6 + (i * 0.05) }}
                >
                  <path d="M12 21C12 21 4 13.5 4 8.5C4 5.42 6.42 3 9.5 3C11.24 3 12.91 3.81 14 5.08C15.09 3.81 16.76 3 18.5 3C21.58 3 24 5.42 24 8.5C24 13.5 16 21 16 21H12Z" />
                </motion.svg>
              );
            })}
          </motion.div>
          <motion.div 
            className="text-xs text-muted-foreground flex items-center gap-1 mt-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: shouldAnimate ? 0 : 1, 
              y: shouldAnimate ? 10 : 0 
            }}
            transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
          >
            <img src="/xp.png" alt="xp" className="w-6 h-6" />
            {xp}/{nextRankXp}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ 
              opacity: shouldAnimate ? 0 : 1, 
              scaleX: shouldAnimate ? 0 : 1 
            }}
            transition={{ duration: 0.5, delay: 0.8, ease: "easeOut" }}
            style={{ transformOrigin: 'left' }}
          >
            <Progress value={xpPercent} className="h-1 bg-muted" />
          </motion.div>
        </motion.div>
      </CardContent>
      {/* Botão da Loja na parte inferior */}
      <motion.div 
        className="p-4 pt-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: shouldAnimate ? 0 : 1, 
          y: shouldAnimate ? 20 : 0 
        }}
        transition={{ duration: 0.5, delay: 1.0, ease: "easeOut" }}
      >
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
      </motion.div>
    </Card>
  )
}
