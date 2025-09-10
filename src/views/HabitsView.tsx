import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, CalendarCheck, CalendarX, ChevronDown, Briefcase, HeartPulse, Brain, Users, Home, Camera, Clock, Paintbrush, BookOpen, DollarSign, Dumbbell, Apple, Monitor, Tag } from 'lucide-react';
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useHabitStore } from '@/stores/useHabitStore';
import { useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { HabitCard } from '@/components/habits/HabitCard';
import { HeatmapView } from '@/components/habits/HeatmapView';
import { HabitCreateModal } from '@/components/habits/HabitCreateModal';
import { HabitDetailSheet } from '@/components/habits/HabitDetailSheet';
import { useState } from 'react';
import { Habit } from '@/types/habit';
import { SortableHabitCard } from '@/components/habits/SortableHabitCard';
import { SortableCategory } from '@/components/habits/SortableCategory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCategorySettings } from '@/hooks/useCategorySettings';

// Function to get current date in Brazil timezone (UTC-3)
const getBrazilToday = () => {
  const now = new Date();
  // Convert to Brazil timezone (UTC-3)
  const brazilOffset = -3 * 60; // -3 hours in minutes
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const brazilTime = new Date(utc + (brazilOffset * 60000));
  
  // Format as YYYY-MM-DD
  const year = brazilTime.getFullYear();
  const month = String(brazilTime.getMonth() + 1).padStart(2, '0');
  const day = String(brazilTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// mapa categoria -> ícone e classe de cor do texto
const CAT_META: Record<string,{icon:any,color:string}> = {
  'Trabalho': { icon: Monitor, color: 'text-green-500' },
  'Saúde': { icon: HeartPulse, color: 'text-red-500' },
  'Mente': { icon: Brain, color: 'text-purple-500' },
  'Social': { icon: Users, color: 'text-yellow-500' },
  'Casa': { icon: Home, color: 'text-blue-500' },
  'Imagem Pessoal': { icon: Camera, color: 'text-blue-400' },
  'Produtividade': { icon: Clock, color: 'text-orange-400' },
  'Arte': { icon: Paintbrush, color: 'text-pink-400' },
  'Leitura': { icon: BookOpen, color: 'text-indigo-400' },
  'Finanças': { icon: DollarSign, color: 'text-yellow-300' },
  'Fitness': { icon: Dumbbell, color: 'text-lime-400' },
  'Nutrição': { icon: Apple, color: 'text-emerald-400' },
  'Sem Categoria': { icon: Tag, color: '' },
};

// TODO: refactor HeatmapView later; placeholder hide

export const HabitsView = () => {
  const habitsMap = useHabitStore(s=>s.habits);
  const logsMap = useHabitStore(s=>s.logs);
  const getProgressForDate = useHabitStore(s=>s.getProgressForDate);
  const habits = Object.values(habitsMap);
  const activeHabits = habits.filter(h=>!h.archivedAt).sort((a,b)=>(a.order??0)-(b.order??0));

  const today = new Date();
  const todayDay = today.getDay(); // 0-6
  const monthPrefix = today.toISOString().slice(0,7); // YYYY-MM

  const isHabitActiveToday = (habit:any)=>{
    if(habit.targetInterval==='daily') return true;

    if(habit.targetInterval==='weekly') {
      return habit.activeDays?.includes(todayDay);
    }

    if(habit.targetInterval==='monthly') {
      const habitLogs = logsMap[habit.id] ?? {};
      const completedDaysInMonth = Object.keys(habitLogs).filter(d=>d.startsWith(monthPrefix) && habitLogs[d]>0).length;
      return completedDaysInMonth < habit.targetCount;
    }

    return true;
  };

  const habitsToday = activeHabits.filter(isHabitActiveToday);
  const habitsInactive = activeHabits.filter(h=>!isHabitActiveToday(h));

  const todayStr = getBrazilToday(); // Use Brazil timezone
  const isHabitCompletedToday = (habit:any)=>{
    const progress = getProgressForDate(habit.id, todayStr);
    return progress? progress.count>=habit.targetCount : false;
  };

  // calcula melhor sequência (longest streak) para cada hábito
  const calcLongestStreak = (habitId:string)=>{
    const logs = logsMap[habitId] || {};
    const dates = Object.keys(logs).filter(d=>logs[d]>0).sort(); // ascending
    let longest=0, current=0, prevDate:string|undefined;
    for(const d of dates){
      if(prevDate && new Date(d).getTime() === new Date(prevDate).getTime()+86400000){
        current+=1;
      }else{
        current=1;
      }
      longest=Math.max(longest,current);
      prevDate=d;
    }
    return longest;
  };

  const bestStreak = useMemo(()=>{
    return activeHabits.reduce((max,h)=>Math.max(max,calcLongestStreak(h.id)),0);
  },[activeHabits, logsMap]);

  const reorderHabits = useHabitStore(s=>s.reorderHabits);
  
  // Use new category settings hook
  const { settings, saveHabitCategoryOrder, toggleHabitCategory } = useCategorySettings();
  const habitCategoryOrder = settings.habitCategoryOrder;
  const collapsed = settings.habitCategoryCollapsed;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEndFactory = (group: Habit[])=> (event:any)=>{
    const {active, over}=event;
    if(!over || active.id===over.id) return;
    const oldIndex = group.findIndex(h=>h.id===active.id);
    const newIndex = group.findIndex(h=>h.id===over.id);
    const newOrdered=arrayMove(group, oldIndex, newIndex);
    reorderHabits(newOrdered);
  };

  // group habits by first category or 'Sem Categoria'
  const groupByCategory = (list: Habit[])=>{
    const map: Record<string, Habit[]> = {};
    list.forEach(h=>{
      const key = Array.isArray(h.categories) && h.categories.length > 0 ? h.categories[0] : 'Sem Categoria';
      if(!map[key]) map[key]=[];
      map[key].push(h);
    });
    return map;
  };

  const groupedToday = groupByCategory(habitsToday);
  const groupedInactive = groupByCategory(habitsInactive);

  const orderedCats = (grp:Record<string,Habit[]>)=>{
    let order = [...habitCategoryOrder];
    const keys = Object.keys(grp);
    keys.forEach(k=>{ if(!order.includes(k)) order.push(k); });
    // remove categories not present
    order = order.filter(k=>keys.includes(k));
    return order;
  };

  const handleCategoryDragEnd = (grpCats:string[])=> (event:any)=>{
    const {active, over}=event;
    if(!over || active.id===over.id) return;
    const oldIdx = grpCats.findIndex(c=>c===active.id);
    const newIdx = grpCats.findIndex(c=>c===over.id);
    const newOrder=arrayMove(grpCats,oldIdx,newIdx);
    saveHabitCategoryOrder(newOrder);
  };

  const toggleGroup = (cat:string) => {
    toggleHabitCategory(cat);
  };

  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<'today'|'inactive'>('today');
  const [openCreate, setOpenCreate] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit|null>(null);
  const [viewHabit, setViewHabit] = useState<Habit|null>(null);

  const selectedHabitData = selectedHabit 
    ? activeHabits.find(h => h.id === selectedHabit)
    : null;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">Hábitos</h1>
        </div>
        
        <Button className="flex items-center gap-2 ml-auto" onClick={()=>setOpenCreate(true)}>
          <Plus size={16} />
          Novo Hábito
        </Button>
      </motion.div>

      {/* Heatmap for selected habit */}
      {selectedHabitData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Atividade de {selectedHabitData.name}</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedHabit(null)}
            >
              Fechar
            </Button>
          </div>
          
          <HeatmapView habit={selectedHabitData as any} />
        </motion.div>
      )}

      {/* Stats Overview removido para simplificação */}

      {/* Habits Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={currentTab} onValueChange={(v)=>setCurrentTab(v as any)} defaultValue="today">
          <TabsList className="grid grid-cols-2 h-14 mb-8">
            <TabsTrigger value="today" className="flex flex-col items-center justify-center gap-1 relative">
              <CalendarCheck size={18} />
              <span className="text-xs">Hoje</span>
              {habitsToday.length>0 && (
                <span className="absolute -top-1 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-[10px] flex items-center justify-center z-10">
                  {habitsToday.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="inactive" className="flex flex-col items-center justify-center gap-1 relative">
              <CalendarX size={18} />
              <span className="text-xs">Inativos</span>
              {habitsInactive.length>0 && (
                <span className="absolute -top-1 -right-2 bg-zinc-500 text-zinc-300 rounded-full w-5 h-5 text-[10px] flex items-center justify-center z-10">
                  {habitsInactive.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today">
            {habitsToday.length>0 ? (
              <div className="space-y-4">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd(orderedCats(groupedToday))}>
                  <SortableContext items={orderedCats(groupedToday)} strategy={verticalListSortingStrategy}>
                    {orderedCats(groupedToday).map(cat=>{ const list=groupedToday[cat]; if(!list) return null; return (
                      <SortableCategory key={cat} id={cat}>
                        <div key={cat}>
                          <button className="w-full bg-[#18181b] rounded-xl p-3 mb-2 flex items-center justify-between" onClick={()=>toggleGroup(cat)}>
                            <div className="flex items-center gap-2">
                              {(()=>{
                                const meta = (CAT_META as any)[cat] || {};
                                if(!meta.icon) return null;
                                const IconComp = meta.icon;
                                return <IconComp size={16} className="text-white" />;
                              })()}
                              <span className="font-semibold text-sm">{cat} <span className="text-muted-foreground">({list.length})</span></span>
                            </div>
                            <span className="w-7 h-7 rounded-full flex items-center justify-center transition-transform" style={{backgroundColor:'#2b2b31cc'}}>
                              <ChevronDown size={14} className={`transition-transform duration-300 ${collapsed[cat]? '-rotate-90':''}`} />
                            </span>
                          </button>
                          <AnimatePresence initial={false}>
                            {!collapsed[cat] && (
                              <motion.div
                                key="content"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                              >
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndFactory(list)}>
                                  <SortableContext items={list.map(h=>h.id)} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-3 pt-2">
                                      {list.map(habit=> (
                                        <SortableHabitCard key={habit.id} habit={habit} onEdit={(h)=>{setEditingHabit(h); setOpenCreate(true);}} onView={()=>setViewHabit(habit)} />
                                      ))}
                                    </div>
                                  </SortableContext>
                                </DndContext>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </SortableCategory>
                    );})}
                  </SortableContext>
                </DndContext>
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum hábito ativo hoje.</p>
            )}
          </TabsContent>

          <TabsContent value="inactive">
            {habitsInactive.length>0 ? (
              <div className="space-y-4">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd(orderedCats(groupedInactive))}>
                  <SortableContext items={orderedCats(groupedInactive)} strategy={verticalListSortingStrategy}>
                    {orderedCats(groupedInactive).map(cat=>{ const list=groupedInactive[cat]; if(!list) return null; return (
                      <SortableCategory key={cat} id={cat}>
                        <div key={cat}>
                          <button className="w-full bg-[#18181b] rounded-xl p-3 mb-2 flex items-center justify-between" onClick={()=>toggleGroup(cat)}>
                            <div className="flex items-center gap-2">
                              {(()=>{
                                const meta = (CAT_META as any)[cat] || {};
                                if(!meta.icon) return null;
                                const IconComp = meta.icon;
                                return <IconComp size={16} className="text-white" />;
                              })()}
                              <span className="font-semibold text-sm">{cat} <span className="text-muted-foreground">({list.length})</span></span>
                            </div>
                            <span className="w-7 h-7 rounded-full flex items-center justify-center transition-transform" style={{backgroundColor:'#2b2b31cc'}}>
                              <ChevronDown size={14} className={`transition-transform duration-300 ${collapsed[cat]? '-rotate-90':''}`} />
                            </span>
                          </button>
                          <AnimatePresence initial={false}>
                            {!collapsed[cat] && (
                              <motion.div
                                key="content"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                              >
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndFactory(list)}>
                                  <SortableContext items={list.map(h=>h.id)} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-3 pt-2">
                                      {list.map(habit=> (
                                        <SortableHabitCard key={habit.id} habit={habit} onEdit={(h)=>{setEditingHabit(h); setOpenCreate(true);}} onView={()=>setViewHabit(habit)} />
                                      ))}
                                    </div>
                                  </SortableContext>
                                </DndContext>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </SortableCategory>
                    );})}
                  </SortableContext>
                </DndContext>
              </div>
            ) : (
              <p className="text-muted-foreground">Todos os hábitos estão ativos hoje.</p>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
      <HabitCreateModal open={openCreate} onOpenChange={(o)=>{ if(!o){setEditingHabit(null);} setOpenCreate(o); }} habit={editingHabit}/>
      <HabitDetailSheet habit={viewHabit} open={!!viewHabit} onOpenChange={(o)=>{ if(!o) setViewHabit(null); }} onEdit={(h)=>{ setViewHabit(null); setEditingHabit(h); setOpenCreate(true);} } />
    </div>
  );
}