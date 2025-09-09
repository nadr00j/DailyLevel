import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';

export const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberCredentials, setRememberCredentials] = useState(false);
  
  const signIn = useAuthStore(state => state.signIn);

  // Carregar credenciais salvas ao montar o componente
  useEffect(() => {
    const savedUsername = localStorage.getItem('dailyLevel_username');
    const savedPassword = localStorage.getItem('dailyLevel_password');
    const savedRemember = localStorage.getItem('dailyLevel_remember') === 'true';
    
    if (savedUsername && savedRemember) {
      setUsername(savedUsername);
    }
    if (savedPassword && savedRemember) {
      setPassword(savedPassword);
    }
    setRememberCredentials(savedRemember);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn(username, password);
      
      if (result.success) {
        // Salvar credenciais se "Lembrar" estiver marcado
        if (rememberCredentials) {
          localStorage.setItem('dailyLevel_username', username);
          localStorage.setItem('dailyLevel_password', password);
          localStorage.setItem('dailyLevel_remember', 'true');
        } else {
          // Limpar credenciais salvas se "Lembrar" não estiver marcado
          localStorage.removeItem('dailyLevel_username');
          localStorage.removeItem('dailyLevel_password');
          localStorage.removeItem('dailyLevel_remember');
        }
        
        toast({
          title: 'Login realizado com sucesso!',
          description: `Bem-vindo, ${username}!`,
        });
      } else {
        toast({
          title: 'Erro no login',
          description: result.error || 'Verifique suas credenciais.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro no login',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <motion.div 
              className="flex justify-center mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
              <img 
                src="/logo-daily-level.png" 
                alt="DailyLevel Logo" 
                className="h-16 w-auto"
              />
            </motion.div>
          </CardHeader>
          <CardContent>
            <motion.form 
              onSubmit={handleSignIn} 
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="space-y-2">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu usuário"
                  required
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberCredentials}
                  onCheckedChange={(checked) => setRememberCredentials(checked as boolean)}
                  disabled={isLoading}
                />
                <Label 
                  htmlFor="remember" 
                  className="text-sm font-normal cursor-pointer"
                >
                  Lembrar credenciais
                </Label>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </motion.div>
            </motion.form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
