# Checklist de Implementação da Gamificação (TodayView)

1. **Preparação do terreno**  
   1.1 Criar `src/config/gamificationConfig.json` com defaults.  
   1.2 Adicionar tipagens em `src/types/gamification.ts`.  
   1.3 Garantir dependências `zustand` e `localforage`.

2. **Store base (Sprint 1)**  
   2.1 Implementar `useGamificationStore.ts` (load/persist).  
   2.2 Actions: `addXp`, `buyItem`, `setConfig` (debounce 500 ms).

3. **Integração com fluxos existentes**  
   3.1 `useHabits` → `addXp('habit', tags)` ao check.  
   3.2 `useTasks`  → `addXp('task', tags)` ao concluir.  
   3.3 `useGoals`  → milestones / metas 100 % → `addXp('milestone'|'goal')`.  
   3.4 Na store: detectar mudança de divisão (`Math.floor(xp/200)`) e disparar toast de **promoção/rebaixamento**.

4. **Sistema de Camadas do PixelBuddy (Sprint 2)**  
   4.1 Criar `usePixelBuddyStore.ts` para gerenciar estado do personagem.  
   4.2 Implementar lógica de camadas: Body → Head → Clothes → Accessory → Hat → Effect.  
   4.3 Criar componente `PixelBuddyRenderer.tsx` que compõe as camadas.  
   4.4 Implementar sistema de inventário com `PixelBuddyItem` interface.  
   4.5 Adicionar ações: `equipItem`, `unequipItem`, `unlockItem`.

5. **Componentes visuais na TodayView**  
   5.1 `<PixelBuddyCard>` com `PixelBuddyRenderer` integrado.  
   5.2 Toasts de XP/Coins (extender `useToast`).  
   5.3 Inserir card no topo da TodayView.  
   5.4 Adicionar botão "Inventário" para gerenciar itens equipados.

6. **Atributos & Aspecto (Sprint 4)**  
   • Contadores rolling 30 d `str/int/cre/soc`.  
   • `resolveAspect()` ⇒ `bal|str|int|cre|soc`.  
   • Cross-fade de sprite quando aspecto mudar.

7. **Loja de Recompensas (Sprint 3)**  
   • `<ShopModal>` lendo itens do config.  
   • `buyItem(id)` → debita coins + aplica efeito.  
   • Botão "Loja" no header da TodayView.  
   • Integrar com sistema de inventário do PixelBuddy.

8. **Assets e Sprites (Sprint 2.5)**  
   8.1 Criar estrutura de pastas `/public/sprites/pixelbuddy/`.  
   8.2 Gerar assets base: 3 corpos, 6 cabeças, 5 efeitos.  
   8.3 Gerar assets customizáveis: 8 roupas, 5 acessórios, 5 chapéus.  
   8.4 Criar `manifest.json` com metadados dos sprites.  
   8.5 Implementar sistema de pré-carregamento de imagens.

9. **Radar & Gráficos (Sprint 5)**  
   • `buildRadarData()` na store.  
   • `<RadarChart>` + painel lateral "Análises".

10. **Quests (Sprint 7)**  
    • Gerador de quests diárias/semanais.  
    • `<QuestList>` abaixo do PixelBuddyCard.  
    • Reroll integrado à Loja.

11. **Telemetria**  
    • Eventos `xp_gain`, `shop_buy`, `radar_render` via console.  
    • Flag para desativar telemetria.

12. **Testes & QA**  
    • Unitários: `addXp`, `resolveAspect`, decay.  
    • Integração: fluxo hábito → avatar.  
    • Playtest de 7 dias.  
    • Teste de combinações de itens do PixelBuddy.

13. **Arte & Assets**  
    • Gerar sprites v1 conforme manifesto.  
    • Pré-carregar assets na TodayView.  
    • Fallback para sprites padrão.  
    • Testar composição de camadas.

14. **Documentação & Config**  
    • Atualizar `README.md` com build dos sprites.  
    • Documentar env vars (coin rate, targets).  
    • Publicar changelog da gamificação v0.5.  
    • Documentar sistema de camadas do PixelBuddy.

15. **Sistema de Inventário (Sprint 3.5)**  
    15.1 Criar `PixelBuddyInventory.tsx` para gerenciar itens.  
    15.2 Implementar sistema de raridade (common, rare, epic, legendary).  
    15.3 Adicionar condições de desbloqueio para itens especiais.  
    15.4 Criar sistema de coleções temáticas.

16. **Animações e Efeitos (Sprint 4.5)**  
    16.1 Implementar transições suaves entre estados do PixelBuddy.  
    16.2 Adicionar animações de equipar/desequipar itens.  
    16.3 Implementar efeitos visuais (aura, confetti, etc.).  
    16.4 Otimizar performance de renderização de camadas.
