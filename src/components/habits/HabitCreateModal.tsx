import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { HABIT_COLORS } from '@/constants/colors';
import { ColorPickerPopover } from '@/components/ui/ColorPickerPopover';
import { IconEmojiPicker } from '@/components/pickers/IconEmojiPicker';
import { useHabitStore } from '@/stores/useHabitStore';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Slider } from '@/components/ui/slider';
import { ChevronDown, Plus, X } from 'lucide-react';
import clsx from 'clsx';

import * as LucideIcons from 'lucide-react';
import type { Habit } from '@/types/habit';
import { useToast } from '@/hooks/use-toast';

// util para mesclar cor com #1c1c1e
function blendWithDark(hex: string, factor: number): string {
  const h = hex.replace('#','');
  const r = parseInt(h.substring(0,2),16);
  const g = parseInt(h.substring(2,4),16);
  const b = parseInt(h.substring(4,6),16);
  const toHex=(v:number)=>v.toString(16).padStart(2,'0');
  const dR=28,dG=28,dB=30;
  return `#${toHex(Math.round(r*factor + dR*(1-factor)))}${toHex(Math.round(g*factor + dG*(1-factor)))}${toHex(Math.round(b*factor + dB*(1-factor)))}`;
}

const CATEGORY_OPTIONS = [
  { name: 'Arte', icon: 'Paintbrush' },
  { name: 'Estudo', icon: 'Book' },
  { name: 'Leitura', icon: 'BookOpen' },
  { name: 'Finanças', icon: 'DollarSign' },
  { name: 'Fitness', icon: 'Dumbbell' },
  { name: 'Nutrição', icon: 'Apple' },
  { name: 'Saúde', icon: 'HeartPulse' },
  { name: 'Mente', icon: 'Brain' },
  { name: 'Social', icon: 'Users' },
  { name: 'Trabalho', icon: 'Monitor' },
  { name: 'Casa', icon: 'Home' },
  { name: 'Imagem Pessoal', icon: 'Camera' },
  { name: 'Hobbies', icon: 'Gamepad2' },
  { name: 'Produtividade', icon: 'Clock' },
  { name: 'Outro', icon: 'Sparkles' },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit?: Habit | null;
};

