"use client";

import { observer } from "mobx-react-lite";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/atoms/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/atoms/popover";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select";
import { Switch } from "@/components/atoms/switch";
import {
  type Control,
  type ControlType,
  controlContext,
} from "./control-context";

interface ControlFieldProps<T extends ControlType> {
  controlKey: string;
  control: Control<T>;
  disabled?: boolean;
}

export const ControlInput: React.FC<ControlFieldProps<"text">> = observer(
  ({ controlKey, control, disabled }) => {
    return (
      <Input
        size="xs"
        disabled={disabled}
        value={control.value?.get() ?? ""}
        inputClassName="text-[10px]"
        onValueChange={(value) =>
          controlContext.setControlValue(controlKey, value)
        }
      />
    );
  },
);

export const ControlSelect: React.FC<ControlFieldProps<"select">> = observer(
  ({ controlKey, control, disabled }) => {
    return (
      <Select
        disabled={disabled}
        value={control.value?.get() as string | undefined}
        onValueChange={(value) =>
          controlContext.setControlValue(controlKey, value ?? "")
        }
      >
        <SelectTrigger size="xs" className="w-full">
          <SelectValue className="text-[10px]" placeholder="Select an option" />
        </SelectTrigger>
        <SelectPopup>
          {control.options?.map((option) => (
            <SelectItem key={option.toString()} value={option.toString()}>
              {option.toString()}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
    );
  },
);

export const ControlSwitch: React.FC<ControlFieldProps<"switch">> = observer(
  ({ controlKey, control, disabled }) => {
    // Implement a switch control (e.g., a toggle button) as needed
    return (
      <Switch
        style={
          {
            "--thumb-size": "0.75rem",
          } as React.CSSProperties
        }
        checked={control.value?.get() ?? false}
        onCheckedChange={(value) =>
          controlContext.setControlValue(controlKey, value)
        }
        disabled={disabled}
      />
    );
  },
);

export const ControlAction: React.FC<ControlFieldProps<"action">> = observer(
  ({ controlKey, disabled, control }) => {
    const value = control.value?.get();
    return (
      <Button
        size="xs"
        variant="outline"
        className="h-5! w-full text-[10px]! uppercase"
        onClick={() =>
          controlContext.setControlValue(controlKey, `${Date.now()}`)
        }
        disabled={disabled}
      >
        {value
          ? `Last: ${new Date(Number(value)).toLocaleTimeString()}`
          : "Trigger"}
      </Button>
    );
  },
);

export const ControlColor: React.FC<ControlFieldProps<"color">> = observer(
  ({ controlKey, disabled, control }) => {
    const value = control.value?.get();
    const hexColor = value ? `#${value}` : "#FFFFFF";

    return (
      <InputGroup className="overflow-hidden">
        <InputGroupInput
          size="xs"
          disabled={disabled}
          type="text"
          aria-label="Color input hex"
          placeholder="#FFFFFF"
          value={control.value?.get()}
          className="*:[input]:px-0!"
          inputClassName="text-[10px]"
          onValueChange={(value) => {
            if (!/^([0-9A-Fa-f]{1,6})$/.test(value)) {
              return;
            }
            controlContext.setControlValue(controlKey, value);
          }}
        />
        <InputGroupAddon className="pl-2">
          <Popover>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  className="group/color-control-panel flex h-5 items-center justify-center bg-background px-2"
                />
              }
            >
              <div
                className="perspective-near h-3 w-5 rounded-lg border-border border-x border-t-0 border-b group-hover/color-control-panel:-rotate-y-8 group-hover/color-control-panel:border-x-[0.75px] group-hover/color-control-panel:border-b-[0.5px]"
                style={{ backgroundColor: hexColor }}
              />
            </PopoverTrigger>
            <PopoverContent
              side="left"
              align="end"
              popoverProps={{ className: "p-1" }}
            >
              <div className="flex flex-col items-center justify-center"></div>
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
        <InputGroupAddon className="text-[10px]">#</InputGroupAddon>
      </InputGroup>
    );
  },
);

export const ControlRenderer: React.FC<ControlFieldProps<ControlType>> = ({
  controlKey,
  control,
  disabled,
}) => {
  // `control.type` is resolved once at registration (see `registerControl`).
  switch (control.type) {
    case "text":
      return (
        <ControlInput
          controlKey={controlKey}
          control={control as Control<"text">}
          disabled={disabled}
        />
      );
    case "select":
      return (
        <ControlSelect
          controlKey={controlKey}
          control={control as Control<"select">}
          disabled={disabled}
        />
      );
    case "switch":
      return (
        <ControlSwitch
          controlKey={controlKey}
          control={control as Control<"switch">}
          disabled={disabled}
        />
      );
    case "color":
      return (
        <ControlColor
          controlKey={controlKey}
          control={control as Control<"color">}
          disabled={disabled}
        />
      );
    case "action":
      return (
        <ControlAction
          controlKey={controlKey}
          control={control as Control<"action">}
          disabled={disabled}
        />
      );
    // Implement other control types (color, number, switch) as needed
    default:
      return (
        <div className="text-center text-[10px] uppercase">
          unsupported: {control.type}
        </div>
      );
  }
};
