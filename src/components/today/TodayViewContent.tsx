import React from 'react';
import { motion } from 'framer-motion';
import { Settings, RotateCcw, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserDataManager } from '@/lib/userDataManager';
import { toast } from '@/components/ui/use-toast';
import { useState } from 'react';
import { PerformanceReports } from '@/components/reports/PerformanceReports';

export const TodayViewContent = () => {
  const { username, signOut } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleSettings = () => {
    toast({
      title: "Configurações",
      description: "Funcionalidade em desenvolvimento.",
    });
  };

  const handleReload = async () => {
    try {
      setIsLoading(true);
      
      // Limpar localStorage, sessionStorage e cache
      localStorage.clear();
      sessionStorage.clear();
      
      // Para PWA, limpar cache
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // Limpar cookies do domínio atual
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });
      
      toast({
        title: "App atualizado!",
        description: "Cache limpo. Recarregando para nova versão...",
      });
      
      // Aguardar um pouco para o toast aparecer e então recarregar
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível limpar o cache completamente.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    signOut();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Data Management Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Gerenciamento de Dados</CardTitle>
              <span 
                className="text-sm text-muted-foreground font-medium"
                style={{
                  backgroundColor: '#393939',
                  padding: '2px 5px 2px 5px',
                  borderRadius: '5px',
                  marginTop: '-5px'
                }}
              >
                {username}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <Button 
                onClick={handleSettings} 
                disabled={isLoading}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Config</span>
              </Button>
  
              <Button 
                onClick={handleReload} 
                disabled={isLoading}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Atualizar</span>
              </Button>
  
              <Button 
                onClick={handleLogout} 
                size="sm"
                variant="destructive"
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
  
  
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance Reports */}
      <PerformanceReports />
    </div>
  );
};
