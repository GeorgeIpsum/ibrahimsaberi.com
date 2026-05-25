// biome-ignore-all lint/suspicious/noExplicitAny: unknown does not work in a lot of these places properly properly

import { ONE_SECOND } from "./time";

export const sleep = async (ms = ONE_SECOND as number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export const pipe = <T = any>(...fns: ((...args: any[]) => Promise<T>)[]) => {
  return async (val: T | Promise<T> | (() => Promise<T>)) => {
    let result: T | undefined =
      typeof val === "function"
        ? await (val as (...args: any[]) => Promise<T>)()
        : val instanceof Promise
          ? await val
          : val;
    for (const fn of fns) {
      result = await fn(result);
    }
    return result as T;
  };
};

export const passForward = <T>(
  asyncFn: () => Promise<unknown> | unknown,
): ((t: T) => Promise<T>) => {
  return async (t: T) => {
    await asyncFn();
    return t;
  };
};
