import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useId, useState } from "react";
import type { DateRange, DropdownProps } from "react-day-picker";
import { Button } from "@/components/atoms/button";
import { Calendar } from "@/components/atoms/calendar";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from "@/components/atoms/combobox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/atoms/popover";
import { cn } from "@/css/lib";

interface DropdownItem {
  disabled?: boolean;
  label: string;
  value: string;
}
export function DateDropdown(props: DropdownProps) {
  const { options, value, onChange, "aria-label": ariaLabel } = props;
  const items: DropdownItem[] =
    options?.map((option) => ({
      disabled: option.disabled,
      label: option.label,
      value: option.value.toString(),
    })) ?? [];
  const selectedItem = items.find((item) => item.value === value?.toString());
  const handleValueChange = (newValue: DropdownItem | null) => {
    if (onChange && newValue) {
      const syntheticEvent = {
        target: { value: newValue.value },
      } as React.ChangeEvent<HTMLSelectElement>;
      onChange(syntheticEvent);
    }
  };
  return (
    <Combobox
      aria-label={ariaLabel}
      autoHighlight
      items={items}
      onValueChange={handleValueChange}
      value={selectedItem}
    >
      <ComboboxInput
        className="**:[input]:w-0 **:[input]:flex-1 **:[input]:text-center"
        onFocus={(e) => e.currentTarget.select()}
      />
      <ComboboxPopup aria-label={ariaLabel}>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item: DropdownItem) => (
            <ComboboxItem
              disabled={item.disabled}
              key={item.value}
              value={item}
            >
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  );
}

interface DatePickerProps {
  initial?: Date;
  onChange?: (date: Date | undefined) => void;
  onOpenChange?: (open: boolean) => void;
  dropdown?:
    | boolean
    | {
        layout?: React.ComponentProps<typeof Calendar>["captionLayout"];
        render?: NonNullable<
          React.ComponentProps<typeof Calendar>["components"]
        >["Dropdown"];
      };
  components?: React.ComponentProps<typeof Calendar>["components"];
  start?: Date;
  end?: Date;
  buttonProps?: React.ComponentProps<typeof Button>;
  popoverProps?: React.ComponentProps<typeof PopoverContent>;
  className?: string;
  formatStr?: string;
  placeholder?: React.ReactNode;
}
export const DatePicker: React.FC<DatePickerProps> = ({
  initial,
  onChange,
  onOpenChange,
  dropdown = false,
  components,
  start,
  end,
  buttonProps,
  popoverProps,
  className,
  formatStr = "PPP",
  placeholder = "Pick a date",
}) => {
  const [date, setDate] = useState<Date | undefined>(initial);
  const id = useId();

  const onSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (onChange) {
      onChange(selectedDate);
    }
  };

  return (
    <Popover onOpenChange={onOpenChange}>
      <PopoverTrigger
        id={id}
        render={
          <Button
            variant="ghost"
            // size={date ? "default" : "icon"}
            {...buttonProps}
            className={cn("w-full", buttonProps?.className)}
          />
        }
      >
        <CalendarIcon aria-hidden="true" />
        {date ? format(date, formatStr) : placeholder}
      </PopoverTrigger>
      <PopoverContent {...popoverProps}>
        <Calendar
          captionLayout={
            typeof dropdown === "object"
              ? dropdown.layout
              : dropdown
                ? "dropdown"
                : "label"
          }
          components={{
            ...(!!dropdown && {
              Dropdown: DateDropdown,
            }),
            ...components,
          }}
          defaultMonth={date}
          mode="single"
          onSelect={onSelect}
          selected={date}
          startMonth={start}
          endMonth={end}
          className={className}
        />
      </PopoverContent>
    </Popover>
  );
};

interface DateRangePickerProps
  extends Omit<DatePickerProps, "onChange" | "initial"> {
  initial?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  unpickedRangeLabel?: React.ReactNode;
}
export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  onChange,
  initial,
  dropdown,
  start,
  end,
  unpickedRangeLabel,
}) => {
  const [date, setDate] = useState<DateRange | undefined>(initial);

  const onSelect = (selectedRange: DateRange | undefined) => {
    setDate(selectedRange);
    if (onChange) {
      onChange(selectedRange);
    }
  };

  return (
    <Popover>
      <PopoverTrigger
        render={<Button className="w-full justify-start" variant="outline" />}
      >
        <CalendarIcon aria-hidden="true" />
        {date?.from ? (
          date.to ? (
            <>
              {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
            </>
          ) : (
            format(date.from, "LLL dd, y")
          )
        ) : (
          (unpickedRangeLabel ?? <span>Pick a date range</span>)
        )}
      </PopoverTrigger>
      <PopoverContent>
        <Calendar
          captionLayout={
            typeof dropdown === "object"
              ? dropdown.layout
              : dropdown
                ? "dropdown"
                : "label"
          }
          components={{
            ...(!!dropdown && {
              ...(typeof dropdown === "object" && dropdown.render
                ? { Dropdown: dropdown.render }
                : { Dropdown: DateDropdown }),
            }),
          }}
          defaultMonth={date?.from}
          mode="range"
          onSelect={onSelect}
          selected={date}
          startMonth={start}
          endMonth={end}
        />
      </PopoverContent>
    </Popover>
  );
};
