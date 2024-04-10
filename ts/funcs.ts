// helper functions

export const degreesToRadians = (x: number): number => (x * Math.PI) / 180;

export const clamp = (num: number, min: number, max: number): number => Math.min(Math.max(num, min), max);
