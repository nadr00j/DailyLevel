import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, Calendar, ArrowRight, ChevronDown, Monitor, HeartPulse, Brain, Users, Home, Camera, Paintbrush, BookOpen, DollarSign, Dumbbell, Apple, Tag, GripVertical } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useTasks } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskBucket } from '@/types';
import type { Task } from '@/types';
import { CreateTaskSheet } from '@/components/tasks/CreateTaskSheet';
import { EditTaskSheet } from '@/components/tasks/EditTaskSheet';
import { TaskDetailSheet } from '@/components/tasks/TaskDetailSheet';
import { SortableCategory } from '@/components/habits/SortableCategory';
import { useCategorySettings } from '@/hooks/useCategorySettings';

const bucketIcons = {
  today: Clock,
  week: Calendar,
  later: ArrowRight
};

const bucketLabels = {
  today: 'Hoje',
  week: 'Semana',
  later: 'Depois'
};

// mapa categoria -> ícone e classe de cor do texto para tarefas
const TASK_CAT_META: Record<string,{icon:any,color:string}> = {
  'Trabalho': { icon: Monitor, color: 'text-green-500' },
  'trabalho': { icon: Monitor, color: 'text-green-500' },
  'Saúde': { icon: HeartPulse, color: 'text-red-500' },
  'saude': { icon: HeartPulse, color: 'text-red-500' },
  'Mente': { icon: Brain, color: 'text-purple-500' },
  'mente': { icon: Brain, color: 'text-purple-500' },
  'Social': { icon: Users, color: 'text-yellow-500' },
  'social': { icon: Users, color: 'text-yellow-500' },
  'Casa': { icon: Home, color: 'text-blue-500' },
  'casa': { icon: Home, color: 'text-blue-500' },
  'Imagem Pessoal': { icon: Camera, color: 'text-blue-400' },
  'imagem pessoal': { icon: Camera, color: 'text-blue-400' },
  'Produtividade': { icon: Clock, color: 'text-orange-400' },
  'produtividade': { icon: Clock, color: 'text-orange-400' },
  'Arte': { icon: Paintbrush, color: 'text-pink-400' },
  'arte': { icon: Paintbrush, color: 'text-pink-400' },
  'Leitura': { icon: BookOpen, color: 'text-indigo-400' },
  'leitura': { icon: BookOpen, color: 'text-indigo-400' },
  'Finanças': { icon: DollarSign, color: 'text-yellow-300' },
  'financas': { icon: DollarSign, color: 'text-yellow-300' },
  'finanças': { icon: DollarSign, color: 'text-yellow-300' },
  'Fitness': { icon: Dumbbell, color: 'text-lime-400' },
  'fitness': { icon: Dumbbell, color: 'text-lime-400' },
  'Nutrição': { icon: Apple, color: 'text-emerald-400' },
  'nutricao': { icon: Apple, color: 'text-emerald-400' },
  'nutrição': { icon: Apple, color: 'text-emerald-400' },
  'Sem Categoria': { icon: Tag, color: '' },
  'sem categoria': { icon: Tag, color: '' },
};

