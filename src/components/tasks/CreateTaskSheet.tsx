import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Clock, Calendar, ArrowRight, AlertCircle, ChevronDown } from 'lucide-react';
import { WeekDayPicker } from "@/components/pickers/WeekDayPicker";
import { CategoryPicker } from "@/components/pickers/CategoryPicker";
import { TaskBucket } from "@/types";
import { cn } from "@/lib/utils";
import clsx from 'clsx';

interface CreateTaskSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultBucket: TaskBucket;
  addTask: (data: Omit<import("@/types").Task, 'id'|'createdAt'|'updatedAt'|'order'>) => Promise<any>;
  showBucketSelect?: boolean;
}

const priorityColors = {
  low: "text-green-500",
  medium: "text-yellow-400",
  high: "text-red-500",
} as const;

const priorityRing = {
  low: 'data-[state=on]:ring-green-500',
  medium: 'data-[state=on]:ring-yellow-400',
  high: 'data-[state=on]:ring-red-500'
} as const;

const textOn = {
  low: 'data-[state=on]:text-green-500',
  medium: 'data-[state=on]:text-yellow-400',
  high: 'data-[state=on]:text-red-500'
} as const;

// Removido CATEGORY_OPTIONS - agora usando CategoryPicker que já tem todas as categorias

export const CreateTaskSheet = ({ open, onOpenChange, defaultBucket, addTask, showBucketSelect }: CreateTaskSheetProps) => {
  const [title, setTitle] = useState("");
  const [bucket, setBucket] = useState<TaskBucket>(defaultBucket);
  const [priority, setPriority] = useState<'low'|'medium'|'high'>("low");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [weekStart, setWeekStart] = useState<string | undefined>();
  const [weekEnd, setWeekEnd] = useState<string | undefined>();
  const [showAdvanced, setShowAdvanced] = useState(false);
  // Removido showCustomCat e customCat - CategoryPicker já gerencia isso

  const handleCreate = async () => {
    if (!title.trim()) return;
    await addTask({
      title: title.trim(),
      bucket: bucket,
      completed: false,
      priority: priority,
      description: description.trim() || undefined,
      category: category || undefined,
      weekStart: bucket === 'week' ? weekStart : undefined,
      weekEnd: bucket === 'week' ? weekEnd : undefined,
    });
    setTitle("");
    setDescription("");
    setCategory("");
    setShowAdvanced(false);
    onOpenChange(false);
  };

  // Limpa seleção se bucket mudar
  useEffect(() => {
    if (bucket !== 'week') {
      setWeekStart(undefined);
      setWeekEnd(undefined);
    }
  }, [bucket]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Nova Tarefa</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <Input
            placeholder="Título da tarefa"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea className="resize-none" placeholder="Descrição (opcional)" value={description} onChange={(e)=>setDescription(e.target.value)} />

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-sm mb-1 block">Prioridade</label>
            <ToggleGroup type="single" value={priority} onValueChange={(v)=>setPriority(v as any)} className="w-full">
              {(['low','medium','high'] as const).map(p=> (
                <ToggleGroupItem key={p} value={p} className={cn(`flex-1 py-3 rounded-lg border flex items-center justify-center gap-1 text-white`, textOn[p], `data-[state=on]:ring-2`, priorityRing[p])}>
                  <AlertCircle size={14} className={priorityColors[p]} />
                  <span className="text-xs capitalize">{p === 'low' ? 'Baixa' : p === 'medium' ? 'Média' : 'Alta'}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Advanced options */}
          <div>
            <button onClick={()=>setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-sm font-medium">
              Opções avançadas <ChevronDown size={16} className={clsx('transition-transform', { 'rotate-180': showAdvanced })} />
            </button>
            {showAdvanced && (
              <div className="mt-4 space-y-4">
                {/* Categories */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria</label>
                  <CategoryPicker
                    value={category}
                    onChange={(value) => setCategory(Array.isArray(value) ? value[0] || '' : value)}
                    placeholder="Selecione uma categoria"
                    allowCustom={true}
                    showSearch={true}
                  />
                </div>
              </div>
            )}
          </div>

          {showBucketSelect && (
            <div>
              <label className="text-sm mb-2 block">Adicionar em</label>
              <ToggleGroup type="single" value={bucket} onValueChange={(v)=>setBucket(v as TaskBucket)} className="w-full">
                <ToggleGroupItem value="today" className="flex-1 py-7 rounded-lg border data-[state=on]:ring-2 data-[state=on]:ring-success data-[state=on]:text-success">
                  <div className="flex flex-col items-center gap-1">
                    <Clock size={18} />
                    <span className="text-xs">Hoje</span>
                  </div>
                </ToggleGroupItem>
                <ToggleGroupItem value="week" className="flex-1 py-7 rounded-lg border data-[state=on]:ring-2 data-[state=on]:ring-success data-[state=on]:text-success">
                  <div className="flex flex-col items-center gap-1">
                    <Calendar size={18} />
                    <span className="text-xs">Semana</span>
                  </div>
                </ToggleGroupItem>
                <ToggleGroupItem value="later" className="flex-1 py-7 rounded-lg border data-[state=on]:ring-2 data-[state=on]:ring-success data-[state=on]:text-success">
                  <div className="flex flex-col items-center gap-1">
                    <ArrowRight size={18} />
                    <span className="text-xs">Depois</span>
                  </div>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          )}

          {/* Se bucket Semana, mostrar seletor */}
          {bucket === 'week' && (
            <div className="space-y-2">
              <label className="text-sm mb-1 block">Dias da semana</label>
              <WeekDayPicker start={weekStart} end={weekEnd} onChange={(s,e)=>{setWeekStart(s); setWeekEnd(e);}} />
            </div>
          )}

        </div>

        <SheetFooter>
          <Button onClick={handleCreate} disabled={!title.trim()}>
            Salvar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
