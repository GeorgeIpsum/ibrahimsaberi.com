export const clampedNumber = (min = 1000, max = 5000) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const randomGreaterThan = (num: number, generator?: () => number) =>
  (generator?.() ?? Math.random()) > num;
export const randomLessThan = (num: number, generator?: () => number) =>
  (generator?.() ?? Math.random()) < num;
export const coinFlip = (generator?: () => number) =>
  randomGreaterThan(0.5, generator);

type RandomArrayMemberOptions<T> = {
  exclude?: T[];
  equalityFn?: (a: T, b: T) => boolean;
};
export const randomArrayMember = <T>(
  arr: T[] | readonly T[],
  options: RandomArrayMemberOptions<T> = {},
): T => {
  const { exclude, equalityFn } = options;
  let member: T;
  do {
    member = arr[Math.floor(Math.random() * arr.length)];
  } while (exclude?.some((e) => equalityFn?.(e, member) ?? e === member));
  return member;
};

type RandomArrayMembersOptions<T> = {
  allowDuplicates?: boolean;
} & RandomArrayMemberOptions<T>;
export const randomArrayMembers = <T>(
  arr: T[] | readonly T[],
  count: number,
  { allowDuplicates, exclude, equalityFn }: RandomArrayMembersOptions<T> = {
    allowDuplicates: false,
    exclude: [],
  },
): T[] => {
  const result: T[] = [];
  const usedIndices = new Set<number>();

  while (
    result.length < count &&
    (allowDuplicates ? true : usedIndices.size < arr.length)
  ) {
    const index = Math.floor(Math.random() * arr.length);
    if (
      (allowDuplicates ? true : !usedIndices.has(index)) &&
      !exclude?.some((e) => equalityFn?.(e, arr[index]) ?? e === arr[index])
    ) {
      usedIndices.add(index);
      result.push(arr[index]);
    }
  }

  return result;
};
