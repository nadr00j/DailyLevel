import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { ICON_CATALOG, ALL_ICON_NAMES } from '@/data/iconCatalog';
import * as LucideIcons from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

const EmojiPicker = React.lazy(async () => {
  const PickerMod = await import('@emoji-mart/react');
  const dataMod = await import('@emoji-mart/data');
  const Picker = (PickerMod as any).default;
  const data = (dataMod as any).default;
  // Wrap Picker to inject data prop by default
  const Wrapped = (props: any) => <Picker data={data} {...props} />;
  return { default: Wrapped };
});

const RECENTS_KEY = 'dl.recent.picks';

type TabType = 'icon' | 'emoji';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelectIcon?: (name: string) => void;
  onSelectEmoji?: (char: string) => void;
  initialTab?: TabType;
}

export const IconEmojiPicker: React.FC<Props> = ({ open, onClose, onSelectIcon, onSelectEmoji, initialTab = 'icon' }) => {
  const [tab, setTab] = useState<TabType>(initialTab);
  const [recent, setRecent] = useState<string[]>([]);

  // force size of emoji picker root when tab is emoji
  useEffect(() => {
    if (tab === 'emoji') {
      const root = document.querySelector('section[data-emoji-set]') as HTMLElement | null;
      if (root) {
        root.style.setProperty('width','385px','important');
        root.style.setProperty('height','500px','important');
        root.style.setProperty('--sidebar-width','42px','important');
      }
    }
  }, [tab, open]);

  // Load recents from localStorage
  useEffect(() => {
    const r = localStorage.getItem(RECENTS_KEY);
    if (r) setRecent(JSON.parse(r));
  }, []);

  const saveRecent = (value: string) => {
    setRecent(prev => {
      const next = [value, ...prev.filter(v => v !== value)].slice(0, 12);
      localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
      return next;
    });
  };

  // Use full Lucide icon list for more options
  const allIcons = useMemo(()=>
    Object.keys(LucideIcons).filter(name=>/^[A-Z]/.test(name) && name!=='Icon' && name!=='createLucideIcon')
  ,[]);
  const [iconSearch, setIconSearch] = useState('');
  const filteredIcons = useMemo(()=>{
    if(!iconSearch.trim()) return allIcons;
    const q = iconSearch.toLowerCase();
    return allIcons.filter(n=>n.toLowerCase().includes(q));
  },[iconSearch, allIcons]);

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }} modal={true}>
      <SheetContent
        side="bottom"
        className="h-[60%] p-0 flex flex-col overflow-y-auto"
        onInteractOutside={(e)=>e.preventDefault()}
        onEscapeKeyDown={(e)=>e.preventDefault()}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Seletor de ícone ou emoji</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col h-full">
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabType)} className="flex flex-col flex-1">
            <TabsList className="relative grid w-full grid-cols-2 sticky top-0 z-10 bg-background border-b border-border">
              <TabsTrigger value="icon">Ícone</TabsTrigger>
              <TabsTrigger value="emoji" style={{ marginRight: '10px' }}>Emoji</TabsTrigger>
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 top-1 w-7 h-7 text-muted-foreground"
                style={{ marginRight: '10px' }}
                onClick={() => onClose()}
              >
                <LucideIcons.X size={16} />
              </Button>
            </TabsList>

            {/* Tabs content */}
            <TabsContent value="icon" className="flex-1 overflow-y-auto p-4 min-h-0 space-y-4">
              <Input data-icon-search
                // A busca de ícones é feita em inglês
                placeholder="Buscar ícone (em inglês)..."
                value={iconSearch}
                onChange={e=>setIconSearch(e.target.value)}
                onPointerDown={e=>e.stopPropagation()}
                onKeyDown={e=>e.stopPropagation()}
              />

              <div className="grid grid-cols-5 gap-3">
                {filteredIcons.map((name) => {
                  const IconComp = (LucideIcons as any)[name] as React.FC<{ size?: number }> | undefined;
                  if (!IconComp) return null;
                  return (
                    <Button
                      key={name}
                      variant="ghost"
                      className="w-16 h-16 p-0"
                      onClick={() => {
                        onSelectIcon?.(name);
                        saveRecent(name);
                        onClose();
                      }}
                    >
                      <IconComp size={36} />
                    </Button>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="emoji" className="flex-1 overflow-y-auto p-0 mt-px min-h-0" style={{ height: '900px', width: '900px'}}>
              <Suspense fallback={<div className="flex items-center justify-center"  style={{ height: '900px', width: '900px'}}>Carregando emojis...</div>}>
                <EmojiPicker
                  theme="dark"
                  width={1000}
                  height={1500}
                  onEmojiSelect={(e: any) => {
                    const char = e.native || e.emoji || e;
                    onSelectEmoji?.(char);
                    saveRecent(char);
                    onClose();
                  }}
                  perLine={10}
                  maxFrequentRows={0}
                  previewPosition="none"
                  locale="pt"
                />
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};
