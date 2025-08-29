import React, { useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { Plus, Clock, Calendar, ArrowRight } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskBucket } from '@/types';
import type { Task } from '@/types';
import { CreateTaskSheet } from '@/components/tasks/CreateTaskSheet';
import { EditTaskSheet } from '@/components/tasks/EditTaskSheet';
import { TaskDetailSheet } from '@/components/tasks/TaskDetailSheet';

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
    reorderTasks,
  } = useTasks();

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

  // drag sensors removed

  const handleDragEnd = (event:any, tasksArr: typeof todayTasks, bucket: TaskBucket)=>{
     const {active, over}=event;
     if(!over || active.id===over.id) return;
     const oldIndex = tasksArr.findIndex(t=>t.id===active.id);
     const newIndex = tasksArr.findIndex(t=>t.id===over.id);
     const newOrder = arrayMove(tasksArr, oldIndex, newIndex);
     reorderTasks(newOrder);
  }

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

          {taskBuckets.map(({ bucket, tasks }) => (
            <TabsContent key={bucket} value={bucket} className="mt-4">
              {tasks.length > 0 ? (
                <div className="space-y-3">
                  {/* Pending tasks */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      Pendentes ({tasks.filter(t=>!t.completed).length})
                    </h3>
                    {tasks
                      .filter(task=>!task.completed)
                      .sort((a,b)=>({high:0,medium:1,low:2}[a.priority]-({high:0,medium:1,low:2}[b.priority])) )
                      .map(task=> (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onToggle={()=>toggleTask(task.id)}
                          onMove={(b)=>moveTask(task.id,b)}
                          onDelete={()=>deleteTask(task.id)}
                          onEdit={()=>setEditingTask(task)}
                          onView={()=>setViewTask(task)}
                        />
                      ))}
                  </div>

                  {/* Completed tasks */}
                  {tasks.filter(task => task.completed).length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">
                        Concluídas ({tasks.filter(task => task.completed).length})
                      </h3>
                      <div className="space-y-3">
                        {tasks
                          .filter(task => task.completed)
                          .sort((a,b)=>({high:0,medium:1,low:2}[a.priority]-({high:0,medium:1,low:2}[b.priority])) )
                          .map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              onToggle={() => toggleTask(task.id)}
                              onMove={(newBucket) => moveTask(task.id, newBucket)}
                              onDelete={() => deleteTask(task.id)}
                              onEdit={() => setEditingTask(task)}
                              onView={()=>setViewTask(task)}
                            />
                          ))}
                      </div>
                    </div>
                  )}
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
                  <Button variant="outline" className="flex items-center gap-2 mx-auto" onClick={() => { setChooseBucket(false); setOpenCreate(true);} }>
                    <Plus size={16} />
                    Adicionar Tarefa
                  </Button>
                </motion.div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </div>
    <CreateTaskSheet open={openCreate} onOpenChange={(o)=>{setOpenCreate(o)}} defaultBucket={activeBucket} addTask={addTask} showBucketSelect={chooseBucket} />
    <EditTaskSheet task={editingTask} open={!!editingTask} onOpenChange={(o)=>!o && setEditingTask(null)} onSave={updateTask} />
    <TaskDetailSheet task={viewTask} open={!!viewTask} onOpenChange={(o)=>!o && setViewTask(null)} onEdit={(t)=>{setViewTask(null); setEditingTask(t);}} />
    </>
  );
};