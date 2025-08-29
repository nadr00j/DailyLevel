import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Goal } from "@/types";
import { Target, CalendarClock, CheckCircle, HeartPulse, Briefcase, DollarSign, BookOpen, Users, Tag, Paintbrush, Dumbbell, Apple, Monitor, Brain, Camera, Clock } from "lucide-react";
import clsx from 'clsx';
import { IconEmojiPicker } from '@/components/pickers/IconEmojiPicker';
import { HABIT_COLORS } from '@/constants/colors';
import * as LucideIcons from 'lucide-react';
import { Plus } from 'lucide-react';
import { ColorPickerPopover } from '@/components/ui/ColorPickerPopover';
import { ChevronDown } from 'lucide-react';

function blendWithDark(hex:string,factor:number){
  const h=(hex||'#ffffff').replace('#','');
  const r=parseInt(h.substring(0,2),16)||255;
  const g=parseInt(h.substring(2,4),16)||255;
  const b=parseInt(h.substring(4,6),16)||255;
  const toHex=(v:number)=>v.toString(16).padStart(2,'0');
  const dR=28,dG=28,dB=30;
  return `#${toHex(Math.round(r*factor+dR*(1-factor)))}${toHex(Math.round(g*factor+dG*(1-factor)))}${toHex(Math.round(b*factor+dB*(1-factor)))}`;
}

interface EditGoalSheetProps {
  goal: Goal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, data: Partial<Goal>) => Promise<void>;
}

export const EditGoalSheet = ({ goal, open, onOpenChange, onSave }: EditGoalSheetProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bucket, setBucket] = useState<'active' | 'future' | 'completed'>('active');
  const [color, setColor] = useState<string>('');
  const [iconType, setIconType] = useState<'icon'|'emoji'|null>(null);
  const [iconValue, setIconValue] = useState<string>('');
  const [pickerOpen, setPickerOpen] = useState(false);

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

  const [category, setCategory] = useState<string>('personal');
  const [showCustomCat,setShowCustomCat]=useState(false);
  const [customCat,setCustomCat]=useState('');
  const [showAdvanced,setShowAdvanced]=useState(false);

  // Sync local state when a new goal is provided
  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setDescription(goal.description || "");
      if (goal.isCompleted) setBucket('completed');
      else if (goal.isFuture) setBucket('future');
      else setBucket('active');
      setColor(goal.color || '');
      setIconType(goal.iconType || null);
      setIconValue(goal.iconValue || '');
      setCategory(goal.category || 'personal');
    }
  }, [goal]);

  if (!goal) return null;

  const handleSave = async () => {
    const updates: Partial<Goal> = {
      title: title.trim(),
      description: description.trim() || undefined,
      color,
      iconType: iconType || undefined,
      iconValue: iconValue || undefined,
      category,
    };

    // Bucket mapping
    if (bucket === 'active') {
      updates.isFuture = false;
      updates.isCompleted = false;
    } else if (bucket === 'future') {
      updates.isFuture = true;
      updates.isCompleted = false;
    } else if (bucket === 'completed') {
      updates.isFuture = false;
      updates.isCompleted = true;
    }

    await onSave(goal.id, updates);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="sm:max-w-lg"
        onInteractOutside={(e)=>{ if(pickerOpen) e.preventDefault(); }}
        onEscapeKeyDown={(e)=>{ if(pickerOpen) e.preventDefault(); }}
      >
        <SheetHeader>
          <SheetTitle>Editar Meta</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0" style={{backgroundColor: color ? blendWithDark(color,0.4): '#2a2a2c'}}>
              {iconValue ? (iconType==='emoji' ? iconValue : React.createElement((LucideIcons as any)[iconValue] || (LucideIcons as any).HelpCircle, { size:18 })) : '?'}
            </div>
            <Input placeholder="Título" className="flex-1" value={title} onChange={(e)=>setTitle(e.target.value)} />
          </div>
          <Textarea
            placeholder="Descrição (opcional)"
            className="resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Icon / Emoji */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ícone / Emoji</label>
            <Button variant="outline" onClick={()=>setPickerOpen(true)} className="w-full justify-start gap-2">
              {iconValue ? (
                iconType==='emoji' ? iconValue : React.createElement((LucideIcons as any)[iconValue] || (LucideIcons as any).HelpCircle, { size:16 })
              ) : <Plus size={16}/>}<span>{iconValue ? 'Trocar' : 'Escolher'}</span>
            </Button>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Cor</label>
            <div className="grid grid-cols-6 gap-2">
              {HABIT_COLORS.map(c=> (
                <button key={c} className={`w-8 h-8 rounded-[10px] ${color===c ? 'ring-2 ring-offset-2 ring-primary' : ''}`} style={{backgroundColor:c}} onClick={()=>setColor(c)} />
              ))}
              <ColorPickerPopover value={color} onChange={setColor} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm mb-1 block">Mover para</label>
            <ToggleGroup type="single" value={bucket} onValueChange={(v)=>setBucket(v as any)} className="w-full">
              <ToggleGroupItem value="active" className="flex-1 py-7 rounded-lg border data-[state=on]:ring-2 data-[state=on]:ring-green-500 data-[state=on]:text-green-500 flex flex-col items-center justify-center gap-1 text-white">
                <Target size={16} className="shrink-0 stroke-current" />
                <span className="text-xs">Ativas</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="future" className="flex-1 py-7 rounded-lg border data-[state=on]:ring-2 data-[state=on]:ring-green-500 data-[state=on]:text-green-500 flex flex-col items-center justify-center gap-1 text-white">
                <CalendarClock size={16} className="shrink-0 stroke-current" />
                <span className="text-xs">Futuras</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Advanced options */}
          <div>
            <button onClick={()=>setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-sm font-medium">
              Opções avançadas <ChevronDown size={16} className={clsx('transition-transform', { 'rotate-180': showAdvanced })} />
            </button>
            {showAdvanced && (
            <div className="space-y-2 mt-4">
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
            </div>) }
          </div>
        </div>

        <SheetFooter>
          <Button onClick={handleSave} disabled={!title.trim()}>Salvar</Button>
        </SheetFooter>
        <IconEmojiPicker
          open={pickerOpen}
          onClose={()=>setPickerOpen(false)}
          onSelectIcon={(name)=>{setIconType('icon'); setIconValue(name); setPickerOpen(false);}}
          onSelectEmoji={(char)=>{setIconType('emoji'); setIconValue(char); setPickerOpen(false);}}
          initialTab="icon"
        />
      </SheetContent>
    </Sheet>
  );
};
