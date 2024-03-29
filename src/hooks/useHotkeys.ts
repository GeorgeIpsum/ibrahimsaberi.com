// unceremoniously yoinked from
// https://github.com/mantinedev/mantine/blob/master/packages/%40mantine/hooks/src/use-hotkeys/use-hotkeys.ts
// with some modifications of course :)
import { useEffect } from "react";

type KeyboardModifiers = {
  alt: boolean;
  ctrl: boolean;
  meta: boolean;
  mod: boolean;
  shift: boolean;
};

type Hotkey = KeyboardModifiers & {
  key?: string;
};

type CheckHotkeyMatch = (event: KeyboardEvent) => boolean;

function parseHotkey(hotkey: string): Hotkey {
  const keys = hotkey
    .toLowerCase()
    .split("+")
    .map((part) => part.trim());

  const modifiers: KeyboardModifiers = {
    alt: keys.includes("alt"),
    ctrl: keys.includes("ctrl"),
    meta: keys.includes("meta"),
    mod: keys.includes("mod"),
    shift: keys.includes("shift"),
  };

  const reservedKeys = ["alt", "ctrl", "meta", "shift", "mod"];

  const freeKey = keys.find((key) => !reservedKeys.includes(key));

  return {
    ...modifiers,
    key: freeKey,
  };
}

function isExactHotkey(hotkey: Hotkey, event: KeyboardEvent): boolean {
  const { alt, ctrl, meta, mod, shift, key } = hotkey;
  const { altKey, ctrlKey, metaKey, shiftKey, key: pressedKey } = event;

  if (alt !== altKey) {
    return false;
  }

  if (mod) {
    if (!ctrlKey && !metaKey) {
      return false;
    }
  } else {
    if (ctrl !== ctrlKey) {
      return false;
    }
    if (meta !== metaKey) {
      return false;
    }
  }
  if (shift !== shiftKey) {
    return false;
  }

  if (
    key &&
    (pressedKey.toLowerCase() === key.toLowerCase() ||
      event.code.replace("Key", "").toLowerCase() === key.toLowerCase())
  ) {
    return true;
  }

  return false;
}

function getHotkeyMatcher(hotkey: string): CheckHotkeyMatch {
  return (event) => isExactHotkey(parseHotkey(hotkey), event);
}

type KeyListener = (
  event: React.KeyboardEvent<HTMLElement> | KeyboardEvent
) => void;

interface HotkeyItemOptions {
  preventDefault?: boolean;
}

type HotkeyItem = [string | string[], KeyListener, HotkeyItemOptions?];

function shouldFireEvent(
  event: KeyboardEvent,
  tagsToIgnore: string[],
  triggerOnContentEditable = false
) {
  if (event.target instanceof HTMLElement) {
    if (triggerOnContentEditable) {
      return !tagsToIgnore.includes(event.target.tagName);
    }

    return (
      !event.target.isContentEditable &&
      !tagsToIgnore.includes(event.target.tagName)
    );
  }

  return true;
}

export default function useHotkeys(
  hotkeys: HotkeyItem[],
  tagsToIgnore: string[] = ["INPUT", "TEXTAREA", "SELECT"],
  triggerOnContentEditable = false,
  eventTrigger: "keydown" | "keyup" | "keypress" = "keydown"
) {
  const fireHotkey = (
    hotkey: string,
    event: KeyboardEvent,
    options: HotkeyItemOptions,
    handler: KeyListener
  ) => {
    if (
      getHotkeyMatcher(hotkey)(event) &&
      shouldFireEvent(event, tagsToIgnore, triggerOnContentEditable)
    ) {
      if (options.preventDefault) {
        event.preventDefault();
      }

      handler(event);
    }
  };

  useEffect(() => {
    const keyListener = (event: KeyboardEvent) => {
      hotkeys.forEach(
        ([hotkey, handler, options = { preventDefault: true }]) => {
          const fire = (key: string) =>
            fireHotkey(key, event, options, handler);

          if (Array.isArray(hotkey)) {
            hotkey.forEach((key) => fire(key));
          } else {
            fire(hotkey);
          }
        }
      );
    };

    document.documentElement.addEventListener(eventTrigger, keyListener);
    return () =>
      document.documentElement.removeEventListener(eventTrigger, keyListener);
  }, [hotkeys]);
}
