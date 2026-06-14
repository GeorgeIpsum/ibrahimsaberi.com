import { fastIsEqual as equals } from "fast-is-equal";
import { action, type IObservableValue, observable, reaction } from "mobx";

export type ControlType = "select" | "text" | "color" | "number" | "switch";
export type ControlValue = string | number | boolean;
export type ControlTypeValue<T extends ControlType> = T extends "select"
  ? string | number
  : T extends "text"
    ? string
    : T extends "color"
      ? string
      : T extends "number"
        ? number
        : T extends "switch"
          ? boolean
          : never;
export type Control<T extends ControlType> = {
  type?: T;
  value: IObservableValue<ControlTypeValue<T>> | undefined;
  options?: T extends "select" ? string[] | number[] : never;
  onChange?: (value: ControlTypeValue<T>) => void;
};

export type ControlInput<T extends ControlType> = Omit<Control<T>, "value"> & {
  value?: ControlTypeValue<T>;
};

interface ControlContext<K extends string> {
  registeredControls: { [key in K]: Control<ControlType> };
}

const getDefaultControlValue = <T extends ControlType>(
  type: T,
): ControlTypeValue<T> => {
  switch (type) {
    case "select":
    case "text":
    case "color":
      return "" as ControlTypeValue<T>;
    case "number":
      return 0 as ControlTypeValue<T>;
    case "switch":
      return false as ControlTypeValue<T>;
    default:
      throw new Error(`Unsupported control type: ${type}`);
  }
};

export function createControlContext<K extends string>() {
  const context: ControlContext<K> = observable({
    registeredControls: {} as { [key in K]: Control<ControlType> },
  });

  const registerControl = <T extends ControlType>(
    key: K,
    control: ControlInput<T>,
  ): void => {
    action(() => {
      const { onChange, ...rest } = control;
      if (context.registeredControls[key]) {
        if (
          equals(
            {
              ...context.registeredControls,
              value: context.registeredControls[key].value?.get(),
            },
            control,
          )
        ) {
          console.debug(
            `Control "${key}" already registered with same config, skipping re-registration.`,
          );
          return;
        }
      }

      context.registeredControls[key] = {
        ...rest,
        value: observable.box(
          control.value ?? getDefaultControlValue(control.type ?? "text"),
        ) as IObservableValue<ControlTypeValue<T>>,
      };

      reaction(
        () => context.registeredControls[key].value?.get(),
        (value) => {
          console.debug(`Control "${key}" value changed to`, value);
          onChange?.(
            context.registeredControls[key].value?.get() as ControlTypeValue<T>,
          );
        },
      );
    })();
  };

  return {
    context,
    registerControl,
  };
}

declare global {
  var IS_controller:
    | ReturnType<typeof createControlContext<string>>
    | undefined;
}

globalThis.IS_controller =
  globalThis.IS_controller ?? createControlContext<string>();

export const controlContext = globalThis.IS_controller;
