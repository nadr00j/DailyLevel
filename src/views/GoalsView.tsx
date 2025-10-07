import { Plus, Target, CalendarClock, CheckCircle } from 'lucide-react';
import type { Goal } from '@/types';
import { CreateGoalSheet } from '@/components/goals/CreateGoalSheet';
import { EditGoalSheet } from '@/components/goals/EditGoalSheet';
import { GoalDetailSheet } from '@/components/goals/GoalDetailSheet';
import { useGoalStore } from '@/stores/useGoalStore';
import { Button } from '@/components/ui/button';
import { GoalCard } from '@/components/goals/GoalCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'framer-motion';
import { HeartPulse, Briefcase, DollarSign, BookOpen, Users, ChevronDown, Tag, Paintbrush, Dumbbell, Apple, Monitor, Brain, Camera, Clock, Book } from 'lucide-react';
import { SortableCategory } from '@/components/habits/SortableCategory';
import { useCategorySettings } from '@/hooks/useCategorySettings';

// Icon map for goal categories
const GOAL_CAT_META: Record<string,{icon:any}> = {
  health: { icon: HeartPulse },
  saude: { icon: HeartPulse },
  career: { icon: Briefcase },
  trabalho: { icon: Monitor },
  finance: { icon: DollarSign },
  financas: { icon: DollarSign },
  learning: { icon: BookOpen },
  estudo: { icon: BookOpen },
  mente: { icon: Brain },
  social: { icon: Users },
  fitness: { icon: Dumbbell },
  nutricao: { icon: Apple },
  arte: { icon: Paintbrush },
  'imagem-pessoal': { icon: Camera },
  hobbies: { icon: Paintbrush },
  produtividade: { icon: Clock },
  personal: { icon: Users },
  'sem categoria': { icon: Tag },
};

const formatCategoryLabel=(slug:string)=> slug.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
import { SortableGoalCard } from '@/components/goals/SortableGoalCard';
import { useCallback } from 'react';

