import { HexColorPicker } from 'react-colorful';
import { Palette } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import React, { useState } from 'react';

// util para mesclar cor com #09090b
function blendWithDark(hex: string, factor: number): string {
  const h = hex.replace('#','');
  const r = parseInt(h.substring(0,2),16)||255;
  const g = parseInt(h.substring(2,4),16)||255;
  const b = parseInt(h.substring(4,6),16)||255;
  const toHex=(v:number)=>v.toString(16).padStart(2,'0');
  const dR=9,dG=9,dB=11; // #09090b
  return `#${toHex(Math.round(r*factor + dR*(1-factor)))}${toHex(Math.round(g*factor + dG*(1-factor)))}${toHex(Math.round(b*factor + dB*(1-factor)))}`;
}

interface Props {
  value: string;
  onChange: (c: string) => void;
}

export const ColorPickerPopover: React.FC<Props> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label="Escolher cor"
          className="w-8 h-8 rounded-[10px] border border-border flex items-center justify-center text-xs"
          style={{ backgroundColor: value ? blendWithDark(value,0.40) : 'transparent' }}
        >
          <Palette size={14} className="shrink-0 text-white" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-60 bg-[#1c1c1e] border border-border rounded-xl">
        <HexColorPicker color={value} onChange={(c)=>onChange(c)} />
      </PopoverContent>
    </Popover>
  );
};
