import { observer } from "mobx-react-lite";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
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
