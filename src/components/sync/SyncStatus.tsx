import { useEffect, useState } from 'react';
import { useSyncStore } from '@/stores/useSyncStore';
import { Wifi, WifiOff, Cloud, CloudOff, Download, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SyncStatus = () => {
  const { isOnline, lastSync, pendingChanges, config } = useSyncStore();
  const [showDetails, setShowDetails] = useState(false);

  const formatLastSync = () => {
    if (lastSync === 0) return 'Nunca';
    const diff = Date.now() - lastSync;
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `${minutes}m atrás`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500';
    if (pendingChanges.length > 0) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff size={16} />;
    if (pendingChanges.length > 0) return <Upload size={16} />;
    return <Cloud size={16} />;
  };

  return (
    <div className="fixed bottom-20 right-4 z-50">
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="bg-background border rounded-lg p-3 mb-2 shadow-lg min-w-[200px]"
          >
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className={`flex items-center gap-1 ${getStatusColor()}`}>
                  {getStatusIcon()}
                  {!isOnline ? 'Offline' : pendingChanges.length > 0 ? 'Sincronizando...' : 'Sincronizado'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Última sincronização:</span>
                <span className="text-xs">{formatLastSync()}</span>
              </div>
              
              {pendingChanges.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Mudanças pendentes:</span>
                  <span className="text-yellow-500 font-medium">{pendingChanges.length}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sincronização automática:</span>
                <span className={config.autoSync ? 'text-green-500' : 'text-red-500'}>
                  {config.autoSync ? 'Ativada' : 'Desativada'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowDetails(!showDetails)}
        className={`p-2 rounded-full shadow-lg border transition-colors ${
          isOnline ? 'bg-background hover:bg-muted' : 'bg-red-500/10 border-red-500/20'
        }`}
        title={!isOnline ? 'Offline - Dados salvos localmente' : 'Status de sincronização'}
      >
        <div className={`${getStatusColor()}`}>
          {getStatusIcon()}
        </div>
      </motion.button>
    </div>
  );
};
