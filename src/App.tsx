import React, { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useAuthStore } from '@/stores/useAuthStore';
import { dataSyncService } from '@/lib/DataSyncService';
import { VitalityListener } from '@/components/gamification/VitalityListener';

const queryClient = new QueryClient();

const App = () => {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  
  useEffect(() => {
    console.log('[App] useEffect executado:', { 
      isAuthenticated, 
      isLoading, 
      user: user?.id,
      userEmail: user?.email 
    });
    
    if (user?.id && !isLoading) {
      console.log('[App] Chamando dataSyncService.loadAll para userId:', user.id);
      dataSyncService.loadAll(user.id).catch(error => {
        console.error('[App] Erro no loadAll:', error);
      });
    } else {
      console.log('[App] Condições não atendidas para loadAll:', {
        isAuthenticated,
        hasUser: !!user,
        userId: user?.id,
        isLoading
      });
    }
  }, [user?.id, isLoading]);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Sonner />
          <VitalityListener />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