export const HabitCreateModal: React.FC<Props> = ({ open, onOpenChange, habit }) => {
  const createHabit = useHabitStore(s=>s.createHabit);
  const updateHabit = useHabitStore(s=>s.updateHabit);
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<string>('');
  const [iconType, setIconType] = useState<'icon'|'emoji' | null>(null);
  const [iconValue, setIconValue] = useState<string>('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [targetInterval, setTargetInterval] = useState<'daily'|'weekly'|'monthly'>('daily');
  const [targetCount, setTargetCount] = useState(1);
  const [activeDays, setActiveDays] = useState<number[]>([]); // for weekly
  const [categories, setCategories] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // estado para categoria personalizada
  const [showCustomCat, setShowCustomCat] = useState(false);
  const [customCat, setCustomCat] = useState('');

  // reset or fill on open
  useEffect(()=>{
    if(open){
      if(habit){
        setName(habit.name ?? '');
        setDescription(habit.description||'');
        setColor(habit.color);
        setIconType(habit.iconType);
        setIconValue(habit.iconValue);
        setTargetInterval(habit.targetInterval==='none' ? 'daily' : habit.targetInterval as 'daily'|'weekly'|'monthly');
        setTargetCount(habit.targetCount);
        setActiveDays(habit.activeDays || []);
        setCategories(habit.categories);
      }else{
        setName(''); setDescription(''); setColor(''); setIconType(null); setIconValue('');
        setTargetInterval('daily'); setTargetCount(1); setCategories([]); setActiveDays([]);
      }
      setShowAdvanced(false);
      setShowCustomCat(false);
      setCustomCat('');
    }
  },[open,habit]);

  const canSave = !!name?.trim() && !!color && !!iconValue;

  const handleSave = () => {
    if(!canSave) return;
    if(habit){
      updateHabit(habit.id,{
        name:name.trim(),
        description: description.trim() || undefined,
        color,
        iconType: iconType!,
        iconValue,
        categories,
        targetInterval,
        targetCount,
        activeDays: targetInterval==='weekly'? activeDays : undefined,
      });
      toast({ title:'Hábito atualizado'});
    }else{
      createHabit({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        iconType: iconType!,
        iconValue,
        categories,
        targetInterval,
        targetCount,
        activeDays: targetInterval==='weekly'? activeDays : undefined,
      });
      toast({ title: 'Hábito criado' });
    }
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[90%] p-0 flex flex-col [&>button]:hidden"
          onInteractOutside={(e)=>e.preventDefault()}
          onEscapeKeyDown={(e)=>e.preventDefault()}
        >
          {/* preview */}
          <div className="p-4 border-b border-border flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: color ? blendWithDark(color,0.4) : '#1c1c1e' }}>
              {iconType==='emoji' ? iconValue : iconType==='icon' ? (
                React.createElement((LucideIcons as any)[iconValue] || (LucideIcons as any).HelpCircle, { size:24 })
              ) : '?' }
            </div>
            <div className="flex-1">
              <p className="font-semibold">{name || 'Nome do Hábito'}</p>
              {description && <p className="text-sm text-muted-foreground truncate max-w-[200px]">{description}</p>}
            </div>
            <Button variant="ghost" size="icon" onClick={()=>onOpenChange(false)}>
              <X size={20}/>
            </Button>
          </div>

          {/* form */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Nome */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input value={name} onChange={(e)=>setName(e.target.value)} maxLength={48} placeholder="Beber Água" />
            </div>

            {/* Icon/Emoji */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ícone / Emoji</label>
              <Button variant="outline" onClick={()=>setPickerOpen(true)} className="w-full justify-start gap-2">
                {iconValue ? (
                  iconType==='emoji' ? iconValue : React.createElement((LucideIcons as any)[iconValue] || (LucideIcons as any).HelpCircle, { size:16 })
                ) : <Plus size={16}/>}
                <span>{iconValue ? 'Trocar' : 'Escolher'}</span>
              </Button>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição <span className="text-muted-foreground text-xs">(opcional)</span></label>
              <Textarea value={description} onChange={(e)=>setDescription(e.target.value)} rows={3} className="resize-none" />
            </div>

            {/* Cor */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cor</label>
              <div className="grid grid-cols-6 gap-2">
                {HABIT_COLORS.map(c=> (
                  <button key={c} className={clsx('w-8 h-8 rounded-[10px]', {'ring-2 ring-offset-2 ring-primary': color===c})} style={{backgroundColor:c}} onClick={()=>setColor(c)} />
                ))}
                <ColorPickerPopover value={color} onChange={setColor} />
              </div>
            </div>

            {/* Advanced options */}
            <div>
              <button onClick={()=>setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-sm font-medium">
                Opções avançadas <ChevronDown size={16} className={clsx('transition-transform', { 'rotate-180': showAdvanced })} />
              </button>
              {showAdvanced && (
                <div className="mt-4 space-y-4">
                  <p className="text-xs text-muted-foreground">Meta define o intervalo em que seu progresso zera.</p>

                  {/* Target Interval */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Meta</label>
                    <ToggleGroup type="single" value={targetInterval} onValueChange={(v)=> setTargetInterval((v||'daily') as any)} className="grid grid-cols-3 gap-2">
                      {['daily','weekly','monthly'].map(intv => (
                        <ToggleGroupItem key={intv} value={intv} className="py-2 capitalize border rounded-md data-[state=on]:border-success data-[state=on]:text-success transition-colors">
                          {intv==='daily' ? 'Diário' : intv==='weekly' ? 'Semana' : 'Mês'}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>

                  {/* Target count */}
                  {targetInterval==='daily' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex justify-between">
                      Conclusões por dia <span className="font-semibold">{targetCount}x</span>
                    </label>
                    <Slider
                      value={[targetCount]}
                      min={1}
                      max={10}
                      step={1}
                      onValueChange={(v)=>setTargetCount(v[0])}
                    />
                  </div>) }

                  {targetInterval==='weekly' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex justify-between">
                      Conclusões por dia na semana <span className="font-semibold">{targetCount}x</span>
                    </label>
                    <Slider
                      value={[targetCount]}
                      min={1}
                      max={14}
                      step={1}
                      onValueChange={(v)=>setTargetCount(v[0])}
                    />

                    <div className="mt-8 space-y-2">
                      <label className="text-sm font-medium">Dias da semana</label>
                      <div className="grid grid-cols-7 gap-1">
                        {[0,1,2,3,4,5,6].map(d=>{
                          const selected=activeDays.includes(d);
                          const dayLabel=['D','S','T','Q','Q','S','S'][d];
                          return (
                            <button key={d} type="button" onClick={()=>{
                              setActiveDays(prev=>selected? prev.filter(x=>x!==d): [...prev,d]);
                            }} className={clsx('w-8 h-8 rounded-md text-xs', selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground')}>
                              {dayLabel}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>) }

                  {targetInterval==='monthly' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex justify-between">
                      Conclusões por mês <span className="font-semibold">{targetCount}x</span>
                    </label>
                    <Slider
                      value={[targetCount]}
                      min={1}
                      max={60}
                      step={1}
                      onValueChange={(v)=>setTargetCount(v[0])}
                    />
                  </div>) }

                  {/* Categories */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Categorias</label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORY_OPTIONS.map(opt=>{
                        const selected = categories.includes(opt.name);
                        return (
                          <Button key={opt.name} size="sm" variant={selected ? 'default' : 'outline'} className="gap-1" onClick={()=>{
                            if(opt.name==='Outro'){
                              setShowCustomCat(prev=>!prev);
                              return;
                            }
                            if(selected){
                              setCategories([]);
                            }else{
                              setCategories([opt.name]);
                            }
                          }}>
                            {React.createElement((LucideIcons as any)[opt.icon] || (LucideIcons as any).Tag, { size:14 })}
                            {opt.name}
                          </Button>
                        );
                      })}
                    </div>

                    {showCustomCat && (
                      <div className="flex gap-2 mt-2">
                        <Input placeholder="Nova categoria" value={customCat} onChange={(e)=>setCustomCat(e.target.value)} className="flex-1" />
                        <Button disabled={!customCat.trim()} onClick={()=>{
                          const name = customCat.trim();
                          if(name){
                            setCategories([name]);
                            setCustomCat('');
                            setShowCustomCat(false);
                          }
                        }}>
                          Adicionar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <SheetFooter className="p-4 border-t border-border">
            <Button className="w-full" disabled={!canSave} onClick={handleSave}>Salvar</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Picker */}
      <IconEmojiPicker
        open={pickerOpen}
        onClose={()=>setPickerOpen(false)}
        onSelectIcon={(name)=>{ setIconType('icon'); setIconValue(name); }}
        onSelectEmoji={(c)=>{ setIconType('emoji'); setIconValue(c); }}
        initialTab="icon"
      />
    </>
  );
};
