import { Trophy } from 'lucide-react';
import { useVictoryDialog } from '@/stores/useVictoryDialog';
import { motion } from 'framer-motion';
import { useEffect } from 'react';

export const VictoryDialog = () => {
  const { open, title, points, icon, close } = useVictoryDialog();

  console.log('VictoryDialog render:', { open, title, points, icon });

  // Auto close after 2 seconds
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        close();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [open, close]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 15 }}
            className="bg-[#1c1c1e] border-none text-center flex flex-col items-center gap-3 rounded-xl max-w-xs p-6 text-white"
          >
            <motion.div
              initial={{ scale: 0.6, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 15 }}
              className="rounded-full bg-[#ffffff0d] p-4 shadow-lg"
            >
              {icon ? <img src={icon} alt="icon" className="w-12 h-12" /> : <Trophy size={48} className="text-background" />}
            </motion.div>
            <h2 className="text-xl font-bold">{points===0?'Promoção de Rank!':'Meta Concluída!'}</h2>
            <p className="text-sm text-gray-300 max-w-[200px] mx-auto">{title}</p>
            {points>0 && <span className="text-yellow-400 font-semibold text-lg">+{points} XP</span>}
          </motion.div>
        </div>
      )}
    </>
  );
};
