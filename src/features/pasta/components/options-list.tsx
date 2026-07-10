"use client";

import { ComboboxItem, ComboboxList } from "@/components/atoms/combobox";

// this is SO DUMB
export const OptionsList: React.FC = () => {
  return (
    <ComboboxList>
      {(item: { label: string; value: string }) => (
        <ComboboxItem key={item.value} value={item}>
          {item.label}
        </ComboboxItem>
      )}
    </ComboboxList>
  );
};
