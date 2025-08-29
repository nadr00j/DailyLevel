export const ICON_CATALOG = [
  { label: 'Atividades', icons: ['NotebookPen','Briefcase','Gamepad2','Palette','Music','BookOpenCheck','Code2','PenTool'] },
  { label: 'Saúde', icons: ['HeartPulse','Dumbbell','Stethoscope','Pills','BedSingle','Apple','Brain','Droplets'] },
  { label: 'Esportes', icons: ['Bicycle','Trophy','Football','Volleyball','Basketball','Target','Sailboat','Mountain'] },
  { label: 'Casa', icons: ['Utensils','WashingMachine','ShowerHead','Broom','Leaf','Sprout','CookingPot','CupSoda'] },
  { label: 'Social/Trabalho', icons: ['Users','MessageSquare','Phone','CalendarCheck','LaptopMinimal','Presentation','MapPin','Building'] },
];

export const ALL_ICON_NAMES: string[] = ICON_CATALOG.flatMap(c => c.icons);
