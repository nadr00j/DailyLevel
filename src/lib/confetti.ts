import type { CreateTypes } from 'canvas-confetti';

let confettiInstance: ReturnType<CreateTypes['create']> | null = null;
let confettiBase: CreateTypes | null = null;

async function initInstance() {
  if (confettiInstance) return confettiInstance;

  const mod = await import('canvas-confetti');
  const confetti = mod.default as unknown as CreateTypes;
  confettiBase = confetti;

  // cria canvas dedicado abaixo do popup
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '1000'; // acima de todos os dialogs
  document.body.appendChild(canvas);

  confettiInstance = confetti.create(canvas, { resize: true, useWorker: false });
  return confettiInstance!;
}

export async function fireVictoryConfetti() {
  const confetti = await initInstance();

  let star: string = 'star';
  let xp: string = 'xp';
  if (confettiBase && (confettiBase as any).shapeFromText) {
    star = (confettiBase as any).shapeFromText({ text: '⭐', scalar: 1.3 });
    xp   = (confettiBase as any).shapeFromText({ text: 'XP', scalar: 1, color: '#facc15' });
  }

  const defaults: any = {
    spread: 360,
    ticks: 60,
    gravity: 0,
    decay: 0.9,
    startVelocity: 25,
    shapes: [star, xp],
    colors: ['#facc15', '#4ade80', '#38bdf8'],
    origin: { x: 0.5, y: 0.5 },
  } as const;

  // Explosão única de vitória
  confetti({ ...defaults, particleCount: 60, scalar: 1 });
}

export async function fireGoldenConfetti() {
  const confetti = await initInstance();

  let coin: string = 'circle';
  let sparkle: string = 'star';
  if (confettiBase && (confettiBase as any).shapeFromText) {
    coin = (confettiBase as any).shapeFromText({ text: '🪙', scalar: 1.2 });
    sparkle = (confettiBase as any).shapeFromText({ text: '✨', scalar: 1.3 });
  }

  const defaults: any = {
    spread: 360,
    ticks: 80,
    gravity: 0.3,
    decay: 0.95,
    startVelocity: 30,
    shapes: [coin, sparkle],
    colors: ['#fbbf24', '#f59e0b', '#d97706', '#facc15'],
    origin: { x: 0.5, y: 0.5 },
  } as const;

  // Explosão dourada para itens da loja
  confetti({ ...defaults, particleCount: 80, scalar: 1.2 });
  
  // Segunda explosão menor após 300ms
  setTimeout(() => {
    confetti({ ...defaults, particleCount: 40, scalar: 0.8, origin: { x: 0.3, y: 0.5 } });
    confetti({ ...defaults, particleCount: 40, scalar: 0.8, origin: { x: 0.7, y: 0.5 } });
  }, 300);
}