export const GoalsView = () => {
  // Use Zustand store instead of old hook
  const goals = useGoalStore(state => state.goals);
  const updateGoalStore = useGoalStore(state => state.updateGoal);
  const deleteGoalStore = useGoalStore(state => state.removeGoal);
  const addGoalStore = useGoalStore(state => state.addGoal);
  const reorderGoals = useGoalStore(state => state.reorderGoals);
  const updateGoalProgress = useGoalStore(state => state.updateGoalProgress);
  
  // Create async wrappers for compatibility with components
  const updateGoal = useCallback(async (goal: Goal) => {
    updateGoalStore(goal);
  }, [updateGoalStore]);
  
  const deleteGoal = useCallback(async (goalId: string) => {
    await deleteGoalStore(goalId);
  }, [deleteGoalStore]);
  
  const addGoal = useCallback(async (goalData: any) => {
    addGoalStore(goalData);
    return goalData;
  }, [addGoalStore]);
  
  // Filter goals by status
  const byOrder = (a: Goal, b: Goal) => (a.order ?? 0) - (b.order ?? 0);
  const futureGoals = goals.filter(g => !g.isCompleted && g.isFuture).sort(byOrder);
  const activeGoals = goals.filter(g => !g.isCompleted && !g.isFuture).sort(byOrder);
  const completedGoals = goals.filter(g => g.isCompleted).sort(byOrder);

  // Use new category settings hook
  const { settings, saveGoalCategoryOrder, toggleGoalCategory } = useCategorySettings();
  const goalCategoryOrder = settings.goalCategoryOrder;
  const collapsed = settings.goalCategoryCollapsed;

  const [openCreate, setOpenCreate] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [viewGoal, setViewGoal] = useState<Goal | null>(null);
  const [currentTab, setCurrentTab] = useState<'active'|'urgent'|'completed'>('active');
  const [createBucket, setCreateBucket] = useState<'active'|'future'>('active');

  const totalGoals = activeGoals.length + completedGoals.length;
  const averageProgress = totalGoals>0 ? (completedGoals.length/totalGoals)*100 : 0;

  const sensors = useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: { 
        distance: 5,
        delay: 100,
        tolerance: 5
      } 
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5
      }
    })
  );

  const handleDragEndFactory = (list: Goal[]) => (event:any)=>{
    const {active, over}=event;
    if(!over || active.id===over.id) return;
    const oldIndex = list.findIndex(g=>g.id===active.id);
    const newIndex = list.findIndex(g=>g.id===over.id);
    const newOrdered=arrayMove(list, oldIndex, newIndex);
    reorderGoals(newOrdered);
  };

  const groupByCategory = (arr:Goal[])=>{
    const map: Record<string,Goal[]> = {};
    arr.forEach(g=>{
      const key = g.category || 'personal';
      if(!map[key]) map[key]=[];
      map[key].push(g);
    });
    return map;
  };

  const groupedActive = groupByCategory(activeGoals);
  const groupedFuture = groupByCategory(futureGoals);
  const groupedCompleted = groupByCategory(completedGoals);

  const toggleGroup = (cat:string) => {
    toggleGoalCategory(cat);
  };

  const [activeCat,setActiveCat] = useState<string|null>(null);

  // Function to properly complete a goal with XP
  const completeGoal = useCallback((goal: Goal) => {
    console.log('[Goals Debug] Completing goal:', goal.title, 'isCompleted:', goal.isCompleted);
    if (goal.isCompleted) {
      // If already completed, just toggle back
      const updatedGoal = { ...goal, isCompleted: false };
      updateGoal(updatedGoal);
    } else {
      // If completing, use updateGoalProgress to trigger XP
      console.log('[Goals Debug] Calling updateGoalProgress with targetValue:', goal.targetValue);
      updateGoalProgress(goal.id, goal.targetValue);
    }
  }, [updateGoal, updateGoalProgress]);

  const orderedCats = (grp:Record<string,Goal[]>)=>{
    let order=[...goalCategoryOrder];
    const keys=Object.keys(grp);
    keys.forEach(k=>{if(!order.includes(k)) order.push(k);});
    order=order.filter(k=>keys.includes(k));
    return order;
  };

  const handleCategoryDragEnd=(cats:string[])=> (event:any)=>{
    const {active,over}=event;
    if(!over||active.id===over.id) return;
    const newOrder=arrayMove(cats,cats.indexOf(active.id),cats.indexOf(over.id));
    saveGoalCategoryOrder(newOrder);
    setActiveCat(null);
  };

  // drag reorder within completed bucket (all categories)
  const handleCompletedCardDragEndFactory = (groupList: Goal[])=> (event:any)=>{
    const {active,over}=event;
    if(!over||active.id===over.id) return;
    const oldIdx = groupList.findIndex(g=>g.id===active.id);
    const newIdx = groupList.findIndex(g=>g.id===over.id);
    if(oldIdx===-1||newIdx===-1) return;
    const newGroup = arrayMove(groupList, oldIdx, newIdx);
    const rest = completedGoals.filter(g=>g.category!==groupList[0].category);
    const newBucketOrdered=[...rest,...newGroup];
    reorderGoals(newBucketOrdered);
  };

  const renderCategory = (cat:string, list:Goal[])=> (
    <div>
      <button className="w-full bg-[#18181b] rounded-xl p-3 mb-2 flex items-center justify-between select-none" onClick={()=>toggleGroup(cat)}>
        <div className="flex items-center gap-2">
          {(()=>{ const Icon=GOAL_CAT_META[cat]?.icon; return Icon? <Icon size={16} className="text-white"/>:null;})()}
          <span className="font-semibold text-sm">{formatCategoryLabel(cat)} <span className="text-muted-foreground">({list.length})</span></span>
        </div>
        <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{backgroundColor:'#2b2b31cc'}}>
          <ChevronDown size={14} className={`transition-transform duration-300 ${collapsed[cat]? '-rotate-90':''}`} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {!collapsed[cat] && (
          <motion.div 
            key={`content-${cat}-${list.length}`} 
            initial={{height:0,opacity:0}} 
            animate={{height:'auto',opacity:1}} 
            exit={{height:0,opacity:0}} 
            transition={{duration:0.25}}
          >
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndFactory(list)}>
              <SortableContext items={list.map(g=>g.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3 pt-2">
                  {list.map(goal=> (
                    <SortableGoalCard key={goal.id} goal={goal} onToggle={()=>completeGoal(goal)} onDelete={()=>deleteGoal(goal.id)} onMove={(to)=>{ if(to==='future') updateGoal({...goal, isFuture:true}); else updateGoal({...goal, isFuture:false}); }} onEdit={()=>setEditingGoal(goal)} onView={()=>setViewGoal(goal)} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <>
    <div className="p-4 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">Metas</h1>
        </div>
        
        <Button className="flex items-center gap-2" onClick={()=>{
          setCreateBucket(currentTab==='urgent' ? 'future' : 'active');
          setOpenCreate(true);
        }}>
          <Plus size={16} />
          Nova Meta
        </Button>
      </motion.div>

      {/* Visão Geral removida */}

      {/* Goals Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={currentTab} onValueChange={(v)=>setCurrentTab(v as any)} defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-16 mb-8">
            <TabsTrigger value="active" className="flex flex-col items-center justify-center gap-1 py-2 relative">
              <Target size={18} />
              <span className="text-xs">Ativas</span>
              {activeGoals.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-[10px] flex items-center justify-center z-10">
                  {activeGoals.length}
                </span>
              )}
            </TabsTrigger>
            
            <TabsTrigger value="urgent" className="flex flex-col items-center justify-center gap-1 py-2 relative">
              <CalendarClock size={18} />
              <span className="text-xs">Futuras</span>
              {futureGoals.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-[10px] flex items-center justify-center z-10">
                  {futureGoals.length}
                </span>
              )}
            </TabsTrigger>
            
            <TabsTrigger value="completed" className="flex flex-col items-center justify-center gap-1 py-2 relative">
              <CheckCircle size={18} />
              <span className="text-xs">Concluídas</span>
              {completedGoals.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-success text-success-foreground rounded-full w-5 h-5 text-[10px] flex items-center justify-center z-10">
                  {completedGoals.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            {activeGoals.length>0? (
              <div className="space-y-4">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd(orderedCats(groupedActive))} onDragStart={(e)=>setActiveCat(e.active.id as string)}>
                <SortableContext items={orderedCats(groupedActive)} strategy={verticalListSortingStrategy}>
              {orderedCats(groupedActive).map(cat=>{ const list=groupedActive[cat]; if(!list) return null; return (
                <SortableCategory key={`active-${cat}`} id={cat}>
                  {renderCategory(cat,list)}
                </SortableCategory>
              );})}
              </SortableContext>
              <DragOverlay dropAnimation={null}>
                {activeCat ? (
                  <SortableCategory id={activeCat}>
                    {renderCategory(activeCat, groupedActive[activeCat]||[])}
                  </SortableCategory>
                ) : null}
              </DragOverlay>
              </DndContext>
              </div>
            ) : (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} className="card-glass p-8 rounded-xl text-center">
                <Target size={48} className="mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Sem metas ativas</h3>
                <p className="text-muted-foreground mb-4">Defina metas significativas para acompanhar seu progresso e conquistas</p>
                <Button className="flex items-center gap-2 mx-auto" onClick={()=>{ setCreateBucket('active'); setOpenCreate(true); }}>
                  <Plus size={16}/> Criar sua Primeira Meta
                </Button>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="urgent" className="mt-4">
            {futureGoals.length>0 ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd(orderedCats(groupedFuture))} onDragStart={(e)=>setActiveCat(e.active.id as string)}>
                <SortableContext items={orderedCats(groupedFuture)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {orderedCats(groupedFuture).map(cat=>{const list=groupedFuture[cat]; if(!list) return null; return (
                      <SortableCategory key={`future-${cat}`} id={cat}>{renderCategory(cat,list)}</SortableCategory>
                    );})}
                  </div>
                </SortableContext>
                <DragOverlay dropAnimation={null}>
                  {activeCat ? (
                    <SortableCategory id={activeCat}>{renderCategory(activeCat, groupedFuture[activeCat]||[])}</SortableCategory>
                  ) : null}
                </DragOverlay>
              </DndContext>
            ) : (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} className="card-glass p-8 rounded-xl text-center">
                <CalendarClock size={48} className="mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Sem metas futuras</h3>
                <p className="text-muted-foreground mb-4">Todas as suas metas estão em andamento ou concluídas.</p>
                <Button className="flex items-center gap-2 mx-auto" onClick={()=>{ setCreateBucket('future'); setOpenCreate(true); }}>
                  <Plus size={16}/> Criar sua Primeira Meta
                </Button>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            {completedGoals.length > 0 ? (
              <div className="space-y-3">
                <div className="bg-success/10 border border-success/20 rounded-lg p-3 mb-4">
                  <p className="text-sm text-white">
                    🎉 Parabéns por concluir estas metas!
                  </p>
                </div>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd(orderedCats(groupedCompleted))} onDragStart={(e)=>setActiveCat(e.active.id as string)}>
                <SortableContext items={orderedCats(groupedCompleted)} strategy={verticalListSortingStrategy}>
                  {orderedCats(groupedCompleted).map(cat=>{ const list=groupedCompleted[cat]; if(!list) return null; return (
                    <SortableCategory key={`completed-${cat}`} id={cat}>
                      {renderCategory(cat,list)}
                    </SortableCategory>
                  );})}
                </SortableContext>
                <DragOverlay dropAnimation={null}>
                  {activeCat ? (
                    <SortableCategory id={activeCat}>{renderCategory(activeCat, groupedCompleted[activeCat]||[])}</SortableCategory>
                  ) : null}
                </DragOverlay>
              </DndContext>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card-glass p-8 rounded-xl text-center"
              >
                <Target size={48} className="mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Nenhuma meta concluída ainda</h3>
                <p className="text-muted-foreground">
                  Continue trabalhando nas suas metas ativas para vê-las aqui!
                </p>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
    <CreateGoalSheet open={openCreate} onOpenChange={setOpenCreate} addGoal={addGoal} defaultBucket={createBucket} />
    <EditGoalSheet goal={editingGoal} open={!!editingGoal} onOpenChange={(open)=>{ if(!open) setEditingGoal(null);}} onSave={async (goalId, updates) => {
      if (editingGoal) {
        const updatedGoal = { ...editingGoal, ...updates };
        await updateGoal(updatedGoal);
      }
    }} />
    <GoalDetailSheet goal={viewGoal} open={!!viewGoal} onOpenChange={(open)=>{ if(!open) setViewGoal(null);}} onEdit={(g)=>{ setViewGoal(null); setEditingGoal(g); }} />
    </>
  );
};