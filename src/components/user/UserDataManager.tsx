import React, { useState, useRef } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserDataManager, type UserDataFile } from '@/lib/userDataManager';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export const UserDataManagerComponent = () => {
  const { isAuthenticated, username, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [userReport, setUserReport] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportData = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Usuário não autenticado',
        description: 'Faça login primeiro.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const userData = await UserDataManager.saveUserDataAuto();
      
      // Criar blob e download do arquivo apenas quando solicitado
      const blob = new Blob([JSON.stringify(userData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dailylevel-user-${username}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Dados exportados com sucesso!',
        description: 'Arquivo JSON baixado automaticamente.',
      });
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      toast({
        title: 'Erro ao exportar dados',
        description: 'Tente novamente.',
        variant: 'destructive',
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
        title: 'Dados importados com sucesso!',
        description: 'Seus dados foram restaurados.',
      });
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      toast({
        title: 'Erro ao importar dados',
        description: 'Verifique se o arquivo é válido.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleGenerateReport = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Usuário não autenticado',
        description: 'Faça login primeiro.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const userData = await UserDataManager.generateUserDataReport(username!);
      const report = UserDataManager.generateUserReport(userData);
      setUserReport(report);
      setShowReport(true);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: 'Erro ao gerar relatório',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: 'Logout realizado',
      description: 'Você foi desconectado.',
    });
  };

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Usuário não autenticado</CardTitle>
          <CardDescription>
            Faça login para acessar as funcionalidades de dados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use as credenciais: Nadr00J / Mortadela1
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Gerenciamento de Dados
            <Badge variant="secondary">{username}</Badge>
          </CardTitle>
          <CardDescription>
            Exporte, importe e visualize seus dados do DailyLevel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={handleExportData} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Exportando...' : '📤 Exportar Dados'}
            </Button>

            <Button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? 'Importando...' : '📥 Importar Dados'}
            </Button>

            <Button 
              onClick={handleGenerateReport} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? 'Gerando...' : '📊 Gerar Relatório'}
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportData}
            className="hidden"
          />

          <Separator />

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Último login: {new Date().toLocaleString()}
            </div>
            <Button 
              onClick={handleLogout} 
              variant="destructive" 
              size="sm"
            >
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>

      {showReport && (
        <Card>
          <CardHeader>
            <CardTitle>Relatório do Usuário</CardTitle>
            <CardDescription>
              Estatísticas detalhadas dos seus dados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md overflow-auto max-h-96">
              {userReport}
            </pre>
            <Button 
              onClick={() => setShowReport(false)} 
              className="mt-4"
              variant="outline"
            >
              Fechar Relatório
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
