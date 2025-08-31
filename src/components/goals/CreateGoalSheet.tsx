import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Target, CalendarClock, Plus } from "lucide-react";
import { IconEmojiPicker } from '@/components/pickers/IconEmojiPicker';
import { HABIT_COLORS } from '@/constants/colors';
import * as LucideIcons from 'lucide-react';
import { ColorPickerPopover } from '@/components/ui/ColorPickerPopover';
import { HeartPulse, Briefcase, DollarSign, BookOpen, Users, Tag } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

// util
function blendWithDark(hex:string, factor:number){
  const h = (hex||'#ffffff').replace('#','');
  const r=parseInt(h.substring(0,2),16)||255;
  const g=parseInt(h.substring(2,4),16)||255;
  const b=parseInt(h.substring(4,6),16)||255;
  const toHex=(v:number)=>v.toString(16).padStart(2,'0');
  const dR=28,dG=28,dB=30;
  return `#${toHex(Math.round(r*factor+dR*(1-factor)))}${toHex(Math.round(g*factor+dG*(1-factor)))}${toHex(Math.round(b*factor+dB*(1-factor)))}`;
}

interface CreateGoalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addGoal: (goalData: any)=>Promise<any>;
  defaultBucket?: 'active'|'future';
}

export const CreateGoalSheet = ({ open, onOpenChange, addGoal, defaultBucket }: CreateGoalSheetProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bucket, setBucket] = useState<'active'|'future'>('active');
  const [color, setColor] = useState<string>('');
  const [iconType, setIconType] = useState<'icon'|'emoji'|null>(null);
  const [iconValue, setIconValue] = useState<string>('');
  const [pickerOpen, setPickerOpen] = useState(false);

  const CATEGORY_OPTIONS = [
    { name: 'arte', label: 'Arte', icon: LucideIcons.Paintbrush },
    { name: 'estudo', label: 'Estudo', icon: LucideIcons.Book },
    { name: 'financas', label: 'Finanças', icon: LucideIcons.DollarSign },
    { name: 'fitness', label: 'Fitness', icon: LucideIcons.Dumbbell },
    { name: 'nutricao', label: 'Nutrição', icon: LucideIcons.Apple },
    { name: 'saude', label: 'Saúde', icon: LucideIcons.HeartPulse },
    { name: 'mente', label: 'Mente', icon: LucideIcons.Brain },
    { name: 'social', label: 'Social', icon: LucideIcons.Users },
    { name: 'trabalho', label: 'Trabalho', icon: LucideIcons.Monitor },
    { name: 'imagem-pessoal', label: 'Imagem Pessoal', icon: LucideIcons.Camera },
    { name: 'hobbies', label: 'Hobbies', icon: LucideIcons.Gamepad2 },
    { name: 'produtividade', label: 'Produtividade', icon: LucideIcons.Clock },
    { name: 'personal', label: 'Pessoal', icon: LucideIcons.Users },
    { name: 'Outro', label: 'Outro', icon: LucideIcons.Tag },
  ];

  const [category, setCategory] = useState<string>('personal');
  const [showCustomCat,setShowCustomCat]=useState(false);
  const [customCat,setCustomCat]=useState('');
  const [showAdvanced,setShowAdvanced]=useState(false);

  // sincroniza bucket quando abrir
  useEffect(() => {
    if(open) {
      setBucket(defaultBucket ?? 'active');
    }
  }, [open, defaultBucket]);

  const handleSave = async () => {
    if (!title.trim()) return;
    
    const goalData = {
      title: title.trim(),
      description: description.trim() || undefined,
      color,
      iconType: iconType || undefined,
      iconValue: iconValue || undefined,
      category,
      targetValue: 1,
      unit: "",
      isFuture: bucket==='future'
    };
    
    console.log('🔍 [DEBUG] CreateGoalSheet.handleSave - Criando meta com dados:', goalData);
    
    try {
      addGoal(goalData);
      console.log('✅ [DEBUG] CreateGoalSheet.handleSave - Meta criada com sucesso');
    } catch (error) {
      console.error('❌ [DEBUG] CreateGoalSheet.handleSave - Erro ao criar meta:', error);
    }
    
    // se bucket future já está tratado acima; não há opção completed
    setTitle("");
    setDescription("");
    setColor('');
    setIconType(null);
    setIconValue('');
    setBucket(defaultBucket ?? 'active');
    setCategory('personal');
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
          <SheetTitle>Nova Meta</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0" style={{backgroundColor: color ? blendWithDark(color,0.4) : '#2a2a2c'}}>
              {iconValue ? (iconType==='emoji' ? iconValue : React.createElement((LucideIcons as any)[iconValue] || (LucideIcons as any).HelpCircle, { size:18 })) : '?'}
            </div>
            <Input placeholder="Título da meta" className="flex-1" value={title} onChange={(e)=>setTitle(e.target.value)} />
          </div>
          <Textarea placeholder="Descrição (opcional)" value={description} onChange={(e)=>setDescription(e.target.value)} className="resize-none" />
          {/* bucket select */}
          {/* Icon / Emoji */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ícone / Emoji</label>
            <Button variant="outline" onClick={()=>setPickerOpen(true)} className="w-full justify-start gap-2">
              {iconValue ? (
                iconType==='emoji' ? iconValue : React.createElement((LucideIcons as any)[iconValue] || (LucideIcons as any).HelpCircle, { size:16 })
              ) : <Plus size={16}/>}<span>{iconValue ? 'Trocar' : 'Escolher'}</span>
            </Button>
          </div>

          {/* Color select */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Cor</label>
            <div className="grid grid-cols-6 gap-2">
              {HABIT_COLORS.map(c=> (
                <button key={c} className={`w-8 h-8 rounded-[10px] ${color===c ? 'ring-2 ring-offset-2 ring-primary': ''}`} style={{backgroundColor:c}} onClick={()=>setColor(c)} />
              ))}
              <ColorPickerPopover value={color} onChange={setColor} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm mb-1 block">Adicionar em</label>
            <ToggleGroup type="single" value={bucket} onValueChange={(v)=>setBucket(v as 'active'|'future')} className="w-full">
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
                  <Button key={opt.name} size="sm" variant={selected? 'default':'outline'} className="gap-1" onClick={()=>{
                    if(opt.name==='Outro'){
                      setShowCustomCat(prev=>!prev);
                      return;
                    }
                    setCategory(opt.name);
                    setShowCustomCat(false);
                  }}>
                    <opt.icon size={14} />
                    {opt.label}
                  </Button>
                );
              })}
            </div>

            {showCustomCat && (
              <div className="flex gap-2 mt-2">
                <Input placeholder="Nova categoria" value={customCat} onChange={(e)=>setCustomCat(e.target.value)} className="flex-1" />
                <Button disabled={!customCat.trim()} onClick={()=>{
                  const name = customCat.trim().toLowerCase().replace(/\s+/g,'-');
                  if(name){ setCategory(name); setShowCustomCat(false); setCustomCat(''); }
                }}>Adicionar</Button>
              </div>
            )}
          </div>
          )}
          </div>
        </div>

        <SheetFooter>
          <Button onClick={handleSave} disabled={!title.trim()}>Salvar</Button>
        </SheetFooter>
      </SheetContent>
      {/* Picker modal */}
      <IconEmojiPicker
        open={pickerOpen}
        onClose={()=>setPickerOpen(false)}
        onSelectIcon={(name)=>{ setIconType('icon'); setIconValue(name); setPickerOpen(false); }}
        onSelectEmoji={(char)=>{ setIconType('emoji'); setIconValue(char); setPickerOpen(false); }}
        initialTab="icon"
      />
    </Sheet>
  );
};
