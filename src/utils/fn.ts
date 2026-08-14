/** biome-ignore-all lint/suspicious/noExplicitAny: we gotta get a little funcy in here */

export function debounce(func: (...args: any[]) => void, wait: number) {
  let timeout: ReturnType<typeof setTimeout>;

  return function (...args: any[]) {
    clearTimeout(timeout);

    timeout = setTimeout(() => {
      // @ts-expect-error its fine
      func.apply(this, args);
    }, wait);
  };
}

export const noop = (): any => {};
