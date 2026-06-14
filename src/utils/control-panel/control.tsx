import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { Input } from "@/components/atoms/input";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select";
import type { Control, ControlType } from "./control-context";

export const resolveControlType = <T extends ControlType>(
  control: Control<T>,
): T => {
  if (typeof control === "object" && "type" in control) {
    return control.type as T;
  } else if (typeof control === "object" && "options" in control) {
    return "select" as T;
  } else if (typeof control === "object" && "value" in control) {
    const value = control.value?.get();
    if (typeof value === "boolean") {
      return "switch" as T;
    } else if (typeof value === "number") {
      return "number" as T;
    } else if (typeof value === "string" && value.startsWith("#")) {
      return "color" as T;
    }
  }

  return "text" as T; // default to text if type can't be inferred
};

export const ControlInput: React.FC<{ control: Control<"text"> }> = observer(
  ({ control }) => {
    return (
      <Input
        value={control.value?.get()}
        onValueChange={(value) => {
          action(() => {
            control.value?.set(value);
          })();
        }}
      />
    );
  },
);

export const ControlSelect: React.FC<{ control: Control<"select"> }> = observer(
  ({ control }) => {
    return (
      <Select
        value={control.value?.get() as string | undefined}
        onValueChange={(value) => {
          action(() => {
            if (value === null) {
              control.value?.set("");
            } else {
              control.value?.set(value);
            }
          })();
        }}
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

export const ControlRenderer: React.FC<{ control: Control<ControlType> }> = ({
  control,
}) => {
  const type = resolveControlType(control);

  switch (type) {
    case "text":
      return <ControlInput control={control as Control<"text">} />;
    case "select":
      return <ControlSelect control={control as Control<"select">} />;
    // Implement other control types (color, number, switch) as needed
    default:
      return <div className="uppercase">unsupported: {type}</div>;
  }
};
