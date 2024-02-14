// https://github.com/mantinedev/mantine/blob/master/packages/%40mantine/hooks/src/use-window-event/use-window-event.ts
import { useEffect } from "react";

const useEventListener = <K extends string>(
  type: K,
  listener: K extends keyof WindowEventMap
    ? (this: Window, ev: WindowEventMap[K]) => void
    : K extends keyof ElementEventMap
      ? (this: HTMLElement, ev: ElementEventMap[K]) => void
      : (this: Window, ev: CustomEvent) => void,
  options?: boolean | AddEventListenerOptions,
  el: HTMLElement | Window = window
) => {
  useEffect(() => {
    el.addEventListener(type, listener as EventListener, options);
    return () => {
      el.removeEventListener(type, listener as EventListener, options);
    };
  }, [type, listener]);
};

export default useEventListener;
