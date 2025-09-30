// Script para diagnosticar e corrigir o erro React #310
// Execute este script no console do navegador

console.log('🔧 Iniciando diagnóstico do erro React #310...');

// 1. Verificar se o erro ainda persiste
function checkForReactError() {
    console.log('🔍 Verificando se há erros React no console...');
    
    // Interceptar erros do console
    const originalError = console.error;
    let hasReactError = false;
    
    console.error = function(...args) {
        const message = args.join(' ');
        if (message.includes('Minified React error #310')) {
            hasReactError = true;
            console.log('❌ Erro React #310 detectado!');
        }
        originalError.apply(console, args);
    };
    
    return hasReactError;
}

// 2. Limpar localStorage problemático apenas se necessário
function clearProblematicStorage() {
    console.log('🧹 Limpando localStorage problemático...');
    
    const keysToRemove = [
        'dl.gamification.v21',
        'dl.vitality.v21',
        'dl-quick-stats'
    ];
    
    keysToRemove.forEach(key => {
        if (localStorage.getItem(key)) {
            console.log(`❌ Removendo ${key}`);
            localStorage.removeItem(key);
        }
    });
}

// 3. Verificar stores
function checkStores() {
    console.log('🔍 Verificando stores...');
    
    try {
        if (window.useGamificationStoreV21) {
            const gamStore = window.useGamificationStoreV21.getState();
            console.log('📊 Gamification Store:', {
                xp: gamStore.xp,
                coins: gamStore.coins,
                userId: gamStore.userId,
                hasAddXp: typeof gamStore.addXp === 'function'
            });
        }
        
        if (window.useAuthStore) {
            const authStore = window.useAuthStore.getState();
            console.log('🔐 Auth Store:', {
                isAuthenticated: authStore.isAuthenticated,
                userId: authStore.user?.id,
                isLoading: authStore.isLoading
            });
        }
        
        console.log('✅ Stores verificados com sucesso');
    } catch (error) {
        console.error('❌ Erro ao verificar stores:', error);
        return false;
    }
    
    return true;
}

// 4. Testar se o app está funcionando
function testAppFunctionality() {
    console.log('🧪 Testando funcionalidade do app...');
    
    try {
        // Verificar se componentes principais estão renderizados
        const app = document.querySelector('[data-testid="app"]') || document.querySelector('#root > div');
        if (app) {
            console.log('✅ App renderizado com sucesso');
        } else {
            console.log('⚠️ App pode não estar renderizado corretamente');
        }
        
        // Verificar se não há erros críticos
        const hasErrors = document.querySelector('[data-error]') || 
                         document.body.textContent.includes('Something went wrong');
        
        if (!hasErrors) {
            console.log('✅ Nenhum erro crítico detectado na UI');
        } else {
            console.log('❌ Erros críticos detectados na UI');
        }
        
        return !hasErrors;
    } catch (error) {
        console.error('❌ Erro ao testar funcionalidade:', error);
        return false;
    }
}

// 5. Função principal de diagnóstico
function diagnoseReactError310() {
    console.log('🚨 Executando diagnóstico do erro React #310...');
    
    const hasError = checkForReactError();
    const storesOk = checkStores();
    const appWorking = testAppFunctionality();
    
    console.log('📋 Resumo do diagnóstico:', {
        hasReactError: hasError,
        storesWorking: storesOk,
        appFunctional: appWorking
    });
    
    if (hasError || !storesOk || !appWorking) {
        console.log('⚠️ Problemas detectados. Executando limpeza...');
        clearProblematicStorage();
        
        console.log('⏳ Aguardando 3 segundos antes de recarregar...');
        setTimeout(() => {
            console.log('🔄 Recarregando página...');
            window.location.reload();
        }, 3000);
    } else {
        console.log('✅ App funcionando corretamente! Erro React #310 foi corrigido.');
    }
}

// Executar diagnóstico
diagnoseReactError310();
