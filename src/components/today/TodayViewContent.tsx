import React from 'react';
import { motion } from 'framer-motion';
import { Download, Upload, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserDataManager } from '@/lib/userDataManager';
import { toast } from '@/components/ui/use-toast';
import { useState, useRef } from 'react';
import { PerformanceReports } from '@/components/reports/PerformanceReports';

export const TodayViewContent = () => {
  const { username, signOut } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportData = async () => {
    try {
      setIsLoading(true);
      const userData = await UserDataManager.generateUserDataReport(username);
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daily-level-data-${username}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Dados exportados!",
        description: "Seus dados foram salvos com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível exportar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const userData = await UserDataManager.loadUserData(file);
      await UserDataManager.applyUserData(userData);
      
      toast({
        title: "Dados importados!",
        description: "Seus dados foram carregados com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      toast({
        title: "Erro ao importar",
        description: "Arquivo inválido ou corrompido. Verifique o arquivo e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
                onClick={handleExportData} 
                disabled={isLoading}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
  
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isLoading}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Importar</span>
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
  
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />
  
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance Reports */}
      <PerformanceReports />
    </div>
  );
};
