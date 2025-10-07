import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Task } from "@/types";
import { AlertCircle, ChevronDown, Calendar, ArrowRight, Paintbrush, BookOpen, DollarSign, Dumbbell, Apple, HeartPulse, Brain, Users, Monitor, Camera, Clock, Tag } from "lucide-react";
import { WeekDayPicker } from "@/components/pickers/WeekDayPicker";
import { cn } from "@/lib/utils";
import clsx from 'clsx';

const CATEGORY_OPTIONS = [
  { name: 'arte', label: 'Arte', icon: Paintbrush },
  { name: 'estudo', label: 'Estudo', icon: BookOpen },
  { name: 'financas', label: 'Finanças', icon: DollarSign },
  { name: 'fitness', label: 'Fitness', icon: Dumbbell },
  { name: 'nutricao', label: 'Nutrição', icon: Apple },
  { name: 'saude', label: 'Saúde', icon: HeartPulse },
  { name: 'mente', label: 'Mente', icon: Brain },
  { name: 'social', label: 'Social', icon: Users },
  { name: 'trabalho', label: 'Trabalho', icon: Monitor },
  { name: 'imagem-pessoal', label: 'Imagem Pessoal', icon: Camera },
  { name: 'hobbies', label: 'Hobbies', icon: Paintbrush },
  { name: 'produtividade', label: 'Produtividade', icon: Clock },
  { name: 'personal', label: 'Pessoal', icon: Users },
  { name: 'Outro', label: 'Outro', icon: Tag },
];

interface EditTaskSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (task: Task)=>Promise<void>;
}

export const EditTaskSheet = ({ task, open, onOpenChange, onSave }: EditTaskSheetProps) => {

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("low");
  const [category, setCategory] = useState<string>("");
  const [bucket, setBucket] = useState<Task['bucket']>(() => task?.bucket ?? 'today');
  const [weekStart, setWeekStart] = useState<string | undefined>();
  const [weekEnd, setWeekEnd] = useState<string | undefined>();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCustomCat, setShowCustomCat] = useState(false);
  const [customCat, setCustomCat] = useState('');

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

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority);
      setCategory(task.category || "");
      setWeekStart(task.weekStart);
      setWeekEnd(task.weekEnd);
      setShowAdvanced(false);
      setBucket(task.bucket);
    }
  }, [task]);

  if (!task) return null;

  const handleSave = async () => {
    // Cria objeto completo de Task para salvar
    const updatedTask: Task = {
      ...task!,
      title: title.trim(),
      description: description.trim(),
      priority,
      category: category || undefined,
      bucket,
      weekStart: bucket==='week' ? weekStart : undefined,
      weekEnd: bucket==='week' ? weekEnd : undefined,
      updatedAt: new Date().toISOString(),
    };
    await onSave(updatedTask);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Editar Tarefa</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" />
          <Textarea className="resize-none" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição" />

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-sm mb-1 block">Prioridade</label>
            <ToggleGroup type="single" value={priority} onValueChange={(v)=>setPriority(v as Task["priority"])} className="w-full">
              {(["low","medium","high"] as const).map(p=> (
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
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_OPTIONS.map(opt=>{
                      const selected = category===opt.name;
                      return (
                        <Button key={opt.name} size="sm" variant={selected?'default':'outline'} className="gap-1" onClick={()=>{
                          if(opt.name==='Outro') { setShowCustomCat(prev=>!prev); return; }
                          setCategory(opt.name); setShowCustomCat(false);
                        }}>
                          <opt.icon size={14}/>
                          {opt.label}
                        </Button>
                      );
                    })}
                  </div>

                  {showCustomCat && (
                    <div className="flex gap-2 mt-2">
                      <Input placeholder="Nova categoria" value={customCat} onChange={(e)=>setCustomCat(e.target.value)} className="flex-1" />
                      <Button disabled={!customCat.trim()} onClick={()=>{
                        const name=customCat.trim().toLowerCase().replace(/\s+/g,'-');
                        if(name){ setCategory(name); setShowCustomCat(false); setCustomCat(''); }
                      }}>Adicionar</Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Removido WeekDayPicker daqui para reposicionar */}

          {/* Seção 'Adicionar em' fora das opções avançadas */}
          <div className="mt-6 mb-4">
            <label className="text-sm mb-2 block">Adicionar em</label>
          <ToggleGroup type="single" value={bucket} onValueChange={(v) => setBucket(v as Task['bucket'])} className="w-full">
            <ToggleGroupItem value="today" className="flex-1 py-8 my-3 rounded-lg border data-[state=on]:ring-2 data-[state=on]:ring-success data-[state=on]:text-success">
              <div className="flex flex-col items-center gap-1">
                <Clock size={18} />
                <span className="text-xs">Hoje</span>
              </div>
            </ToggleGroupItem>
            <ToggleGroupItem value="week" className="flex-1 py-8 my-3 rounded-lg border data-[state=on]:ring-2 data-[state=on]:ring-success data-[state=on]:text-success">
              <div className="flex flex-col items-center gap-1">
                <Calendar size={18} />
                <span className="text-xs">Semana</span>
              </div>
            </ToggleGroupItem>
            <ToggleGroupItem value="later" className="flex-1 py-8 my-3 rounded-lg border data-[state=on]:ring-2 data-[state=on]:ring-success data-[state=on]:text-success">
              <div className="flex flex-col items-center gap-1">
                <ArrowRight size={18} />
                <span className="text-xs">Depois</span>
              </div>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        {/* WeekDayPicker reposicionado abaixo de 'Adicionar em' */}
        {bucket==='week' && (
          <div className="space-y-2 mt-4 mb-8">
            <label className="text-sm mb-1 block">Dias da semana</label>
            <WeekDayPicker start={weekStart} end={weekEnd} onChange={(s,e)=>{setWeekStart(s); setWeekEnd(e);}} />
          </div>
        )}
        {/* Fecha o container principal */}
        </div>
        <SheetFooter>
          <Button onClick={handleSave} disabled={!title.trim()}>Salvar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};