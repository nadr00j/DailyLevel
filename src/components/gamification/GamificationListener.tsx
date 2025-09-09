import { useEffect, useRef } from 'react'
import { useGamificationStore } from '@/stores/useGamificationStore'
import { toast } from '@/components/ui/use-toast'
import { Sparkles, Dumbbell, CheckSquare, Flag, Trophy } from 'lucide-react'
import { motion, animate } from 'framer-motion'
import { useState } from 'react'
import { fireGoldenConfetti } from '@/lib/confetti'
import { useShopStore } from '@/stores/useShopStore'

// rank helpers (copied from store)
const rankNames = ["Bronze","Prata","Ouro","Platina","Diamante","Champion","Grand Champ."] as const;

function calcRank(xp:number){
  if(xp>=4200) return {idx:24, tier:"God", div:0};
  const idx = Math.floor(xp/200); // 0..23
  const tierIdx = Math.floor(idx/3); // 0..6
  const div = (idx%3)+1; //1..3
  return {idx, tier:rankNames[tierIdx], div};
}

// contador animado
const CountUp: React.FC<{ to:number; prefix?:string; className?:string }> = ({ to, prefix='', className })=>{
  const [val,setVal] = useState(0)
  useEffect(()=>{
    const controls = animate(0,to,{duration:0.6,ease:'easeOut',onUpdate:v=>setVal(Math.floor(v))})
    return ()=>controls.stop()
  },[to])
  return <span className={className}>{prefix}{val}</span>
}

export const GamificationListener = () => {
  const xp = useGamificationStore(s=>s.xp)
  const coins = useGamificationStore(s=>s.coins)
  const rankIdx = useGamificationStore(s=>s.rankIdx)
  const history = useGamificationStore(s=>s.history)
  // Ready flag to skip initial history loads
  const ready = useRef<boolean>(false)
  const prevLen = useRef<number>(0)
  const initTime = useRef<number>(Date.now())

  // Enable listener after initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      ready.current = true;
      prevLen.current = history.length;
      console.log('[GamificationListener Debug] Listener ativado, histórico inicial:', history.length);
    }, 2000); // Aumentei para 2 segundos para garantir que o carregamento inicial termine
    return () => clearTimeout(timer);
  }, []);

  useEffect(()=>{
    if(!ready.current) {
      console.log('[GamificationListener Debug] Listener não pronto, ignorando mudanças iniciais');
      return;
    }
    
    // Ignora itens muito antigos (carregados do banco)
    const now = Date.now();
    const timeSinceInit = now - initTime.current;
    
    console.log('[GamificationListener Debug] useEffect executado:', { 
      historyLength: history.length, 
      prevLength: prevLen.current,
      timeSinceInit 
    });

    if(history.length > prevLen.current){
      const last = history[history.length-1];
      
      // Só mostra toast para itens criados após a inicialização
      if(last.ts && (now - last.ts) > timeSinceInit) {
        console.log('[GamificationListener Debug] Item muito antigo, ignorando toast');
        prevLen.current = history.length;
        return;
      }
      
      console.log('[GamificationListener Debug] Novo item no histórico detectado!');

      const dXp = last.xp
      const dCoins = last.coins

      let actionIcon = <Sparkles size={18} />
      let actionLabel = 'Ação'
      if(last){
        switch(last.type){
          case 'habit': actionIcon=<Dumbbell size={18}/>; actionLabel='Hábito'; break;
          case 'task': actionIcon=<CheckSquare size={18}/>; actionLabel='Tarefa'; break;
          case 'milestone': actionIcon=<Flag size={18}/>; actionLabel='Milestone'; break;
          case 'goal': actionIcon=<Trophy size={18}/>; actionLabel='Meta'; break;
        }
      }

      const emojiMap: Record<string,string> = {Habit:'🏋️',Tarefa:'✅',Milestone:'🚩',Meta:'🏆'} as any;

      const xpTotal = useGamificationStore.getState().xp;
      const rankIdx = useGamificationStore.getState().rankIdx;
      const rankTier = useGamificationStore.getState().rankTier;
      const rankDiv = useGamificationStore.getState().rankDiv;
      const nextRankXp = (rankIdx + 1) * 200;
      const xpPercent = (xpTotal/nextRankXp)*100;
      const roman = ['I','II','III'];
      const divLabel = rankDiv===0?'':roman[(rankDiv as number)-1];

      console.log('[GamificationListener Debug] Exibindo toast com:', { dXp, dCoins, actionLabel });
      
      toast({
        duration:2500,
        className:'bg-secondary text-white shadow-lg border',
        description:(
          <div className="flex flex-col gap-1 w-56 ml-12">
            <div className="flex items-center gap-2">
              <img src="/xp.png" alt="xp" className="w-6 h-6" />
              <span className="font-semibold"><CountUp to={dXp} prefix="+" /> XP</span>
              <span className="flex items-center gap-0.5 ml-auto animate-bounce">🪙<CountUp to={dCoins} prefix="+" className="font-semibold" /></span>
            </div>
            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-green-400"
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs opacity-70 flex items-center gap-1 mt-1">
              {rankTier && (
                <>
                  <img src={`/ranks/${rankTier.toUpperCase()} ${divLabel}.png`} alt={rankTier} className="w-4 h-4" />
                  {rankTier} {divLabel} · <CountUp to={xpTotal}/> /{nextRankXp} XP
                </>
              )}
            </span>
          </div>
        )
      })
      
      console.log('[GamificationListener Debug] Toast exibido com sucesso!');
      
      // Trigger confetti if enabled
      const { confettiEnabled } = useShopStore.getState();
      if (confettiEnabled) {
        fireGoldenConfetti();
      }
      
      prevLen.current = history.length
    }
  },[history.length])

  return null
}
