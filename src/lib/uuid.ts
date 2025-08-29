export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
    return (crypto as any).randomUUID();
  }
  // Simple fallback UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
