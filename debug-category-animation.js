// Script para diagnosticar especificamente as animações das categorias
// Execute este código no console do navegador

console.log('🎬 Iniciando diagnóstico das animações de categoria...');

let animationCount = 0;
let lastAnimationTime = Date.now();

// 1. Monitorar elementos sendo criados/removidos
function monitorDOMChanges() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.textContent?.includes('itens')) {
                        animationCount++;
                        const now = Date.now();
                        const timeSince = now - lastAnimationTime;
                        console.warn(`🎬 CATEGORIA RENDERIZADA #${animationCount} - ${timeSince}ms desde última`);
                        console.log('Elemento adicionado:', node);
                        lastAnimationTime = now;
                    }
                });
            }
        });
    });

    // Observar a seção de categorias
    const categorySection = document.querySelector('h4') || document.body;
    observer.observe(categorySection.parentElement || document.body, {
        childList: true,
        subtree: true
    });

    console.log('✅ Observer configurado para monitorar mudanças no DOM');
}

// 2. Interceptar chamadas do Framer Motion
function interceptFramerMotion() {
    // Procurar por elementos motion.div
    setInterval(() => {
        const motionDivs = document.querySelectorAll('[style*="transform"]');
        if (motionDivs.length > 0) {
            console.log(`🎭 ${motionDivs.length} elementos com animação encontrados`);
        }
    }, 1000);
}

// 3. Monitorar re-renders do React especificamente para CategoryList
function monitorCategoryRenders() {
    let renderCount = 0;
    
    // Interceptar console.log para detectar logs de categoria
    const originalLog = console.log;
    console.log = function(...args) {
        const message = args.join(' ');
        if (message.includes('Category Cache') || message.includes('categoria')) {
            renderCount++;
            console.error(`🔄 CATEGORY RENDER #${renderCount}: ${message}`);
        }
        originalLog.apply(console, args);
    };
    
    // Verificar se há elementos sendo recriados constantemente
    let lastCategoryCount = 0;
    setInterval(() => {
        const categoryElements = document.querySelectorAll('[class*="space-y-4"] > div');
        const currentCount = categoryElements.length;
        
        if (currentCount !== lastCategoryCount) {
            console.warn(`📊 Número de categorias mudou: ${lastCategoryCount} → ${currentCount}`);
            lastCategoryCount = currentCount;
        }
    }, 500);
}

// 4. Verificar se o problema é no key do React
function checkReactKeys() {
    console.log('🔑 Verificando keys do React...');
    
    setInterval(() => {
        const categoryElements = document.querySelectorAll('[class*="space-y-4"] > div');
        categoryElements.forEach((el, index) => {
            const reactKey = el._reactInternalFiber?.key || el._reactInternalInstance?.key || 'no-key';
            if (index < 3) { // Log apenas as primeiras 3 para não spammar
                console.log(`Categoria ${index}: key="${reactKey}"`);
            }
        });
    }, 2000);
}

// 5. Monitorar especificamente o historyCategories
function monitorHistoryCategories() {
    if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
        console.log('🔍 Tentando acessar internals do React...');
    }
    
    // Verificar se conseguimos acessar o store diretamente
    if (window.useGamificationStoreV21) {
        const store = window.useGamificationStoreV21;
        let lastHistoryLength = store.getState().history.length;
        
        store.subscribe((state) => {
            if (state.history.length !== lastHistoryLength) {
                console.warn(`📈 HISTORY MUDOU: ${lastHistoryLength} → ${state.history.length}`);
                lastHistoryLength = state.history.length;
            }
        });
    }
}

// Executar todos os diagnósticos
monitorDOMChanges();
interceptFramerMotion();
monitorCategoryRenders();
checkReactKeys();
monitorHistoryCategories();

console.log('🎯 Diagnóstico completo iniciado! Aguarde alguns segundos para ver os resultados...');
console.log('💡 Se você ver muitas mensagens de "CATEGORIA RENDERIZADA", o problema é re-render constante');
console.log('🎬 Se você ver elementos sendo adicionados/removidos constantemente, o problema é no DOM');
console.log('🔑 Se as keys estão mudando, o problema é na chave do React');

// Auto-stop após 30 segundos
setTimeout(() => {
    console.log(`📊 RESUMO FINAL após 30s:`);
    console.log(`- Animações detectadas: ${animationCount}`);
    console.log(`- Última animação: ${Date.now() - lastAnimationTime}ms atrás`);
    
    if (animationCount > 30) {
        console.error('🚨 PROBLEMA CONFIRMADO: Muitas animações (>30 em 30s)');
        console.error('💡 CAUSA PROVÁVEL: Re-render constante do componente CategoryList');
    } else {
        console.log('✅ Animações parecem normais');
    }
}, 30000);
