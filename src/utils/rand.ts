export const clampedNumber = (min = 1000, max = 5000) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const randomGreaterThan = (num: number, generator?: () => number) =>
  (generator?.() ?? Math.random()) > num;
export const randomLessThan = (num: number, generator?: () => number) =>
  (generator?.() ?? Math.random()) < num;
export const coinFlip = (generator?: () => number) =>
  randomGreaterThan(0.5, generator);

export const randomArrayMember = <T>(arr: T[] | readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];
