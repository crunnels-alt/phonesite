export interface Slot {
  /** Percent from the left edge. */
  x: number;
  /** Pixels from the top of the pattern. */
  y: number;
  /** Pixels wide. */
  width: number;
}

export interface Placement extends Slot {
  index: number;
}

/** Repeats a hand-placed pattern of slots down the page so any number of items keeps the off-grid look. */
export function scatter(count: number, pattern: Slot[], patternHeight: number): { placements: Placement[]; height: number } {
  const placements = Array.from({ length: count }, (_, index) => {
    const slot = pattern[index % pattern.length];
    return { ...slot, y: slot.y + Math.floor(index / pattern.length) * patternHeight, index };
  });
  const height = Math.ceil(count / pattern.length) * patternHeight;
  return { placements, height };
}