// Função para normalizar nome da categoria
const normalizeCategoryName = (name: string): string => {
  if (!name) return 'Sem Categoria';
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

// Função para obter metadados da categoria
const getCategoryMeta = (categoryName: string) => {
  const normalized = normalizeCategoryName(categoryName);
  return TASK_CAT_META[normalized] || TASK_CAT_META[categoryName.toLowerCase()] || TASK_CAT_META['Sem Categoria'];
};

export const TasksView = () => {
  const { 
    todayTasks, 
    weekTasks, 
    laterTasks, 
    toggleTask, 
    moveTask, 
    deleteTask,
    addTask,
    updateTask,
  } = useTasks();

  // Use new category settings hook
  const { settings, saveTaskCategoryOrder, toggleTaskCategory } = useCategorySettings();
  
  // Get bucket-specific settings
  const getTaskCategoryOrder = (bucket: TaskBucket) => settings.taskCategoryOrder[bucket];
  const getTaskCategoryCollapsed = (bucket: TaskBucket) => settings.taskCategoryCollapsed[bucket];

  const [activeBucket, setActiveBucket] = useState<TaskBucket>('today');
  const [openCreate, setOpenCreate] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewTask, setViewTask] = useState<Task | null>(null);
  const [chooseBucket, setChooseBucket] = useState(false);

  const taskBuckets: { bucket: TaskBucket; tasks: typeof todayTasks }[] = [
    { bucket: 'today', tasks: todayTasks },
    { bucket: 'week', tasks: weekTasks },
    { bucket: 'later', tasks: laterTasks }
  ];

  const totalTasks = todayTasks.length + weekTasks.length + laterTasks.length;
  const completedTasks = [...todayTasks, ...weekTasks, ...laterTasks].filter(t => t.completed).length;

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: { 
        distance: 8,
        delay: 150,
        tolerance: 5
      } 
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5
      }
    })
  );

  // Group tasks by category
  const groupByCategory = (list: Task[]) => {
    const map: Record<string, Task[]> = {};
    list.forEach(t => {
      const key = normalizeCategoryName(t.category || 'Sem Categoria');
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  };

  // Get ordered categories for specific bucket
  const orderedCats = (grp: Record<string, Task[]>, bucket: TaskBucket) => {
    let order = [...getTaskCategoryOrder(bucket)];
    const keys = Object.keys(grp);
    keys.forEach(k => { if (!order.includes(k)) order.push(k); });
    // remove categories not present
    order = order.filter(k => keys.includes(k));
    return order;
  };

  // Handle category drag end for specific bucket
  const handleCategoryDragEnd = (bucket: TaskBucket, grpCats: string[]) => (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    // Verificar se é uma categoria sendo arrastada
    if (!active.id.toString().startsWith('category-')) return;
    
    // Extrair IDs reais dos prefixos
    const activeId = active.id.toString().replace('category-', '');
    const overId = over.id.toString().replace('category-', '');
    
    const oldIdx = grpCats.findIndex(c => c === activeId);
    const newIdx = grpCats.findIndex(c => c === overId);
    
    if (oldIdx === -1 || newIdx === -1) return;
    
    const newOrder = arrayMove(grpCats, oldIdx, newIdx);
    saveTaskCategoryOrder(bucket, newOrder);
  };

  const toggleGroup = (bucket: TaskBucket, cat: string) => {
    toggleTaskCategory(bucket, cat);
  };


  return (
    <>
    <div className="p-4 space-y-6 select-none">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">Tarefas</h1>
        </div>
        
        <Button className="flex items-center gap-2" onClick={() => { setChooseBucket(true); setOpenCreate(true);} }>
          <Plus size={16} />
          Nova Tarefa
        </Button>
      </motion.div>

      {/* Visão Geral removida */}

      {/* Task Buckets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={activeBucket} onValueChange={(val)=>setActiveBucket(val as TaskBucket)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 h-16">
            {taskBuckets.map(({ bucket, tasks }) => {
              const Icon = bucketIcons[bucket];
              const pending = tasks.filter(t=>!t.completed).length;
              return (
                <TabsTrigger
                  key={bucket}
                  value={bucket}
                  className="flex flex-col items-center justify-center gap-1 py-2 relative"
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="text-xs truncate max-w-[60px]">{bucketLabels[bucket]}</span>
                  {pending>0 && (
                    <span className="absolute -top-1 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-[10px] flex items-center justify-center z-10">
                      {pending}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {taskBuckets.map(({ bucket, tasks }) => {
            const groupedTasks = groupByCategory(tasks);
            const orderedCategories = orderedCats(groupedTasks, bucket);
            const collapsed = getTaskCategoryCollapsed(bucket);
            
            return (
              <TabsContent key={bucket} value={bucket} className="mt-4">
                {tasks.length > 0 ? (
                  <div className="space-y-4">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd(bucket, orderedCategories)}>
                      <SortableContext items={orderedCategories.map(cat => `category-${cat}`)} strategy={verticalListSortingStrategy}>
                        {orderedCategories.map(cat => {
                          const categoryTasks = groupedTasks[cat];
                          if (!categoryTasks) return null;

                          const pendingTasks = categoryTasks
                            .filter(task => !task.completed)
                            .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]));
                          
                          const completedTasks = categoryTasks
                            .filter(task => task.completed)
                            .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]));

                          return (
                            <SortableCategory key={cat} id={cat}>
                              {({ categoryDragHandleProps }: any) => (
                                <div key={cat}>
                                  <button className="w-full bg-[#18181b] rounded-xl p-3 mb-2 flex items-center justify-between select-none" onClick={() => toggleGroup(bucket, cat)}>
                                    <div className="flex items-center gap-2">
                                      <button 
                                        {...categoryDragHandleProps}
                                        className="cursor-grab touch-none p-1 hover:bg-white/10 rounded transition-colors"
                                        style={{ touchAction: 'none' }}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <GripVertical size={14} className="text-muted-foreground" />
                                      </button>
                                      {(() => {
                                        const meta = getCategoryMeta(cat);
                                        if (!meta.icon) return null;
                                        const IconComp = meta.icon;
                                        return <IconComp size={16} className="text-white" />;
                                      })()}
                                      <span className="font-semibold text-sm">{cat} <span className="text-muted-foreground">({categoryTasks.length})</span></span>
                                    </div>
                                    <span className="w-7 h-7 rounded-full flex items-center justify-center transition-transform" style={{ backgroundColor: '#2b2b31cc' }}>
                                      <ChevronDown size={14} className={`transition-transform duration-300 ${collapsed[cat] ? '-rotate-90' : ''}`} />
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
                                        <div className="space-y-3 pt-2">
                                          {/* Pending tasks */}
                                          {pendingTasks.length > 0 && (
                                            <div className="space-y-3">
                                              <h4 className="text-xs font-medium text-muted-foreground ml-3">
                                                Pendentes ({pendingTasks.length})
                                              </h4>
                                              {pendingTasks.map(task => (
                                                <TaskCard
                                                  key={task.id}
                                                  task={task}
                                                  onToggle={() => toggleTask(task.id)}
                                                  onMove={(b) => moveTask(task.id, b)}
                                                  onDelete={() => deleteTask(task.id)}
                                                  onEdit={() => setEditingTask(task)}
                                                  onView={() => setViewTask(task)}
                                                />
                                              ))}
                                            </div>
                                          )}

                                          {/* Completed tasks */}
                                          {completedTasks.length > 0 && (
                                            <div className="space-y-3 mt-4">
                                              <h4 className="text-xs font-medium text-muted-foreground ml-3">
                                                Concluídas ({completedTasks.length})
                                              </h4>
                                              {completedTasks.map(task => (
                                                <TaskCard
                                                  key={task.id}
                                                  task={task}
                                                  onToggle={() => toggleTask(task.id)}
                                                  onMove={(b) => moveTask(task.id, b)}
                                                  onDelete={() => deleteTask(task.id)}
                                                  onEdit={() => setEditingTask(task)}
                                                  onView={() => setViewTask(task)}
                                                />
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )}
                            </SortableCategory>
                          );
                        })}
                      </SortableContext>
                    </DndContext>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="card-glass p-8 rounded-xl text-center"
                  >
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      {React.createElement(bucketIcons[bucket], { 
                        size: 24, 
                        className: "text-muted-foreground" 
                      })}
                    </div>
                    <h3 className="font-semibold mb-2">Nenhuma tarefa em {bucketLabels[bucket].toLowerCase()}</h3>
                    <p className="text-muted-foreground mb-4">
                      Adicione tarefas para começar seu planejamento de {bucketLabels[bucket].toLowerCase()}
                    </p>
                    <Button variant="outline" className="flex items-center gap-2 mx-auto" onClick={() => { setChooseBucket(false); setOpenCreate(true); }}>
                      <Plus size={16} />
                      Adicionar Tarefa
                    </Button>
                  </motion.div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </motion.div>
    </div>
    <CreateTaskSheet open={openCreate} onOpenChange={(o)=>{setOpenCreate(o)}} defaultBucket={activeBucket} addTask={addTask} showBucketSelect={chooseBucket} />
    <EditTaskSheet task={editingTask} open={!!editingTask} onOpenChange={(o)=>!o && setEditingTask(null)} onSave={updateTask} />
    <TaskDetailSheet task={viewTask} open={!!viewTask} onOpenChange={(o)=>!o && setViewTask(null)} onEdit={(t)=>{setViewTask(null); setEditingTask(t);}} />
    </>
  );
};